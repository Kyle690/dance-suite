'use client';
import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
    Alert,
    Box,
    Button,
    ButtonGroup,
    Chip,
    CircularProgress,
    ClickAwayListener,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grow,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { ArrowDropDown, Print } from '@mui/icons-material';
import { DialogProps } from '@toolpad/core';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { sortBy, startCase, toLower } from 'lodash';
import { getHeatRoundMarks, printFinalResult } from '@/app/server/competitions';
import { buildSkatingResults, DanceResult, RawMarkEntry } from '@/app/lib/skating';
import { FinalPrintMode } from '@/app/components/pdf/HeatFinalResultDocument';

type HeatFinalResultDialogProps = {
    heat_id: string;
};

const PRINT_OPTIONS: { label: string; mode: FinalPrintMode }[] = [
    { label: 'Print Working + Results', mode: 'both' },
    { label: 'Print Working Only', mode: 'working' },
    { label: 'Print Results Only', mode: 'result' },
];

const HeatFinalResultDialog: React.FC<DialogProps<HeatFinalResultDialogProps>> = ({
    open,
    onClose,
    payload,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [ printing, setPrinting ] = useState(false);
    const [ menuOpen, setMenuOpen ] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

    // ── Data loading ──────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: [ 'get-final-result-data', payload.heat_id ],
        queryFn: async () => {
            const res = await getHeatRoundMarks(payload.heat_id);
            return res.data;
        },
        enabled: open && Boolean(payload.heat_id),
    });

    // ── Skating calculation ───────────────────────────────────────────────────
    const adjudicators = useMemo(
        () =>
            sortBy(
                data?.panel?.panels_adjudicators?.map(p => ({
                    uid: p.adjudicator_id,
                    letter: p.adjudicator.letter,
                })),
                'letter',
            ) ?? [],
        [ data ],
    );

    const skatingResults = useMemo(() => {
        if (!data) return null;

        const dancers = sortBy(
            data.start_list?.map(d => ({
                uid: d.uid,
                number: d.number ?? 0,
                name: d.name ?? '',
                partner_name: d.partner_name ?? null,
            })),
            'number',
        );

        const rawMarks: RawMarkEntry[] = data.heat_marks.map(hm => ({
            adjudicator_id: hm.adjudicator_id,
            adjudicator_letter: adjudicators.find(a => a.uid === hm.adjudicator_id)?.letter ?? '',
            marks: hm.marks.map(m => ({
                dancer_id: m.dancer_id ?? '',
                dancer_number: m.dancer_number,
                dance: m.dance,
                mark: m.mark ?? 0,
            })),
        }));

        return buildSkatingResults(data.dances ?? [], adjudicators, dancers, rawMarks);
    }, [ data, adjudicators ]);

    // ── Print handler ─────────────────────────────────────────────────────────
    const handlePrint = useCallback(async (mode: FinalPrintMode) => {
        setMenuOpen(false);
        setPrinting(true);
        try {
            const result = await printFinalResult({ heat_id: payload.heat_id, mode });
            const base64 = result?.data;
            if (!base64) {
                enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
                return;
            }

            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([ bytes ], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) {
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            }
        } catch (err) {
            console.error('PDF generation error:', err);
            enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
        } finally {
            setPrinting(false);
        }
    }, [ payload.heat_id, enqueueSnackbar ]);

    // ── Per-dance table renderer ──────────────────────────────────────────────
    const renderDanceTable = (danceResult: DanceResult) => {
        const numDancers = danceResult.numDancers;
        const ordinals = Array.from({ length: numDancers }, (_, i) => i + 1);

        return (
            <Box key={danceResult.dance} mb={4}>
                <Typography
                    variant="subtitle1" fontWeight="bold"
                    mb={1}
                >
                    {startCase(toLower(danceResult.dance))}
                </Typography>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 500, '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">No.</TableCell>
                                {adjudicators.map(adj => (
                                    <TableCell key={adj.uid} align="center">
                                        {adj.letter}
                                    </TableCell>
                                ))}
                                {ordinals.map(p => (
                                    <TableCell
                                        key={p} align="center"
                                        sx={{ fontFamily: 'monospace' }}
                                    >
                                        1-{p}
                                    </TableCell>
                                ))}
                                <TableCell align="center">Place</TableCell>
                                <TableCell align="center">Rule</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {danceResult.dancers.map(dancer => (
                                <TableRow key={dancer.dancer_id}>
                                    <TableCell align="center">{dancer.dancer_number}</TableCell>
                                    {adjudicators.map(adj => {
                                        const jm = dancer.judgeMarks.find(j => j.adjudicator_id === adj.uid);
                                        return (
                                            <TableCell key={adj.uid} align="center">
                                                {jm?.mark && jm.mark > 0 ? jm.mark : '-'}
                                            </TableCell>
                                        );
                                    })}
                                    {ordinals.map(p => {
                                        const isResolvedCell = p === dancer.resolvedAt;
                                        const isPastResolved =
                                            dancer.resolvedAt !== Infinity && p > dancer.resolvedAt;
                                        const count = dancer.ordinalCounts[p];
                                        const showSum = isResolvedCell && dancer.rule === 'R10';
                                        const sum = showSum
                                            ? dancer.judgeMarks
                                                  .filter(jm => jm.mark > 0 && jm.mark <= p)
                                                  .reduce((s, jm) => s + jm.mark, 0)
                                            : null;
                                        return (
                                            <TableCell
                                                key={p}
                                                align="center"
                                                sx={isResolvedCell ? { fontWeight: 'bold' } : undefined}
                                            >
                                                {isPastResolved
                                                    ? '-'
                                                    : count > 0
                                                      ? showSum ? `${count}(${sum})` : count
                                                      : ''}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell align="center">
                                        {dancer.place}
                                    </TableCell>
                                    <TableCell align="center">
                                        {dancer.rule}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Dialog
            open={open} fullWidth
            maxWidth="lg"
        >
            <DialogTitle>
                <Stack
                    direction="row" justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="h6">
                        {data?.item_no ?? ''} — Finals Result
                    </Typography>
                    <Typography variant="h6">
                        {data?.section?.name ? startCase(toLower(data.section.name)) : ''}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <Stack
                        alignItems="center" justifyContent="center"
                        py={6}
                    >
                        <CircularProgress />
                    </Stack>
                ) : !skatingResults ? null : (
                    <Stack spacing={4} mt={1}>
                        {/* Per-dance tables */}
                        <Box>
                            <Typography variant="h6" mb={2}>
                                Per-Dance Results (Rules 9 &amp; 10)
                            </Typography>
                            {skatingResults.perDance.map(dr => renderDanceTable(dr))}
                        </Box>

                        <Divider />

                        {/* Combined result table */}
                        <Box>
                            <Typography variant="h6" mb={2}>
                                Final Result
                            </Typography>
                            <TableContainer>
                                <Table size="small" sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center">No.</TableCell>
                                            {skatingResults.perDance.map(dr => (
                                                <TableCell key={dr.dance} align="center">
                                                    {startCase(toLower(dr.dance))}
                                                </TableCell>
                                            ))}
                                            <TableCell align="center">Total</TableCell>
                                            <TableCell align="center">Place</TableCell>
                                            <TableCell align="center">Rule</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {skatingResults.combined.map(dancer => (
                                            <TableRow key={dancer.dancer_id}>
                                                <TableCell align="center">{dancer.dancer_number}</TableCell>
                                                {dancer.perDancePlaces.map(dp => (
                                                    <TableCell key={dp.dance} align="center">
                                                        {dp.place}
                                                    </TableCell>
                                                ))}
                                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                                    {dancer.total}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {dancer.place}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {dancer.rule}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Rule 11 table — only shown when ties exist */}
                        {skatingResults.rule11 && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="h6" mb={1}>
                                        Rule 11 — Tie Resolution
                                    </Typography>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        {skatingResults.rule11.explanation}
                                    </Alert>
                                    <TableContainer>
                                        <Table size="small" sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="center">No.</TableCell>
                                                    <TableCell>Name</TableCell>
                                                    {skatingResults.perDance.map(dr => (
                                                        <TableCell key={dr.dance} align="center">
                                                            {startCase(toLower(dr.dance))}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center">Total</TableCell>
                                                    <TableCell align="center">Final Place</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {skatingResults.combined
                                                    .filter(d => d.rule === 'R11')
                                                    .map(dancer => (
                                                        <TableRow key={dancer.dancer_id}>
                                                            <TableCell align="center">
                                                                {dancer.dancer_number}
                                                            </TableCell>
                                                            <TableCell>{dancer.name}</TableCell>
                                                            {dancer.perDancePlaces.map(dp => (
                                                                <TableCell key={dp.dance} align="center">
                                                                    {dp.place}
                                                                </TableCell>
                                                            ))}
                                                            <TableCell
                                                                align="center"
                                                                sx={{ fontWeight: 'bold' }}
                                                            >
                                                                {dancer.total}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Chip
                                                                    size="small"
                                                                    label={dancer.place}
                                                                    color="warning"
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                <ButtonGroup
                    ref={anchorRef} variant="outlined"
                    size="small" color="primary"
                    disabled={!skatingResults || printing}
                >
                    <Button
                        onClick={() => handlePrint('both')}
                        startIcon={printing ? <CircularProgress size={14} /> : <Print />}
                    >
                        Print
                    </Button>
                    <Button
                        size="small" onClick={() => setMenuOpen(prev => !prev)}
                        sx={{ px: 0.5, minWidth: 28 }}
                    >
                        <ArrowDropDown />
                    </Button>
                </ButtonGroup>
                <Popper
                    open={menuOpen} anchorEl={anchorRef.current}
                    placement="top-end" transition
                    disablePortal style={{ zIndex: 9999 }}
                >
                    {({ TransitionProps }) => (
                        <Grow {...TransitionProps} style={{ transformOrigin: 'right bottom' }}>
                            <Paper elevation={4}>
                                <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
                                    <MenuList dense>
                                        {PRINT_OPTIONS.map(opt => (
                                            <MenuItem key={opt.mode} onClick={() => handlePrint(opt.mode)}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
                <Button
                    size="small" color="inherit"
                    variant="contained" onClick={() => onClose()}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default HeatFinalResultDialog;

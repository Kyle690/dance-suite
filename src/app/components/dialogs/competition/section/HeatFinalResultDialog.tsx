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
import { ArrowDropDown, CheckCircle, OpenInNew, Print, RemoveCircleOutline } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import dayjs from '@/app/utils/dayjs';
import {DialogProps, useDialogs} from '@toolpad/core';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { sortBy, startCase, toLower } from 'lodash';
import { approveHeatResult, deleteAdjudicatorMarks, deleteMarks, getHeatRoundMarks, printFinalResult } from '@/app/server/competitions';
import { buildSkatingResults, DanceResult, RawMarkEntry } from '@/app/lib/skating';
import { FinalPrintMode } from '@/app/components/pdf/HeatFinalResultDocument';
import {HeatStatus} from "@prisma/client";

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
    const [ approving, setApproving ] = useState(false);
    const [ selectedSubmission, setSelectedSubmission ] = useState<NonNullable<typeof data>['mark_submissions'][number] | null>(null);
    const [ deleting, setDeleting ] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

    const handleDeleteSubmission = useCallback(async () => {
        if (!selectedSubmission) return;
        const confirmed = await dialogs.confirm(
            `Delete the mark submission from adjudicator ${selectedSubmission.adjudicator_letter} (${selectedSubmission.adjudicator_name})? This cannot be undone.`,
            { title: 'Delete Submission?' }
        );
        if (!confirmed) return;
        setDeleting(true);
        try {
            const result = await deleteAdjudicatorMarks(selectedSubmission.uid);
            if (result?.serverError) {
                enqueueSnackbar(result.serverError, { variant: 'error' });
                return;
            }
            if (result?.data) {
                enqueueSnackbar('Submission deleted', { variant: 'success' });
                setSelectedSubmission(null);
                await queryClient.invalidateQueries({ queryKey: [ 'get-final-result-data', payload.heat_id ] });
                await queryClient.invalidateQueries({ queryKey: [ 'section-heats' ] });
            }
        } catch {
            enqueueSnackbar('Failed to delete submission', { variant: 'error' });
        } finally {
            setDeleting(false);
        }
    }, [ selectedSubmission,  enqueueSnackbar, payload.heat_id ]);

    const handleDeleteAllMarks = useCallback(async () => {
        const confirmed = await dialogs.confirm(
            'Delete all mark submissions for this heat? The heat will be reset to JUDGING. This cannot be undone.',
            { title: 'Delete All Marks?' }
        );
        if (!confirmed) return;
        setDeleting(true);
        try {
            const result = await deleteMarks(payload.heat_id);
            if (result?.serverError) {
                enqueueSnackbar(result.serverError, { variant: 'error' });
                return;
            }
            if (result?.data) {
                enqueueSnackbar('All marks deleted', { variant: 'success' });
                await queryClient.invalidateQueries({ queryKey: [ 'get-final-result-data', payload.heat_id ] });
                await queryClient.invalidateQueries({ queryKey: [ 'section-heats' ] });
                onClose();
            }
        } catch {
            enqueueSnackbar('Failed to delete marks', { variant: 'error' });
        } finally {
            setDeleting(false);
        }
    }, [ payload.heat_id,  enqueueSnackbar,  onClose ]);

    // ── Data loading ──────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: [ 'get-final-result-data', payload.heat_id ],
        queryFn: async () => {
            const res = await getHeatRoundMarks(payload.heat_id);
            return res.data;
        },
        enabled: open && Boolean(payload.heat_id),
    });

    const dialogs = useDialogs()

    const queryClient = useQueryClient();

    // ── Skating calculation ───────────────────────────────────────────────────
    const adjudicators = useMemo(
        () =>
            sortBy(
                data?.panel?.panels_adjudicators?.map(p => ({
                    uid: p.adjudicator_id,
                    letter: p.adjudicator.letter,
                    name:p.adjudicator.name,
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

    const handleApprove = useCallback(async () => {
        if (!payload?.heat_id) return;
        const confirmed = await dialogs.confirm(
            'Approving the result will mark this heat as Complete and cannot be undone.',
            { title: 'Approve Result?' }
        );
        if (!confirmed) return;

        setApproving(true);
        try {
            const result = await approveHeatResult(payload.heat_id);
            if (result?.data) {
                enqueueSnackbar('Heat result approved', { variant: 'success' });
                await queryClient.invalidateQueries({ queryKey: [ 'get-final-result-data', payload.heat_id ] });
                await queryClient.invalidateQueries({ queryKey: [ 'section-heats' ] });
                onClose();
            }
        } catch (err) {
            console.error('Approve error:', err);
            enqueueSnackbar('Failed to approve result', { variant: 'error' });
        } finally {
            setApproving(false);
        }
    }, [ payload?.heat_id, dialogs, enqueueSnackbar, queryClient, onClose ]);

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
                        {/* Mark Submission Audit */}
                        {(data?.mark_submissions?.length ?? 0) > 0 && (
                            <>
                                <Divider />
                                <Stack spacing={1}>
                                    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                                        <Typography variant={'subtitle2'} color={'text.secondary'}>
                                            Mark Submissions
                                        </Typography>
                                        {data?.status !== 'COMPLETE' && (
                                            <Button
                                                size={'small'}
                                                color={'error'}
                                                variant={'outlined'}
                                                disabled={deleting}
                                                startIcon={deleting ? <CircularProgress size={14} /> : undefined}
                                                onClick={handleDeleteAllMarks}
                                            >
                                                Delete All Marks
                                            </Button>
                                        )}
                                    </Stack>
                                    <TableContainer component={Paper} variant={'outlined'}>
                                        <Table size={'small'}>
                                            <TableHead>
                                                <TableRow>
                                                    {[ 'Adj.', 'Name', 'Type', 'Submitted', 'IP Address', 'Signature', 'Security', '' ].map((h) => (
                                                        <TableCell key={h} sx={{ fontWeight: 700, py: 0.5 }}>{h}</TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data?.mark_submissions?.map((sub) => (
                                                    <TableRow key={sub.uid}>
                                                        <TableCell sx={{ fontWeight: 700, py: 0.5 }}>{sub.adjudicator_letter}</TableCell>
                                                        <TableCell sx={{ py: 0.5 }}>{sub.adjudicator_name}</TableCell>
                                                        <TableCell sx={{ py: 0.5 }}>
                                                            <Chip
                                                                label={startCase(toLower(sub.input_type))}
                                                                size={'small'}
                                                                color={sub.input_type === 'JUDGE' ? 'primary' : 'default'}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ py: 0.5, whiteSpace: 'nowrap' }}>
                                                            {dayjs(sub.submitted_at).format('DD MMM YYYY HH:mm:ss')}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 0.5, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                            {sub.ip_address ?? <Typography variant={'caption'} color={'text.disabled'}>—</Typography>}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 0.5 }}>
                                                            {sub.signature
                                                                ? (
                                                                    <Box
                                                                        component={'img'}
                                                                        src={sub.signature}
                                                                        alt={`Signature of ${sub.adjudicator_name}`}
                                                                        sx={{
                                                                            height: 36,
                                                                            maxWidth: 120,
                                                                            objectFit: 'contain',
                                                                            display: 'block',
                                                                            border: '1px solid',
                                                                            borderColor: 'divider',
                                                                            borderRadius: 1,
                                                                            bgcolor: 'common.white',
                                                                            p: 0.25,
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Typography variant={'caption'} color={'text.disabled'}>—</Typography>
                                                                )}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 0.5, whiteSpace: 'nowrap' }}>
                                                            {sub.checksum_valid === true && (
                                                                <Tooltip title={'The mark data, signature, and IP address match the original submission. No tampering detected.'}>
                                                                    <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                                                                        <CheckCircle fontSize={'small'} color={'success'} />
                                                                        <Typography variant={'caption'} color={'success.main'}>Verified</Typography>
                                                                    </Stack>
                                                                </Tooltip>
                                                            )}
                                                            {sub.checksum_valid === false && (
                                                                <Tooltip title={'The checksum does not match the stored mark data. The submission may have been altered after entry.'}>
                                                                    <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                                                                        <RemoveCircleOutline fontSize={'small'} color={'error'} />
                                                                        <Typography variant={'caption'} color={'error.main'}>Mismatch</Typography>
                                                                    </Stack>
                                                                </Tooltip>
                                                            )}
                                                            {sub.checksum_valid === null && (
                                                                <Tooltip title={'No checksum was recorded for this submission. This is expected for marks entered manually by a scrutineer.'}>
                                                                    <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                                                                        <RemoveCircleOutline fontSize={'small'} color={'disabled'} />
                                                                        <Typography variant={'caption'} color={'text.disabled'}>Not recorded</Typography>
                                                                    </Stack>
                                                                </Tooltip>
                                                            )}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 0.5 }}>
                                                            <Tooltip title={'View full submission'}>
                                                                <IconButton size={'small'} onClick={() => setSelectedSubmission(sub)}>
                                                                    <OpenInNew fontSize={'small'} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Stack>
                            </>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                {data?.status !== HeatStatus.COMPLETE && (
                    <Button
                        onClick={handleApprove}
                        variant={'contained'}
                        size={'small'}
                        color={'success'}
                        disabled={!data || approving}
                        startIcon={approving ? <CircularProgress size={14} /> : <CheckCircle />}
                    >
                        Approve Result
                    </Button>
                )}
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

            {/* Submission Detail Dialog */}
            {selectedSubmission && (
                <Dialog
                    open={!!selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    maxWidth={'sm'}
                    fullWidth
                >
                    <DialogTitle>
                        <Stack direction={'row'} spacing={1} alignItems={'center'}>
                            <Typography variant={'h6'}>
                                Adjudicator {selectedSubmission.adjudicator_letter} — {selectedSubmission.adjudicator_name}
                            </Typography>
                            <Chip
                                label={startCase(toLower(selectedSubmission.input_type))}
                                size={'small'}
                                color={selectedSubmission.input_type === 'JUDGE' ? 'primary' : 'default'}
                            />
                        </Stack>
                        <Typography variant={'caption'} color={'text.secondary'} display={'block'}>
                            Submitted {dayjs(selectedSubmission.submitted_at).format('DD MMM YYYY [at] HH:mm:ss')}
                            {selectedSubmission.ip_address && ` · ${selectedSubmission.ip_address}`}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3}>
                            {/* Marks grouped by dance */}
                            {(() => {
                                const byDance = selectedSubmission.marks.reduce<Record<string, typeof selectedSubmission.marks>>((acc, m) => {
                                    if (!acc[m.dance]) acc[m.dance] = [];
                                    acc[m.dance].push(m);
                                    return acc;
                                }, {});
                                return Object.entries(byDance).map(([ dance, marks ]) => (
                                    <Stack key={dance} spacing={0.5}>
                                        <Typography variant={'subtitle2'} color={'text.secondary'}>{dance}</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                            {marks
                                                .slice()
                                                .sort((a, b) => a.dancer_number - b.dancer_number)
                                                .map((m) => (
                                                    <Chip
                                                        key={`${m.dance}-${m.dancer_number}`}
                                                        label={`${m.dancer_number}${m.mark != null ? ` — ${m.mark}` : ''}`}
                                                        size={'small'}
                                                        variant={'outlined'}
                                                    />
                                                ))}
                                        </Box>
                                    </Stack>
                                ));
                            })()}

                            {/* Signature */}
                            {selectedSubmission.signature && (
                                <Stack spacing={0.5}>
                                    <Typography variant={'subtitle2'} color={'text.secondary'}>Signature</Typography>
                                    <Box
                                        component={'img'}
                                        src={selectedSubmission.signature}
                                        alt={`Signature of ${selectedSubmission.adjudicator_name}`}
                                        sx={{
                                            maxWidth: '100%',
                                            height: 100,
                                            objectFit: 'contain',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            bgcolor: 'common.white',
                                            p: 1,
                                            alignSelf: 'flex-start',
                                        }}
                                    />
                                </Stack>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            size={'small'}
                            variant={'outlined'}
                            color={'error'}
                            disabled={deleting}
                            startIcon={deleting ? <CircularProgress size={14} /> : undefined}
                            onClick={handleDeleteSubmission}
                        >
                            Delete Submission
                        </Button>
                        <Button size={'small'} variant={'contained'} color={'inherit'} onClick={() => setSelectedSubmission(null)}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Dialog>
    );
};

export default HeatFinalResultDialog;

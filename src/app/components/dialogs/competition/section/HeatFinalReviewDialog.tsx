'use client';
import React, { useMemo } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { DialogProps, useDialogs } from '@toolpad/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { sortBy, startCase, toLower } from 'lodash';
import { approveFinalResult, getHeatRoundMarks } from '@/app/server/competitions';
import { buildSkatingResults, DanceResult, RawMarkEntry } from '@/app/lib/skating';

type HeatFinalReviewDialogProps = {
    heat_id: string;
};

const HeatFinalReviewDialog: React.FC<DialogProps<HeatFinalReviewDialogProps, boolean>> = ({
    open,
    onClose,
    payload,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const dialogs = useDialogs();

    // ── Data loading ──────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['get-final-review-data', payload.heat_id],
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
                    name:p.adjudicator.name
                })),
                'letter',
            ) ?? [],
        [data],
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
    }, [data, adjudicators]);

    const allMarksEntered = useMemo(() => {
        if (!data) return false;
        return data.heat_marks.length === (data.panel?.panels_adjudicators?.length ?? 0);
    }, [data]);

    // ── Approve mutation ──────────────────────────────────────────────────────
    const { mutate, isPending } = useMutation({
        mutationKey: ['approve-final-result', payload.heat_id],
        mutationFn: async () => {
            if (!skatingResults) throw new Error('No results calculated');
            return approveFinalResult({
                heat_id: payload.heat_id,
                results: skatingResults.combined.map(d => ({
                    dancer_id: d.dancer_id,
                    place: d.place,
                })),
            });
        },
        onSuccess: res => {
            if (res?.data) {
                enqueueSnackbar('Final results approved', { variant: 'success' });
                onClose(true);
                return;
            }
            enqueueSnackbar('Failed to approve final results', { variant: 'error' });
        },
        onError: () => {
            enqueueSnackbar('Error approving final results', { variant: 'error' });
        },
    });

    const onApprove = async () => {
        await dialogs.confirm('Confirm final results and submit for checking?', {
            title: 'Confirm Approval',
            onClose: async confirmed => {
                if (confirmed) mutate();
            },
        });
    };

    // ── Per-dance table renderer ──────────────────────────────────────────────
    const renderDanceTable = (danceResult: DanceResult) => {
        const numDancers = danceResult.numDancers;
        const ordinals = Array.from({ length: numDancers }, (_, i) => i + 1);

        return (
            <Box key={danceResult.dance} mb={4}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
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
                                    <TableCell key={p} align="center" sx={{ fontFamily: 'monospace' }}>
                                        1-{p}
                                    </TableCell>
                                ))}
                                <TableCell align="center">Place</TableCell>
                                <TableCell align={'center'}>Rule</TableCell>
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
                                                {jm?.mark ?? '-'}
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
                                    <TableCell align={'center'}>
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
        <Dialog open={open} fullWidth maxWidth="lg">
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {data?.item_no} — Finals Review
                    </Typography>
                    <Typography variant={'h6'}>
                        {startCase(toLower(String(data?.section?.name)))}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <Stack alignItems="center" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Stack>
                ) : !allMarksEntered ? (
                    <Alert severity="error">
                        Not all adjudicators have entered marks. All marks must be submitted before reviewing.
                    </Alert>
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
                                                <TableCell align={'center'}>
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
                <Button
                    size="small"
                    color="inherit"
                    variant="contained"
                    onClick={() => onClose(false)}
                >
                    Close
                </Button>
                <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={onApprove}
                    disabled={isPending || !allMarksEntered || !skatingResults}
                >
                    {isPending ? <CircularProgress size={20} color="inherit" /> : 'Approve'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default HeatFinalReviewDialog;

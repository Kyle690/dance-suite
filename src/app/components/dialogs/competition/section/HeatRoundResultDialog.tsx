import React, { useCallback, useRef, useState } from 'react';
import { DialogProps } from "@toolpad/core";
import {
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
    Tooltip,
    Typography,
} from "@mui/material";
import { ArrowDropDown, CheckCircle, CheckCircleOutline, OpenInNew, Print, RemoveCircleOutline } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import dayjs from "@/app/utils/dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { approveHeatResult, getHeatRoundResult, printHeatResult } from "@/app/server/competitions";
import { startCase, toLower } from "lodash";
import { useSnackbar } from "notistack";
import { PrintMode } from "@/app/components/pdf/HeatRoundResultDocument";
import { HeatStatus } from "@prisma/client";
import { useDialogs } from "@toolpad/core";

type HeatRoundResultDialogProps = {
    heatId?: string;
}

const PRINT_OPTIONS: { label: string; mode: PrintMode }[] = [
    { label: 'Print Results + Callback Sheet', mode: 'both' },
    { label: 'Print Results Only', mode: 'result' },
    { label: 'Print Callback Sheet Only', mode: 'callback' },
];

const HeatRoundResultDialog: React.FC<DialogProps<HeatRoundResultDialogProps>> = ({
    open,
    onClose,
    payload
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const dialogs = useDialogs();
    const queryClient = useQueryClient();
    const [ printing, setPrinting ] = useState(false);
    const [ approving, setApproving ] = useState(false);
    const [ menuOpen, setMenuOpen ] = useState(false);
    const [ selectedSubmission, setSelectedSubmission ] = useState<NonNullable<typeof data>['mark_submissions'][number] | null>(null);
    const anchorRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery({
        queryKey: [ 'heat-round-result', payload?.heatId ],
        queryFn: async () => {
            if (!payload?.heatId) return null;
            const result = await getHeatRoundResult(payload.heatId);
            if (result?.data) return result.data;
            return null;
        }
    });

    const title = data
        ? `Item No. ${data.item_no} — ${startCase(toLower(String(data.section_name)))} ${startCase(toLower(String(data.heat_type)))} Results`
        : 'Round Results';

    const handleApprove = useCallback(async () => {
        if (!payload?.heatId) return;
        const confirmed = await dialogs.confirm(
            'Approving the result will mark this heat as Complete and cannot be undone.',
            { title: 'Approve Result?' }
        );
        if (!confirmed) return;

        setApproving(true);
        try {
            const result = await approveHeatResult(payload.heatId);
            if (result?.data) {
                enqueueSnackbar('Heat result approved', { variant: 'success' });
                await queryClient.invalidateQueries({ queryKey: [ 'heat-round-result', payload.heatId ] });
                await queryClient.invalidateQueries({ queryKey: [ 'section-heats' ] });
                onClose();
            }
        } catch (err) {
            console.error('Approve error:', err);
            enqueueSnackbar('Failed to approve result', { variant: 'error' });
        } finally {
            setApproving(false);
        }
    }, [ payload?.heatId, dialogs, enqueueSnackbar, queryClient, onClose ]);

    const handlePrint = useCallback(async (mode: PrintMode) => {
        if (!payload?.heatId) return;
        setMenuOpen(false);
        setPrinting(true);
        try {
            const result = await printHeatResult({ heat_id: payload.heatId, mode });
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
            // Clean up the object URL after a short delay to allow the tab to load
            if (win) {
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            }
        } catch (err) {
            console.error('PDF generation error:', err);
            enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
        } finally {
            setPrinting(false);
        }
    }, [ payload?.heatId, enqueueSnackbar ]);

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth={'lg'}
        >
            <DialogTitle>
                <Stack
                    direction={'row'}
                    spacing={2}
                    alignItems={'center'}
                >
                    <Typography variant={'h6'}>{title}</Typography>
                    {data && (
                        <Chip
                            label={`Called Back: ${data.total_called_back} / ${data.callback_limit ?? 0}`}
                            size={'small'}
                            color={data.total_called_back >= (data.callback_limit ?? 0) ? 'success' : 'warning'}
                            variant={'outlined'}
                        />
                    )}
                    {data?.heat_status === HeatStatus.COMPLETE && (
                        <Chip
                            label={'Approved'}
                            size={'small'}
                            color={'success'}
                            icon={<CheckCircle />}
                        />
                    )}
                </Stack>
            </DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Stack
                        alignItems={'center'}
                        justifyContent={'center'}
                        py={6}
                    >
                        <CircularProgress />
                    </Stack>
                ) : (
                    <Stack spacing={3}>
                        <TableContainer
                            component={Paper}
                            variant={'outlined'}
                            sx={{ overflowX: 'auto' }}
                        >
                            <Table size={'small'} stickyHeader>
                                <TableHead>
                                    {data?.table?.headerRows?.map((headerRow, index) => (
                                        <TableRow key={index}>
                                            {headerRow.map((cell, cellIndex) => (
                                                <TableCell
                                                    key={cellIndex}
                                                    align={cell?.align}
                                                    colSpan={cell?.colSpan}
                                                    rowSpan={cell?.rowSpan}
                                                    sx={cellSx({
                                                        strong: true,
                                                        rightBorder: 'thin',
                                                        minWidth: 32,
                                                        py: 0.5,
                                                    })}
                                                >
                                                    {cell?.label}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHead>
                                <TableBody>
                                    {data?.table?.rows?.map((bodyRow, index) => {
                                        const calledBack = bodyRow[bodyRow.length - 1] === true;
                                        return (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    bgcolor: calledBack ? 'rgba(46, 125, 50, 0.08)' : undefined,
                                                    '&:hover': { filter: 'brightness(0.97)' },
                                                }}
                                            >
                                                {bodyRow.map((cell, cellIndex) => (
                                                    <TableCell
                                                        key={cellIndex}
                                                        align={'center'}
                                                        sx={cellSx({
                                                            rightBorder: 'thin',
                                                            minWidth: 32,
                                                            py: 0.5,
                                                        })}
                                                    >
                                                        {String(cell ?? '')}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Mark Submission Audit */}
                        {(data?.mark_submissions?.length ?? 0) > 0 && (
                            <Stack spacing={1}>
                                <Typography variant={'subtitle2'} color={'text.secondary'}>
                                    Mark Submissions
                                </Typography>
                                <TableContainer component={Paper} variant={'outlined'}>
                                    <Table size={'small'}>
                                        <TableHead>
                                            <TableRow>
                                                {[ 'Adj.', 'Name', 'Type', 'Submitted', 'IP Address', 'Signature', 'Security', '' ].map((h) => (
                                                    <TableCell
                                                        key={h}
                                                        sx={cellSx({ strong: true, py: 0.5 })}
                                                    >
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data?.mark_submissions?.map((sub) => (
                                                <TableRow key={sub.uid}>
                                                    <TableCell sx={{ fontWeight: 700, py: 0.5 }}>
                                                        {sub.adjudicator_letter}
                                                    </TableCell>
                                                    <TableCell sx={{ py: 0.5 }}>
                                                        {sub.adjudicator_name}
                                                    </TableCell>
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
                                                                    src={`${sub.signature}`}
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
                        )}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                {data?.heat_status !== HeatStatus.COMPLETE && (
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
                    ref={anchorRef}
                    variant={'outlined'}
                    size={'small'}
                    color={'primary'}
                    disabled={!data || printing}
                >
                    <Button
                        onClick={() => handlePrint('both')}
                        startIcon={printing ? <CircularProgress size={14} /> : <Print />}
                    >
                        Print
                    </Button>
                    <Button
                        size={'small'}
                        onClick={() => setMenuOpen((prev) => !prev)}
                        sx={{ px: 0.5, minWidth: 28 }}
                    >
                        <ArrowDropDown />
                    </Button>
                </ButtonGroup>
                <Popper
                    open={menuOpen}
                    anchorEl={anchorRef.current}
                    placement={'top-end'}
                    transition
                    disablePortal
                    style={{ zIndex: 9999 }}
                >
                    {({ TransitionProps }) => (
                        <Grow
                            {...TransitionProps}
                            style={{ transformOrigin: 'right bottom' }}
                        >
                            <Paper elevation={4}>
                                <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
                                    <MenuList dense>
                                        {PRINT_OPTIONS.map((opt) => (
                                            <MenuItem
                                                key={opt.mode}
                                                onClick={() => handlePrint(opt.mode)}
                                            >
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
                    onClick={() => onClose()}
                    variant={'contained'}
                    size={'small'}
                    color={'inherit'}
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
                                                        label={m.dancer_number}
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
                        <Button size={'small'} variant={'contained'} color={'inherit'} onClick={() => setSelectedSubmission(null)}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Dialog>
    );
};

function cellSx({
    strong,
    rightBorder,
    minWidth,
    py,
}: {
    strong?: boolean;
    rightBorder?: 'thin' | 'thick';
    minWidth?: number;
    py?: number;
}) {
    return {
        ...(strong && { fontWeight: 700 }),
        ...(rightBorder === 'thick' && { borderRight: '2px solid', borderRightColor: 'divider' }),
        ...(rightBorder === 'thin' && { borderRight: '1px solid', borderRightColor: 'divider' }),
        ...(minWidth && { minWidth }),
        ...(py !== undefined && { py }),
    };
}

export default HeatRoundResultDialog;

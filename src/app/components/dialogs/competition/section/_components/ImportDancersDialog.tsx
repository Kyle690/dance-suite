'use client';
import React, { useRef, useState } from 'react';
import { DialogProps } from "@toolpad/core";
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
    IconButton,
    Link,
    Stack,
    Typography,
} from "@mui/material";
import { Close, CloudUpload } from "@mui/icons-material";
import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import Papa from "papaparse";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSectionDancers, importDancers } from "@/app/server/competitions";
import { DancerSchema, DancerSchemaType } from "@/app/schemas/SectionSchema";
import { useSnackbar } from "notistack";

type ImportPayload = {
    section_id: string;
}

type ParsedRow = DancerSchemaType & { _tempId: string };

const TEMPLATE_CSV = `number,name,partner_name,studio,region,country\n101,Jane Smith,John Smith,Elite Studio,Northern,AUS`;

const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dancers-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const ImportDancersDialog: React.FC<DialogProps<ImportPayload>> = ({ open, onClose, payload }) => {
    const { section_id } = payload;

    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [errorCount, setErrorCount] = useState(0);
    const [rowSelection, setRowSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set<string>() });
    const [isImporting, setIsImporting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data: existingDancers = [], isLoading: dancersLoading } = useQuery({
        queryKey: ['section-dancers', section_id],
        queryFn: async () => {
            const res = await getSectionDancers({ section_id });
            return res?.data ?? [];
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const valid: ParsedRow[] = [];
                let errors = 0;

                (results.data as Record<string, string>[]).forEach((row, index) => {
                    const parsed = DancerSchema.safeParse({
                        number: String(row.number ?? '').trim(),
                        name: String(row.name ?? '').trim() || null,
                        partner_name: row.partner_name?.trim() || null,
                        studio: row.studio?.trim() || null,
                        region: row.region?.trim() || null,
                        country: row.country?.trim() || null,
                        section_id,
                    });

                    if (parsed.success) {
                        const existing = existingDancers.find((d) => d.number === parsed.data.number);
                        valid.push({
                            ...parsed.data,
                            ...(existing ? { uid: existing.uid } : {}),
                            _tempId: `row-${index}`,
                        });
                    } else {
                        errors++;
                    }
                });

                setParsedRows(valid);
                setErrorCount(errors);
                setRowSelection({ type: 'include', ids: new Set(valid.map((r) => r._tempId)) });
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const conflictCount = parsedRows.filter((r) => !!r.uid).length;

    const handleImport = async () => {
        const selectedRows = parsedRows.filter((r) => rowSelection.type === 'exclude' ? !rowSelection.ids.has(r._tempId) : rowSelection.ids.has(r._tempId));
        if (!selectedRows.length) return;

        setIsImporting(true);
        try {
            const res = await importDancers({
                section_id,
                dancers: selectedRows.map(({ _tempId, ...dancer }) => dancer),
            });

            if (!res?.serverError && !res?.validationErrors) {
                await queryClient.invalidateQueries({ queryKey: ['section-dancers', section_id] });
                enqueueSnackbar(`${selectedRows.length} dancer${selectedRows.length > 1 ? 's' : ''} imported successfully`, { variant: 'success' });
                onClose();
            } else {
                enqueueSnackbar('Import failed. Please try again.', { variant: 'error' });
            }
        } catch {
            enqueueSnackbar('Import failed. Please try again.', { variant: 'error' });
        } finally {
            setIsImporting(false);
        }
    };

    const selectedCount = rowSelection.type === 'exclude'
        ? parsedRows.length - rowSelection.ids.size
        : rowSelection.ids.size;
    const title = step === 'upload' ? 'Import Dancers' : `Preview — ${parsedRows.length} rows${conflictCount > 0 ? ` (${conflictCount} conflicts)` : ''}`;

    return (
        <Dialog open={open} fullWidth maxWidth="md">
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{title}</Typography>
                    <IconButton onClick={() => onClose()} size="small">
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {step === 'upload' && (
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Upload a CSV file with columns: <strong>number, name</strong>, partner_name, studio, region, country.
                            The number and name columns are required.
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="outlined"
                                startIcon={<CloudUpload />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={dancersLoading}
                            >
                                Choose CSV file
                            </Button>
                            {fileName && (
                                <Typography variant="body2" color="text.secondary">
                                    {fileName}
                                </Typography>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </Stack>

                        {parsedRows.length > 0 && (
                            <Alert severity={errorCount > 0 ? 'warning' : 'success'}>
                                {parsedRows.length} valid row{parsedRows.length !== 1 ? 's' : ''} found
                                {errorCount > 0 ? `, ${errorCount} row${errorCount !== 1 ? 's' : ''} had errors and were skipped` : ''}.
                            </Alert>
                        )}

                        {errorCount > 0 && parsedRows.length === 0 && (
                            <Alert severity="error">
                                No valid rows found. {errorCount} row{errorCount !== 1 ? 's' : ''} had errors (missing number or name).
                                Check your file and try again.
                            </Alert>
                        )}

                        <Typography variant="body2">
                            <Link
                                component="button"
                                onClick={downloadTemplate}
                                underline="hover"
                            >
                                Don't have a file? Download a template
                            </Link>
                        </Typography>
                    </Stack>
                )}

                {step === 'preview' && (
                    <Box sx={{ height: 450 }}>
                        <DataGrid
                            rows={parsedRows}
                            getRowId={(row) => row._tempId}
                            checkboxSelection
                            rowSelectionModel={rowSelection}
                            onRowSelectionModelChange={setRowSelection}
                            density="compact"
                            disableColumnSelector
                            columns={[
                                { field: 'number', headerName: 'Number', width: 90 },
                                { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
                                { field: 'partner_name', headerName: 'Partner Name', flex: 1, minWidth: 140 },
                                { field: 'studio', headerName: 'Studio', flex: 1, minWidth: 120 },
                                { field: 'region', headerName: 'Region', width: 100 },
                                { field: 'country', headerName: 'Country', width: 90 },
                                {
                                    field: '_status',
                                    headerName: 'Status',
                                    width: 140,
                                    renderCell: (params) => params.row.uid
                                        ? <Chip label="Will overwrite" color="warning" size="small" />
                                        : <Chip label="New" color="success" size="small" />,
                                },
                            ]}
                            sx={{
                                backgroundColor: 'background.paper',
                                borderRadius: 2,
                                '& .MuiDataGrid-columnHeader': { backgroundColor: 'background.paper' },
                            }}
                            slotProps={{
                                loadingOverlay: { variant: 'linear-progress', noRowsVariant: 'skeleton' },
                            }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
                {step === 'upload' ? (
                    <>
                        <Button onClick={() => onClose()} color="inherit">Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={() => setStep('preview')}
                            disabled={parsedRows.length === 0}
                        >
                            Next
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={() => setStep('upload')} color="inherit">Back</Button>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                                Importing {selectedCount} of {parsedRows.length} selected
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleImport}
                                disabled={selectedCount === 0 || isImporting}
                                startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : undefined}
                            >
                                Import {selectedCount} dancer{selectedCount !== 1 ? 's' : ''}
                            </Button>
                        </Stack>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ImportDancersDialog;

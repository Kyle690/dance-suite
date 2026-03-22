'use client';
import React, { useCallback, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    Alert,
    Chip,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    Divider,
    TextField,
    IconButton,
    Collapse,
} from '@mui/material';
import { DialogProps } from '@toolpad/core';
import { competition } from '@prisma/client';
import Papa from 'papaparse';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { importCompetition } from '@/app/server/competitions';
import { CompetitionImportRowType } from '@/app/schemas/SectionSchema';
import { CloudUpload, FileDownloadOutlined, ExpandMore, ExpandLess, DeleteOutline } from '@mui/icons-material';
import { groupBy, startCase, toLower } from 'lodash';
import { CompetitiveType, SectionEntryType } from '@prisma/client';
import { getCompetitiveTypeColor, getEntryTypeColor } from '@/app/utils/heatUtils';

const COMPETITIVE_TYPE_MAP: Record<string, CompetitiveType> = {
    competitive: CompetitiveType.COMPETITIVE,
    social: CompetitiveType.SOCIAL,
    mixed: CompetitiveType.MIXED_COMPETITIVE,
    mixed_competitive: CompetitiveType.MIXED_COMPETITIVE,
};

const ENTRY_TYPE_MAP: Record<string, SectionEntryType> = {
    solo: SectionEntryType.SOLO,
    duo: SectionEntryType.DUO,
    couple: SectionEntryType.COUPLE,
    group: SectionEntryType.GROUP,
};

type ParsedRow = CompetitionImportRowType & { _row: number; _errors: string[] };

const parseCompetitiveType = (raw: string): CompetitiveType =>
    COMPETITIVE_TYPE_MAP[raw.trim().toLowerCase()] ?? CompetitiveType.COMPETITIVE;

const parseEntryType = (raw: string): SectionEntryType =>
    ENTRY_TYPE_MAP[raw.trim().toLowerCase()] ?? SectionEntryType.COUPLE;

const validateRow = (row: Omit<ParsedRow, '_errors'>): string[] => {
    const errors: string[] = [];
    if (!row.number.trim()) errors.push('Missing number');
    if (!row.name.trim()) errors.push('Missing dancer name');
    if (!row.section_name.trim()) errors.push('Missing section name');
    if (row.number.trim() && isNaN(parseInt(row.number.trim(), 10))) errors.push('Number must be numeric');
    return errors;
};

const CompetitionImportDialog: React.FC<DialogProps<competition>> = ({ open, onClose, payload }) => {
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const processFile = useCallback((file: File) => {
        setFileName(file.name);
        setRows([]);

        Papa.parse(file, {
            skipEmptyLines: true,
            complete: (result) => {
                const sectionsWithErrors = new Set<string>();
                const parsed: ParsedRow[] = (result.data as string[][]).map((cols, i) => {
                    const [
                        number = '',
                        name = '',
                        partner_name = '',
                        studio = '',
                        region = '',
                        country = '',
                        section_name = '',
                        competitive_type_raw = '',
                        entry_type_raw = '',
                    ] = cols;

                    const row = {
                        _row: i + 1,
                        number: number.trim(),
                        name: name.trim(),
                        partner_name: partner_name.trim() || null,
                        studio: studio.trim() || null,
                        region: region.trim() || null,
                        country: country.trim() || null,
                        section_name: section_name.trim(),
                        competitive_type: parseCompetitiveType(competitive_type_raw),
                        entry_type: parseEntryType(entry_type_raw),
                    };

                    const errors = validateRow(row);
                    if (errors.length > 0) {
                        sectionsWithErrors.add(row.section_name.toLowerCase() || '__unknown__');
                    }
                    return { ...row, _errors: errors };
                });

                setRows(parsed);
                setExpandedSections(sectionsWithErrors);
            },
        });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) processFile(file);
    };

    const handleRowRemove = (rowIndex: number) => {
        setRows(prev => prev.filter(r => r._row !== rowIndex));
    };

    const handleRowFieldChange = (
        rowIndex: number,
        field: keyof Omit<CompetitionImportRowType, 'competitive_type' | 'entry_type'>,
        value: string
    ) => {
        setRows(prev => prev.map(r => {
            if (r._row !== rowIndex) return r;
            const updated = { ...r, [field]: value };
            return { ...updated, _errors: validateRow(updated) };
        }));
    };

    const toggleSection = (sectionKey: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionKey)) next.delete(sectionKey);
            else next.add(sectionKey);
            return next;
        });
    };

    const validRows = rows.filter(r => r._errors.length === 0);
    const errorRows = rows.filter(r => r._errors.length > 0);
    const allSectionGroups = groupBy(rows, r => r.section_name.trim().toLowerCase() || '__unknown__');
    const totalSectionCount = Object.keys(allSectionGroups).filter(k => k !== '__unknown__').length;
    const importableSectionCount = Object.entries(allSectionGroups)
        .filter(([k, sectionRows]) => k !== '__unknown__' && sectionRows.some(r => r._errors.length === 0))
        .length;

    const handleImport = async () => {
        if (!payload?.uid || validRows.length === 0) return;
        setIsImporting(true);
        try {
            const result = await importCompetition({
                competition_id: payload.uid,
                rows: validRows,
            });

            if (result?.data) {
                const { sections_created, sections_existing, dancers_created } = result.data;
                enqueueSnackbar(
                    `Imported ${dancers_created} dancers across ${sections_created} new section(s) (${sections_existing} existing)`,
                    { variant: 'success' }
                );
                await queryClient.invalidateQueries({ queryKey: ['competitionSections', payload.uid] });
                onClose?.();
            } else {
                enqueueSnackbar('Import failed', { variant: 'error' });
            }
        } catch {
            enqueueSnackbar('Import failed', { variant: 'error' });
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setRows([]);
        setFileName(null);
        setExpandedSections(new Set());
        onClose?.();
    };

    return (
        <Dialog open={open} fullWidth maxWidth="lg">
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Import Competition Data</Typography>
                    <Button
                        size="small"
                        startIcon={<FileDownloadOutlined />}
                        component="a"
                        href="/competition-import-template.csv"
                        download="competition-import-template.csv"
                        sx={{ ml: 2, whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        Example CSV
                    </Button>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} pt={1}>
                    <Alert severity="info" variant="outlined">
                        <Typography variant="body2" fontWeight={500} mb={0.5}>Expected CSV column order:</Typography>
                        <Typography variant="body2" fontFamily="monospace">
                            number, dancer name, partner name, studio, region, country, section name, section type, entry type
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                            Section type: competitive (default), social, mixed — Entry type: couple (default), solo, duo, group
                        </Typography>
                    </Alert>

                    {/* Drop zone */}
                    <Box
                        component="label"
                        htmlFor="csv-upload"
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        sx={{
                            border: '2px dashed',
                            borderColor: isDragging ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            bgcolor: isDragging ? 'action.hover' : 'background.default',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        }}
                    >
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv,text/csv"
                            hidden
                            onChange={handleFileChange}
                        />
                        <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" fontWeight={500}>
                            {fileName ?? 'Drag & drop a CSV file or click to browse'}
                        </Typography>
                        {fileName && (
                            <Typography variant="caption" color="text.secondary">
                                Click to replace
                            </Typography>
                        )}
                    </Box>

                    {rows.length > 0 && (
                        <>
                            {/* Summary chips */}
                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                <Chip label={`${rows.length} rows`} size="small" />
                                <Chip
                                    label={`${totalSectionCount} section${totalSectionCount !== 1 ? 's' : ''}`}
                                    size="small"
                                    color="primary"
                                />
                                <Chip
                                    label={`${validRows.length} valid dancer${validRows.length !== 1 ? 's' : ''}`}
                                    size="small"
                                    color="success"
                                />
                                {errorRows.length > 0 && (
                                    <Chip
                                        label={`${errorRows.length} row${errorRows.length !== 1 ? 's' : ''} with issues`}
                                        size="small"
                                        color="error"
                                    />
                                )}
                            </Stack>

                            <Divider />

                            {/* Section summary table */}
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Section</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Entry</TableCell>
                                        <TableCell align="right">Dancers</TableCell>
                                        <TableCell align="right">Issues</TableCell>
                                        <TableCell width={48} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(allSectionGroups).map(([sectionKey, sectionRows]) => {
                                        const first = sectionRows[0];
                                        const validCount = sectionRows.filter(r => r._errors.length === 0).length;
                                        const errorCount = sectionRows.filter(r => r._errors.length > 0).length;
                                        const hasErrors = errorCount > 0;
                                        const isExpanded = expandedSections.has(sectionKey);
                                        const displayName = first.section_name || '(no section name)';

                                        return (
                                            <React.Fragment key={sectionKey}>
                                                <TableRow
                                                    hover={hasErrors}
                                                    sx={{ cursor: hasErrors ? 'pointer' : 'default' }}
                                                    onClick={() => hasErrors && toggleSection(sectionKey)}
                                                >
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {displayName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={startCase(toLower(first.competitive_type.replace('_', ' ')))}
                                                            size="small"
                                                            color={getCompetitiveTypeColor(first.competitive_type)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={startCase(toLower(first.entry_type))}
                                                            size="small"
                                                            color={getEntryTypeColor(first.entry_type)}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">{validCount}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {hasErrors ? (
                                                            <Chip label={errorCount} size="small" color="error" />
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary">—</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell padding="none">
                                                        {hasErrors && (
                                                            <IconButton size="small">
                                                                {isExpanded
                                                                    ? <ExpandLess fontSize="small" />
                                                                    : <ExpandMore fontSize="small" />}
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Inline error editor */}
                                                {hasErrors && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            sx={{ p: 0, borderBottom: isExpanded ? undefined : 'none' }}
                                                        >
                                                            <Collapse in={isExpanded} unmountOnExit>
                                                                <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="error"
                                                                        fontWeight={500}
                                                                        display="block"
                                                                        mb={1.5}
                                                                    >
                                                                        {errorCount} row{errorCount !== 1 ? 's' : ''} with issues — edit inline to fix before importing:
                                                                    </Typography>
                                                                    <Table size="small">
                                                                        <TableHead>
                                                                            <TableRow>
                                                                                <TableCell sx={{ width: 80 }}>#</TableCell>
                                                                                <TableCell sx={{ width: 180 }}>Name</TableCell>
                                                                                <TableCell sx={{ width: 180 }}>Section</TableCell>
                                                                                <TableCell>Errors</TableCell>
                                                                                <TableCell width={48} />
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {sectionRows
                                                                                .filter(r => r._errors.length > 0)
                                                                                .map(row => (
                                                                                    <TableRow key={row._row}>
                                                                                        <TableCell>
                                                                                            <TextField
                                                                                                size="small"
                                                                                                value={row.number}
                                                                                                onChange={e => handleRowFieldChange(row._row, 'number', e.target.value)}
                                                                                                error={row._errors.some(e => e.toLowerCase().includes('number'))}
                                                                                                inputProps={{ style: { fontSize: 12 } }}
                                                                                                sx={{ width: 70 }}
                                                                                            />
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <TextField
                                                                                                size="small"
                                                                                                value={row.name}
                                                                                                onChange={e => handleRowFieldChange(row._row, 'name', e.target.value)}
                                                                                                error={row._errors.some(e => e.toLowerCase().includes('dancer'))}
                                                                                                inputProps={{ style: { fontSize: 12 } }}
                                                                                                sx={{ width: 160 }}
                                                                                            />
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <TextField
                                                                                                size="small"
                                                                                                value={row.section_name}
                                                                                                onChange={e => handleRowFieldChange(row._row, 'section_name', e.target.value)}
                                                                                                error={row._errors.some(e => e.toLowerCase().includes('section'))}
                                                                                                inputProps={{ style: { fontSize: 12 } }}
                                                                                                sx={{ width: 160 }}
                                                                                            />
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <Typography variant="caption" color="error">
                                                                                                {row._errors.join(', ')}
                                                                                            </Typography>
                                                                                        </TableCell>
                                                                                        <TableCell padding="none">
                                                                                            <IconButton
                                                                                                size="small"
                                                                                                color="error"
                                                                                                onClick={e => { e.stopPropagation(); handleRowRemove(row._row); }}
                                                                                            >
                                                                                                <DeleteOutline fontSize="small" />
                                                                                            </IconButton>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" color="inherit" size="small" onClick={handleClose} disabled={isImporting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    disabled={importableSectionCount === 0 || isImporting}
                    onClick={handleImport}
                >
                    {isImporting
                        ? <CircularProgress size={18} color="inherit" />
                        : `Import ${importableSectionCount} section${importableSectionCount !== 1 ? 's' : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CompetitionImportDialog;
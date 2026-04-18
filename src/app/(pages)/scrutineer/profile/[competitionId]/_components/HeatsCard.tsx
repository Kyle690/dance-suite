'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getCompetitionHeats } from "@/app/server/competitions";
import { Card, CardContent, Chip, Stack } from '@mui/material';
import { DataGrid } from "@mui/x-data-grid";
import { orderBy, startCase, toLower } from 'lodash';
import { getHeatStatusColor, getHeatTypeColor } from "@/app/utils/heatUtils";
import SectionHeatRowButtons from "@/app/components/dialogs/competition/section/_components/SectionHeatRowButtons";
import { useParams } from "next/navigation";
import { HeatStatus } from "@prisma/client";

const ALL_STATUSES = Object.values(HeatStatus);

const HeatsCard = () => {
    const { competitionId } = useParams<{ competitionId: string }>();
    const [ activeFilters, setActiveFilters ] = useState<HeatStatus[]>([]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: [ 'competition-heats', competitionId ],
        queryFn: async () => {
            if (!competitionId) return [];
            const res = await getCompetitionHeats(competitionId);
            if (res?.data) return res.data;
            return [];
        },
    });

    const toggleFilter = (status: HeatStatus) => {
        setActiveFilters((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [ ...prev, status ]
        );
    };

    const visibleStatuses = useMemo(() => {
        if (!data) return new Set<HeatStatus>();
        return new Set(data.map((h: any) => h.status as HeatStatus));
    }, [ data ]);

    const filteredRows = useMemo(() => {
        if (!data) return [];
        if (activeFilters.length === 0) return data;
        return data.filter((h: any) => activeFilters.includes(h.status));
    }, [ data, activeFilters ]);

    return (
        <Card
            sx={{
                borderTopLeftRadius: 0,
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <CardContent
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    pb: '16px !important',
                }}
            >
                {/* Status filter chips */}
                <Stack direction={'row'} spacing={1} flexWrap={'wrap'} mb={1.5} useFlexGap>
                    {ALL_STATUSES.filter((s) => visibleStatuses.has(s)).map((status) => {
                        const active = activeFilters.includes(status);
                        return (
                            <Chip
                                key={status}
                                label={startCase(toLower(status))}
                                size={'small'}
                                color={active ? getHeatStatusColor(status) : 'default'}
                                variant={active ? 'filled' : 'outlined'}
                                onClick={() => toggleFilter(status)}
                                sx={{ cursor: 'pointer' }}
                            />
                        );
                    })}
                </Stack>

                <DataGrid
                    columns={[
                        {
                            field: 'item_no',
                            headerName: 'Item No',
                        },
                        {
                            field: 'section',
                            headerName: 'Section',
                            flex: 1,
                            valueGetter: (_: any, row: any) => startCase(toLower(row?.section?.name)),
                        },
                        {
                            field: 'type',
                            headerName: 'Heat Type',
                            flex: 1,
                            align: 'center',
                            headerAlign: 'center',
                            renderCell: (params) => (
                                <Chip
                                    size="small"
                                    label={startCase(toLower(params.row.type))}
                                    color={getHeatTypeColor(params.row.type)}
                                />
                            ),
                        },
                        {
                            field: 'callback_limit',
                            headerName: 'Callback',
                            flex: 1,
                            headerAlign: 'center',
                            align: 'center',
                            valueGetter:(value)=>value>0?value:'N/A'
                        },
                        {
                            field: 'no_dancers',
                            headerName: 'No. of Dancers',
                            flex: 1,
                            headerAlign: 'center',
                            align: 'center',
                            valueGetter: (_: any, row: any) => row?.start_list?.length,
                        },
                        {
                            field: 'dances',
                            headerName: 'Dances',
                            flex: 1,
                            headerAlign: 'center',
                            align: 'center',
                            valueGetter: (_: any, row: any) => row.dances?.map((d:string) => d?.[0]).join(', ') || 'N/A',
                        },
                        {
                            field: 'panel',
                            headerName: 'Panel',
                            flex: 1,
                            valueGetter: (row: { panels_adjudicators: { adjudicator: { letter: string } }[] }) => {
                                return orderBy(row?.panels_adjudicators, 'adjudicator.letter')
                                    ?.map((p) => p?.adjudicator?.letter)
                                    .join(', ') || 'N/A';
                            },
                        },
                        {
                            field: 'marks_entered',
                            headerName: 'Marks Entered',
                            flex: 1,
                            headerAlign: 'center',
                            align: 'center',
                            valueGetter: (_: any, row: any) =>
                                `${row?.heat_marks?.length || 0} / ${row?.panel?.panels_adjudicators?.length || 0}`,
                        },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 1,
                            renderCell: (params) => (
                                <Chip
                                    size="small"
                                    label={startCase(toLower(params?.row?.status))}
                                    color={getHeatStatusColor(params.row.status)}
                                />
                            ),
                        },
                        {
                            field: 'actions',
                            headerName: 'Actions',
                            minWidth: 80,
                            align: 'center',
                            headerAlign: 'center',
                            renderCell: (params) => (
                                <SectionHeatRowButtons
                                    data={params?.row}
                                    refetch={refetch}
                                />
                            ),
                        },
                    ]}
                    rows={filteredRows}
                    getRowId={(row) => row?.uid}
                    showToolbar
                    loading={isLoading}
                    disableColumnSelector
                    //disableColumnFilter
                    //disableColumnSorting
                    disableColumnMenu
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            csvOptions: { disableToolbarButton: true },
                            printOptions: { disableToolbarButton: true },
                        },
                        loadingOverlay: {
                            variant: 'linear-progress',
                            noRowsVariant: 'skeleton',
                        },
                    }}
                    sx={{
                        flex: 1,
                        backgroundColor: 'background.paper',
                        borderRadius: 4,
                        '& .MuiDataGrid-columnHeader': {
                            backgroundColor: 'background.paper',
                        },
                    }}
                />
            </CardContent>
        </Card>
    );
};

export default HeatsCard;

import React from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteHeat, getSectionHeats } from "@/app/server/competitions";
import { Box, Chip, IconButton, Stack } from '@mui/material'
import { DataGrid } from "@mui/x-data-grid";
import { useDialogs } from "@toolpad/core";
import { orderBy, startCase, toLower }from 'lodash';
import { getHeatStatusColor } from "@/app/utils/heatUtils";
import MenuButtons from "@/app/components/layout/MenuButtons";
import { Edit, Delete, ListSharp }from '@mui/icons-material'
import HeatDialog from "@/app/components/dialogs/competition/section/HeatDialog";
import { HeatStatus } from "@prisma/client";
import { useSnackbar } from "notistack";
import SectionHeatRowButtons from "@/app/components/dialogs/competition/section/_components/SectionHeatRowButtons";

type SectionHeatsProps = {
    sectionId:string
}

const SectionHeats: React.FC<SectionHeatsProps> = ({
    sectionId
}) => {


    const {
        data,
        isLoading,
        refetch
    }=useQuery({
        queryKey:[ 'section-heats', sectionId ],
        queryFn:async()=>{
            if(!sectionId)return [];
            const res = await getSectionHeats({ uid:sectionId });
            if(res.data){
                return res.data;
            }
            return [];
        }
    })

    const dialogs = useDialogs()
    const { enqueueSnackbar }=useSnackbar()

    return (
        <Stack>
            <DataGrid
                columns={[
                    {
                        field:'item_no',
                        headerName:'Item No',
                    },
                    {
                        field:'type',
                        headerName:'Heat Type',
                        flex:1,
                    },
                    {
                        field:'callback_limit',
                        headerName:"Callback",
                        flex:1,
                        headerAlign:'center',
                        align:'center',
                    },
                    {
                        field:'no_dancers',
                        headerName:'No. of Dancers',
                        flex:1,
                        headerAlign:'center',
                        align:'center',
                        valueGetter:(_,row)=>row?.start_list?.length
                    },
                    {
                        field:'dances',
                        headerName:'Dances',
                        flex:1,
                    },
                    {
                        field:'panel',
                        headerName:'Panel',
                        flex:1,
                        valueGetter:(row:{panels_adjudicators:{adjudicator:{letter:string}}[]})=>{
                            return orderBy(row?.panels_adjudicators,'adjudicator.letter')?.map((p=>p?.adjudicator?.letter)).join(', ') ||'N/A'
                        }
                    },
                    {
                        field:'marks_entered',
                        headerName:'Marks Entered',
                        flex:1,
                        headerAlign:'center',
                        align:'center',
                        valueGetter:(_,row)=>`${row?.heat_marks?.length || 0} / ${row?.panel?.panels_adjudicators?.length || 0}`
                    },
                    {
                        field:'status',
                        headerName:'Status',
                        flex:1,
                        renderCell:(params)=>{



                            return (
                                <Chip
                                    size={'small'}
                                    label={startCase(toLower(params?.row?.status))}
                                    color={getHeatStatusColor(params.row.status)}
                                />
                            )
                        }
                    },
                    {
                        field:'actions',
                        headerName:'Actions',
                        minWidth:80,
                        align:'center',
                        headerAlign:'center',
                        renderCell:(params)=>{
                            return (
                                <SectionHeatRowButtons
                                    data={params?.row}
                                    refetch={refetch}
                                />
                            )
                        }
                    }
                ]}
                rows={data ||[]}
                getRowId={(row)=>row?.uid}
                showToolbar
                loading={isLoading}
                disableColumnSelector
                sx={{
                    backgroundColor:'background.paper',
                    borderRadius:4,
                    '& .MuiDataGrid-columnHeader': {
                        backgroundColor: 'background.paper',
                    },
                }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                        csvOptions: { disableToolbarButton: true },
                        printOptions: { disableToolbarButton: true },
                    },
                    loadingOverlay:{
                        variant:'linear-progress',
                        noRowsVariant:'skeleton'
                    }
                }}
            />
        </Stack>
    );
}

export default SectionHeats;

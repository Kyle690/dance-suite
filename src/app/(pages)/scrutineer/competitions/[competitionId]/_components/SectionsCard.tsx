'use client'
import React from 'react';
import { Button, Card, CardContent, CardHeader } from "@mui/material";
import MenuButtons from "@/app/components/layout/MenuButtons";
import { AddCircle, Edit, Delete, ViewArray } from "@mui/icons-material";
import { useDialogs } from "@toolpad/core";
import SectionDetailsDialog from "@/app/components/dialogs/competition/SectionDetailsDialog";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { deleteSection, getCompetitionSections } from "@/app/server/competitions";
import { DataGrid } from "@mui/x-data-grid";
import SectionDialog from "@/app/components/dialogs/competition/section/SectionDialog";
import { startCase, toLower } from "lodash";
import { Chip } from "@mui/material";
import { getEntryTypeColor, getCompetitiveTypeColor, getSectionStatusColor } from "@/app/utils/heatUtils";


type SectionsCardProps = {}

const SectionsCard: React.FC<SectionsCardProps> = () => {

    const dialogs = useDialogs();

    const { competitionId }=useParams()

    const {
        data,
        isLoading,
        refetch,
    }=useQuery({
        queryKey:[ 'competitionSections', competitionId ],
        queryFn:async()=>{
            if(!competitionId){
                return [];
            }
            const res = await getCompetitionSections({ competition_id:String(competitionId) });
            if(res.data){
                return res.data;
            }
            return [];
        }
    })

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
                <DataGrid
                    columns={[
                        {
                            field:'name',
                            headerName:'Section Name',
                            flex:1,
                            renderCell:(params)=>{
                                return (
                                    <Button
                                        onClick={async()=>{
                                            await dialogs.open(SectionDialog, params.row)
                                        }}
                                    >
                                        {startCase(toLower(params.value))}
                                    </Button>
                                )
                            }
                        },
                        {
                            field:'_count.heat',
                            headerName:'Heats',
                            flex:1,
                            valueGetter:(_,row)=>row._count?.heat || 0,
                            align:'center',
                            headerAlign:'center'
                        },
                        {
                            field:'next_heat',
                            headerName:'Next Heat',
                            flex:1,
                            valueGetter:(_, row)=>`Item ${row?.heat?.[0]?.item_no || 0}`,
                            align:'center',
                            headerAlign:'center'
                        },
                        {
                            field:'entry_type',
                            headerName:'Entry Type',
                            flex:1,
                            renderCell:(params)=> params.value ? (
                                <Chip
                                    label={startCase(toLower(params.value))}
                                    size="small"
                                    color={getEntryTypeColor(params.value)}
                                />
                            ) : null,
                        },
                        {
                            field:'competitive_type',
                            headerName:'Competitive Type',
                            flex:1,
                            renderCell:(params)=> params.value ? (
                                <Chip
                                    label={startCase(toLower(params.value.replace('_', ' ')))}
                                    size="small"
                                    color={getCompetitiveTypeColor(params.value)}
                                />
                            ) : null,
                        },
                        {
                            field:'status',
                            headerName:'Status',
                            flex:1,
                            align:'center',
                            headerAlign:'center',
                            renderCell:(params)=> params.value ? (
                                <Chip
                                    label={startCase(toLower(params.value))}
                                    size="small"
                                    color={getSectionStatusColor(params.value)}
                                />
                            ) : null,
                        },
                        {
                            field:'Actions',
                            headerName:'Actions',
                            width:80,
                            headerAlign:'center',
                            align:'center',
                            renderCell:(params)=>(
                                <MenuButtons
                                    name={'section_menu'}
                                    id={params?.row?.uid}
                                    buttons={[
                                        {
                                            label:'View Section',
                                            icon:<ViewArray color={'primary'}/>,
                                            onClick:async()=>{
                                                await dialogs.open(SectionDialog, params.row);
                                            }
                                        },
                                        {
                                            label:'Edit',
                                            icon:<Edit color={'secondary'}/>,
                                            onClick:async()=>{
                                                await dialogs.open(SectionDetailsDialog, params.row)
                                                refetch();
                                            },
                                        },
                                        {
                                            label:'Delete',
                                            icon:<Delete color={'error'}/>,
                                            onClick:async()=>{
                                                await dialogs.confirm('Are you sure you want to delete this section? This action cannot be undone.',{
                                                    title:'Delete Section',
                                                    onClose:async(res)=>{
                                                        if(res){
                                                            const response = await deleteSection({ uid:params.row.uid });
                                                            if(response?.data){
                                                                refetch();
                                                            }
                                                        }
                                                    }
                                                })
                                            }
                                        }
                                    ]}
                                />
                            )
                        }
                    ]}
                    rows={data ||[]}
                    getRowId={(row)=>row.uid}
                    showToolbar
                    disableColumnMenu
                    loading={isLoading}
                    sx={{
                        flex: 1,
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
            </CardContent>
        </Card>
    );
}

export default SectionsCard;

//RL5i1MLnSzyc

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
        <Card>
            <CardHeader
                action={(
                    <Button
                        size={'small'}
                        variant={'contained'}
                        color={'primary'}
                        startIcon={<AddCircle color={'inherit'} />}
                        onClick={async()=>{
                            await dialogs.open(SectionDetailsDialog)
                            refetch();
                        }}
                    >
                        Add Section
                    </Button>
                )}
            />
            <CardContent
                sx={{
                    height:800
                }}
            >
                <DataGrid
                    columns={[
                        {
                            field:'name',
                            headerName:'Section Name',
                            flex:1,
                        },
                        {
                            field:'heats',
                            headerName:'Heats',
                            flex:1
                        },
                        {
                            field:'next_heat',
                            headerName:'Next Heat',
                            flex:1
                        },
                        {
                            field:'entry_type',
                            headerName:'Entry Type',
                            flex:1,
                        },
                        {
                            field:'competitive_type',
                            headerName:'Competitive Type',
                            flex:1
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
                    loading={isLoading}
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
            </CardContent>
        </Card>
    );
}

export default SectionsCard;

'use client';
import { Typography, Box, Card, CardContent, Button, Chip, Stack, Container, CardHeader, Link } from '@mui/material';
import NextLink from 'next/link'
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AddCircle } from "@mui/icons-material";
import { useDialogs } from "@toolpad/core";
import CompetitionDetailsDialog from "@/app/components/dialogs/competition/CompetitionDetailsDialog";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCompetitions } from "@/app/server/competitions";

const columns: GridColDef[] = [
    {
        field: 'name',
        headerName: 'Competition Name',
        width: 250,
        renderCell:(params)=>(
            <Link
                component={NextLink}
                href={`/competitions/${params.id}`}
            >
                {params.value}
            </Link>
        )
    },
    { field: 'date', headerName: 'Date', flex:1, minWidth: 130, type:'dateTime' },
    { field: 'venue', headerName: 'Venue', flex:1, minWidth: 180 },
    { field:'organization', headerName:'Organization', flex:1, minWidth:150 },
    // {
    //     field: 'status',
    //     headerName: 'Status',
    //     width: 120,
    //     renderCell: (params) => {
    //         const getStatusColor = (status: string) => {
    //             switch (status.toLowerCase()) {
    //             case 'upcoming': return 'info';
    //             case 'in progress': return 'warning';
    //             case 'completed': return 'success';
    //             case 'cancelled': return 'error';
    //             default: return 'default';
    //             }
    //         };
    //         return (
    //             <Chip
    //                 label={params.value}
    //                 color={getStatusColor(params.value)}
    //                 size="small"
    //             />
    //         );
    //     }
    // },
    // { field: 'participants', headerName: 'Participants', width: 120, type: 'number' },
    // {
    //     field: 'actions',
    //     type: 'actions',
    //     headerName: 'Actions',
    //     width: 120,
    //     getActions: (params) => [
    //         <GridActionsCellItem
    //             key="view"
    //             icon={<VisibilityIcon />}
    //             label="View"
    //             onClick={() => console.log('View', params.id)}
    //         />,
    //         <GridActionsCellItem
    //             key="edit"
    //             icon={<EditIcon />}
    //             label="Edit"
    //             onClick={() => console.log('Edit', params.id)}
    //         />,
    //         <GridActionsCellItem
    //             key="delete"
    //             icon={<DeleteIcon />}
    //             label="Delete"
    //             onClick={() => console.log('Delete', params.id)}
    //         />,
    //     ],
    // },
];

const Competitions = ()=>{

    const [ openModal, setOpenModal ]=useState<boolean>(false);

    const {
        data,
        isLoading,
    }=useQuery({
        queryKey:[ 'competitions' ],
        queryFn:async()=>{
            const response = await getCompetitions();
            if(response.data){
                return response.data;
            }
        }
    })

    return (
        <Container
            maxWidth={'lg'}
            sx={{
                p:4
            }}
        >
            <Card>
                <CardHeader
                    title={'Competitions'}
                    subheader={'All competitions you have created or are managing'}
                    action={(
                        <Button
                            startIcon={<AddCircle/>}
                            variant={'contained'}
                            size={'small'}
                            onClick={()=>setOpenModal(true)}
                        >
                            Create New
                        </Button>
                    )}
                />
                <CardContent>
                    <div style={{ height: 700, width: '100%' }}>
                        <DataGrid
                            rows={data}
                            columns={columns}
                            density={'compact'}
                            getRowId={(row)=>row.uid}
                            showToolbar
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
                    </div>
                </CardContent>
            </Card>
            <CompetitionDetailsDialog
                payload={undefined}
                open={openModal}
                onClose={async()=>setOpenModal(false)}
            />
        </Container>
    )
}

export default Competitions;

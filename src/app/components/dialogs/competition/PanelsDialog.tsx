import React, { useEffect } from 'react';
import { DialogProps, useDialogs } from "@toolpad/core";
import { useParams } from "next/navigation";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Box, } from "@mui/material";
import { AddCircle, Delete, Edit } from '@mui/icons-material'
import { DataGrid } from "@mui/x-data-grid";
import PanelDialog from "@/app/components/dialogs/competition/PanelDialog";
import { useQuery } from "@tanstack/react-query";
import { deletePanel, getPanels } from "@/app/server/competitions";
import MenuButtons from "@/app/components/layout/MenuButtons";
import { PanelSchemaType } from "@/app/schemas/PanelSchema";
import { orderBy } from "lodash";

const PanelsDialog: React.FC<DialogProps> = ({
    open,
    onClose,
}) => {

    const {
        competitionId
    }=useParams();

    const dialogs = useDialogs();
    const onExit = ()=>{
        onClose?.(undefined);
    }

    const {
        data:panels,
        isLoading:panelsLoading,
        refetch
    }=useQuery({
        queryKey:[ 'competition_panels',competitionId ],
        queryFn:async()=>{
            if(!competitionId){
                return null
            }
            const result = await getPanels(String(competitionId));
            if(result?.data){
                return result.data;
            }
            return null;
        }
    })

    useEffect (() => {
        if(open){
            refetch();
        }
    }, [ open ]);


    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth={'lg'}
        >
            <DialogTitle>
                <Stack
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                >
                    <Typography variant={'h5'}>
                        Adjudicator Panels
                    </Typography>
                    <Button
                        size={'small'}
                        variant={'contained'}
                        onClick={async()=>{
                            await dialogs.open(PanelDialog)
                        }}
                        color={'primary'}
                        startIcon={<AddCircle/>}
                    >
                        Add Panel
                    </Button>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ height:600 }}>
                    <DataGrid
                        columns={[
                            {
                                field:'name',
                                headerName:'Panel Name',
                                flex:1,
                                valueGetter:(value)=>value ||'N/A'
                            },
                            {
                                field:'adjudicators',
                                headerName:'Adjudicators',
                                flex:1,
                                valueGetter:(_, row)=>{
                                    return orderBy(row.panels_adjudicators,'adjudicator.letter')?.map((item)=>{
                                        return item.adjudicator?.letter
                                    }).join(', ')
                                }
                            },
                            {
                                field:'actions',
                                headerName:'Actions',
                                flex:1,
                                width:60,
                                headerAlign:'center',
                                align:'center',
                                renderCell:(params)=>{
                                    return <MenuButtons
                                        name={'panel-actions'}
                                        id={params?.row?.uid}
                                        buttons={[
                                            {
                                                label:'Edit',
                                                color:'primary',
                                                icon:<Edit color={'primary'}/>,
                                                onClick:async()=>{
                                                    await dialogs.open(PanelDialog,{
                                                        uid:params.row.uid,
                                                        name:params.row.name ||'',
                                                        competitionId:String(competitionId),
                                                        adjudicators: params.row.panels_adjudicators.map((adjudicator)=>{
                                                            return {
                                                                uid:adjudicator.adjudicator.uid,
                                                                letter:adjudicator.adjudicator.letter,
                                                                name:String(adjudicator.adjudicator.name)
                                                            }
                                                        })
                                                    })
                                                }
                                            },
                                            {
                                                label:'Delete',
                                                color:'error',
                                                icon:<Delete color={'error'}/>,
                                                onClick:async()=>{
                                                    await dialogs.confirm('Confirm you want to delete this panel? This action cannot be undone.',{
                                                        onClose:async(response)=>{
                                                            if(response){
                                                                await deletePanel(params.row?.uid);
                                                                await refetch();
                                                            }
                                                        },
                                                        title:'Confirm delete',
                                                        okText:'Delete',
                                                        severity:'error',
                                                    })
                                                }
                                            }
                                        ]}
                                    />
                                }
                            }
                        ]}
                        rows={panels ||[]}
                        loading={panelsLoading}
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
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    size={'small'}
                    onClick={onExit}
                    color={'inherit'}
                    variant={'contained'}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PanelsDialog;

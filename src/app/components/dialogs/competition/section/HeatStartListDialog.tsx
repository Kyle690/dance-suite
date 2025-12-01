import React, { useEffect } from 'react';
import { DialogProps } from "@toolpad/core";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getHeatDancers, updateHeatDancers } from "@/app/server/competitions";
import { DataGrid } from "@mui/x-data-grid";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";

type HeatStartListProps = {
    heatId:string,
}

const HeatStartListDialog: React.FC<DialogProps<HeatStartListProps, boolean>> = ({
    open,
    onClose,
    payload,
}) => {


    /*
    - get all the dancers for the section
    - get the dancers fro the heat
    - show a list of dancers with checkboxes to include/exclude them from the heat start list
    - allow reordering of the dancers in the start list
    - save the start list
     */

    const [ selectedDancers, setSelectedDancers ]=React.useState<GridRowSelectionModel>({
        ids:new Set<string>(),
        type:'include'
    });


    const {
        data,
        isLoading
    }=useQuery({
        queryKey:[ 'heat-dancers', payload.heatId ],
        queryFn:async()=>{
            if(!payload.heatId)return null;
            const res = await getHeatDancers(payload.heatId);
            if(res.data){
                return res.data;
            }
            return null;
        },
        enabled:open
    })

    useEffect (() => {
        if(data?.start_list?.length){
            setSelectedDancers({
                ids:new Set(data.start_list.map((d:any)=>d.uid)),
                type:'include'
            })
        }
    }, [ data ]);


    const onExit=()=>{
        onClose?.(false);
    }

    const {
        enqueueSnackbar
    }=useSnackbar()

    const {
        mutate,
        isPending,
    }=useMutation({
        mutationKey:[ 'submit-heat-start-list',payload.heatId, selectedDancers ],
        mutationFn:async()=>{
            let dancerIds = Array.from(selectedDancers.ids) as string[];
            if(selectedDancers.type==='exclude'){
                dancerIds = data?.section?.dancers?.map((d)=>d.uid) as string[]
            }
            const res = await updateHeatDancers({
                heat_id:payload.heatId,
                start_list:dancerIds,
                to_create:[]
            })
            return res?.data;
        },
        onSuccess:(data)=>{
            if(data){
                enqueueSnackbar('Heat start list updated',{ variant:'success' });
                onClose?.(true);
                return;
            }
            enqueueSnackbar('Failed to update heat start list',{ variant:'error' });
            console.log('Failed To Update Heat Start List',data);
        },
        onError:(error)=>{
            enqueueSnackbar('An error occurred while updating heat start list',{ variant:'error' });
            console.log('Error Updating Heat Start List',error);
        }
    })

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth={'md'}
        >
            <DialogTitle>
                Heat Start List
            </DialogTitle>
            <DialogContent>
                <DataGrid
                    columns={[
                        {
                            field:'number',
                            headerName:'Number',
                            flex:1,
                        },
                        {
                            field: 'name',
                            headerName: 'Dancer Name',
                            flex: 1,
                            valueGetter: (_, row) => `${row?.name} ${row?.partner_name}`,
                        },
                        {
                            field:'studio_name',
                            headerName:"Studio",
                            flex:1,
                        }
                    ]}
                    rows={data?.section?.dancers ||[]}
                    getRowId={(row)=>row?.uid}
                    density={'compact'}
                    checkboxSelection
                    rowSelectionModel={selectedDancers}
                    onRowSelectionModelChange={(newChange)=>{
                        setSelectedDancers(newChange);
                    }}
                    showToolbar
                    loading={isLoading}
                    disableColumnSelector
                    disableColumnFilter
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
            </DialogContent>
            <DialogActions>
                <Button
                    size={'small'}
                    color={"inherit"}
                    variant={'contained'}
                    onClick={onExit}
                >
                    Cancel
                </Button>
                <Button
                    size={'small'}
                    color={'primary'}
                    variant={'contained'}
                    onClick={()=>mutate()}
                >
                    {isPending? <CircularProgress/>:'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default HeatStartListDialog;

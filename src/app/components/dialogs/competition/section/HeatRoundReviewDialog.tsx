import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    CircularProgress,
    DialogContent,
    Stack,
    Typography, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, Grid, Box
} from "@mui/material";
import { DialogProps, useDialogs } from "@toolpad/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getHeatRoundMarks } from "@/app/server/competitions";
import { Error } from "@mui/icons-material";
import { dancers } from "@prisma/client";
import { orderBy, startCase, toLower } from "lodash";
import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import { createHeatResult } from "@/app/server/competitions";

type HeatRoundReviewDialogProps = {
    heat_id:string
}

const HeatRoundReviewDialog: React.FC<DialogProps<HeatRoundReviewDialogProps, boolean>> = ({
    open,
    onClose,
    payload
}) => {

    const { data, isLoading }=useQuery({
        queryKey:[ 'get-heat-round-review-data', payload.heat_id ],
        queryFn:async()=>{
            const res = await getHeatRoundMarks(payload.heat_id);
            return res.data;
        },
        enabled:open && Boolean(payload.heat_id)
    })

    const dialogs = useDialogs()

    const allDataPresent = React.useMemo(()=>{
        if(!data)return false;
        const adjudicators = data?.panel?.panels_adjudicators || [];
        // TODO - later additionally check all the marks from all judges are present
        return data.heat_marks.length===adjudicators.length
    },[ data ]);


    const [ dancersCalledBack, setDancersCalledBack ] = React.useState<GridRowSelectionModel>({
        type:'include',
        ids:new Set()
    });

    const majority = React.useMemo(()=>{
        if(!data)return 0;
        const adjudicators = data?.panel?.panels_adjudicators || [];
        const dances = data?.dances;
        return Math.ceil((adjudicators.length * dances?.length)/2)+1;

    },[ data ])

    const dancers = React.useMemo(()=>{

        if(!data)return []

        const marks = data?.heat_marks || [];

        const dancerStatus = data.start_list?.map((dancer)=>{

            const callbacks = marks?.reduce((a,v)=>{

                v.marks.forEach((mark)=>{
                    if(mark.dancer_id===dancer.uid){
                        a++
                    }
                })

                return a;
            },0)

            return {
                ...dancer,
                callbacks,
                majority: callbacks>=majority,
            }
        });

        if(!dancersCalledBack?.ids?.size){
            const calledBack = dancerStatus?.filter(dancer=>dancer.majority) || [];
            setDancersCalledBack({
                type:'include',
                ids:new Set(calledBack.map(dancer=>dancer.uid))
            });
        }

        return orderBy(dancerStatus,'callbacks','desc');

    },[ data, majority ]);


    const { enqueueSnackbar }=useSnackbar()

    const {
        mutate,
        isPending,
    }=useMutation({
        mutationKey:[ 'submit-heat-round-review' ],
        mutationFn:async()=>{
            return createHeatResult({
                heat_id:data!.uid,
                results:dancers.map((dancer)=>{
                    return {
                        dancer_id:dancer.uid,
                        callbacks:dancer.callbacks,
                        called_back:dancersCalledBack.ids.has(dancer.uid)
                    }
                })
            })
        },
        onSuccess:(data)=>{
            if(data.data){
                enqueueSnackbar('Heat result submitted successfully',{ variant:'success' });
                onClose(true);
                return;
            }
            enqueueSnackbar('Failed to submit heat round review',{ variant:'error' });
            console.log(data);
        },
        onError:(error)=>{
            enqueueSnackbar('Error submitting heat round review',{ variant:'error' });
            console.error('Error submitting heat round review:', error);
        }
    })


    const onSubmit = async()=>{
        const dancersWithMajorityNotCalledBack = dancers.filter(dancer=>dancer.majority && !dancersCalledBack.ids.has(dancer.uid));
        if(dancersWithMajorityNotCalledBack.length>0){
            const res = await dialogs.confirm(
                'Some dancers with majority votes are not marked as called back, are you sure you want to proceed?',
                {
                    title:"Please Confirm",
                }
            );
            console.log('result of confirmation:', res);
            if(!res){
                return;
            }
        }
        mutate()
    }


    return (
        <Dialog
            open={open} fullWidth
            maxWidth={'md'}
        >
            <DialogTitle>
                <Stack
                    direction={'row'}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                >
                    <Typography variant={'h6'}>
                        {data?.item_no} - Round Review
                    </Typography>
                    <Typography >
                        {startCase(toLower(String(data?.section?.name)))}
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                {isLoading?(
                    <Stack
                        alignItems={'center'}
                        justifyContent={'center'}
                    >
                        <CircularProgress size={30} color={'primary'}/>
                    </Stack>
                ):!allDataPresent?(
                    <Stack>
                        <Alert
                            variant={'standard'}
                            color={'error'}
                            icon={<Error color={'error'}/>}
                        >
                            <Typography>
                                All marks have not been entered for this round. You can now review partially review the marks but not proceed
                            </Typography>
                        </Alert>
                        <TableContainer>
                            <Table size={'small'}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align={'center'} colSpan={2}>
                                            Adjudicator
                                        </TableCell>
                                        <TableCell align={'right'}>
                                            Marks Entered
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.panel?.panels_adjudicators?.map((adjudicator)=>{
                                        const entered = data?.heat_marks?.find(heatMark=>heatMark.adjudicator_id===adjudicator.adjudicator.uid)
                                        return (
                                            <TableRow key={adjudicator.uid}>
                                                <TableCell>
                                                    {adjudicator?.adjudicator?.letter}
                                                </TableCell>
                                                <TableCell>
                                                    {adjudicator?.adjudicator?.name}
                                                </TableCell>
                                                <TableCell align={'right'}>
                                                    <Chip
                                                        size={'small'}
                                                        label={entered?'Yes':'No'}
                                                        color={entered?'success':'error'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Stack>
                ):(
                    <Grid
                        container
                        spacing={4}
                    >
                        <Grid
                            size={{
                                sm:12,
                                md:6
                            }}
                            sx={{
                                border:`1px solid #efefef`,
                                borderRadius:2,
                                padding:2,
                            }}
                        >
                            <Box height={'400px'} mb={2}>
                                <DataGrid
                                    columns={[
                                        {
                                            field:'number',
                                            headerName:'Dancer No.',
                                            flex:1,
                                            align:'center',
                                            headerAlign:'center'
                                        },
                                        {
                                            field:'callbacks',
                                            headerName:'No. of Callbacks',
                                            flex:1,
                                            align:'center',
                                            headerAlign:'center'
                                        }
                                    ]}
                                    rows={dancers}
                                    getRowId={(row)=>row.uid}
                                    hideFooter
                                    checkboxSelection
                                    rowSelectionModel={dancersCalledBack}
                                    onRowSelectionModelChange={(newRow)=>{
                                        setDancersCalledBack((prev:GridRowSelectionModel)=>{
                                            const prevIds = Array.from(prev.ids) as string[];
                                            const newRowIds = Array.from(newRow.ids) as string[];
                                            const resultIds = new Set(prev.ids);

                                            // Find added dancers
                                            const addedIds = newRowIds.filter(id => !prevIds.includes(id));
                                            addedIds.forEach(id => {
                                                const dancer = dancers.find(d => d.uid === id);
                                                if (dancer) {
                                                // Add all dancers with the same callback count
                                                    dancers.forEach(d => {
                                                        if (d.callbacks >= dancer.callbacks) {
                                                            resultIds.add(d.uid);
                                                        }
                                                    });
                                                }
                                            });

                                            // Find removed dancers
                                            const removedIds = prevIds.filter(id => !newRowIds.includes(id));
                                            removedIds.forEach(id => {
                                                const dancer = dancers.find(d => d.uid === id);
                                                if (dancer) {
                                                // Remove all dancers with the same callback count
                                                    dancers.forEach(d => {
                                                        if (d.callbacks <= dancer.callbacks) {
                                                            resultIds.delete(d.uid);
                                                        }
                                                    });
                                                }
                                            });

                                            return {
                                                type: 'include',
                                                ids: resultIds
                                            };
                                        });
                                    }}
                                    sx={{
                                        '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-checkboxInput': {
                                            display: 'none'
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid
                            size={{
                                sm:12,
                                md:6
                            }}
                            sx={{
                                border:`1px solid #efefef`,
                                borderRadius:2,
                                padding:2,
                                flex:1
                            }}
                        >
                            <Stack
                                direction={'row'}
                                spacing={4}
                                justifyContent={'space-between'}
                                alignItems={'center'}
                                mb={4}
                                flex={1}
                            >
                                <Stack
                                    alignItems={'center'}
                                    justifyContent={'center'}
                                    sx={{
                                        border:`1px solid #efefef`,
                                        borderRadius:2,
                                        padding:2,
                                        flex:1
                                    }}
                                >
                                    <Typography variant={'body2'} textAlign={'center'}>
                                        Panel
                                    </Typography>
                                    <Typography variant={'h6'}>
                                        {data?.panel?.panels_adjudicators.map(p=>p.adjudicator.letter).sort().join(', ')}
                                    </Typography>
                                </Stack>
                                <Stack
                                    sx={{
                                        border:`1px solid #efefef`,
                                        borderRadius:2,
                                        padding:2,
                                        flex:1,
                                    }}
                                    justifyContent={'center'}
                                    alignItems={'center'}
                                >
                                    <Typography variant={'body2'} textAlign={'center'}>Min Required Majority</Typography>
                                    <Typography variant={'h6'}>{Math.ceil(Number(data?.panel?.panels_adjudicators?.length ||0)*Number(data?.dances?.length||0)/2)+1}</Typography>
                                </Stack>
                            </Stack>
                            <Alert
                                severity={'info'}
                                sx={{
                                    mb:6
                                }}
                            >
                                <Typography variant={'caption'} textAlign={'center'}>
                                    Select the dancers to be called back to the next round. Selecting or deselecting a dancer will automatically select/deselect all dancers with equal or lower callback counts.
                                </Typography>
                            </Alert>
                            <Stack
                                px={4}
                                sx={{
                                    border:`1px solid #efefef`,
                                    borderRadius:2,
                                    padding:2,
                                    flex:1,
                                    background:'primary',
                                }}
                            >

                                <Typography
                                    variant={'h6'}
                                    textAlign={'center'}
                                >
                                    <strong>{dancersCalledBack.ids.size}</strong> dancers called back from <strong>{dancers.length}</strong> dancers in this round.
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    size={'small'}
                    color={'inherit'}
                    variant={'contained'}
                    onClick={()=>onClose(false)}
                >
                    Cancel
                </Button>
                <Button
                    size={'small'}
                    color={'primary'}
                    variant={'contained'}
                    onClick={onSubmit}
                    disabled={isPending || dancersCalledBack.ids.size===0}
                >
                    {isPending? <CircularProgress size={20} color={'inherit'}/>:'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default HeatRoundReviewDialog;

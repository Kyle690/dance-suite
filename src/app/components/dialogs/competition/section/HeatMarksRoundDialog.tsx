import React, { useEffect, useMemo, useState } from 'react';
import { DialogProps, useDialogs } from "@toolpad/core";
import {
    Button, CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, Divider,
    Grid,
    IconButton, List, ListItem, ListItemButton, ListItemText,
    Stack,
    Typography
} from "@mui/material";
import { forEach, get, orderBy, startCase, toLower } from "lodash";
import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import CustomInput from "@/app/components/forms/CustomInput";
import { useMutation } from "@tanstack/react-query";
import { submitRoundMarks } from "@/app/server/competitions";
import { RoundMarkSchemaType } from "@/app/schemas/MarksSchemas";
import { useSnackbar } from "notistack";

type RoundMarksDialogProps = {
    panel:{
        panels_adjudicators:{
            adjudicator_id:string,
            adjudicator:{
                letter:string
            }
        }[]
    },
    start_list:{
        uid: string,
        number: number,
        name: string,
        partner_name: string,
    }[],
    dances:string[]
    item_no:string,
    type:string,
    section?:{
        name:string
    },
    callback_limit:number,
    uid:string,
}

type RoundMarkEntry = {
    dance:string,
    adjudicator_id:string,
    heat_id:string,
    letter:string,
    marks:{
        uid:string,
        number:number,
        name:string,
        partner_name:string,
    }[]
}



const HeatMarksRoundDialog: React.FC<DialogProps<RoundMarksDialogProps, boolean>> = ({
    open,
    onClose,
    payload,
}) => {

    const [ activePosition, setActivePosition ]=useState<number>(0);

    const [ formState, setFormState ]=useState< RoundMarkEntry[]>([])
    const [ typedNumber, setTypedNumber ]=useState<string>('')
    const [ error, setError ]=useState<string|null>(null);

    const {
        dances,
        adjudicators,
        dancers,
        defaultMarks,
    } = useMemo(()=>{
        if(!payload)return {
            dances:[],
            adjudicators:[],
            dancers:[]
        }
        const adjudicators = orderBy(payload?.panel?.panels_adjudicators,'adjudicator.letter')
        const dances = payload?.dances;


        const defaultMarks = adjudicators.reduce((a:RoundMarkEntry[],v)=>{

            dances?.forEach(dance=>{
                a.push({
                    dance,
                    heat_id:payload.uid,
                    adjudicator_id:v.adjudicator_id,
                    letter:get(v.adjudicator,'letter',''),
                    marks:[],
                })
            })


            return a;
        },[])

        setFormState(defaultMarks);

        return {
            dances,
            adjudicators: adjudicators.map((a)=>({
                adjudicator_uid:a.adjudicator_id,
                letter:a?.adjudicator?.letter,
            })),
            dancers:orderBy(payload.start_list,'number'),
            defaultMarks
        }
    },[ payload ])


    const dialogs = useDialogs()
    const { enqueueSnackbar }=useSnackbar()
    const onExit = ()=>{
        onClose?.(false)
    }

    const currentDanceIndex = useMemo(()=>{
        return dances?.findIndex(dance=>dance===formState[activePosition]?.dance);
    },[ dances, activePosition, formState ])

    const currentAdjudicatorIndex = useMemo(()=>{
        const adjudicatorLetter = formState[activePosition]?.letter;
        return adjudicators?.findIndex(adjudicator=>adjudicator.letter===adjudicatorLetter);
    },[ adjudicators, activePosition, formState ])

    const onNext=async(mode?:'dance'|'adjudicator'|'enter')=>{
        //console.log('onNext called', { mode, typedNumber, activeState })
        if(mode==='dance'){
            const currentDanceIndex = dances?.findIndex(dance=>dance===formState[activePosition]?.dance);
            // is not the last dance
            if(currentDanceIndex!==-1 && currentDanceIndex<dances.length-1){
                setActivePosition((prev)=>prev+1)
            }
        }
        if(mode==='adjudicator'){
            setActivePosition((prev)=>prev+dances?.length)
        }

        if(typedNumber?.length && mode==='enter'){
            onDancerSelect(Number(typedNumber), true)
            setTypedNumber('')
        }

        if(!typedNumber?.length && mode==='enter'){
            setActivePosition((prev)=>{
                if(prev+1<formState.length){
                    return prev+1;
                }
                return prev;
            })

        }


    }

    const onDancerSelect = async(dancerNumber:number, fromInput:boolean=false)=>{
        const foundDancer = dancers?.find(dancer=>Number(dancer?.number)===Number(dancerNumber))
        if(!foundDancer){
            await dialogs.alert(`Dancer ${dancerNumber} not found in start list.`);
            return;
        }
        const checkedDancer = formState[activePosition]?.marks?.find(marks=>Number(marks.number)===Number(dancerNumber));
        if(checkedDancer){
            if(fromInput)return;
            setFormState(prev=>{
                const current = prev[activePosition];
                const updatedMarks = current.marks.filter(mark=>Number(mark.number)!==Number(dancerNumber));
                const updatedEntry = {
                    ...current,
                    marks:updatedMarks
                }
                const newState = [ ...prev ];
                newState[activePosition]=updatedEntry;
                return newState;
            })
            return;
        }
        setFormState(prev=>{
            const current = prev[activePosition];
            const updatedEntry = {
                ...current,
                marks:[ ...current.marks, foundDancer ]
            }
            const newState = [ ...prev ];
            newState[activePosition]=updatedEntry;

            if(updatedEntry?.marks?.length>payload?.callback_limit){
                dialogs.alert('Callback limit reached for this dance and adjudicator.');
            }

            return newState;
        })

    }

    const onPrevious = (mode:'dance'|'adjudicator')=>{
        if(mode==='dance'){
            if(currentDanceIndex!==0){
                setActivePosition((prev)=>prev-1)
            }
        }
        if(mode==='adjudicator'){
            setActivePosition((prev)=>prev - dances?.length)
        }
    }

    useEffect (() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                onNext('enter');
            }
        }
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        }
    }, [ onNext ]);


    const {
        mutate,
        isPending,
    }=useMutation({
        mutationKey:[ 'round-marks-submit',payload.uid ],
        mutationFn:async(data:RoundMarkSchemaType)=>{
            return submitRoundMarks(data)
        },
        onSuccess:(data)=>{
            if(!data.data){
                enqueueSnackbar('Failed to submit marks. Please try again.',{ variant:'error' });
                console.log('Failed to submit round marks', data);
                return;
            }
            console.log("Round marks submitted successfully:", data);
            enqueueSnackbar('Marks submitted successfully.',{ variant:'success' });
            onClose?.(true);
        },
        onError:(error)=>{
            enqueueSnackbar('Error submitting marks. Please try again.',{ variant:'error' });
            console.log('Error submitting marks:', error);
        }
    })

    const onSubmit = async()=>{
        //check all dancers have marks that match the callback limit
        let allValid = true;
        forEach(formState, (entry)=>{
            if(entry.marks.length!==payload?.callback_limit){
                allValid=false;
            }
        })
        if(!allValid){
            const response = await dialogs.confirm('Not all dances have the required number of callbacks. Do you want to proceed?',{
                title:'Missing Marks',
                okText:'Confirm'
            });
            if(!response)return;
        }
        const response = await dialogs.confirm('Confirm all the marks have been entered for this round?',{
            title:'Are you sure?',
            okText:'Confirm',
        })
        if(!response)return;
        mutate(formState)
    }




    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth={'sm'}
        >
            <DialogTitle>
                Item No: {payload?.item_no} - {startCase(toLower(payload?.section?.name))} {startCase(toLower(payload?.type))}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={4}>
                    <Grid
                        size={{
                            xs:12,
                            md:6
                        }}
                    >
                        <Typography variant={'h6'} align={'center'}>
                            Dance
                        </Typography>
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                        >
                            <IconButton
                                onClick={()=>onPrevious('dance')}
                                disabled={currentDanceIndex===0}
                            >
                                <ChevronLeftOutlined/>
                            </IconButton>
                            <Typography align={'center'} width={200}>{formState?.[activePosition]?.dance}</Typography>
                            <IconButton
                                onClick={()=>onNext('dance')}
                                disabled={currentDanceIndex===dances.length-1}
                            >
                                <ChevronRightOutlined/>
                            </IconButton>
                        </Stack>
                    </Grid>
                    <Grid
                        size={{
                            xs:12,
                            md:6
                        }}
                    >
                        <Typography variant={'h6'} align={'center'}>
                            Adjudicator
                        </Typography>
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                        >
                            <IconButton
                                onClick={()=>onPrevious('adjudicator')}
                                disabled={currentAdjudicatorIndex===0}
                            >
                                <ChevronLeftOutlined/>
                            </IconButton>
                            <Typography align={'center'} width={200}>{formState?.[activePosition]?.letter}</Typography>
                            <IconButton
                                onClick={()=>onNext('adjudicator')}
                                disabled={currentAdjudicatorIndex===adjudicators.length-1}
                            >
                                <ChevronRightOutlined/>
                            </IconButton>
                        </Stack>
                    </Grid>
                    <Grid
                        size={{
                            xs:12,
                            md:6
                        }}
                        sx={{
                            border:'1px solid #ccc',
                            borderRadius:4,
                            maxHeight:400,
                            minHeight:300,
                            overflowY:'auto',
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Typography align={'center'}>
                            Start List
                        </Typography>
                        <Divider/>
                        <List

                            dense
                        >
                            {dancers.map((dancer, index)=>{
                                const selected = formState?.[activePosition]?.marks?.find(mark=>Number(mark.number)===Number(dancer?.number));
                                return (
                                    <ListItemButton
                                        key={dancer?.uid}
                                        selected={!!selected}
                                        onClick={()=>{
                                            onDancerSelect(dancer.number)
                                        }}
                                    >
                                        <ListItem >
                                            <ListItemText
                                                primary={dancer?.number}
                                                slotProps={{
                                                    primary:{
                                                        align:'center'
                                                    }

                                                }}
                                            //secondary={`${dancer?.name} ${dancer?.partner_name?` & ${dancer?.partner_name}`:''}`}
                                            />
                                        </ListItem>
                                    </ListItemButton>

                                )}
                            )}
                        </List>
                    </Grid>
                    <Grid
                        size={{
                            xs:12,
                            md:6
                        }}
                        sx={{
                            border:'1px solid #ccc',
                            borderRadius:4,
                            maxHeight:400,
                            minHeight:300,
                            overflowY:'auto',
                            bgcolor: 'background.paper',
                            padding:2
                        }}
                    >
                        <Stack
                            spacing={2}
                        >
                            <CustomInput
                                label={'Dancer'}
                                value={typedNumber as any}
                                onChange={(e)=>{
                                    setTypedNumber(get(e,'target.value','') as string)
                                }}
                                name="typedNumber"
                                size={'small'}
                            />
                            <Button
                                variant={'contained'}
                                size={'small'}
                                onClick={()=>onNext('enter')}
                            >
                                Enter
                            </Button>
                            <Typography textAlign={'center'}>
                                {`Marks Entered: ${formState[activePosition]?.marks.length ||0} / ${payload?.callback_limit}`}
                            </Typography>
                            <Stack
                                direction={'row'}
                                justifyContent={'space-between'}
                                spacing={2}
                            >
                                <Button
                                    size={'small'}
                                    variant={'contained'}
                                    onClick={()=>setActivePosition(prev=>prev-1)}
                                    disabled={activePosition===0}
                                    color={'inherit'}
                                    fullWidth
                                >
                                    Prev
                                </Button>
                                <Button
                                    size={'small'}
                                    variant={'contained'}
                                    color={'primary'}
                                    fullWidth
                                    disabled={activePosition===formState?.length-1}
                                    onClick={()=>onNext('enter')}
                                >
                                    Next
                                </Button>
                            </Stack>
                            <Button
                                onClick={()=>{
                                    setFormState(prev=>{
                                        const current = prev[activePosition];
                                        const updatedEntry = {
                                            ...current,
                                            marks:[]
                                        }
                                        const newState = [ ...prev ];
                                        newState[activePosition]=updatedEntry;
                                        return newState;
                                    })
                                }}
                                variant={'contained'}
                                color={'inherit'}
                                size={'small'}
                                disabled={formState[activePosition]?.marks.length===0}
                            >
                                Clear Dance Marks
                            </Button>
                            <Button
                                onClick={()=>{
                                    setActivePosition(0)
                                    setFormState(defaultMarks as RoundMarkEntry[])
                                }}
                                variant={'contained'}
                                color={'inherit'}
                                size={'small'}
                            >
                                Clear All Marks
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onExit}
                    size={'small'}
                    variant={'contained'}
                    color={'inherit'}
                >
                    Cancel
                </Button>
                <Button
                    size={'small'}
                    variant={'contained'}
                    color={'primary'}
                    onClick={onSubmit}
                >
                    {isPending? <CircularProgress size={20} color={'inherit'}/>:'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default HeatMarksRoundDialog;

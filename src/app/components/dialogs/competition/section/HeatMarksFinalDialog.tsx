import React, { useMemo, useState, useRef, useEffect } from 'react';
import { DialogProps, useDialogs } from "@toolpad/core";
import {
    Button, Chip, CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton, InputAdornment,
    Stack, TextField,
    Typography
} from "@mui/material";
import { sortBy, startCase, toLower } from "lodash";
import { CheckCircle, ChevronLeftOutlined, ChevronRightOutlined, Close, Pending } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { submitFinalMarks } from "@/app/server/competitions";
import CustomInput from "@/app/components/forms/CustomInput";

type HeatMarksFinalDialogProps = {
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
        mark:string,
        dance:string,
    }[]
}

const HeatMarksFinalDialog: React.FC<DialogProps<HeatMarksFinalDialogProps>> = ({
    open,
    onClose,
    payload
}) => {

    const [ activePosition, setActivePosition ]=useState<number>(0);
    const [ formState, setFormState ]=useState< RoundMarkEntry[]>([])
    const [ activeMarkIndex, setActiveMarkIndex ]=useState<number>(0)

    const {
        dances,
        adjudicators,
        defaultMarks,
    }=useMemo(()=>{
        const dances = payload?.dances || [];
        const adjudicators = sortBy(payload?.panel?.panels_adjudicators?.map((p)=>({ letter:p.adjudicator.letter, adjudicator_id:p.adjudicator_id })),'letter')
        const dancers = sortBy(payload.start_list,'number');

        const defaultMarks = adjudicators.reduce((a:RoundMarkEntry[],v)=>{

            dances.forEach(dance=>{
                a.push({
                    dance,
                    heat_id:payload.uid,
                    adjudicator_id:v.adjudicator_id,
                    letter:v.letter,
                    marks:dancers.map((d)=>({
                        ...d,
                        mark:'',
                        dance:dance
                    }))
                })
            })

            return a;
        },[])

        setFormState(defaultMarks)

        return {
            dances,
            adjudicators,
            defaultMarks,
        }
    },[ payload ])

    const { enqueueSnackbar }=useSnackbar()
    const dialogs = useDialogs()

    const { mutate, isPending } = useMutation({
        mutationKey: [ 'submit-final-marks', payload.uid ],
        mutationFn: async () => {
            return submitFinalMarks(formState);
        },
        onSuccess: (data) => {
            if (data?.data) {
                enqueueSnackbar('Final marks saved successfully', { variant: 'success' });
                onClose();
                return;
            }
            enqueueSnackbar('Failed to save final marks', { variant: 'error' });
        },
        onError: () => {
            enqueueSnackbar('Error saving final marks', { variant: 'error' });
        }
    });

    const onExit = async()=>{
        await dialogs.confirm('Are you sure you want to exit? \nAll unsaved changes will be lost.',{
            title:'Please Confirm',
            onClose:async(res)=> {
                if (res) {
                    onClose?. ();
                }
            }
        })
    }

    const onSubmitAll = async () => {
        await dialogs.confirm('All marks have been entered and are ready to submit?', {
            title: 'Confirm Submit',
            onClose: async (confirmed) => {
                if (confirmed) {
                    mutate();
                }
            }
        });
    };

    const currentDanceIndex = useMemo(()=>{
        return dances?.findIndex(dance=>dance===formState[activePosition]?.dance);
    },[ dances, activePosition, formState ])

    const currentAdjudicatorIndex = useMemo(()=>{
        const adjudicatorLetter = formState[activePosition]?.letter;
        return adjudicators?.findIndex(adjudicator=>adjudicator.letter===adjudicatorLetter);
    },[ adjudicators, activePosition, formState ])


    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const hasAdvanced = useRef(false);


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
        if(mode==='enter'){
            hasAdvanced.current = true;
            setActiveMarkIndex(0)
            setActivePosition((prev)=>prev+1)
        }

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

    const validateRow =useMemo(()=>{
        if(!formState[activePosition]){
            return false;
        }
        const currentRow = formState[activePosition];
        if(currentRow?.marks?.some(mark=>mark.mark==='')){
            return false;
        }
        const uniqueMarks = new Set(currentRow.marks?.map(mark=>mark.mark));
        if(uniqueMarks.size!==currentRow.marks?.length){
            return false;
        }
        return true

    },[ formState, activePosition ])

    const validRound = useMemo(()=>{

        // check if all rows are valid
        if(formState.length===0){
            return false;
        }
        return formState.every(row=>{
            if(row?.marks?.some(mark=>mark.mark==='')){
                return false;
            }
            const uniqueMarks = new Set(row.marks?.map(mark=>mark.mark));
            if(uniqueMarks.size!==row.marks?.length){
                return false;
            }
            return true
        })

    },[ formState ])

    // After advancing with Enter, auto-focus the first input of the new position
    useEffect(() => {
        if (!hasAdvanced.current) return;
        hasAdvanced.current = false;
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 0);
    }, [ activePosition ]);

    useEffect (() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && validateRow) {
                onNext('enter');
            }
        }
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        }
    }, [ validateRow ]);

    const handleMarkChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if(isNaN(Number(e.target.value))){
            enqueueSnackbar('Please enter a valid number',{ variant:'warning' })
            return;
        }

        if(Number(e.target.value)> Number(formState?.[activePosition]?.marks?.length)){
            enqueueSnackbar('Mark cannot be greater than the number of dancers in the heat',{ variant:'error' })
            return;
        }

        if(e.target.value !=='' && Number(e.target.value)===0){
            enqueueSnackbar('Mark cannot be 0',{ variant:'error' })
            return;
        }

        const positionsTaken = formState?.[activePosition]?.marks?.filter((mark,index)=>index!==activeMarkIndex).map(mark=>mark.mark) || [];
        if(e.target.value !=='' && positionsTaken.includes(e.target.value)){
            enqueueSnackbar('This mark has already been used for another dancer in this dance',{ variant:'error' })
            return;
        }



        const updatedFormState = [ ...formState ];
        const currentMark = updatedFormState[activePosition].marks?.[index];
        if(currentMark){
            currentMark.mark = e.target.value;
            setFormState(updatedFormState);
            setActiveMarkIndex(index);

            // Move focus left after each entry (right-to-left input flow)
            setTimeout(() => {
                if(index >= 0){
                    inputRefs.current[index + 1]?.focus();
                }
            }, 0);
        }
    }

    return (
        <Dialog
            open={open} fullWidth
            maxWidth={'md'}
        >
            <DialogTitle>
                <Stack
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                >
                    <Typography variant={'h5'}>
                        Item No: {payload?.item_no} - {startCase(toLower(payload?.section?.name))} {startCase(toLower(payload?.type))}
                    </Typography>
                    <IconButton
                        onClick={onExit}
                    >
                        <Close/>
                    </IconButton>
                </Stack>

            </DialogTitle>
            <DialogContent>
                <Grid
                    container spacing={2}
                    mt={2}
                >
                    <Grid
                        size={{
                            xs:12,
                            md:6
                        }}
                        sx={{
                            border:'1px solid lightgrey',
                            borderRadius:4,
                            p:2,
                            mb:4
                        }}
                    >
                        <Typography variant={'h6'} align={'center'}>
                            Dance
                        </Typography>
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                            justifyContent={'space-evenly'}
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
                        sx={{
                            border:'1px solid lightgrey',
                            borderRadius:4,
                            p:2,
                            mb:4
                        }}
                    >
                        <Typography variant={'h6'} align={'center'}>
                            Adjudicator
                        </Typography>
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                            justifyContent={'space-evenly'}
                        >
                            <IconButton
                                onClick={()=>onPrevious('adjudicator')}
                                disabled={currentAdjudicatorIndex===0}
                                size={'large'}
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

                    {formState?.[activePosition]?.marks?.map((mark,index)=>(
                        <Grid
                            size={11/Number(formState?.[activePosition]?.marks?.length ||11)}
                            key={index}
                        >
                            <TextField
                                inputRef={(el) => inputRefs.current[index] = el}
                                id={mark.uid+'-'+mark.dance}
                                label={''}
                                value={mark.mark}
                                onChange={(e) => handleMarkChange(index, e as React.ChangeEvent<HTMLInputElement>)}
                                focused={activeMarkIndex===index}
                                onFocus={()=>setActiveMarkIndex(index)}
                                slotProps={{
                                    input:{
                                        startAdornment:(
                                            <InputAdornment position={'start'}>
                                                <Typography color={'textDisabled'}>{mark.number}</Typography>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                        </Grid>
                    ))}
                    <Grid
                        size={1}
                        alignItems={'center'}
                        justifyContent={'center'}
                        display={'flex'}
                    >
                        {validateRow?(
                            <CheckCircle fontSize={'large'} color={'success'}/>
                        ):(
                            <Pending fontSize={'medium'}  color={'inherit'}/>
                        )}
                    </Grid>
                    <Grid
                        size={{
                            xs:12,
                            md:6
                        }}
                        sx={{
                            border:'1px solid lightgrey',
                            borderRadius:4,
                            p:2,
                            mt:4
                        }}
                    >
                        <Stack >
                            <Stack
                                direction={'row'}
                                alignItems={'center'}
                                justifyContent={'space-between'}
                                spacing={2}
                            >
                                <TextField
                                    label={''}
                                    size={'small'}
                                    sx={{
                                        flex:0.8
                                    }}
                                />
                                <Button
                                    variant={'contained'}
                                    size={'small'}
                                    sx={{
                                        flex:0.4
                                    }}
                                >
                                    Add Dancer(s)
                                </Button>
                            </Stack>
                            <Stack
                                direction={'row'}
                                alignItems={'center'}
                                justifyContent={'space-between'}
                                mt={4}
                                spacing={2}
                            >
                                <CustomInput
                                    inputType={'autocomplete'}
                                    name={'dancer-select'}
                                    label={''}
                                    size={'small'}
                                    sx={{
                                        flex:0.8
                                    }}
                                    fullWidth
                                    value={'' as any}
                                    onChange={(e)=>{}}
                                    options={payload?.start_list?.map((dancer)=>({
                                        label: dancer.name,
                                        value: dancer.uid
                                    }))}
                                />
                                <Button
                                    variant={'contained'}
                                    size={'small'}
                                    sx={{
                                        flex:0.4
                                    }}
                                >
                                    Remove Dancer(s)
                                </Button>
                            </Stack>

                        </Stack>
                    </Grid>
                    <Grid
                        size={{
                            xs:12,
                            md:6
                        }}
                        sx={{
                            border:'1px solid lightgrey',
                            borderRadius:4,
                            paddingX:2,
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            flex:1,
                            mt:4
                        }}
                    >
                        <Stack
                            direction={'row'}
                            flex={1}
                            alignItems={'center'}
                            justifyContent={'space-evenly'}
                            spacing={4}
                            height={'100%'}
                        >
                            <Stack
                                flex={1}
                                height={'100%'}
                                justifyContent={'space-evenly'}
                            >
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    onClick={()=>onPrevious('dance')}
                                    disabled={currentDanceIndex===0}
                                    size={'small'}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    color={'inherit'}
                                    size={'small'}
                                >
                                    Clear
                                </Button>
                                <Button
                                    fullWidth
                                    variant={'contained'}
                                    onClick={onExit}
                                    color={'inherit'}
                                    size={'small'}
                                >
                                    Cancel All
                                </Button>
                            </Stack>
                            <Stack
                                flex={1}
                                height={'100%'}
                                justifyContent={'space-evenly'}
                            >
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    onClick={()=>onNext('enter')}
                                    disabled={currentDanceIndex===dances.length-1}
                                    size={'small'}
                                >
                                    Next
                                </Button>
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    disabled={!validateRow}
                                    size={'small'}
                                >
                                    Ok
                                </Button>
                                <Button
                                    fullWidth
                                    variant={'contained'}
                                    disabled={!validRound || isPending}
                                    color={'primary'}
                                    size={'small'}
                                    onClick={onSubmitAll}
                                >
                                    {isPending ? <CircularProgress size={16} /> : 'Ok All'}
                                </Button>
                            </Stack>
                        </Stack>

                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}

export default HeatMarksFinalDialog;

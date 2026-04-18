import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDialogs } from "@toolpad/core";
import { useSnackbar } from "notistack";
import { forEach, keys, sortBy, startCase, toLower } from "lodash";
import AdjudicatorSignatureDialog from "@/app/components/dialogs/adjudicator/AdjudicatorSignatureDialog";
import { AdjudicatorMarksSchemaType } from "@/app/schemas/adjudicators/adjudicatorMarksSchema";
import { submitAdjudicatorHeatMarks } from "@/app/server/adjudicator";
import { Box, Button, ButtonProps, Grid, IconButton, Stack, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import HeatCard from "@/app/(pages)/adjudicator/[adjudicatorId]/[heatId]/_components/HeatCard";
import { HeatResponseType } from "@/app/(pages)/adjudicator/[adjudicatorId]/[heatId]/page";

type AdjudicatorRoundHeatType = {
    heatId: string
    data?:HeatResponseType|null
};

type FormState = {
    activeDanceIndex: number;
    marks: {
        [dance:string]:{
            confirmed: string[],
            selected: string[]
        }
    }
}
const AdjudicatorRoundHeat: React.FC<AdjudicatorRoundHeatType> = ({
    heatId,
    data
}) => {

    const router = useRouter();

    const session=useSession()

    const dialogs = useDialogs()

    const { enqueueSnackbar }=useSnackbar()

    const [ formState, setFormState ]=useState<FormState>({
        activeDanceIndex:0,
        marks:{},
    })

    const dances = useMemo(()=>{
        return data?.dances || []
    },[ data ])

    useEffect(()=>{
        if(dances.length) {
            setFormState(prev => ({
                ...prev,
                marks: dances.reduce((a:FormState['marks'], v) => {
                    a[v] = {
                        confirmed: [],
                        selected: []
                    }
                    return a;
                }, {})
            }))
        }
    },[ dances ])

    const dancers = useMemo(()=>{
        if(!data?.start_list?.length)return [];
        return sortBy(data.start_list.map((dancer)=>({
            value:dancer.uid,
            label:dancer.number
        })),'label')
    },[ data ])

    const currentDance = useMemo(()=>{
        if(!dances.length){
            return null;
        }
        return formState.marks[dances[formState.activeDanceIndex]]
    },[ formState, dances ])

    const onDancerSelect = async(dancerId:string)=>{
        const isSelected = currentDance?.selected.includes(dancerId);
        const isConfirmed = currentDance?.confirmed.includes(dancerId);

        if(!isSelected && !isConfirmed){
            setFormState(prev=>{
                const danceName = dances[prev.activeDanceIndex || 0];
                const current = prev.marks[danceName];
                return {
                    ...prev,
                    marks: {
                        ...prev.marks,
                        [danceName]: {
                            ...current,
                            selected: [ ...current.selected, dancerId ],
                        },
                    },
                };
            });
        } else if(isSelected){
            if(currentDance?.confirmed.length === data?.callback_limit){
                await dialogs.alert('You have reached the maximum number of callbacks for this dance. Please confirm/remove the selected dancers before proceeding.',{
                    title:'Callback Limit Reached',
                })
                return;
            }
            setFormState(prev=>{
                const danceName = dances[prev.activeDanceIndex || 0];
                const current = prev.marks[danceName];
                return {
                    ...prev,
                    marks: {
                        ...prev.marks,
                        [danceName]: {
                            selected: current.selected.filter((id)=>id!==dancerId),
                            confirmed: [ ...current.confirmed, dancerId ],
                        },
                    },
                };
            });
        } else if(isConfirmed){
            setFormState(prev=>{
                const danceName = dances[prev.activeDanceIndex || 0];
                const current = prev.marks[danceName];
                return {
                    ...prev,
                    marks: {
                        ...prev.marks,
                        [danceName]: {
                            ...current,
                            confirmed: current.confirmed.filter((id)=>id!==dancerId),
                        },
                    },
                };
            });
        }
    }

    //console.log('Current Dance', currentDance)

    const onContinue =async()=>{
        await dialogs.confirm('Please confirm you are satisfied with the marks entered, this cannot be redone once submitted!',{
            title:'Confirm',
            severity:'info',
            onClose:async(res)=>{
                if(res){
                    // check if there current dance is not the last, progress to the next dance
                    if(formState.activeDanceIndex!==dances?.length-1){
                        setFormState(prev=>{
                            return {
                                ...prev,
                                activeDanceIndex: prev.activeDanceIndex+1,
                            }
                        })
                        return;
                    }
                    const signature = await dialogs.open(AdjudicatorSignatureDialog,{});
                    if(!signature){
                        return;
                    }
                    // Submit the result and return
                    const marks = keys(formState.marks).reduce((a:AdjudicatorMarksSchemaType,v)=>{

                        const danceMarks = formState.marks[v].confirmed;

                        forEach(danceMarks,(dancerId)=>{
                            const dancer = data?.start_list.find((d)=>d.uid===dancerId);
                            if(dancer){
                                a.push({
                                    dancer_id: String(dancerId),
                                    dancer_number: Number(dancer.number),
                                    dance:v
                                })
                            }
                        })


                        return a;
                    },[])

                    const response = await submitAdjudicatorHeatMarks({
                        heat_id:String(heatId),
                        signature:signature,
                        marks:marks,
                    })
                    if(response.data){
                        enqueueSnackbar('Marks submitted successfully', { variant:'success' })
                    }else{
                        console.log('Error submitting marks', response);
                        enqueueSnackbar('Error submitting marks', { variant:'error' })
                    }
                }
            },

        })

    }


    return (
        <Stack
            alignItems={'flex-start'}
            width={'100%'}
            mt={1}
        >
            <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                width={'100%'}
                mb={2}
            >
                <IconButton
                    onClick={async()=>{
                        await dialogs.confirm('Are you sure you want to go back? Your current selections will be lost.',{
                            title:'Confirm',
                            onClose:async(res)=>{
                                if(res){
                                    router.back();
                                }
                            }
                        })
                    }}
                >
                    <ArrowBack/>
                </IconButton>
                <Stack
                    alignItems={'flex-end'}
                >
                    <Typography variant={'body1'}>{session?.data?.adjudicator.letter} - {session?.data?.user?.name}</Typography>
                    <Typography variant={'caption'} color={'text.secondary'}>
                        {session?.data?.adjudicator.competition_name}
                    </Typography>
                </Stack>
            </Stack>
            <HeatCard
                itemNo={data?.item_no}
                sectionName={data?.section?.name}
                type={data?.type}
                activeDance={startCase(toLower(dances[formState.activeDanceIndex]))}
                totalDances={`${formState.activeDanceIndex+1}/${dances?.length}`}
            />
            <Grid
                container
                spacing={{
                    xs:2,
                    md:4
                }}
                sx={{
                    mt:2
                }}
            >
                <Grid
                    size={12}
                    sx={{
                        display: 'flex',
                        justifyContent:'space-between',
                    }}
                >
                    <Stack
                        direction={'row'}
                        spacing={2}
                    >
                        <Typography variant={'caption'} color={'warning'}>݀· Selected</Typography>
                        <Typography variant={'caption'} color={'primary'}>· Confirmed</Typography>
                    </Stack>
                    <Typography fontWeight={600}>
                        {currentDance?.confirmed?.length ||0}/{data?.callback_limit} Callbacks
                    </Typography>
                </Grid>
                {dancers.map((dancer)=>{

                    const isSelected = currentDance?.selected?.includes(dancer.value);
                    const isConfirmed = currentDance?.confirmed?.includes(dancer.value);

                    let color ='inherit';
                    if(isSelected)color='warning';
                    if(isConfirmed)color='primary';

                    return (
                        <Grid
                            key={dancer.value}
                            size={{
                                xs:4,
                                md:3
                            }}
                        >
                            <Button
                                size={'small'}
                                variant={'contained'}
                                fullWidth
                                onClick={()=>onDancerSelect(dancer.value)}
                                color={color as ButtonProps['color']}
                                sx={{
                                    height:45
                                }}
                            >
                                {dancer.label}
                            </Button>
                        </Grid>
                    )
                })}
            </Grid>
            <Box
                sx={{
                    position: 'absolute',
                    flex:1,
                    bottom:16,
                    zIndex:1,
                    left:20,
                    right:20,
                }}
            >
                <Button
                    disabled={currentDance?.confirmed?.length!==data?.callback_limit}
                    variant={'contained'}
                    color={'primary'}
                    fullWidth
                    sx={{
                        height:50,
                    }}
                    onClick={onContinue}
                >
                    Continue
                </Button>
            </Box>
        </Stack>
    );
};

export default AdjudicatorRoundHeat;

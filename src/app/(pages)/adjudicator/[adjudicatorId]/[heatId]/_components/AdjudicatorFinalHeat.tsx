import React, { useEffect, useMemo, useState } from 'react';
import { HeatResponseType } from "@/app/(pages)/adjudicator/[adjudicatorId]/[heatId]/page";
import {
    Box,
    Button, Card, CardHeader,
    IconButton,
    Stack,
    Typography
} from "@mui/material";
import { ArrowBack, Delete } from "@mui/icons-material";
import HeatCard from "@/app/(pages)/adjudicator/[adjudicatorId]/[heatId]/_components/HeatCard";
import { keys, some, sortBy, startCase, toLower, values } from "lodash";
import { useDialogs } from "@toolpad/core";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdjudicatorAssignPositionDialog from "@/app/components/dialogs/adjudicator/AdjudicatorAssignPositionDialog";
import { useSnackbar } from "notistack";
import AdjudicatorSignatureDialog from "@/app/components/dialogs/adjudicator/AdjudicatorSignatureDialog";
import { submitAdjudicatorHeatMarks } from "@/app/server/adjudicator";
import { AdjudicatorMarksSchemaType } from "@/app/schemas/adjudicators/adjudicatorMarksSchema";

type AdjudicatorFinalType = {
    data: HeatResponseType;
    heatId: string
};

type FormState = {
    activeDanceIndex: number;
    marks: {
        [dancerId:string]:{
            uid:string,
            number:string,
            mark:number |null,
            dance:string,
        }
    }[]
}
const AdjudicatorFinalHeat: React.FC<AdjudicatorFinalType> = ({
    data,
    heatId
}) => {

    const dialogs = useDialogs()
    const router= useRouter()
    const session = useSession()
    const { enqueueSnackbar } = useSnackbar()

    const [ formState, setFormState ]=useState<FormState>({
        activeDanceIndex:0,
        marks:[]
    })

    const dances = useMemo(()=>{
        return data?.dances || []
    },[ data ])

    const dancers = useMemo(()=>{
        if(!data?.start_list?.length)return [];
        return sortBy(data.start_list.map((dancer)=>({
            value:dancer.uid,
            label:dancer.number
        })),'label')
    },[ data ])

    useEffect(()=>{
        if(dances.length) {
            setFormState(prev => ({
                ...prev,
                marks: dances.reduce((a:FormState['marks'], v) => {
                    a.push(data.start_list.reduce((acc:FormState['marks'][0],dancer)=>{
                        acc[dancer.uid]={
                            uid:dancer.uid,
                            number:dancer.number,
                            mark:null,
                            dance:v,
                        }
                        return acc
                    },{}))

                    return a;
                }, [])
            }))
        }
    },[ dances ])

    const positions = useMemo(()=>{
        const currentDance = formState.marks[formState.activeDanceIndex];
        if(!currentDance) return {
            allPositions:[],
            available:[]
        }
        const positions = keys(currentDance).map((_,i)=>i+1);
        return {
            allPositions:positions,
            available:positions.filter(pos=>!values(currentDance).find(item=>Number(item.mark)===pos))
        }

    },[ formState ])

    const assignMark = (dancerId:string, mark:number|null)=>{
        setFormState((prev)=>{
            return {
                ...prev,
                marks:prev.marks.map((prevMarks, index)=>{
                    if(index!==prev.activeDanceIndex){
                        return prevMarks;
                    }
                    prevMarks[dancerId].mark=mark
                    return prevMarks;
                })
            }
        })
    }

    const onContinue =async()=>{
        // check if round is correct
        const check = values(formState.marks[formState.activeDanceIndex]).every(mark=>mark.mark!==undefined && mark.mark!==null);
        if(!check){
            enqueueSnackbar('Please ensure all marks are entered', { variant:'error' });
            return;
        }
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

                    const response = await submitAdjudicatorHeatMarks({
                        heat_id:String(heatId),
                        signature:signature,
                        marks:formState.marks.reduce((a:AdjudicatorMarksSchemaType,dancerMarks)=>{

                            values(dancerMarks).forEach(mark=>{
                                a.push({
                                    dancer_id: String(mark.uid),
                                    dance:mark.dance,
                                    dancer_number: Number(mark.number),
                                    mark:Number(mark.mark)
                                })
                            })

                            return a;
                        },[]),
                    })
                    if(response.data){
                        enqueueSnackbar('Marks submitted successfully', { variant:'success' })
                    }else{
                        console.log('Error submitting marks', response);
                        enqueueSnackbar('Error submitting marks', { variant:'error' })
                    }
                }
            }
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
            <Stack
                spacing={1}
                width={'100%'}
                mt={2}
            >
                {dancers.map((dancer)=>{

                    const dancerMark = formState.marks?.[formState.activeDanceIndex]?.[dancer.value].mark as number

                    return (
                        <Card
                            key={dancer.value}
                        >
                            <CardHeader
                                title={dancer.label}
                                action={(
                                    <Stack
                                        direction={'row'}
                                        spacing={2}
                                    >
                                        <Button
                                            variant={'outlined'}
                                            sx={{
                                                height:'100%',
                                                minHeight:35
                                            }}
                                            onClick={async()=>{
                                                const result = await dialogs.open(AdjudicatorAssignPositionDialog,{
                                                    dancerNumber:dancer.label,
                                                    dancerId:dancer.value,
                                                    title:`${data.item_no}-${startCase(toLower(data?.section?.name))}`,
                                                    subtitle:startCase(toLower(dances[formState.activeDanceIndex])),
                                                    positions
                                                })
                                                if(result){
                                                    assignMark(result.dancerId, result.mark)
                                                }
                                            }}
                                        >
                                            {dancerMark}
                                        </Button>
                                        {!!dancerMark && (
                                            <IconButton
                                                onClick={()=>{
                                                    assignMark(dancer.value, null)
                                                }}
                                            >
                                                <Delete/>
                                            </IconButton>
                                        )}
                                    </Stack>

                                )}
                            />
                        </Card>
                    )
                })}
            </Stack>
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
                    disabled={positions.available.length!==0}
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

export default AdjudicatorFinalHeat;

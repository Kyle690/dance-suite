import React, { useMemo } from 'react';
import MenuButtons, { MenuButtonsProps } from "@/app/components/layout/MenuButtons";
import { HeatStatus, HeatType } from "@prisma/client";
import { useDialogs } from "@toolpad/core";
import {
    Delete,
    Edit,
    FormatListBulletedAdd,
    ChecklistRtlSharp,
    FilterListOffRounded,
    PlayArrowSharp,
    ChecklistSharp, ListAlt, PlayArrow,
} from '@mui/icons-material';
import { updateHeatStatus, deleteHeat } from "@/app/server/competitions";
import { useSnackbar } from "notistack";
import HeatDialog from "@/app/components/dialogs/competition/section/HeatDialog";
import HeatStartListDialog from "@/app/components/dialogs/competition/section/HeatStartListDialog";
import HeatMarksRoundDialog from "@/app/components/dialogs/competition/section/HeatMarksRoundDialog";
import HeatRoundReviewDialog from "@/app/components/dialogs/competition/section/HeatRoundReviewDialog";
import HeatRoundResultDialog from "@/app/components/dialogs/competition/section/HeatRoundResultDialog";
import HeatMarksFinalDialog from "@/app/components/dialogs/competition/section/HeatMarksFinalDialog";
import HeatFinalReviewDialog from "@/app/components/dialogs/competition/section/HeatFinalReviewDialog";
import HeatFinalResultDialog from "@/app/components/dialogs/competition/section/HeatFinalResultDialog";

type SectionHeatRowButtonsProps = {
    data:any,
    refetch:()=>void;
}

const SectionHeatRowButtons: React.FC<SectionHeatRowButtonsProps> = ({
    data,
    refetch
}) => {

    const dialogs = useDialogs()
    const { enqueueSnackbar }=useSnackbar()


    const buttons:MenuButtonsProps['buttons'] = useMemo(()=>{

        const defaults = [
            {
                label:'Delete',
                icon:<Delete color={'error'}/>,
                onClick:async()=>{
                    await dialogs.confirm('Are you sure you want to delete this heat? This action cannot be undone.',{
                        title:'Please Confirm',
                        onClose:async(res)=>{
                            if(res){
                                const response = await deleteHeat({ uid:data?.uid });
                                if(response?.data){
                                    enqueueSnackbar('Heat deleted',{ variant:'success' })
                                    refetch();
                                }
                            }
                        }
                    });
                }
            },
            {
                label:'Edit',
                icon:<Edit color={'primary'}/>,
                onClick:async()=>{
                    await dialogs.open(HeatDialog, data);
                    refetch();
                }
            },
            {
                label:'Delete Last Round',
                icon:<FilterListOffRounded color={'error'}/>,
                onClick:()=>{}
            },
            {
                label:'Review Marks',
                icon:<ChecklistRtlSharp color={'success'}/>,
                onClick:async()=>{
                    if(data?.type===HeatType.ROUND || data?.type===HeatType.QUARTER_FINAL || data?.type===HeatType.SEMI_FINAL) {
                        const response = await dialogs.open (HeatRoundReviewDialog, {
                            heat_id:data?.uid
                        })

                        if(response){
                            refetch()
                        }
                    }

                    if(data?.type===HeatType.FINAL) {
                        const response = await dialogs.open (HeatFinalReviewDialog, {
                            heat_id: data?.uid,
                        })
                        if(response){
                            refetch()
                        }
                    }
                }
            },
            {
                label:'Enter Marks',
                icon:<ChecklistSharp color={'secondary'}/>,
                onClick:async()=>{
                    if(data?.type===HeatType.ROUND || data?.type===HeatType.QUARTER_FINAL || data?.type===HeatType.SEMI_FINAL){
                        await dialogs.open(HeatMarksRoundDialog,{
                            ...data
                        })
                    }
                    if(data?.type===HeatType.FINAL){
                        await dialogs.open(HeatMarksFinalDialog,{
                            ...data
                        })
                    }
                }
            },
            {
                label:'View Start List',
                icon:<FormatListBulletedAdd color={'primary'}/>,
                onClick:async()=>{
                    const result =  await dialogs.open(HeatStartListDialog,{
                        heatId:data?.uid
                    })

                    if(result){
                        refetch()
                    }
                }
            },
            {
                label: 'Review Result',
                icon: <ListAlt color={'info'}/>,
                onClick: async () => {
                    if (data?.type === HeatType.FINAL) {
                        await dialogs.open(HeatFinalResultDialog, { heat_id: String(data?.uid) });
                    } else {
                        await dialogs.open(HeatRoundResultDialog, { heatId: String(data?.uid) });
                    }
                },
            },
            {
                label:'Start Heat',
                icon:<PlayArrow color={'success'}/>,
                disabled:!data?.start_list?.length,
                onClick:async()=>{
                    if(!data?.start_list?.length){
                        await dialogs.alert('Cannot start heat without any dancers. Please add dancers to the heat before starting.',{
                            title:'Start Heat Error',
                        })
                        return;
                    }
                    await dialogs.confirm('Once started this will appear in the adjudicators queue for adjudication!',{
                        title:'Are you sure you want to start this heat?',
                        okText:'Start',
                        cancelText:'Cancel',
                        onClose:async(res)=>{
                            if(res) {
                                const result =  await updateHeatStatus({
                                    heat_id: data?.uid,
                                    status: HeatStatus.READY,
                                })
                                console.log('Heat status update rstult', result);
                                refetch()
                            }
                        }
                    })

                }
            }
        ]


        if(data?.status===HeatStatus.COMPLETE){
            return [
                defaults[0],
                defaults[2],
                defaults[6]
            ]
        }

        if(data?.status===HeatStatus.DRAFT){
            return [
                defaults[1],
                defaults[0],
                {
                    label:'Activate',
                    icon:<PlayArrowSharp color={'success'}/>,
                    onClick:async()=>{
                        await dialogs.confirm('Are you sure you want to activate this heat? Once activated the heat will be added to the upcoming schedule.',{
                            title:'Please Confirm',
                            onClose:async(res)=>{
                                if(res){
                                    await updateHeatStatus({
                                        heat_id:data.uid,
                                        status:HeatStatus.ACTIVE,
                                    });
                                    refetch()
                                }
                            }
                        })
                    }
                },
                defaults[5]
            ]
        }

        if(
            data?.status===HeatStatus.READY
        ){
            return [
                defaults[1],
                defaults[0],
                defaults[4],
                defaults[5],

            ]
        }
        if(data?.status===HeatStatus?.ACTIVE){
            return [
                defaults[1],
                defaults[0],
                defaults[4],
                defaults[5],
                defaults[7],
            ]
        }

        if(data?.status===HeatStatus.MARSHALLING){
            return [
                defaults[1],
                defaults[2],
                defaults[5],
                defaults[7],
            ]
        }

        if(data?.status===HeatStatus.READY || data?.status===HeatStatus.JUDGING){
            return [
                defaults[1],
                defaults[0],
                defaults[4],
                defaults[5],
            ]
        }

        if(data?.status===HeatStatus.REVIEWING){
            return [
                defaults[1],
                defaults[0],
                defaults[2],
                defaults[3]
            ]
        }

        if(data?.status===HeatStatus.CHECKING){
            return [
                {
                    label: 'Review Result',
                    icon: <ListAlt color={'info'}/>,
                    onClick: async () => {
                        if (data?.type === HeatType.FINAL) {
                            await dialogs.open(HeatFinalResultDialog, { heat_id: String(data?.uid) });
                        } else {
                            await dialogs.open(HeatRoundResultDialog, { heatId: String(data?.uid) });
                        }
                        refetch();
                    },
                },
                {
                    label:'Delete Marks',
                    icon:<Delete color={'error'}/>,
                    onClick:async()=>{},
                }
            ]
        }


        return []
    },[ dialogs, data ])

    const disabled =  data?.status === HeatStatus.CANCELED


    return (
        <MenuButtons
            name={'heat-actions'}
            id={data.uid}
            disabled={disabled}
            buttons={buttons}
        />
    );
}

export default SectionHeatRowButtons;

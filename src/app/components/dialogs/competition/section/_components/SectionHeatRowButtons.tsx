import React, { useMemo } from 'react';
import MenuButtons, { MenuButtonsProps } from "@/app/components/layout/MenuButtons";
import { HeatStatus } from "@prisma/client";
import { useDialogs } from "@toolpad/core";
import {
    Delete,
    Edit,
    FormatListBulletedAdd,
    ListSharp,
    ChecklistRtlSharp,
    FilterListOffRounded, PlayArrowSharp
} from '@mui/icons-material';
import { activateHeat, deleteHeat } from "@/app/server/competitions";
import { useSnackbar } from "notistack";
import HeatDialog from "@/app/components/dialogs/competition/section/HeatDialog";
import HeatStartListDialog from "@/app/components/dialogs/competition/section/HeatStartListDialog";

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
                onClick:()=>{}
            },
            {
                label:'Enter Marks',
                icon:<ListSharp color={'secondary'}/>,
                onClick:()=>{}
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
            }
        ]


        if(data?.status===HeatStatus.COMPLETE){
            return [
                defaults[0],
                defaults[2],
                defaults[3]
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
                                    await activateHeat(data?.uid);
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
            || data?.status===HeatStatus?.ACTIVE
        ){
            return [
                defaults[1],
                defaults[0],
                defaults[4],
                defaults[5]
            ]
        }

        if(data?.status===HeatStatus.MARSHALLING){
            return [
                defaults[1],
                defaults[2],
                defaults[5]
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


        return []
    },[ dialogs, data ])

    const disabled = data?.status === HeatStatus.COMPLETE || data?.status === HeatStatus.CANCELED


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

import React from 'react';
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCompetition } from "@/app/server/competitions";
import { IconButton, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
import { Settings, ExitToAppOutlined, Edit, Delete, People, FormatListNumberedRtl } from '@mui/icons-material'
import MenuButtons from "@/app/components/layout/MenuButtons";
import { competition } from "@prisma/client";
import { useDialogs } from "@toolpad/core";
import CompetitionDetailsDialog from "@/app/components/dialogs/competition/CompetitionDetailsDialog";
import AdjudicatorsDialog from "@/app/components/dialogs/competition/AdjudicatorsDialog";

type CustomToolbarActionProps = {
    competition?:competition
}

const CustomToolbarAction:React.FC<CustomToolbarActionProps> =({
    competition
})=>{

    const router = useRouter()
    const dialogs = useDialogs();

    return (
        <Stack
            direction={'row'}
            alignItems={'center'}
        >
            <MenuButtons
                name={'Competition'}
                id={'competition'}
                menuName={'Details'}
                buttons={[
                    {
                        label:'Edit Details',
                        onClick:async()=>{
                            await dialogs.open(CompetitionDetailsDialog,competition)
                        },
                        icon:<Edit color={'primary'}/>,
                        color:'primary'
                    },
                    {
                        label:'Delete',
                        onClick:()=>{},
                        icon:<Delete color={'error'}/>,
                        color:'error',
                    }
                ]}

            />
            <MenuButtons
                name={'Adjudicators'}
                id={'competition'}
                menuName={'Adjudicators'}
                buttons={[
                    {
                        label:'Adjudicators',
                        onClick:async()=>{
                            dialogs.open(AdjudicatorsDialog,undefined)
                        },
                        icon:<People color={'primary'}/>,
                        color:'primary'
                    },
                    {
                        label:'Panels',
                        onClick:()=>{},
                        icon:<FormatListNumberedRtl color={'secondary'}/>,
                        color:'secondary',
                    }
                ]}

            />
            <Tooltip title={'Close Competition'}>
                <IconButton
                    onClick={()=>router.push('/competitions')}
                >
                    <ExitToAppOutlined/>
                </IconButton>
            </Tooltip>
        </Stack>
    )
}


export default CustomToolbarAction;

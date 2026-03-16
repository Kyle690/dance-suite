import React from 'react';
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCompetition } from "@/app/server/competitions";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { ExitToAppOutlined, Edit, Delete, People, FormatListNumberedRtl, DarkMode, LightMode } from '@mui/icons-material'
import MenuButtons from "@/app/components/layout/MenuButtons";
import { competition } from "@prisma/client";
import { useDialogs } from "@toolpad/core";
import CompetitionDetailsDialog from "@/app/components/dialogs/competition/CompetitionDetailsDialog";
import AdjudicatorsDialog from "@/app/components/dialogs/competition/AdjudicatorsDialog";
import PanelsDialog from "@/app/components/dialogs/competition/PanelsDialog";
import { useAdjudicators } from "@/app/hooks/useAdjudicators";
import { useColorScheme } from "@mui/material/styles";
import UserMenu from "@/app/components/UserMenu";

type CustomToolbarActionProps = {
    competition?:competition
}

const CustomToolbarAction:React.FC<CustomToolbarActionProps> =({
    competition
})=>{

    const router = useRouter()
    const dialogs = useDialogs();
    const { mode, setMode } = useColorScheme();
    const isDark = mode === 'dark';

    const {
        data:adjudicators,
        isLoading:adjudicatorsLoading
    }=useAdjudicators(String(competition?.uid))

    return (
        <Stack
            direction={'row'}
            alignItems={'center'}
        >
            <MenuButtons
                name={'Competition'}
                id={'competition'}
                menuName={'Competition'}
                buttons={[
                    {
                        label:'Edit Details',
                        onClick:async()=>{
                            await dialogs.open(CompetitionDetailsDialog,competition)
                        },
                        icon:<Edit color={'primary'}/>,
                        color:'primary',
                        disabled:!competition || adjudicatorsLoading
                    },
                    {
                        label:'Delete',
                        onClick:()=>{},
                        icon:<Delete color={'error'}/>,
                        color:'error',
                    },
                    {
                        label:'Adjudicators',
                        onClick:async()=>{
                            dialogs.open(AdjudicatorsDialog,adjudicators?adjudicators:undefined)
                        },
                        icon:<People color={'primary'}/>,
                        color:'primary'
                    },
                    {
                        label:'Panels',
                        onClick:async()=>{
                            await dialogs.open(PanelsDialog)
                        },
                        icon:<FormatListNumberedRtl color={'secondary'}/>,
                        color:'secondary',
                    }
                ]}

            />
            <UserMenu />
            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton onClick={() => setMode(isDark ? 'light' : 'dark')}>
                    {isDark ? <LightMode /> : <DarkMode />}
                </IconButton>
            </Tooltip>
            <Tooltip title={'Close Competition'}>
                <IconButton
                    onClick={()=>router.push('/scrutineer/profile')}
                >
                    <ExitToAppOutlined/>
                </IconButton>
            </Tooltip>
        </Stack>
    )
}


export default CustomToolbarAction;

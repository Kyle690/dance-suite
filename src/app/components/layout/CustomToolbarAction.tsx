import React from 'react';
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompetition, updateCompetitionStatus } from "@/app/server/competitions";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { ExitToAppOutlined, Edit, Archive, People, FormatListNumberedRtl, DarkMode, LightMode, PlayCircleOutline, PauseCircleOutline, Upload } from '@mui/icons-material'
import MenuButtons from "@/app/components/layout/MenuButtons";
import { competition } from "@prisma/client";
import { useDialogs } from "@toolpad/core";
import CompetitionDetailsDialog from "@/app/components/dialogs/competition/CompetitionDetailsDialog";
import AdjudicatorsDialog from "@/app/components/dialogs/competition/AdjudicatorsDialog";
import PanelsDialog from "@/app/components/dialogs/competition/PanelsDialog";
import CompetitionImportDialog from "@/app/components/dialogs/competition/CompetitionImportDialog";
import { useAdjudicators } from "@/app/hooks/useAdjudicators";
import { useColorScheme } from "@mui/material/styles";
import UserMenu from "@/app/components/UserMenu";
import { useSnackbar } from "notistack";

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
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data: adjudicators } = useAdjudicators(String(competition?.uid))

    const isActive = competition?.status === 'ACTIVE';

    const { mutate: toggleStatus, isPending: isTogglingStatus } = useMutation({
        mutationKey: [ 'update-competition-status', competition?.uid ],
        mutationFn: () => updateCompetitionStatus(competition!.uid),
        onSuccess: async (data) => {
            if (data?.data) {
                const newStatus = data.data.status;
                enqueueSnackbar(
                    newStatus === 'ACTIVE' ? 'Competition activated' : 'Competition set to draft',
                    { variant: 'success' }
                );
                await queryClient.invalidateQueries({ queryKey: [ 'getCompetition', competition?.uid ] });
            }
        },
        onError: () => {
            enqueueSnackbar('Failed to update competition status', { variant: 'error' });
        },
    });

    return (
        <Stack
            direction={'row'}
            alignItems={'center'}
            spacing={1}
        >
            <MenuButtons
                name={'Competition'}
                id={'competition'}
                menuName={'Competition'}
                buttons={[
                    { type: 'subheader', label: 'Competition' },
                    {
                        label: isActive ? 'Set to Draft' : 'Activate Competition',
                        onClick: () => toggleStatus(),
                        icon: isActive
                            ? <PauseCircleOutline color={'warning'} />
                            : <PlayCircleOutline color={'success'} />,
                        color: isActive ? 'warning' : 'success',
                        disabled: !competition || isTogglingStatus,
                    },
                    {
                        label: 'Edit Details',
                        onClick: async () => {
                            await dialogs.open(CompetitionDetailsDialog, competition);
                        },
                        icon: <Edit color={'primary'} />,
                        color: 'primary',
                        disabled: !competition,
                    },
                    {
                        label: 'Archive Competition',
                        onClick: () => {},
                        icon: <Archive color={'error'} />,
                        color: 'error',
                        disabled: !competition,
                    },
                    { type: 'divider' },
                    { type: 'subheader', label: 'Configuration' },
                    {
                        label: 'Adjudicators',
                        onClick: async () => {
                            await dialogs.open(AdjudicatorsDialog, adjudicators ? adjudicators : undefined);
                        },
                        icon: <People color={'primary'} />,
                        color: 'primary',
                        disabled: !competition,
                    },
                    {
                        label: 'Panels',
                        onClick: async () => {
                            await dialogs.open(PanelsDialog);
                        },
                        icon: <FormatListNumberedRtl color={'secondary'} />,
                        color: 'secondary',
                        disabled: !competition,
                    },
                    { type: 'divider' },
                    { type: 'subheader', label: 'Data' },
                    {
                        label: 'Import CSV',
                        onClick: async () => {
                            await dialogs.open(CompetitionImportDialog, competition!);
                        },
                        icon: <Upload color={'info'} />,
                        color: 'info',
                        disabled: !competition,
                    },
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
                    onClick={()=>router.push('/scrutineer/competitions')}
                >
                    <ExitToAppOutlined/>
                </IconButton>
            </Tooltip>
        </Stack>
    )
}


export default CustomToolbarAction;

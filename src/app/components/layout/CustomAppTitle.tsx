import React from 'react';
import { competition, CompetitionStatus } from "@prisma/client";
import { Typography, Stack, Chip } from "@mui/material";
import dayjs from "@/app/utils/dayjs";
import { startCase, toLower } from "lodash";

type CustomAppTitleProps = {
    competition?:competition
}

const CustomAppTitle: React.FC<CustomAppTitleProps> = ({
    competition
}) => {

    const statusColor = (status?:string) => {
        switch (status) {
        case CompetitionStatus.ACTIVE:
            return 'success';
        case CompetitionStatus.COMPLETED:
            return 'primary';
        case CompetitionStatus.CANCELLED:
            return 'error';
        case CompetitionStatus.ARCHIVED:
            return 'info';
        default:
            return 'default';
        }
    }

    return (
        <Stack
            direction={'row'}
            alignItems={'center'}
        >
            <Stack
                spacing={-0.5}
            >
                <Typography
                    variant={'h6'}
                    fontWeight={'600'}
                    color={'primary'}
                >
                    {competition?.name || 'Dance Suite Scrutineer'}
                </Typography>
                <Stack
                    direction={'row'}
                    alignItems={'center'}
                    spacing={2}
                >
                    {competition?.venue && (
                        <Typography variant={'caption'}>
                            {competition.venue}
                        </Typography>
                    )}
                    {competition?.date && (
                        <Typography variant={'caption'}>
                            {dayjs(competition.date).format('DD/MM/YYYY')}
                        </Typography>
                    )}
                </Stack>
            </Stack>
            {competition?.status && (
                <Chip
                    color={statusColor(competition.status)}
                    label={startCase(toLower(competition.status))}
                    size={'small'}
                    sx={{ ml: 2, height: 24, mt: 0.5 }}
                />
            )}
        </Stack>
    );
}

export default CustomAppTitle;

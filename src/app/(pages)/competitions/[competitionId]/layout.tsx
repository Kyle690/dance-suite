'use client';
import React, { useState } from 'react';
import { AppProvider } from "@toolpad/core/AppProvider";
import theme from "@/app/theme";
import { Home, Event, Dashboard, ExitToAppOutlined, Settings } from '@mui/icons-material';
import { DashboardLayout } from "@toolpad/core";
import { IconButton, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getCompetition } from "@/app/server/competitions";
import CustomToolbarAction from "@/app/components/layout/CustomToolbarAction";
import CustomAppTitle from "@/app/components/layout/CustomAppTitle";

type layoutProps = {
    children: React.ReactNode
}

const NAVIGATION = [
    {
        kind: 'header' as const,
        title: 'Dance Suite Scrutineer',
    },
    {
        segment: '',
        title: 'Home',
        icon: <Home />,
    },
    {
        segment: 'sections',
        title: 'Dashboard',
        icon: <Dashboard/>,
    },
    {
        segment: 'competitions',
        title: 'Competitions',
        icon: <Event />,
    },
];

const BRANDING = {
    title: 'Dance Suite Scrutineer',
};

const Layout: React.FC<layoutProps> = ({
    children
}) => {


    const { competitionId }=useParams()

    const {
        data,
        isLoading,
    }=useQuery({
        queryKey:[ 'getCompetition', competitionId ],
        queryFn:async()=>getCompetition(String(competitionId))
    })

    return (
        <AppProvider
            navigation={NAVIGATION}
            branding={{
                title:data?.data?.name ||BRANDING.title,
                homeUrl:`/competitions/${competitionId}`
            }}
            theme={theme}
        >
            <DashboardLayout
                hideNavigation
                slots={{
                    toolbarActions:CustomToolbarAction,
                    appTitle:CustomAppTitle
                }}
                slotProps={{
                    toolbarActions:{
                        competition:data?.data
                    },
                    appTitle:{
                        competition:data?.data
                    }
                }}
            >
                <Stack
                    p={4}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background:'background.paper',
                    }}
                >
                    {children}
                </Stack>
            </DashboardLayout>
        </AppProvider>
    );
}

export default Layout;

'use client';
import React, { useState } from 'react';
import { AppProvider } from "@toolpad/core/AppProvider";
import theme from "@/app/theme";
import { Home, Event, Dashboard, ExitToAppOutlined, Settings } from '@mui/icons-material';
import { DashboardLayout } from "@toolpad/core";
import { CssBaseline, IconButton, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getCompetition } from "@/app/server/competitions";
import CustomToolbarAction from "@/app/components/layout/CustomToolbarAction";
import CustomAppTitle from "@/app/components/layout/CustomAppTitle";

type layoutProps = {
    children: React.ReactNode
}



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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    competition:data?.data
                }
            }}
        >
            <Stack
                p={4}
                sx={{
                    height: '100%',
                    width:'100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background:'custom.background',
                }}
            >
                {children}
            </Stack>
        </DashboardLayout>
    );
}

export default Layout;

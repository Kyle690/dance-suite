'use client';
import React from 'react';
import { AuthProvider } from "@/app/contexts/AuthContext";
import CustomToolbarAction from "@/app/components/layout/CustomToolbarAction";
import CustomAppTitle from "@/app/components/layout/CustomAppTitle";
import { Dashboard, Event, Home } from "@mui/icons-material";
import { AppProvider } from "@toolpad/core/AppProvider";
import { CssBaseline } from "@mui/material";
import theme from "@/app/theme";

type layoutType = {
    children: React.ReactNode;
};
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
const layout: React.FC<layoutType> = ({ children }) => {

    return (
        <AuthProvider>
            <AppProvider
                navigation={NAVIGATION}
                branding={{
                    title:BRANDING.title,
                    homeUrl:`/scrutineer/profile`
                }}
                theme={theme}
            >
                <CssBaseline />
                {children}
            </AppProvider>
        </AuthProvider>
    );
};

export default layout;

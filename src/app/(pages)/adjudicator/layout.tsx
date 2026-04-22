'use client';
import React from 'react';
import { AppProvider } from "@toolpad/core/AppProvider";
import AdjudicatorApp from "@/app/(pages)/adjudicator/_components/AdjudicatorApp";
import theme from "@/app/theme";
import { SessionProvider } from "next-auth/react";



type layoutType = {
    children: React.ReactNode;
};
const Layout: React.FC<layoutType> = ({
    children
}) => {

    return (
        <AppProvider
            theme={theme}
        >
            <SessionProvider>
                <AdjudicatorApp>
                    {children}
                </AdjudicatorApp>
            </SessionProvider>

        </AppProvider>
    );
};

export default Layout;

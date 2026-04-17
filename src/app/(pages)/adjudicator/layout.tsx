'use client';
import React from 'react';
import { AppProvider } from "@toolpad/core/AppProvider";
import AdjudicatorApp from "@/app/(pages)/adjudicator/_components/AdjudicatorApp";
import theme from "@/app/theme";



type layoutType = {
    children: React.ReactNode;
};
const layout: React.FC<layoutType> = ({
    children
}) => {


    return (
        <AppProvider
            theme={theme}
        >
            <AdjudicatorApp>
                {children}
            </AdjudicatorApp>
        </AppProvider>
    );
};

export default layout;

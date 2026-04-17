'use client';
import React from 'react';
import { SessionProvider } from "next-auth/react";

type AdjudicatorAppType = {
    children: React.ReactNode;
};
const AdjudicatorApp: React.FC<AdjudicatorAppType> = ({ children }) => {

    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
};

export default AdjudicatorApp;

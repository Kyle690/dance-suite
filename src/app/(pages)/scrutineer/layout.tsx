'use client';
import React from 'react';
import { AuthProvider } from "@/app/contexts/AuthContext";

type layoutType = {
    children: React.ReactNode;
};
const layout: React.FC<layoutType> = ({ children }) => {

    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
};

export default layout;

'use client';
import React, { useEffect } from 'react';
import { SessionProvider, useSession } from "next-auth/react";
import { AppProvider } from "@toolpad/core/AppProvider";
import theme from "@/app/theme";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";

type AdjudicatorAppType = {
    children: React.ReactNode;
};
const AdjudicatorApp: React.FC<AdjudicatorAppType> = ({ children }) => {

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/adjudicator/auth');
            return;
        }
        if (session?.adjudicator?.competition_id) {
            router.replace(`/adjudicator/${session.adjudicator.competition_id}`);
        }
    }, [ status, session, router ]);

    if(status==='loading'){
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    width:'100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        )
    }

    return (
        <div>
            {children}
        </div>
    );
};

export default AdjudicatorApp;

'use client';
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

const AdjudicatorIndexPage: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            router.replace('/adjudicator/auth');
            return;
        }

        if (session?.adjudicator?.competition_id) {
            router.replace(`/adjudicator/${session.adjudicator.competition_id}`);
        }
    }, [ status, session, router ]);

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
    );
};

export default AdjudicatorIndexPage;

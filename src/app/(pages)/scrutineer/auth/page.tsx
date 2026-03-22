'use client';
import React, { useEffect, useState } from 'react';
import ScrutineerSignIn from "@/app/(pages)/scrutineer/auth/_components/ScrutineerSignIn";
import ScrutineerSignup from "@/app/(pages)/scrutineer/auth/_components/ScrutineerSignup";
import ScrutineerForgotPassword from "@/app/(pages)/scrutineer/auth/_components/ScrutineerForgotPassword";
import ScrutineerNewPassword from "@/app/(pages)/scrutineer/auth/_components/ScrutineerNewPassword";
import { createClient } from "@/app/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

type AuthMode = 'signin' | 'signup' | 'forgot' | 'recovery';

const Page: React.FC = () => {
    const searchParams = useSearchParams();
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    const isRecovery = searchParams.get('type') === 'recovery';
    const hasError = !!errorCode;

    const [ mode, setMode ] = useState<AuthMode>(isRecovery && !hasError ? 'recovery' : 'signin');

    useEffect(() => {
        if (isRecovery) return;
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setMode('recovery');
            }
        });
        return () => subscription.unsubscribe();
    }, [ isRecovery ]);

    if (isRecovery && hasError) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    p: 2,
                }}
            >
                <Card sx={{ maxWidth: 480, width: '100%' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack spacing={2} alignItems="center" textAlign="center">
                            <ErrorOutline sx={{ fontSize: 48, color: 'error.main' }} />
                            <Typography variant="h5" fontWeight={600}>
                                Link Expired
                            </Typography>
                            <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                                {decodeURIComponent(errorDescription || 'This reset link is invalid or has expired.')}
                            </Alert>
                            <Typography variant="body2" color="text.secondary">
                                Password reset links expire after a short time. Request a new one below.
                            </Typography>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => setMode('forgot')}
                            >
                                Request New Reset Link
                            </Button>
                            <Button
                                variant="text"
                                fullWidth
                                onClick={() => setMode('signin')}
                            >
                                Back to Sign In
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    if (mode === 'recovery') return <ScrutineerNewPassword />;
    if (mode === 'forgot') return <ScrutineerForgotPassword onModeChange={() => setMode('signin')} />;
    if (mode === 'signup') return <ScrutineerSignup onModeChange={() => setMode('signin')} />;

    return (
        <ScrutineerSignIn
            onModeChange={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot')}
        />
    );
};

export default Page;
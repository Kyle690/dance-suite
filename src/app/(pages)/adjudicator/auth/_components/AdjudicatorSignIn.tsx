'use client';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdjudicatorSignInSchema, AdjudicatorSignInFormType } from '@/app/schemas/AuthSchema';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import CustomInput from '@/app/components/forms/CustomInput';
import OtpInput from '@/app/components/forms/OtpInput';
import { GavelOutlined } from '@mui/icons-material';
import { useQuery } from "@tanstack/react-query";
import { getLiveCompetitions } from "@/app/server/adjudicator";

const AdjudicatorSignIn: React.FC = () => {
    const router = useRouter();
    const [ error, setError ] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
        getValues,
        watch
    } = useForm<AdjudicatorSignInFormType>({
        defaultValues: {
            competition_id: '',
            login_code: '',
        },
        mode: 'onChange',
        resolver: zodResolver(AdjudicatorSignInSchema),
    });

    const competitionId = watch('competition_id')

    const onSubmit = async (data: AdjudicatorSignInFormType) => {
        setError(null);

        const result = await signIn('adjudicator-credentials', {
            competition_id:data.competition_id,
            login_code: data.login_code,
            redirect: false,
        });

        if (result?.error) {
            setError('Invalid login code or competition not live. Please check the details and try again.');
            return;
        }

        router.replace('/adjudicator');
    };

    const {
        data,
        isLoading,
    }=useQuery({
        queryKey:[ 'adjudicator-live-competitions' ],
        queryFn:async()=>{
            return getLiveCompetitions();
        }
    })

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
            <Card sx={{ maxWidth: 440, width: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                    {isLoading ? (
                        <Box>
                            <CircularProgress/>
                        </Box>
                    ):(
                        <Stack>
                            <Stack
                                alignItems="center"
                                spacing={1}
                                mb={3}
                            >
                                <GavelOutlined sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Typography
                                    variant="h5" component="h1"
                                    fontWeight={600}
                                >
                                    Adjudicator Portal
                                </Typography>
                                <Typography
                                    variant="body2" color="text.secondary"
                                    textAlign="center"
                                >
                                    Sign in with your email and the 6-digit login code from your invitation.
                                </Typography>
                            </Stack>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Stack
                                component="form" onSubmit={handleSubmit(onSubmit)}
                                spacing={4}
                            >
                                <Controller
                                    name="competition_id"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomInput
                                            {...field}
                                            inputType="select"
                                            options={data?.data}
                                            label="Competition"
                                            value={field.value as any}
                                            error={!!errors.competition_id}
                                            helperText={errors.competition_id?.message}
                                            autoFocus
                                            disabled={isSubmitting}
                                            variant="outlined"
                                        />
                                    )}
                                />
                                {!!competitionId?.length && (
                                    <Controller
                                        name="login_code"
                                        control={control}
                                        render={({ field }) => (
                                            <OtpInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                length={6}
                                                error={!!errors.login_code}
                                                helperText={errors.login_code?.message ?? '6-digit code from your invitation email'}
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                        )}
                                    />
                                )}
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={!isValid || isSubmitting}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdjudicatorSignIn;

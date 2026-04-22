import React, { useState } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import { Controller, useForm } from "react-hook-form";
import { SignInFormType, SignInSchema } from "@/app/schemas/AuthSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Link as MuiLink,
    Stack,
    Typography
} from "@mui/material";
import CustomInput from "@/app/components/forms/CustomInput";

type ScrutineerSignInType = {
    onModeChange: () => void;
    onForgotPassword: () => void;
};
const ScrutineerSignIn: React.FC<ScrutineerSignInType> = ({
    onModeChange,
    onForgotPassword,
}) => {
    const router = useRouter();
    const supabase = createClient();
    const [ error, setError ] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<SignInFormType>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onChange',
        resolver: zodResolver(SignInSchema),
    });

    const onSubmit = async (data: SignInFormType) => {
        setError(null);
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                router.replace('/scrutineer/competitions')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign in');
        }
    };

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
                    <Typography
                        variant="h4" component="h1"
                        gutterBottom textAlign="center"
                    >
                        Welcome Back
                    </Typography>
                    <Typography
                        variant="body2" color="text.secondary"
                        textAlign="center" sx={{ mb: 3 }}
                    >
                        Sign in to your scrutineer account
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Stack
                        component="form" onSubmit={handleSubmit(onSubmit)}
                        spacing={2}
                    >
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <CustomInput
                                    {...field}
                                    inputType="email"
                                    label="Email Address"
                                    type="email"
                                    value={field.value as any}
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    autoComplete="email"
                                    autoFocus
                                    disabled={isSubmitting}
                                    variant="outlined"
                                />
                            )}
                        />
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <CustomInput
                                    {...field}
                                    inputType="password"
                                    label="Password"
                                    value={field.value as any}
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    autoComplete="current-password"
                                    disabled={isSubmitting}
                                    variant="outlined"
                                />
                            )}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={!isValid || isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>

                        <Box sx={{ textAlign: 'right' }}>
                            <MuiLink
                                component={Button}
                                onClick={onForgotPassword}
                                underline="hover"
                                sx={{ fontSize: '0.8125rem' }}
                            >
                                Forgot password?
                            </MuiLink>
                        </Box>

                        <Divider />

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account?{' '}
                                <MuiLink
                                    component={Button}
                                    onClick={onModeChange}
                                    underline="hover"
                                >
                                    Sign Up
                                </MuiLink>
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ScrutineerSignIn;

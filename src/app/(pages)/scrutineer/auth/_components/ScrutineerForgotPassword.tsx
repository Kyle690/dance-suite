import React, { useState } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import { Controller, useForm } from "react-hook-form";
import { ForgotPasswordFormType, ForgotPasswordSchema } from "@/app/schemas/AuthSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Link as MuiLink,
    Stack,
    Typography,
} from "@mui/material";
import { MarkEmailRead } from "@mui/icons-material";
import CustomInput from "@/app/components/forms/CustomInput";

type ScrutineerForgotPasswordProps = {
    onModeChange: () => void;
};

const ScrutineerForgotPassword: React.FC<ScrutineerForgotPasswordProps> = ({
    onModeChange,
}) => {
    const supabase = createClient();
    const [ sent, setSent ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        getValues,
        formState: { errors, isValid, isSubmitting },
    } = useForm<ForgotPasswordFormType>({
        defaultValues: { email: '' },
        mode: 'onChange',
        resolver: zodResolver(ForgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormType) => {
        setError(null);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/scrutineer/auth?type=recovery`,
            });
            if (resetError) throw resetError;
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
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
                    {sent ? (
                        <Stack spacing={2} alignItems="center" textAlign="center">
                            <MarkEmailRead sx={{ fontSize: 48, color: 'success.main' }} />
                            <Typography variant="h5" fontWeight={600}>
                                Check your email
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                We sent a password reset link to <strong>{getValues('email')}</strong>.
                                Check your inbox and follow the link to set a new password.
                            </Typography>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={onModeChange}
                                sx={{ mt: 1 }}
                            >
                                Back to Sign In
                            </Button>
                        </Stack>
                    ) : (
                        <>
                            <Typography
                                variant="h4" component="h1"
                                gutterBottom textAlign="center"
                            >
                                Reset Password
                            </Typography>
                            <Typography
                                variant="body2" color="text.secondary"
                                textAlign="center" sx={{ mb: 3 }}
                            >
                                Enter your email and we'll send you a reset link.
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
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={!isValid || isSubmitting}
                                >
                                    {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Link'}
                                </Button>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Remember your password?{' '}
                                        <MuiLink
                                            component={Button}
                                            onClick={onModeChange}
                                            underline="hover"
                                        >
                                            Sign In
                                        </MuiLink>
                                    </Typography>
                                </Box>
                            </Stack>
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default ScrutineerForgotPassword;
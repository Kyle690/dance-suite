import React, { useState } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import { Controller, useForm } from "react-hook-form";
import { NewPasswordFormType, NewPasswordSchema } from "@/app/schemas/AuthSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import CustomInput from "@/app/components/forms/CustomInput";

const ScrutineerNewPassword: React.FC = () => {
    const supabase = createClient();
    const router = useRouter();
    const [ error, setError ] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<NewPasswordFormType>({
        defaultValues: { password: '', confirmPassword: '' },
        mode: 'onChange',
        resolver: zodResolver(NewPasswordSchema),
    });

    const onSubmit = async (data: NewPasswordFormType) => {
        setError(null);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.password,
            });
            if (updateError) throw updateError;
            router.replace('/scrutineer/profile');
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
                    <Typography
                        variant="h4" component="h1"
                        gutterBottom textAlign="center"
                    >
                        Set New Password
                    </Typography>
                    <Typography
                        variant="body2" color="text.secondary"
                        textAlign="center" sx={{ mb: 3 }}
                    >
                        Choose a strong password for your account.
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
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <CustomInput
                                    {...field}
                                    inputType="password"
                                    label="New Password"
                                    value={field.value as any}
                                    error={!!errors.password}
                                    helperText={errors.password?.message ?? 'Must be at least 6 characters'}
                                    autoComplete="new-password"
                                    autoFocus
                                    disabled={isSubmitting}
                                    variant="outlined"
                                />
                            )}
                        />
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <CustomInput
                                    {...field}
                                    inputType="password"
                                    label="Confirm New Password"
                                    value={field.value as any}
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword?.message}
                                    autoComplete="new-password"
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
                            {isSubmitting ? <CircularProgress size={24} /> : 'Update Password'}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ScrutineerNewPassword;
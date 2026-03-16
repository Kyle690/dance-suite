import React from 'react';
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { SignUpFormType, SignUpSchema } from "@/app/schemas/AuthSchema";
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
    Typography
} from "@mui/material";
import CustomInput from "@/app/components/forms/CustomInput";
import { useMutation } from "@tanstack/react-query";
import { scrutineerSignUp } from "@/app/server/scrutineer";

type ScrutineerSignupType = {
    onModeChange:()=>void;
};
const ScrutineerSignup: React.FC<ScrutineerSignupType> = ({
    onModeChange
}) => {
    const router = useRouter();

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<SignUpFormType>({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        mode: 'onChange',
        resolver: zodResolver(SignUpSchema),
    });



    const {
        mutate,
        isPending,
        error,
    }=useMutation({
        mutationFn:async(data:SignUpFormType)=>scrutineerSignUp(data),
        mutationKey:[ 'scrutineerSignUp' ],
        onSuccess:()=>{
            router.replace('/scrutineer/profile')
        },
        onError:(error)=>{
            console.log('Error signing up',error);
            return error;
        }
    })

    const onSubmit = async (data: SignUpFormType) => mutate(data);

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
                        Sign Up as Scrutineer
                    </Typography>
                    <Typography
                        variant="body2" color="text.secondary"
                        textAlign="center" sx={{ mb: 3 }}
                    >
                        Create your account to manage dance competitions
                    </Typography>


                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error.message}
                        </Alert>
                    )}

                    <Stack
                        component="form" onSubmit={handleSubmit(onSubmit)}
                        spacing={2}
                    >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Controller
                                name="firstName"
                                control={control}
                                render={({ field }) => (
                                    <CustomInput
                                        {...field}
                                        label="First Name"
                                        value={field.value as any}
                                        error={!!errors.firstName}
                                        helperText={errors.firstName?.message}
                                        autoComplete="given-name"
                                        disabled={isPending}
                                        variant="outlined"
                                    />
                                )}
                            />
                            <Controller
                                name="lastName"
                                control={control}
                                render={({ field }) => (
                                    <CustomInput
                                        {...field}
                                        label="Last Name"
                                        value={field.value as any}
                                        error={!!errors.lastName}
                                        helperText={errors.lastName?.message}
                                        autoComplete="family-name"
                                        disabled={isPending}
                                        variant="outlined"
                                    />
                                )}
                            />
                        </Box>
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
                                    disabled={isPending}
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
                                    helperText={errors.password?.message ?? 'Must be at least 6 characters'}
                                    autoComplete="new-password"
                                    disabled={isPending}
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
                                    label="Confirm Password"
                                    value={field.value as any}
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword?.message}
                                    autoComplete="new-password"
                                    disabled={isPending}
                                    variant="outlined"
                                />
                            )}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={!isValid || isPending}
                        >
                            {isPending? <CircularProgress size={24} /> : 'Sign Up'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Already have an account?{' '}
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
                </CardContent>
            </Card>
        </Box>
    );
};

export default ScrutineerSignup;

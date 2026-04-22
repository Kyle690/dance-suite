import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    CircularProgress,
} from '@mui/material';
import { DialogProps } from '@toolpad/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { UpdateProfileSchema, UpdateProfileFormType } from '@/app/schemas/AuthSchema';
import { updateScrutineerDetails } from '@/app/server/scrutineer';
import CustomInput from '@/app/components/forms/CustomInput';

export type EditProfilePayload = {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
};

const EditProfileDialog: React.FC<DialogProps<EditProfilePayload>> = ({
    open,
    onClose,
    payload,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        trigger,
    } = useForm<UpdateProfileFormType>({
        defaultValues: {
            first_name: '',
            last_name: '',
            phone: '',
        },
        mode: 'onChange',
        resolver: zodResolver(UpdateProfileSchema),
    });

    useEffect(() => {
        if (payload) {
            reset({
                first_name: payload.first_name ?? '',
                last_name: payload.last_name ?? '',
                phone: payload.phone === 'N/A' ? '' : (payload.phone ?? ''),
            });
            trigger();
        }
    }, [ payload ]);

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: UpdateProfileFormType) => {
            const result = await updateScrutineerDetails(data);
            if (result?.serverError) throw new Error(result.serverError);
            return result;
        },
        onSuccess: () => {
            enqueueSnackbar('Profile updated successfully', { variant: 'success' });
            //queryClient.invalidateQueries({ queryKey: [ 'scrutineer_profile' ] });
            onClose();
        },
        onError: (err: Error) => {
            enqueueSnackbar(err.message ?? 'Failed to update profile', { variant: 'error' });
        },
    });

    const onSubmit = (data: UpdateProfileFormType) => {
        mutate(data);
    };

    return (
        <form id={'editProfileForm'} onSubmit={handleSubmit(onSubmit)}>
            <Dialog
                open={open} fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} pt={1}>
                        <Controller
                            name="first_name"
                            control={control}
                            render={({ field }) => (
                                <CustomInput
                                    {...field}
                                    value={field.value as any}
                                    label="First Name"
                                    inputType="text"
                                    error={!!errors.first_name}
                                    helperText={errors.first_name?.message}
                                    variant="outlined"
                                />
                            )}
                        />
                        <Controller
                            name="last_name"
                            control={control}
                            render={({ field }) => (
                                <CustomInput
                                    {...field}
                                    value={field.value as any}
                                    label="Last Name"
                                    inputType="text"
                                    error={!!errors.last_name}
                                    helperText={errors.last_name?.message}
                                    variant="outlined"
                                />
                            )}
                        />
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                                <CustomInput
                                    {...field}
                                    value={field.value as any}
                                    label="Phone"
                                    inputType="text"
                                    error={!!errors.phone}
                                    helperText={errors.phone?.message}
                                    variant="outlined"
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        size="small"
                        color="inherit"
                        onClick={() => onClose()}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="editProfileForm"
                        variant="contained"
                        size="small"
                        color="primary"
                        disabled={!isValid || isPending}
                    >
                        {isPending ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
};

export default EditProfileDialog;

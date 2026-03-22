import React, { useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Divider,
    Paper,
    IconButton,
    Chip,
    Card,
    CardContent,
    Stack,
    Skeleton,
    Tooltip,
    MenuItem,
} from '@mui/material';
import { DialogProps } from '@toolpad/core';
import { adjudicator } from '@prisma/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdjudicatorDetail, updateAdjudicatorContact, sendAdjudicatorLoginEmail } from '@/app/server/competitions';
import { useSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdjudicatorContactSchema, AdjudicatorContactType } from '@/app/schemas/CompetitionAdjudicatorsSchema';
import CustomInput from '@/app/components/forms/CustomInput';
import { ContentCopy, Email, Sms } from '@mui/icons-material';
import dayjs from '@/app/utils/dayjs';
import customList from 'country-codes-list';
import { getHeatTypeColor } from '@/app/utils/heatUtils';

interface CountryOption {
    code: string;
    name: string;
    callingCode: string;
    flag: string;
}

const countryOptions: CountryOption[] = Object.entries(
    customList.customList('countryCode', '{countryNameEn}|{countryCallingCode}|{flag}') as Record<string, string>
)
    .map(([code, value]) => {
        const [name, callingCode, flag] = value.split('|');
        return { code, name, callingCode, flag };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

const AdjudicatorDetailDialog: React.FC<DialogProps<adjudicator>> = ({
    open,
    onClose,
    payload,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data: detailData, isLoading } = useQuery({
        queryKey: ['adjudicator-detail', payload?.uid],
        queryFn: async () => {
            const result = await getAdjudicatorDetail(payload!.uid);
            return result?.data ?? null;
        },
        enabled: open && !!payload?.uid,
    });

    const detail = detailData ?? null;

    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty, isValid },
        watch,
    } = useForm<AdjudicatorContactType>({
        defaultValues: {
            uid: payload?.uid ?? '',
            email: '',
            phone_number: '',
            country_code: 'GB',
            country_calling_code: '44',
        },
        mode: 'onChange',
        resolver: zodResolver(AdjudicatorContactSchema),
    });

    const selectedCountryCode = watch('country_code');

    useEffect(() => {
        if (detail) {
            reset({
                uid: detail.uid,
                email: detail.email ?? '',
                phone_number: detail.phone_number ?? '',
                country_code: detail.country_code ?? '',
                country_calling_code: detail.country_calling_code ?? '',
            });
        }
    }, [detail, reset]);

    const selectedCountry = useMemo(
        () => countryOptions.find((c) => c.code === selectedCountryCode),
        [selectedCountryCode]
    );

    const { mutate: saveContact, isPending: isSavingContact } = useMutation({
        mutationKey: ['update-adjudicator-contact', payload?.uid],
        mutationFn: (data: AdjudicatorContactType) => updateAdjudicatorContact(data),
        onSuccess: async (data) => {
            if (data?.data) {
                enqueueSnackbar('Contact details saved', { variant: 'success' });
                await queryClient.invalidateQueries({ queryKey: ['competition_adjudicators'] });
                await queryClient.invalidateQueries({ queryKey: ['adjudicator-detail', payload?.uid] });
            } else {
                enqueueSnackbar('Error saving contact details', { variant: 'error' });
            }
        },
        onError: () => {
            enqueueSnackbar('Error saving contact details', { variant: 'error' });
        },
    });

    const { mutate: sendEmail, isPending: isSendingEmail } = useMutation({
        mutationKey: ['send-adjudicator-email', payload?.uid],
        mutationFn: () => sendAdjudicatorLoginEmail(payload!.uid),
        onSuccess: (data) => {
            if (data?.data?.sent) {
                enqueueSnackbar('Login code email sent', { variant: 'success' });
            } else {
                enqueueSnackbar('Failed to send email', { variant: 'error' });
            }
        },
        onError: () => {
            enqueueSnackbar('Failed to send email', { variant: 'error' });
        },
    });

    const onSubmit = (data: AdjudicatorContactType) => {
        const callingCode = countryOptions.find((c) => c.code === data.country_code)?.callingCode ?? '';
        saveContact({ ...data, country_calling_code: callingCode });
    };

    const handleCopyLoginCode = () => {
        if (detail?.login_code) {
            navigator.clipboard.writeText(detail.login_code);
            enqueueSnackbar('Login code copied', { variant: 'info' });
        }
    };

    const renderSkeleton = () => (
        <Stack spacing={2}>
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
        </Stack>
    );

    return (
        <Dialog open={open} fullWidth maxWidth="md">
            <DialogTitle>
                Adjudicator {payload?.letter} — {payload?.name}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3} pt={1}>
                    {/* Left column */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        {isLoading ? renderSkeleton() : (
                            <>
                                <Typography variant="overline" color="text.secondary">
                                    Credentials
                                </Typography>

                                <Paper
                                    sx={{
                                        bgcolor: 'background.default',
                                        p: 2,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mt: 1,
                                    }}
                                >
                                    <Typography variant="h6" fontFamily="monospace">
                                        {detail?.login_code ?? 'Not assigned'}
                                    </Typography>
                                    {detail?.login_code && (
                                        <IconButton size="small" onClick={handleCopyLoginCode}>
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    )}
                                </Paper>

                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Last login:{' '}
                                    {detail?.last_login
                                        ? dayjs(detail.last_login).format('DD/MM/YYYY HH:mm')
                                        : 'Never logged in'}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="overline" color="text.secondary">
                                    Contact Details
                                </Typography>

                                <form id="adjudicator-contact-form" onSubmit={handleSubmit(onSubmit)}>
                                    <Stack spacing={2} mt={1}>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <CustomInput
                                                    {...field}
                                                    value={field.value as any}
                                                    inputType="email"
                                                    label="Email"
                                                    size="small"
                                                    error={Boolean(fieldState.error)}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />

                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <Controller
                                                name="country_code"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <CustomInput
                                                        {...field}
                                                        value={field.value as any}
                                                        inputType="autocomplete"
                                                        label="Country"
                                                        size="small"
                                                        error={Boolean(fieldState.error)}
                                                        helperText={fieldState.error?.message}
                                                        sx={{ width: 200 }}
                                                        options={customList.all()?.map((item)=>({
                                                            label:`${item.flag} +${item.countryCallingCode}`,
                                                            value:item.countryCode
                                                        }))}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="phone_number"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <CustomInput
                                                        {...field}
                                                        value={field.value as any}
                                                        inputType="text"
                                                        label={selectedCountry ? `Phone (+${selectedCountry.callingCode})` : 'Phone'}
                                                        size="small"
                                                        error={Boolean(fieldState.error)}
                                                        helperText={fieldState.error?.message}
                                                        sx={{ flex: 1 }}
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    </Stack>
                                    <Button
                                        type="submit"
                                        form="adjudicator-contact-form"
                                        variant="contained"
                                        size="small"
                                        sx={{ mt: 2 }}
                                        disabled={!isDirty || !isValid || isSavingContact}
                                    >
                                        Save
                                    </Button>
                                </form>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="overline" color="text.secondary">
                                    Notifications
                                </Typography>
                                <Stack spacing={1} mt={1}>
                                    <Tooltip title={!detail?.email ? 'Add an email address to send login code' : ''}>
                                        <span>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Email />}
                                                fullWidth
                                                disabled={!detail?.email || !detail?.login_code || isSendingEmail}
                                                onClick={() => sendEmail()}
                                            >
                                                {isSendingEmail ? 'Sending…' : 'Send login code via email'}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="SMS integration coming soon">
                                        <span>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Sms />}
                                                fullWidth
                                                disabled
                                            >
                                                Send login code via SMS
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Stack>
                            </>
                        )}
                    </Grid>

                    {/* Right column — Panels, Sections & Heats */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        {isLoading ? renderSkeleton() : (
                            <>
                                <Typography variant="overline" color="text.secondary">
                                    Panels &amp; Heats
                                </Typography>

                                {!detail?.panels_adjudicators?.length ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        No panels assigned
                                    </Typography>
                                ) : (
                                    <Stack spacing={1} mt={1}>
                                        {detail.panels_adjudicators.map((pa) => {
                                            const heats = pa.panel.heat ?? [];

                                            const uniqueSections = Array.from(
                                                new Map(
                                                    heats
                                                        .filter((h) => h.section)
                                                        .map((h) => [h.section!.uid, h.section!])
                                                ).values()
                                            );

                                            return (
                                                <Card key={pa.panel.uid}>
                                                    <CardContent>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            {pa.panel.name}
                                                        </Typography>

                                                        {uniqueSections.length > 0 && (
                                                            <>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Sections
                                                                </Typography>
                                                                <Stack direction="row" flexWrap="wrap" mb={1}>
                                                                    {uniqueSections.map((section) => (
                                                                        <Chip
                                                                            key={section.uid}
                                                                            label={section.name}
                                                                            size="small"
                                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            </>
                                                        )}

                                                        {heats.length > 0 ? (
                                                            <>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Heats
                                                                </Typography>
                                                                <Stack direction="row" flexWrap="wrap">
                                                                    {heats.map((heat) => (
                                                                        <Chip
                                                                            key={heat.uid}
                                                                            label={`${heat.item_no} — ${heat.type.replace('_', ' ')}`}
                                                                            size="small"
                                                                            color={getHeatTypeColor(heat.type as any)}
                                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                No heats assigned
                                                            </Typography>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="inherit"
                    size="small"
                    onClick={() => onClose?.(undefined)}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdjudicatorDetailDialog;

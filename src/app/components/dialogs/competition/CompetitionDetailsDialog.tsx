import React, { useEffect } from 'react';
import { Controller, useForm } from "react-hook-form";
import { CompetitionDetailsFormSchema, CompetitionDetailsFormType } from "@/app/schemas/CompetitionDetailsForm";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    Grid,
    CircularProgress,
    TextField
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import CustomInput from "@/app/components/forms/CustomInput";
import dayjs from "@/app/utils/dayjs";
import { useMutation } from "@tanstack/react-query";
import { createCompetition, updateCompetition } from "@/app/server/competitions";
import { useSnackbar } from "notistack";
import { useRouter } from "next/navigation";
import { competition } from "@prisma/client";

type CompetitionDetailsProps = competition |undefined

const CompetitionDetailsDialog: React.FC<DialogProps<CompetitionDetailsProps>> = ({
    open,
    onClose,
    payload,
}) => {


    const {
        control,
        handleSubmit,
        formState:{ errors, isValid },
        reset,
        trigger,
    }=useForm<CompetitionDetailsFormType>({
        defaultValues:{
            name:'',
            date:dayjs().format(),
            venue:'',
            organizer_name:'',
            organizer_email:'',
            organization:'',
        },
        mode:'onChange',
        resolver:zodResolver(CompetitionDetailsFormSchema)
    })

    useEffect (() => {
        if(payload){
            reset({
                name:payload.name,
                date:dayjs(payload.date).format('YYYY-MM-DD'),
                venue:String(payload.venue),
                organizer_name:String(payload.organizer_name),
                organizer_email:String(payload.organizer_email),
                organization:String(payload.organization),
                uid:payload.uid
            });
            trigger();
        }
    }, [ payload ]);

    const onExit = ()=>{
        onClose();
    }

    const router = useRouter()

    const { enqueueSnackbar }=useSnackbar()

    const {
        mutate,
        isPending
    }=useMutation({
        mutationFn:async(data:CompetitionDetailsFormType)=>payload? updateCompetition(data):createCompetition(data),
        mutationKey:[ 'create-competition', payload ],
        onSuccess:(data)=>{
            if(data.data){
                enqueueSnackbar(`Competition ${payload?'update':'created'} successfully`, { variant:'success' })
                router.push(`/scrutineer/profile/${data.data.uid}`)
                onClose();
            }
        },
        onError:(error:Error)=>{
            console.log(`Error ${payload?'update':'created'} competition:`, error);
            enqueueSnackbar(`Error ${payload?'update':'created'} competition: `+error.message, { variant:'error' })
        }
    })

    const onSubmit = async(data:CompetitionDetailsFormType)=>{
        mutate(data);
    }

    return (
        <form id={'competitionDetailsForm'} onSubmit={handleSubmit(onSubmit)}>
            <Dialog
                open={open} fullWidth
                maxWidth={'md'}
            >
                <DialogTitle>Competition Details</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3}>
                        <Grid
                            size={{
                                xs:12,
                                md:8
                            }}
                            pt={2}
                        >
                            <Controller
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Competition Name'}
                                        error={!!errors.name}
                                        helperText={errors.name ? errors.name.message : ''}
                                        variant={'outlined'}
                                    />
                                )}
                                name={'name'}
                                control={control}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                                md:4
                            }}
                            pt={2}
                        >
                            <Controller
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Date'}
                                        inputType={'date'}
                                        error={!!errors.date}
                                        helperText={errors.date ? errors.date.message : ''}
                                        variant={'outlined'}
                                    />
                                )}
                                name={'date'}
                                control={control}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                            }}
                        >
                            <Controller
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Venue'}
                                        inputType={'text'}
                                        error={!!errors.venue}
                                        helperText={errors.venue ? errors.venue.message : ''}
                                        variant={'outlined'}
                                    />
                                )}
                                name={'venue'}
                                control={control}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                            }}
                        >
                            <Controller
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Organization'}
                                        inputType={'text'}
                                        error={!!errors.organization}
                                        helperText={errors.organization ? errors.organization.message : ''}
                                        variant={'outlined'}
                                    />
                                )}
                                name={'organization'}
                                control={control}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                                md:6
                            }}
                        >
                            <Controller
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Organizer Name'}
                                        inputType={'text'}
                                        error={!!errors.organizer_name}
                                        helperText={errors.organizer_name ? errors.organizer_name.message : ''}
                                        variant={'outlined'}
                                    />
                                )}
                                name={'organizer_name'}
                                control={control}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                                md:6
                            }}
                        >
                            <Controller
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Organizer Email'}
                                        inputType={'text'}
                                        error={!!errors.organizer_email}
                                        helperText={errors.organizer_email ? errors.organizer_email.message : ''}
                                        variant={'outlined'}
                                    />
                                )}
                                name={'organizer_email'}
                                control={control}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant={'contained'}
                        size={'small'}
                        color={'inherit'}
                        onClick={onExit}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="competitionDetailsForm"
                        disabled={!isValid || isPending}
                        variant={'contained'}
                        size={'small'}
                        color={'primary'}
                    >
                        {isPending ? <CircularProgress size={20} color={'inherit'}/> : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
}

export default CompetitionDetailsDialog;

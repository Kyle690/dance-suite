import React, { useEffect } from 'react';
import { Controller, useForm } from "react-hook-form";
import { SectionSchema, SectionSchemaType } from "@/app/schemas/SectionSchema";
import {
    CompetitiveType,
    SectionAgeGroup,
    SectionCategory,
    SectionEntryType,
    SectionLevel,
    sections
} from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Grid, Typography, Stack, Box } from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useParams } from "next/navigation";
import CustomInput from "@/app/components/forms/CustomInput";
import { startCase, toLower, values } from "lodash";
import { useMutation } from "@tanstack/react-query";
import { createSection, updateSection } from "@/app/server/competitions";
import { useSnackbar } from "notistack";

type SectionDialogProps = sections |undefined

const SectionDetailsDialog: React.FC<DialogProps<SectionDialogProps>> = ({
    open,
    onClose,
    payload,
}) => {

    const { competitionId }=useParams()

    const {
        control,
        handleSubmit,
        watch,
        reset,
        getValues,
        formState:{ isValid, errors }
    }=useForm<SectionSchemaType>({
        defaultValues:{
            name:'',
            competition_id:String(competitionId),
            age_group: SectionAgeGroup.JUNIOR,
            level: SectionLevel.BRONZE,
            category: SectionCategory.BALLROOM,
            custom_name:false,
            entry_type:SectionEntryType.COUPLE,
            competitive_type:CompetitiveType.COMPETITIVE
        },
        resolver:zodResolver(SectionSchema),
        mode:'onChange'
    })

    watch([ 'custom_name', 'age_group','level', 'category' ]);

    useEffect (() => {
        if(open && payload){
            reset(payload as SectionSchemaType);
        }
    }, [ payload, open ]);

    const { enqueueSnackbar }=useSnackbar()

    const {
        mutate,
        isPending,
    }=useMutation({
        mutationKey:[ 'section-details-mutation' ],
        mutationFn:async(data:SectionSchemaType)=>{
            return payload? updateSection(data):createSection(data);
        },
        onSuccess:(data)=>{
            if(data.data){
                enqueueSnackbar('Section saved successfully',{ variant:'success' })
                onExit();
                return;
            }
            console.log('Error saving section',data)
            enqueueSnackbar('Failed to save section',{ variant:'error' })
        },
        onError:(error)=>{
            console.log('Error saving section',error)
            enqueueSnackbar('Error saving section',{ variant:'error' })
        }
    })


    const onExit = ()=>{
        onClose?.();
        reset();
    }

    const onSubmit = async(data:SectionSchemaType) => {
        mutate(data)
    }

    return (
        <form id={'section-form'} onSubmit={handleSubmit(onSubmit)}>
            <Dialog
                open={open}
                fullWidth
                maxWidth={'md'}
            >
                <DialogTitle>
                    Section Details
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3}>
                        <Grid
                            size={12} pt={2}
                        >
                            <Stack
                                direction={'row'}
                                alignItems={'center'}
                                spacing={3}
                            >
                                {!getValues('custom_name')?(
                                    <Box
                                        display={'flex'}
                                        flex={0.9}
                                    >
                                        <CustomInput
                                            value={`${getValues('age_group')} ${getValues('level')} ${getValues('category')}` as any}
                                            disabled
                                            label={'Section Name'}
                                            fullWidth
                                            size={'small'}
                                            name={'name'}
                                            onChange={()=>{}}
                                        />
                                    </Box>
                                ):(
                                    <Box
                                        display={'flex'}
                                        flex={0.9}
                                    >
                                        <Controller
                                            render={({ field })=>(
                                                <CustomInput
                                                    {...field}
                                                    label={'Section Name'}
                                                    size={'small'}
                                                    fullWidth
                                                    error={!!errors.name}
                                                    helperText={errors.name?.message}
                                                    disabled={watch('custom_name') === false}
                                                    value={field.value as any}
                                                />
                                            )} name={'name'}
                                            control={control}
                                        />
                                    </Box>
                                )}
                                <Box
                                    display={'flex'}
                                    flex={0.3}
                                >
                                    <Controller
                                        render={({ field })=>(
                                            <CustomInput
                                                {...field}
                                                inputType={'checkbox'}
                                                label={'Use Custom Name'}
                                                size={'small'}
                                                checked={field.value as any}
                                                value={field.value as any}
                                            />
                                        )} name={'custom_name'}
                                        control={control}
                                    />
                                </Box>
                            </Stack>
                        </Grid>
                        {!getValues('custom_name') &&(
                            <React.Fragment>
                                <Grid
                                    size={{
                                        xs:12,
                                        md:4
                                    }}
                                >
                                    <Controller
                                        render={({ field })=>(
                                            <CustomInput
                                                {...field}
                                                inputType={'select'}
                                                label={'Age Group'}
                                                size={'small'}
                                                fullWidth
                                                options={values(SectionAgeGroup).map((age)=>({
                                                    label:startCase(toLower(age)),
                                                    value:age
                                                }))}
                                                value={field.value as any}
                                            />
                                        )}
                                        name={'age_group'}
                                        control={control}
                                    />
                                </Grid>
                                <Grid
                                    size={{
                                        xs:12,
                                        md:4
                                    }}
                                >
                                    <Controller
                                        render={({ field })=>(
                                            <CustomInput
                                                {...field}
                                                inputType={'select'}
                                                label={'Level'}
                                                size={'small'}
                                                fullWidth
                                                options={values(SectionLevel).map((age)=>({
                                                    label:startCase(toLower(age)),
                                                    value:age
                                                }))}
                                                value={field.value as any}
                                            />
                                        )}
                                        name={'level'}
                                        control={control}
                                    />
                                </Grid>
                                <Grid
                                    size={{
                                        xs:12,
                                        md:4
                                    }}
                                >
                                    <Controller
                                        render={({ field })=>(
                                            <CustomInput
                                                {...field}
                                                inputType={'select'}
                                                label={'Category'}
                                                size={'small'}
                                                fullWidth
                                                options={values(SectionCategory).map((age)=>({
                                                    label:startCase(toLower(age)),
                                                    value:age
                                                }))}
                                                value={field.value as any}
                                            />
                                        )}
                                        name={'category'}
                                        control={control}
                                    />
                                </Grid>
                            </React.Fragment>
                        )}
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
                                        inputType={'select'}
                                        label={'Competitive Type'}
                                        size={'small'}
                                        fullWidth
                                        options={values(CompetitiveType).map((age)=>({
                                            label:startCase(toLower(age)),
                                            value:age
                                        }))}
                                        value={field.value as any}
                                    />
                                )}
                                name={'competitive_type'}
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
                                        inputType={'select'}
                                        label={'Entry Type'}
                                        size={'small'}
                                        fullWidth
                                        options={values(SectionEntryType).map((age)=>({
                                            label:startCase(toLower(age)),
                                            value:age
                                        }))}
                                        value={field.value as any}
                                    />
                                )}
                                name={'entry_type'}
                                control={control}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={onExit}
                        size={'small'}
                        color={'inherit'}
                        variant={'contained'}
                    >
                        Cancel
                    </Button>
                    <Button
                        size={'small'}
                        color={'primary'}
                        variant={'contained'}
                        type={'submit'}
                        form={'section-form'}
                        disabled={!isValid}
                    >
                        {isPending? <CircularProgress size={20} color={'inherit'}/>:'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
}

export default SectionDetailsDialog;

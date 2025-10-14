import React, { useEffect } from 'react';
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Grid, Typography, CircularProgress } from '@mui/material';
import {
    DancerSchema,
    DancerSchemaType,
} from "@/app/schemas/SectionSchema";
import CustomInput from "@/app/components/forms/CustomInput";
import { grey } from "@mui/material/colors";
import { useMutation } from "@tanstack/react-query";
import { createDancer } from "@/app/server/competitions";
import { useSnackbar } from "notistack";

type AddDancerProps = {
    dancers:DancerSchemaType[],
    sectionId:string,
    refetch:()=>void
}

const AddDancer: React.FC<AddDancerProps> = ({
    dancers,
    sectionId,
    refetch
}) => {

    const {
        control,
        handleSubmit,
        setError,
        formState:{ isValid, errors },
        reset
    }=useForm<DancerSchemaType>({
        defaultValues:{
            number:'',
            name:'',
            partner_name:'',
            studio:'',
            region:'',
            country:'',
            section_id: sectionId
        },
        mode:'onChange',
        resolver:zodResolver(DancerSchema)
    })

    const { enqueueSnackbar }=useSnackbar()

    const {
        mutate,
        isPending
    }=useMutation({
        mutationKey:[ 'add-dancer', sectionId ],
        mutationFn:async(data:DancerSchemaType)=>{
            return createDancer(data);
        },
        onSuccess:(data)=>{
            if(data?.data){
                enqueueSnackbar('Dancer added successfully',{ variant:'success' })
                reset();
                refetch();
                return;
            }
            enqueueSnackbar('Failed to add dancer',{ variant:'error' })
        },
        onError:(error)=>{
            enqueueSnackbar('Error Adding dancer',{ variant:'error' })
        }
    })

    const onSubmit = (data:DancerSchemaType)=>{
        if(dancers?.find((d)=>d.number===data?.number)){
            setError('number',{
                type:'custom',
                message:'Dancer number must be unique'
            })
            return;
        }
        mutate(data);
    }

    return (
        <form id={'add-dancer-form'} onSubmit={handleSubmit(onSubmit)}>
            <Grid
                container
                spacing={2}
                sx={{
                    px:3,
                    py:2,
                    border:`1px solid ${grey[300]}`,
                    borderRadius:4,
                    mt:4
                }}
            >
                <Grid size={12}>
                    <Typography variant={'h6'}>
                        New Dancer
                    </Typography>
                </Grid>
                <Grid
                    size={{
                        xs:12,
                        md:1
                    }}
                >
                    <Controller
                        render={({ field })=>(
                            <CustomInput
                                {...field}
                                label={'Number'}
                                fullWidth
                                value={field.value as any}
                                required
                                size={'small'}
                                error={!!errors.number}
                                helperText={errors.number?.message}
                            />
                        )} name={'number'}
                        control={control}
                    />
                </Grid>
                <Grid
                    size={{
                        xs:12,
                        md:2
                    }}
                >
                    <Controller
                        render={({ field })=>(
                            <CustomInput
                                {...field}
                                label={'Name'}
                                fullWidth
                                value={field.value as any}
                                size={'small'}
                                error={!!errors.name}
                                helperText={errors.name?.message}
                            />
                        )} name={'name'}
                        control={control}
                    />
                </Grid>
                <Grid
                    size={{
                        xs:12,
                        md:2
                    }}
                >
                    <Controller
                        render={({ field })=>(
                            <CustomInput
                                {...field}
                                label={'Partner Name'}
                                fullWidth
                                value={field.value as any}
                                size={'small'}
                                error={!!errors.partner_name}
                                helperText={errors.partner_name?.message}
                            />
                        )} name={'partner_name'}
                        control={control}
                    />
                </Grid>
                <Grid
                    size={{
                        xs:12,
                        md:2
                    }}
                >
                    <Controller
                        render={({ field })=>(
                            <CustomInput
                                {...field}
                                label={'Studio'}
                                fullWidth
                                value={field.value as any}
                                size={'small'}
                                error={!!errors.studio}
                                helperText={errors.studio?.message}
                            />
                        )} name={'studio'}
                        control={control}
                    />
                </Grid>
                <Grid
                    size={{
                        xs:12,
                        md:2
                    }}
                >
                    <Controller
                        render={({ field })=>(
                            <CustomInput
                                {...field}
                                label={'Region'}
                                fullWidth
                                value={field.value as any}
                                size={'small'}
                                error={!!errors.region}
                                helperText={errors.region?.message}
                            />
                        )} name={'region'}
                        control={control}
                    />
                </Grid>
                <Grid
                    size={{
                        xs:12,
                        md:2
                    }}
                >
                    <Controller
                        render={({ field })=>(
                            <CustomInput
                                {...field}
                                label={'Country'}
                                fullWidth
                                value={field.value as any}
                                size={'small'}
                                error={!!errors.country}
                                helperText={errors.country?.message}
                            />
                        )} name={'country'}
                        control={control}
                    />
                </Grid>
                <Grid
                    size={{
                        xs:12,
                        md:1
                    }}
                >
                    <Button
                        variant={'contained'}
                        fullWidth
                        type={'submit'}
                        form={'add-dancer-form'}
                        disabled={!isValid || isPending}
                    >
                        {isPending ? <CircularProgress size={20} color={'inherit'}/>:'Submit'}
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
}

export default AddDancer;

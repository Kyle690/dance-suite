import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    CircularProgress,
    Grid,
    Stack,
    Typography,
    Chip, Tooltip
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { Controller, useForm } from "react-hook-form";
import { SectionHeatSchema, SectionHeatSchemaType } from "@/app/schemas/SectionSchema";
import { HeatStatus, HeatType } from "@prisma/client";
import CustomInput from "@/app/components/forms/CustomInput";
import { values, startCase, toLower, get } from "lodash";
import { grey } from "@mui/material/colors";
import { DANCES, SPECIAL_DANCES } from "@/app/constants/dances";
import { InfoOutlined }from '@mui/icons-material'
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHeat, updateHeat } from "@/app/server/competitions";
import { useParams } from "next/navigation";
import { usePanels } from "@/app/hooks/usePanels";
import { zodResolver } from "@hookform/resolvers/zod";

type HeatDialogProps = Partial<SectionHeatSchemaType>

const HeatDialog: React.FC<DialogProps<HeatDialogProps>> = ({
    open,
    onClose,
    payload,
}) => {

    const { competitionId }=useParams()

    const {
        panels,
        panelsLoading,
    }=usePanels(String(competitionId))

    const {
        control,
        handleSubmit,
        formState:{ errors,isValid },
        reset,
        getValues,
        setValue,
        trigger,
        watch
    }=useForm<SectionHeatSchemaType>({
        defaultValues:{
            item_no:'',
            section_id: payload?.section_id || '',
            type:HeatType.ROUND,
            callback_limit:0,
            panel_id:'',
            dances:[],
            status:HeatStatus.DRAFT,
            order:0,
        },
        resolver:zodResolver(SectionHeatSchema),
        mode:'onChange',
    })

    useEffect (() => {
        if(open && payload?.uid){
            reset(payload);
        }
    }, [ payload,open ]);

    watch([ 'type' ])

    const [ otherDance, setOtherDance ]=useState<string>('');

    const onExit= ()=>{
        onClose?.()
        reset();
    }

    const onDance=(dance:string)=>{
        const dances = getValues('dances') || [];
        if(dances.includes(dance)){
            setValue('dances', dances.filter((d)=>d!==dance));
        }else{
            setValue('dances', [ ...dances, dance ]);
        }
        trigger('dances');
    }

    const {
        enqueueSnackbar
    }=useSnackbar();

    const queryClient = useQueryClient()

    const {
        mutate,
        isPending
    }=useMutation({
        mutationKey:[ 'section-heat',payload?.section_id, payload?.uid ],
        mutationFn:async(data:SectionHeatSchemaType)=>payload?.uid? updateHeat(data):createHeat(data),
        onSuccess:async(data)=>{
            if(data.data){
                enqueueSnackbar('Heat saved',{ variant:'success' })
                await queryClient.invalidateQueries({ queryKey:[ 'section-heats', payload?.section_id ] });
                onExit();
                return;
            }
            enqueueSnackbar('Failed to save heat',{ variant:'error' })
            console.log('Failed to save heat', data);
        },
        onError:(error)=>{
            enqueueSnackbar('Error saving heat',{ variant:'error' });
            console.log('Error saving heat', error);
        }
    })

    const onSubmit=async(data:SectionHeatSchemaType)=>{
        mutate(data);
    }



    return (
        <form id={'heat-dialog-form'} onSubmit={handleSubmit(onSubmit)}>
            <Dialog
                open={open}
                fullWidth
                maxWidth={'md'}
            >
                <DialogTitle>
                    Heat
                </DialogTitle>
                <DialogContent>
                    <Grid
                        container spacing={3}
                        pt={2}
                    >
                        <Grid
                            size={{
                                xs:6,
                                md:4
                            }}
                        >
                            <Controller
                                name={'item_no'}
                                control={control}
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Item No'}
                                        error={!!errors.item_no}
                                        helperText={errors.item_no?.message}
                                        size={'small'}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:6,
                                md:4
                            }}
                        >
                            <Controller
                                name={'panel_id'}
                                control={control}
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Panel'}
                                        error={!!errors.panel_id}
                                        helperText={errors.panel_id?.message}
                                        size={'small'}
                                        inputType={'select'}
                                        fullWidth
                                        disabled={panelsLoading}
                                        options={panels?.map((panel)=>( {
                                            label:panel.panels_adjudicators.map((panelAdjudicator)=>panelAdjudicator.adjudicator.letter).join(', '),
                                            value:panel.uid
                                        })) || []}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:6,
                                md:4
                            }}
                        >
                            <Controller
                                name={'status'}
                                control={control}
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Status'}
                                        error={!!errors.status}
                                        helperText={errors.status?.message}
                                        inputType={'select'}
                                        fullWidth
                                        options={values(HeatStatus).map((status)=>( { label:startCase(toLower(status)), value:status } ))}
                                        size={'small'}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:6,
                                md:4
                            }}
                        >
                            <Controller
                                name={'type'}
                                control={control}
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        value={field.value as any}
                                        label={'Type'}
                                        error={!!errors.type}
                                        helperText={errors.type?.message}
                                        inputType={'select'}
                                        fullWidth
                                        options={values(HeatType).map((type)=>( { label:startCase(toLower(type)), value:type } ))}
                                        size={'small'}
                                    />
                                )}
                            />
                        </Grid>
                        {getValues('type')!==HeatType.FINAL && getValues('type')!==HeatType.UNCONTESTED && (
                            <Grid
                                size={{
                                    xs:6,
                                    md:4
                                }}
                            >
                                <Controller
                                    name={'callback_limit'}
                                    control={control}
                                    render={({ field })=>(
                                        <CustomInput
                                            {...field}
                                            value={field.value as any}
                                            label={'Callback No.'}
                                            error={!!errors.callback_limit}
                                            helperText={errors.callback_limit?.message}
                                            size={'small'}
                                            onChange={(e)=>{
                                                const val=parseInt(get(e,'target.value','0') as string);
                                                if(!isNaN(val)){
                                                    field.onChange(val)
                                                }else{
                                                    field.onChange(0)
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        )}
                        <Grid
                            size={12}
                            sx={{
                                border:`1px solid ${grey[500]}`,
                                borderRadius:4,
                                p:4
                            }}
                        >
                            <Typography variant={'h6'} mb={2}>
                                Dances
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid
                                    size={12}
                                >
                                    <Stack
                                        direction={'row'} alignItems={'center'}
                                        spacing={2}
                                        mb={2}
                                    >
                                        {getValues('dances').map((dance)=>{
                                            return (
                                                <Chip
                                                    title={'dance'}
                                                    onDelete={()=>onDance(dance)}
                                                    key={dance}
                                                    label={dance}
                                                    color={'default'}
                                                />
                                            )
                                        })}
                                    </Stack>
                                </Grid>
                                {DANCES?.map((danceGroup, index)=>(
                                    <Grid
                                        key={index}
                                        size={{
                                            xs:6,
                                            md:3
                                        }}
                                    >
                                        <Stack
                                            spacing={1}
                                        >
                                            {danceGroup.map((dance)=>(
                                                <Button
                                                    size={'small'}
                                                    key={dance}
                                                    variant={getValues('dances')?.includes(dance)?'contained':'outlined'}
                                                    onClick={()=>onDance(dance)}
                                                >
                                                    {dance}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Grid>
                                ))}
                                <Grid
                                    size={{
                                        xs:6,
                                        md:3
                                    }}
                                    sx={{
                                        border:`1px solid ${grey[500]}`,
                                        borderRadius:4,
                                        p:2
                                    }}
                                >
                                    <Stack>
                                        <Stack
                                            direction={'row'}
                                            spacing={1}
                                            alignItems={'center'}
                                            mb={2}
                                        >
                                            <Typography fontSize={15}>
                                                Special Dances
                                            </Typography>
                                            <Tooltip
                                                title={'TCIS sections are marked on a principle of 4 categories out 10, the scores are then added and places awarded from highest to lowest\n' +
                                                    'In contested round type, the places are scrutineered the traditional way\n' +
                                                    'In uncontested round type a percentage is given to each dancer.'}
                                            >
                                                <InfoOutlined />
                                            </Tooltip>
                                        </Stack>
                                        <Stack
                                            spacing={1}
                                        >
                                            {SPECIAL_DANCES.map((dance)=>(
                                                <Button
                                                    size={'small'}
                                                    key={dance}
                                                    variant={getValues('dances')?.includes(dance)?'contained':'outlined'}
                                                    onClick={()=>onDance(dance)}
                                                >
                                                    {dance}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid
                                    size={12}
                                >
                                    <Stack
                                        spacing={2}
                                        direction={'row'}
                                        alignItems={'center'}
                                        justifyContent={'space-between'}
                                    >
                                        <CustomInput
                                            value={otherDance as any}
                                            onChange={(e)=>
                                                setOtherDance(String(get(e,'target.value','')))}
                                            label={'Other'}
                                            name={'other'}
                                            size={'small'}
                                            sx={{
                                                flex:0.7
                                            }}
                                        />
                                        <Button
                                            size={'small'}
                                            disabled={otherDance.trim().length===0}
                                            variant={'contained'}
                                            fullWidth
                                            onClick={()=>{
                                                onDance(otherDance.trim());
                                                setOtherDance('');
                                            }}
                                            sx={{
                                                flex:0.3
                                            }}
                                        >
                                            Add Dance
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        size={'small'}
                        color={'inherit'}
                        variant={'contained'}
                        onClick={onExit}
                    >
                        Cancel
                    </Button>
                    <Button
                        size={'small'}
                        color={'primary'}
                        variant={'contained'}
                        type={'submit'}
                        form={'heat-dialog-form'}
                        disabled={!isValid || isPending}
                    >
                        {isPending ? <CircularProgress size={20} color={'inherit'}/>:'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
}

export default HeatDialog;

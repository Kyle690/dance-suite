import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogActions, DialogContent, Button, CircularProgress, Grid, Stack, IconButton } from "@mui/material";
import { DialogProps, useDialogs } from "@toolpad/core";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { CompetitionAdjudicatorsSchema, CompetitionAdjudicatorsType } from "@/app/schemas/CompetitionAdjudicatorsSchema";
import { flattenDeep, get } from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomInput from "@/app/components/forms/CustomInput";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { updateAdjudicators } from "@/app/server/competitions";
import AdjudicatorDetailDialog from "@/app/components/dialogs/competition/AdjudicatorDetailDialog";
import { InfoOutlined } from "@mui/icons-material";


const letters = [
    [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M' ],
    [ 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ]
]

const AdjudicatorsDialog: React.FC<DialogProps<CompetitionAdjudicatorsType|undefined>> = ({
    open,
    onClose,
    payload,
}) => {

    const { competitionId } = useParams()
    const dialogs = useDialogs();

    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isSubmitting, isDirty },
        reset,
        watch,
        setValue,
        getValues,
    }=useForm<CompetitionAdjudicatorsType>({
        defaultValues:{
            competitionId:String(competitionId),
            adjudicators: flattenDeep(letters).map((letter)=>({
                name:'',
                letter,
            }))
        },
        mode:'onChange',
        resolver:zodResolver(CompetitionAdjudicatorsSchema)
    })

    watch([ 'adjudicators' ]);

    useEffect (() => {
        if(open && payload?.adjudicators?.length){
            reset(payload);
        }
    }, [ open, payload ]);

    const {
        fields,
    }=useFieldArray({
        name:'adjudicators',
        control,
    })


    const onExit = ()=>{
        onClose?.()
    }

    const { enqueueSnackbar }=useSnackbar();
    const client = useQueryClient();
    const {
        mutate,
        isPending,
    }=useMutation({
        mutationKey:[ 'update-adjudicators', competitionId ],
        mutationFn:(data:CompetitionAdjudicatorsType)=>updateAdjudicators(data),
        onError:(err)=>{
            console.log('error updating adjudicators', err);
            enqueueSnackbar('Error updating adjudicators', { variant: 'error' });
        },
        onSuccess:async(data)=>{
            if(data.data){
                enqueueSnackbar('Adjudicators updated', { variant: 'success' });
                await client.invalidateQueries({
                    queryKey: [
                        'competition_adjudicators',
                        String(competitionId)
                    ]
                })
                onExit()
            }else{
                enqueueSnackbar('Error updating adjudicators', { variant: 'error' });
            }
        }
    })

    const onSubmit = async(data:CompetitionAdjudicatorsType)=>{
        mutate(data);
    }

    const firstLetters = fields?.filter((_,i)=>i<13);
    const secondLetters = fields?.filter((_,i)=>i>=13);

    return (
        <form id={'adjudicators-panel-form'} onSubmit={handleSubmit(onSubmit)}>
            <Dialog
                open={open} maxWidth={'lg'}
                fullWidth
            >
                <DialogTitle>
                    Adjudicators
                </DialogTitle>
                <DialogContent>
                    <Grid
                        container
                        spacing={2}
                        pt={2}
                    >
                        <Grid
                            size={{
                                xs:12,
                                md:6
                            }}
                        >
                            <Stack spacing={2}>
                                {firstLetters?.map((letter, index)=>(
                                    <Stack key={letter.letter} direction="row" spacing={1} alignItems="center">
                                        <Controller
                                            render={({ field })=>(
                                                <CustomInput
                                                    {...field}
                                                    label={letter.letter}
                                                    value={field.value as any}
                                                    error={Boolean(errors?.adjudicators && errors?.adjudicators[index])}
                                                    helperText={errors?.adjudicators && errors?.adjudicators[index]?.name?.message}
                                                    onChange={field.onChange}
                                                    size={'small'}
                                                    sx={{ flex: 1 }}
                                                />
                                            )}
                                            name={`adjudicators.${index}.name`}
                                            control={control}
                                        />
                                        {fields[index]?.uid && (
                                            <IconButton
                                                size="small"
                                                onClick={async () => {
                                                    await dialogs.open(AdjudicatorDetailDialog, fields[index] as any);
                                                }}
                                            >
                                                <InfoOutlined fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Stack>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                                md:6
                            }}
                        >
                            <Stack spacing={2}>
                                {secondLetters?.map((letter, index)=>(
                                    <Stack key={letter.letter} direction="row" spacing={1} alignItems="center">
                                        <Controller
                                            render={({ field })=>(
                                                <CustomInput
                                                    {...field}
                                                    label={letter.letter}
                                                    value={field.value as any}
                                                    error={Boolean(errors?.adjudicators && errors?.adjudicators[index+13])}
                                                    helperText={errors?.adjudicators && errors?.adjudicators[index+13]?.name?.message}
                                                    onChange={field.onChange}
                                                    size={'small'}
                                                    sx={{ flex: 1 }}
                                                />
                                            )}
                                            name={`adjudicators.${index+13}.name`}
                                            control={control}
                                        />
                                        {fields[index+13]?.uid && (
                                            <IconButton
                                                size="small"
                                                onClick={async () => {
                                                    await dialogs.open(AdjudicatorDetailDialog, fields[index+13] as any);
                                                }}
                                            >
                                                <InfoOutlined fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Stack>
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        size={'small'}
                        onClick={onExit}
                        color={'inherit'}
                        variant={'contained'}
                    >
                        Cancel
                    </Button>
                    <Button
                        size={'small'}
                        type={'submit'}
                        variant={'contained'}
                        color={'primary'}
                        form={'adjudicators-panel-form'}
                        disabled={!isValid || isPending}
                    >
                        {isPending ? <CircularProgress size={20} color={'inherit'}/> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
}

export default AdjudicatorsDialog;

import React from 'react';
import { Dialog, DialogTitle, DialogActions, DialogContent, Button, CircularProgress, Grid, Stack } from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { CompetitionAdjudicatorsSchema, CompetitionAdjudicatorsType } from "@/app/schemas/CompetitionAdjudicatorsSchema";
import { flattenDeep } from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomInput from "@/app/components/forms/CustomInput";
import { useField } from "@mui/x-date-pickers/internals";

type AdjudicatorsPanelProps = {}

const letters = [
    [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M' ],
    [ 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ]
]

const AdjudicatorsDialog: React.FC<DialogProps> = ({
    open,
    onClose,
}) => {


    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isSubmitting, isDirty },
        reset,
        watch,
        setValue,
    }=useForm<CompetitionAdjudicatorsType>({
        defaultValues:{
            competitionId:'',
            adjudicators: flattenDeep(letters).map((letter)=>({
                name:'',
                letter,
            }))
        },
        mode:'onChange',
        resolver:zodResolver(CompetitionAdjudicatorsSchema)
    })

    watch([ 'adjudicators' ]);

    const {
        fields,
        update,
    }=useFieldArray({
        name:'adjudicators',
        control,
    })



    const onExit = ()=>{
        onClose?.()
    }

    const firstLetters = fields.splice(0,13);
    const secondLetters = fields

    return (
        <form id={'adjudicators-panel-form'}>
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
                    >
                        <Grid
                            size={{
                                xs:12,
                                md:6
                            }}
                        >
                            <Stack spacing={2}>
                                {firstLetters?.map((letter, index)=>(
                                    <Controller
                                        render={({ field })=>(
                                            <CustomInput
                                                {...field}
                                                label={letter.letter}
                                                value={field.value as any}
                                                error={Boolean(errors?.adjudicators && errors?.adjudicators[index])}
                                                helperText={errors?.adjudicators && errors?.adjudicators[index]?.name?.message}
                                                onChange={(e)=>{
                                                    update(index, {
                                                        ...fields[index],
                                                        name:e.target.value,
                                                    })
                                                }}
                                                size={'small'}
                                            />
                                        )}
                                        name={letter.letter}
                                        control={control}
                                    />
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
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
}

export default AdjudicatorsDialog;

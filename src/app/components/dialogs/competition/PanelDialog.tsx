import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Typography,
    Box,
    Grid,
    ListItemButton,
    List,
    ListItemAvatar,
    ListItemText, Avatar
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { useParams } from "next/navigation";
import { useAdjudicators } from "@/app/hooks/useAdjudicators";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { PanelSchema, PanelSchemaType } from "@/app/schemas/PanelSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomInput from "@/app/components/forms/CustomInput";
import { grey } from "@mui/material/colors";
import { sortBy } from "lodash";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPanel, updatePanel } from "@/app/server/competitions";


type PanelDialogProps = PanelSchemaType|undefined

const PanelDialog: React.FC<DialogProps<PanelDialogProps>> = ({
    open,
    onClose,
    payload
}) => {


    const { competitionId }=useParams()

    const {
        data:adjudicators,
        isLoading:adjudicatorsLoading
    }=useAdjudicators(String(competitionId));

    const {
        control,
        handleSubmit,
        formState:{ errors, isValid },
        watch,
        setValue,
        reset,
        trigger
    }=useForm<PanelSchemaType>({
        defaultValues:{
            competitionId: String(competitionId),
            name:'',
            adjudicators:[]
        },
        mode:'onChange',
        resolver:zodResolver(PanelSchema)
    })
    watch([ 'adjudicators' ])

    useEffect (() => {
        console.log('payload', payload);
        if(open && payload){
            reset(payload);
            trigger()
        }
    }, [ open, payload ]);
    console.log('errors',errors);

    const {
        fields,
        append,
        remove,
    }=useFieldArray({
        control,
        name:'adjudicators'
    })



    const onExit = ()=>{
        onClose?.(undefined);
    }

    const { enqueueSnackbar }=useSnackbar()
    const queryClient =useQueryClient();
    const {
        mutate,
        isPending,
    }=useMutation({
        mutationKey:[ 'panel', payload ],
        mutationFn:async(panel:PanelSchemaType)=>payload?updatePanel(panel):createPanel(panel),
        onSuccess:(data)=>{
            if(data.data){
                enqueueSnackbar(`Panel ${payload?'updated':'created'}`,{ variant:'success' })
                onClose?.()
                queryClient.invalidateQueries({
                    queryKey:[ 'competition_panels',competitionId ]
                })
                return;
            }
            enqueueSnackbar('Error saving panel',{ variant:'error' })
        },
        onError:(error)=>{
            console.log('Error updating panel',error)
            enqueueSnackbar('Error updating panel',{ variant:'error' })
        }
    })

    const onSubmit = (data:PanelSchemaType)=>mutate(data);

    return (
        <form id={'panel-dialog-form'} onSubmit={handleSubmit(onSubmit)}>
            <Dialog
                open={open}
                fullWidth
                maxWidth={'md'}
            >
                <DialogTitle>
                    Panel
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={4}>
                        <Grid
                            size={12}
                            pt={2}
                        >
                            <Controller
                                render={({ field })=>(
                                    <CustomInput
                                        {...field}
                                        label={'Panel Name (Optional)'}
                                        placeholder={''}
                                        value={field.value as any}
                                    />
                                )} name={'name'}
                                control={control}
                            />
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                                md:6
                            }}
                            sx={{
                                border:`1px solid ${grey[500]}`,
                                borderRadius:2,
                                height:400,
                                overflow:'auto'
                            }}
                        >
                            <Typography p={2}>
                                Adjudicators (Click to add/remove)
                            </Typography>
                            <List>
                                {adjudicators?.adjudicators?.map((adjudicator)=>(
                                    <ListItemButton
                                        key={adjudicator.uid}
                                        selected={!!fields.find((a)=>a.uid === adjudicator.uid)}
                                        onClick={()=>{
                                            if(!!fields.find((a)=>a.uid === adjudicator.uid)){
                                                const index = fields.findIndex((a)=>a.uid === adjudicator.uid);
                                                remove(index);
                                            }else{
                                                append({
                                                    uid:adjudicator.uid,
                                                    name:adjudicator.name,
                                                    letter:adjudicator.letter
                                                });
                                            }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar>
                                                {adjudicator.letter}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText>
                                            {adjudicator.name}
                                        </ListItemText>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Grid>
                        <Grid
                            size={{
                                xs:12,
                                md:6
                            }}
                        >
                            <Box
                                sx={{
                                    border:`1px solid ${grey[500]}`,
                                    borderRadius:2,
                                    height:400,
                                    overflow:'auto'
                                }}
                            >
                                <Typography
                                    p={2}
                                >
                                    Selected Adjudicators (Click to add/remove)
                                </Typography>
                                <List>
                                    {sortBy(fields,'letter')?.map((adjudicator)=>(
                                        <ListItemButton
                                            key={adjudicator.uid}
                                            selected={!!fields.find((a)=>a.uid === adjudicator.uid)}
                                            onClick={()=>{
                                                if(!!fields.find((a)=>a.uid === adjudicator.uid)){
                                                    const index = fields.findIndex((a)=>a.uid === adjudicator.uid);
                                                    remove(index);
                                                }else{
                                                    append({
                                                        uid:adjudicator.uid,
                                                        name:adjudicator.name,
                                                        letter:adjudicator.letter
                                                    });
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar>
                                                    {adjudicator.letter}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText>
                                                {adjudicator.name}
                                            </ListItemText>
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Box>
                            {Boolean(errors.adjudicators) && (
                                <Typography color={'error'}>
                                    {errors?.adjudicators?.message}
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        size={'small'}
                        variant={'contained'}
                        color={'inherit'}
                        onClick={onExit}
                    >
                        Cancel
                    </Button>
                    <Button
                        size={'small'}
                        variant={'contained'}
                        color={'primary'}
                        type={'submit'}
                        form={'panel-dialog-form'}
                        disabled={!isValid}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
}

export default PanelDialog;

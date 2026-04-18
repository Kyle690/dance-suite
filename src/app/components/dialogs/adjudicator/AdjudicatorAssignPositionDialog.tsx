import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Stack,
    Typography
} from "@mui/material";
import { DialogProps } from "@toolpad/core";
import { Close } from "@mui/icons-material";

type AdjudicatorAssignPositionDialogType = {
    positions:{
        allPositions:number[],
        available:number[]
    };
    title:string;
    subtitle:string;
    dancerId:string;
    dancerNumber:string;
};
const AdjudicatorAssignPositionDialog: React.FC<DialogProps<AdjudicatorAssignPositionDialogType, {dancerId:string, mark:number} |null>> = ({
    open,
    onClose,
    payload
}) => {

    const onExit =()=>{
        onClose(null);
    }

    return (
        <Dialog
            open={open}
        >
            <DialogTitle>
                <Stack
                    direction={'row'}
                    justifyContent={'space-between'}
                >
                    <Stack>
                        <Typography variant={'h6'}>{payload.title}</Typography>
                        <Typography variant={'caption'}>{payload.subtitle}</Typography>
                    </Stack>
                    <IconButton
                        size={'small'}
                        onClick={onExit}
                    >
                        <Close/>
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3}>
                    <Typography variant={'body1'}>Select a mark to assign to the dancer: <span style={{ fontWeight:'bold' }}>{payload.dancerNumber}</span></Typography>
                    <Grid container spacing={2}>
                        {payload.positions.allPositions.map((position, index)=>(
                            <Grid
                                key={index}
                                size={4}
                            >
                                <Button
                                    onClick={()=>{
                                        onClose({
                                            dancerId:payload.dancerId,
                                            mark: position,
                                        })
                                    }}
                                    variant={'contained'}
                                    disabled={!payload.positions.available.includes(position)}
                                    color={'primary'}
                                    sx={{
                                        width:'100%',
                                        height:50,
                                    }}
                                >
                                    {position}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default AdjudicatorAssignPositionDialog;

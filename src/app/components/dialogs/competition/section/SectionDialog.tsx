import React, { useState } from 'react';
import { DialogProps } from "@toolpad/core";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Stack,
    Typography,
    IconButton,
    Tabs,
    Tab,
    Box,
    TableRow, Table, TableBody, CircularProgress
} from "@mui/material";
import { sections } from "@prisma/client";
import { Close } from "@mui/icons-material";
import SectionDancers from "@/app/components/dialogs/competition/section/_components/SectionDancers";
import { grey } from "@mui/material/colors";
import SectionDetails from "@/app/components/dialogs/competition/section/_components/SectionDetails";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getCompetitionSection } from "@/app/server/competitions";

type SectionDialogProps = {}

const SectionDialog: React.FC<DialogProps<sections>> = ({
    open,
    onClose,
    payload
}) => {

    const [ activeTab, setActiveTab ]=useState(0);

    const {
        data,
        isLoading,
        refetch,
    }=useQuery({
        queryKey:[ 'competition-section', payload?.uid ],
        queryFn:async()=>{
            if(!payload.uid)return null;
            const res = await getCompetitionSection({ uid:String(payload.uid) });
            if(res.data){
                return res.data as sections;
            }
            return null;
        }
    })

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth={'lg'}
        >
            <DialogTitle>
                <Stack
                    direction={'row'}
                    justifyContent={'space-between'}
                >
                    <Typography
                        variant={'h5'}
                    >
                        {payload?.name}
                    </Typography>
                    <IconButton
                        onClick={()=>onClose()}
                    >
                        <Close/>
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent
                sx={{
                    height:700
                }}
            >
                {isLoading ? (
                    <Box
                        display={'flex'}
                        alignItems={'center'}
                        justifyContent={'center'}
                    >
                        <CircularProgress
                            size={'large'}
                        />
                    </Box>
                ):(
                    <React.Fragment>
                        <Tabs
                            value={activeTab}
                            onChange={(_,newValue)=>setActiveTab(newValue)}
                        >
                            <Tab label={'Details'}/>
                            <Tab label={'Dancers'}/>
                            <Tab label={'Heats'}/>
                        </Tabs>
                        {activeTab===0 && (
                            <SectionDetails data={data as sections}/>
                        )}
                        {activeTab===1 && (
                            <SectionDancers sectionId={payload?.uid}/>
                        )}
                    </React.Fragment>
                )}

            </DialogContent>
        </Dialog>
    );
}

export default SectionDialog;

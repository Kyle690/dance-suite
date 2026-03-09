import React, { useMemo, useState } from 'react';
import { DialogProps, useDialogs } from "@toolpad/core";
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
import { AddCircle, Close,  Edit, ImportExport } from "@mui/icons-material";
import SectionDancers from "@/app/components/dialogs/competition/section/_components/SectionDancers";
import { grey } from "@mui/material/colors";
import SectionDetails from "@/app/components/dialogs/competition/section/_components/SectionDetails";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getCompetitionSection } from "@/app/server/competitions";
import SectionHeats from "@/app/components/dialogs/competition/section/_components/SectionHeats";
import MenuButtons, { MenuButtonsProps } from "@/app/components/layout/MenuButtons";
import SectionDetailsDialog from "@/app/components/dialogs/competition/SectionDetailsDialog";
import HeatDialog from "@/app/components/dialogs/competition/section/HeatDialog";
import { startCase, toLower } from "lodash";

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

    const dialogs = useDialogs()

    const activeButtons: MenuButtonsProps['buttons'] = useMemo(()=>{
        if(activeTab===0){
            return [
                {
                    label: 'Edit',
                    icon: <Edit color={'primary'}/>,
                    color: 'primary',
                    onClick:async()=>{
                        await dialogs.open(SectionDetailsDialog,data as sections );
                        refetch();
                    }
                }
            ]
        }
        if(activeTab===1){
            return [
                {
                    label:'Add Dancer',
                    icon:<AddCircle color={'primary'}/>,
                    color:'primary',
                    onClick:()=>{}
                },
                {
                    label:'Import Dancers',
                    icon:<ImportExport color={'secondary'}/>,
                    color:'secondary',
                    onClick:()=>{}
                }
            ]
        }
        return []
    },[ activeTab, dialogs ])

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
                        {startCase(toLower(String(data?.name)))}
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
                    minHeight:800
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
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                            justifyContent={'space-between'}
                        >
                            <Tabs
                                value={activeTab}
                                onChange={(_,newValue)=>setActiveTab(newValue)}
                            >
                                <Tab label={'Details'}/>
                                <Tab label={'Dancers'}/>
                            </Tabs>
                            <MenuButtons
                                name={'section-dialog'}
                                id={payload.uid}
                                buttons={activeButtons}
                            />
                        </Stack>

                        {activeTab===0 && (
                            <Stack spacing={6}>
                                <SectionDetails data={data as sections}/>
                                <Stack spacing={0}>
                                    <Stack
                                        direction={'row'}
                                        alignItems={'center'}
                                        justifyContent={'space-between'}
                                    >
                                        <Typography variant={'h5'}>
                                            Heats
                                        </Typography>
                                        <MenuButtons
                                            name={'heat-buttons'}
                                            id={payload.uid}
                                            buttons={[
                                                {
                                                    label:'Add Heat',
                                                    icon:<AddCircle color={'primary'}/>,
                                                    color:'primary',
                                                    onClick:async()=>{
                                                        await dialogs.open(HeatDialog,{
                                                            section_id:payload.uid
                                                        })
                                                    }
                                                }
                                            ]}
                                        />
                                    </Stack>
                                    <SectionHeats sectionId={payload?.uid}/>
                                </Stack>

                            </Stack>

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

'use client';
import React, { useMemo, useState } from 'react';
import { Tabs, Tab, Divider, Stack } from "@mui/material";
import SectionsCard from "@/app/(pages)/competitions/[competitionId]/_components/SectionsCard";
import HeatsCard from "@/app/(pages)/competitions/[competitionId]/_components/HeatsCard";
import MenuButtons, { MenuButtonsProps } from "@/app/components/layout/MenuButtons";
import { useDialogs } from "@toolpad/core";
import { AddCircle } from "@mui/icons-material";
import SectionDetailsDialog from "@/app/components/dialogs/competition/SectionDetailsDialog";

type pageProps = {}

const Page: React.FC<pageProps> = () => {

    const [ tab, setTab ] = useState<number>(0);

    const dialogs = useDialogs();

    const buttons:MenuButtonsProps['buttons'] = useMemo(()=>{
        if(tab===0){
            return [
                {
                    label:'Create Section',
                    icon:<AddCircle color={'primary'}/>,
                    onClick:async()=>{
                        await dialogs.open(SectionDetailsDialog)
                    }
                }
            ]
        }
        return []
    },[ tab ])

    return (
        <Stack sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
            >
                <Tabs
                    onChange={(e, newValue) => setTab(newValue)}
                    value={tab}
                >
                    <Tab
                        label={'Sections'}
                    />
                    <Tab
                        label={'Heats'}
                    />
                </Tabs>
                <MenuButtons
                    name={'competition-options'}
                    id={'competition'}
                    buttons={buttons}
                />
            </Stack>
            {tab===0 && (
                <SectionsCard/>
            )}
            {tab===1 && (
                <HeatsCard/>
            )}
        </Stack>
    );
}

export default Page;

'use client';
import React, { useState } from 'react';
import { Tabs, Tab, Divider } from "@mui/material";
import SectionsCard from "@/app/(pages)/competitions/[competitionId]/_components/SectionsCard";
import HeatsCard from "@/app/(pages)/competitions/[competitionId]/_components/HeatsCard";

type pageProps = {}

const Page: React.FC<pageProps> = () => {

    const [ tab, setTab ] = useState<number>(0);

    return (
        <div>
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
            <Divider/>
            {tab===0 && (
                <SectionsCard/>
            )}
            {tab===1 && (
                <HeatsCard/>
            )}
        </div>
    );
}

export default Page;

'use client'
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getAdjudicatorSections } from "@/app/server/adjudicator";
import { HeatStatus } from "@prisma/client";
import { Stack, Typography, Skeleton, Tabs, Tab, Divider, } from "@mui/material";
import HeatCard from "@/app/(pages)/adjudicator/[adjudicatorId]/_components/HeatCard";
import { useRouter } from "next/navigation";
import AdjudicatorCard from "@/app/(pages)/adjudicator/[adjudicatorId]/_components/AdjudicatorCard";

type pageType = {};
const Page: React.FC<pageType> = () => {

    const session = useSession();

    const [ activeTab, setActiveTab ] = React.useState<number>(0)

    const {
        isLoading,
        data,
    }=useQuery({
        queryKey:[ 'adjudicator_sections',session.data?.adjudicator.id ],
        queryFn:async()=>{
            const response = await getAdjudicatorSections();
            if(response.data){
                return {
                    active_heats:response.data.filter(section=>section.status===HeatStatus.READY),
                    upcoming_heats:response.data.filter(section=>section.status!==HeatStatus.READY),
                }
            }
            return {
                active_heats:[],
                upcoming_heats:[],
            }
        },
        refetchInterval: 30000, // every 30 seconds
    })

    const router = useRouter()

    if(isLoading){
        return (
            <Stack>
                <Stack>
                    <Skeleton
                        width={100}
                        sx={{
                            mb:0
                        }}
                    />
                    <Skeleton
                        height={200}
                    />
                </Stack>
                <Stack>
                    <Skeleton
                        width={100}
                    />
                    <Skeleton
                        height={200}
                    />
                </Stack>
            </Stack>
        )
    }

    return (
        <Stack mt={2}>
            <AdjudicatorCard sx={{ mb:2 }}/>
            <Tabs
                value={activeTab}
                onChange={(e,tab)=>setActiveTab(tab)}
                sx={{
                    mb:2
                }}
            >
                <Tab label={`Active Heats (${data?.active_heats?.length ?? 0})`}/>
                <Tab label={`Upcoming Heats (${data?.upcoming_heats?.length ?? 0})`}/>
            </Tabs>
            <Divider sx={{ mt:-2, mb:2 }}/>
            {activeTab===0 && (
                <Stack >
                    {!data?.active_heats?.length ?(
                        <Stack
                            alignItems={'center'}
                            justifyContent={'center'}
                            my={5}
                        >
                            <Typography>
                                You have no sections ready for adjudication yet
                            </Typography>
                        </Stack>
                    ):(
                        <Stack>
                            {data?.active_heats.map((heat,index)=>(
                                <HeatCard
                                    key={heat.uid}
                                    uid={heat.uid}
                                    item_no={heat.item_no}
                                    sectionName={heat.section.name}
                                    type={heat.type}
                                    onClick={()=>router.push(`/adjudicator/${session.data?.adjudicator.id}/${heat.uid}`)}
                                />
                            ))}
                        </Stack>
                    )}
                </Stack>
            )}
            {activeTab===1 && (
                <Stack>
                    {!data?.upcoming_heats?.length ?(
                        <Stack
                            alignItems={'center'}
                            justifyContent={'center'}
                            my={5}
                        >
                            <Typography textAlign={'center'}>
                                You have no upcoming sections ready for adjudication yet...
                            </Typography>
                        </Stack>
                    ):(
                        <Stack spacing={2}>
                            {data?.upcoming_heats?.map((heat,index)=>(
                                <HeatCard
                                    key={heat.uid}
                                    uid={heat.uid}
                                    item_no={heat.item_no}
                                    sectionName={heat.section.name}
                                    type={heat.type}
                                    disabled
                                />
                            ))}
                        </Stack>
                    )}
                </Stack>
            )}
        </Stack>
    );
};

export default Page;

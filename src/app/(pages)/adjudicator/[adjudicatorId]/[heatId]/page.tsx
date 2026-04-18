'use client';
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getAdjudicatorHeat,  } from "@/app/server/adjudicator";
import { Skeleton,  } from "@mui/material";
import { heat, HeatType } from "@prisma/client";
import AdjudicatorRoundHeat from "@/app/(pages)/adjudicator/[adjudicatorId]/[heatId]/_components/AdjudicatorRoundHeat";
import AdjudicatorFinalHeat from "@/app/(pages)/adjudicator/[adjudicatorId]/[heatId]/_components/AdjudicatorFinalHeat";


type pageType = {};

export type HeatResponseType = heat &{
    start_list:{
        uid:string,
        number:string
    }[],
    section:{
        name:string
    }
}
const Page: React.FC<pageType> = () => {


    const { heatId }=useParams()

    const {
        data,
        isLoading,
    }=useQuery<HeatResponseType |null>({
        queryKey:[ 'adjudicator_heat', heatId ],
        queryFn:async():Promise<HeatResponseType |null>=>{
            const response = await getAdjudicatorHeat(String(heatId));
            if(response.data)return response.data as unknown as HeatResponseType;
            return null
        }
    })


    if(isLoading){
        return (
            <Skeleton
                height={150}
                variant={'rectangular'}
                sx={{
                    borderRadius: 4,
                    mt:4
                }}
            />
        )
    }

    if(data?.type===HeatType.FINAL){
        return (
            <AdjudicatorFinalHeat
                heatId={String(heatId)}
                data={data}
            />
        )
    }
    return (
        <AdjudicatorRoundHeat
            heatId={String(heatId)}
            data={data}
        />
    )
};

export default Page;

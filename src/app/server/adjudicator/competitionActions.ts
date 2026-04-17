import { unsafeAction } from "@/app/lib/safeAction";
import { prisma } from "@/app/lib/prisma";
import { CompetitionStatus } from "@prisma/client";

export const getLiveCompetitions = unsafeAction.action(async()=>{
    const competitions = await prisma.competition.findMany({
        where:{
            status:CompetitionStatus.ACTIVE
        },
        select:{
            name:true,
            uid:true
        }
    });

    return competitions.map((item)=>({
        label:item.name,
        value:item.uid
    }))
})


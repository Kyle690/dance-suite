import { safeAction } from "@/app/lib/safeAction";
import { AdjudicatorSchema, CompetitionAdjudicatorsSchema } from "@/app/schemas/CompetitionAdjudicatorsSchema";
import { prisma } from "@/app/lib/prisma";
import dayjs from "@/app/utils/dayjs";
import { UidSchema } from "@/app/schemas/CommonSchema";


export const updateAdjudicators = safeAction.inputSchema(CompetitionAdjudicatorsSchema).action(async({
    parsedInput,
    ctx
})=>{

    const adjudicators = await prisma.adjudicator.findMany({
        where:{
            competition_id:parsedInput.competitionId,
            is_deleted:false
        }
    })

    const toCreate = parsedInput.adjudicators.filter((a)=>!a.uid).map((a)=>({
        name:a.name,
        letter:a.letter,
        competition_id:parsedInput.competitionId,
    }));

    const toUpdate = parsedInput.adjudicators.filter((a)=>a.uid).map((a)=>({
        uid:a.uid!,
        name:a.name,
        letter:a.letter,
        competition_id:parsedInput.competitionId,
        updated_by:ctx.user?.id
    }));

    const toDelete = adjudicators.filter((a)=>!parsedInput.adjudicators.find((na)=>na.uid === a.uid)).map((a)=>a.uid);

    const response = await prisma.$transaction([
        prisma.adjudicator.createMany({
            data:toCreate
        }),
        ...toUpdate.map((a)=>prisma.adjudicator.update({
            where:{
                uid:a.uid
            },
            data:{
                name:a.name,
                letter:a.letter,

            }
        })),
        ...toDelete.map((uid)=>prisma.adjudicator.update({
            where:{
                uid
            },
            data:{
                is_deleted:true,
                deleted_by_id:ctx.user?.id,
                deleted_at:dayjs().toDate()
            }
        }))
    ]);

    return response;

})


export const getAdjudicators = safeAction.inputSchema(UidSchema).action(async({ parsedInput })=>{

    const result = await prisma.adjudicator.findMany({
        where:{
            competition_id:parsedInput,
            is_deleted:false
        }
    });

    return {
        competitionId:parsedInput,
        adjudicators:result
    }

});

export default{
    updateAdjudicators,
    getAdjudicators
}

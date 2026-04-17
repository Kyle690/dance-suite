import { adjudicatorSafeAction } from "@/app/lib/adjudicatorSafeAction";
import { prisma } from "@/app/lib/prisma";
import { CompetitionLogEventType, HeatMarkInputType, HeatStatus } from "@prisma/client";
import { UidSchema } from "@/app/schemas/CommonSchema";
import { redirect } from "next/navigation";
import { AdjudicatorMarksRoundSchema } from "@/app/schemas/adjudicators/adjudicatorMarksSchema";
import { createMarksChecksum } from "@/app/server/adjudicator/utils";
import dayjs from "@/app/utils/dayjs";


export const getAdjudicatorSections = adjudicatorSafeAction.action(async({ ctx })=>{
    const adjudicatorId = ctx.adjudicator.id;

    const results = await prisma.heat.findMany({
        where:{
            panel:{
                panels_adjudicators:{
                    some:{ adjudicator_id:adjudicatorId }
                }
            },
            status:{
                in:[ HeatStatus.ACTIVE, HeatStatus.READY, HeatStatus.MARSHALLING ]
            },
            heat_marks:{
                none:{ adjudicator_id:adjudicatorId }
            }
        },
        include:{
            start_list:{
                include:{ dancer:{ select:{ uid:true, number:true } } }
            },
            section:{ select:{ name:true } }
        }
    });
    return results.map((heat)=>({
        ...heat,
        start_list: heat.start_list.map((hd)=>hd.dancer),
    }));

})


export const getAdjudicatorHeat = adjudicatorSafeAction.inputSchema(UidSchema).action(async({ ctx, parsedInput })=>{

    const heatRaw = await prisma.heat.findFirst({
        where:{
            uid:parsedInput,
            panel:{
                panels_adjudicators:{
                    some:{ adjudicator_id:ctx.adjudicator.id }
                }
            }
        },
        include:{
            start_list:{
                include:{ dancer:{ select:{ uid:true, number:true } } }
            },
            section:{ select:{ name:true } }
        }
    });

    if(!heatRaw){
        redirect(`/adjudicator/${ctx.adjudicator.id}`)
    }
    return {
        ...heatRaw!,
        start_list: heatRaw!.start_list.map((hd)=>hd.dancer),
    };


})

export const submitAdjudicatorHeatMarks = adjudicatorSafeAction.inputSchema(AdjudicatorMarksRoundSchema).action(async({ ctx, parsedInput })=>{
    const adjudicatorId = ctx.adjudicator.id;

    const checksum = createMarksChecksum({
        heat_id:parsedInput.heat_id,
        adjudicator_id:adjudicatorId,
        signature:parsedInput.signature,
        ip_address:ctx.ip,
        marks:parsedInput.marks,
        timestamp:dayjs().toDate()
    })


    const marks = await prisma.heat_marks.create({
        data:{
            heat_id:parsedInput.heat_id,
            adjudicator_id:adjudicatorId,
            signature:parsedInput.signature,
            input_type:HeatMarkInputType.JUDGE,
            ip_address:ctx.ip,
            check_sum:checksum,
            marks:{
                createMany:{
                    data:parsedInput.marks
                }
            },
        },
        include:{
            heat:{
                include:{
                    panel:{
                        include:{
                            panels_adjudicators:true
                        }
                    },
                    heat_marks:true
                }
            }
        }
    })

    await prisma.competition_log.create({
        data:{
            event_type:CompetitionLogEventType.HEAT_MARKS_SUBMITTED,
            competition_id: String(ctx.adjudicator.competition_id),
            note: `Adjudicator ${ctx.adjudicator.id} submitted heat marks for heat ${parsedInput.heat_id}`
        }
    })

    const heatNumberAdjudicators = marks.heat.panel?.panels_adjudicators?.length
    const numberOfEnteredMarks = marks.heat.heat_marks?.length;

    if(heatNumberAdjudicators===numberOfEnteredMarks){
        console.log('Updating heat status to REVIEWING as all adjudicators have submitted their marks')
        // heat is complete we can update the status
        await prisma.heat.update({
            where:{
                uid:parsedInput.heat_id
            },
            data:{
                status: HeatStatus.REVIEWING
            }
        })
    }

    redirect(`/adjudicator/${ctx.adjudicator.id}`)


    return marks;

})

export default {
    getAdjudicatorSections,
    getAdjudicatorHeat,
    submitAdjudicatorHeatMarks,
}

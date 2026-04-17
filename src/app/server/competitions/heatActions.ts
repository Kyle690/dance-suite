import { safeAction } from "@/app/lib/safeAction";
import { HeatStatusSchema, SectionHeatSchema, SectionHeatStartListSchema } from "@/app/schemas/SectionSchema";
import { prisma } from "@/app/lib/prisma";
import { UidSchema } from "@/app/schemas/CommonSchema";
import { CompetitionLogEventType, HeatStatus } from "@prisma/client";
import { getCompetitionUser } from "@/app/server/competitions/competitionActions";


export const createHeat = safeAction.inputSchema(SectionHeatSchema).action(async({ parsedInput, ctx })=>{

    return prisma.heat.create({
        data:{
            section:{
                connect:{
                    uid:parsedInput.section_id
                }
            },
            item_no:parsedInput.item_no,
            order:parsedInput.order,
            status:parsedInput.status,
            type:parsedInput.type,
            dances:parsedInput.dances,
            callback_limit:parsedInput.callback_limit,
            panel:{
                connect:{
                    uid:parsedInput.panel_id
                }
            }
        }
    })
});

export const updateHeat = safeAction.inputSchema(SectionHeatSchema).action(async({ parsedInput, ctx })=>{

    return prisma.heat.update({
        where:{
            uid:parsedInput.uid
        },
        data:{
            item_no:parsedInput.item_no,
            order:parsedInput.order,
            status:parsedInput.status,
            type:parsedInput.type,
            dances:parsedInput.dances,
            callback_limit:parsedInput.callback_limit,
            panel:{
                connect:{
                    uid:parsedInput.panel_id
                }
            }
        }
    })

})

export const deleteHeat = safeAction.inputSchema(SectionHeatSchema.pick({ uid:true })).action(async({ parsedInput, ctx })=>{

    return prisma.heat.delete({
        where:{
            uid:parsedInput.uid
        }
    })
})

export const updateHeatStatus = safeAction.inputSchema(HeatStatusSchema).action(async({ parsedInput, ctx })=>{

    const eventType = ()=>{
        switch(parsedInput.status){
        case HeatStatus.ACTIVE:
            return CompetitionLogEventType.HEAT_ACTIVE
        case HeatStatus.READY:
            return CompetitionLogEventType.HEAT_READY
        case HeatStatus.MARSHALLING:
            return CompetitionLogEventType.HEAT_MARSHALLING
        default:
            throw new Error(`Invalid heat status: ${parsedInput.status}`)
        }
    }

    const competitionUser = await getCompetitionUser({
        userId:ctx.user.id,
        competitionId:String(ctx.competition_id)
    })

    console.log('changing heat status', parsedInput)

    return prisma.heat.update({
        where:{
            uid:parsedInput.heat_id
        },
        data:{
            status:parsedInput.status,
            competition_log:{
                create:{
                    event_type:eventType(),
                    competition_id:String(competitionUser?.data?.competition_id),
                    user_id:competitionUser?.data?.uid,
                    note:`User set the heat to ${parsedInput.status}`
                }
            }
        }
    })
})


export const getHeatDancers = safeAction.inputSchema(UidSchema).action(async({ parsedInput })=>{
    const result = await prisma.heat.findUnique({
        where:{ uid:parsedInput },
        include:{
            start_list:{
                include:{
                    dancer:true
                }
            },
            section:{ include:{ dancers:true } }
        }
    });
    if(!result) return null;
    return {
        ...result,
        start_list: result.start_list.map((hd)=>hd.dancer),
    };
})



export const updateHeatDancers = safeAction.inputSchema(SectionHeatStartListSchema).action(async({ parsedInput })=>{

    await prisma.heat_dancers.deleteMany({
        where:{ heat_id:parsedInput.heat_id }
    });

    if(parsedInput.start_list.length > 0){
        await prisma.heat_dancers.createMany({
            data:parsedInput.start_list.map((dancerId)=>({
                heat_id:parsedInput.heat_id,
                dancer_id:dancerId,
            }))
        });
    }

    return prisma.heat.findUnique({ where:{ uid:parsedInput.heat_id } });
})

export const getCompetitionHeats = safeAction.inputSchema(UidSchema).action(async({ parsedInput })=>{
    return prisma.heat.findMany({
        where:{
            section:{
                competition_id: parsedInput
            }
        },
        orderBy:{
            item_no:'asc'
        },
        include:{
            start_list:{
                orderBy:{
                    dancer:{
                        number:'asc'
                    }
                },
                include:{
                    dancer:true
                }
            },
            section:{
                select:{
                    name:true
                }
            },
            heat_marks:true,
            panel:{
                include:{
                    panels_adjudicators:{
                        include:{
                            adjudicator:{
                                select:{
                                    letter:true
                                }
                            }
                        }
                    }
                }
            }
        }
    })
})

export default {
    createHeat,
    updateHeat,
    deleteHeat,
    updateHeatStatus,
    getHeatDancers,
    updateHeatDancers,
    getCompetitionHeats,
}

import { safeAction } from "@/app/lib/safeAction";
import { SectionHeatSchema, SectionHeatStartListSchema } from "@/app/schemas/SectionSchema";
import { prisma } from "@/app/lib/prisma";
import { UidSchema } from "@/app/schemas/CommonSchema";
import { HeatStatus } from "@prisma/client";


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

export const activateHeat = safeAction.inputSchema(UidSchema).action(async({ parsedInput, ctx })=>{
    return prisma.heat.update({
        where:{
            uid:parsedInput
        },
        data:{
            status:HeatStatus.ACTIVE
        }
    })
})


export const getHeatDancers = safeAction.inputSchema(UidSchema).action(async({ parsedInput })=>{
    return prisma.heat.findUnique({
        where:{
            uid:parsedInput
        },
        include:{
            start_list:true,
            section:{
                include:{
                    dancers:true
                }
            }
        }
    })
})



export const updateHeatDancers = safeAction.inputSchema(SectionHeatStartListSchema).action(async({ parsedInput })=>{

    const connectDancers = await prisma.heat.update({
        where:{
            uid:parsedInput.heat_id
        },
        data:{
            start_list:{
                set:parsedInput.start_list.map((dancerId)=>({
                    uid:dancerId
                }))
            }
        }
    })
    // TODO - if dancers are part of a previous heat and have been removed they need to be adjusted accordingly

    return connectDancers;

})

export default {
    createHeat,
    updateHeat,
    deleteHeat,
    activateHeat,
    getHeatDancers,
    updateHeatDancers
}

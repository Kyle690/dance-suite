import { safeAction } from "@/app/lib/safeAction";
import { SectionHeatSchema } from "@/app/schemas/SectionSchema";
import { prisma } from "@/app/lib/prisma";


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

export default {
    createHeat,
    updateHeat,
    deleteHeat,
}

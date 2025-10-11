import { safeAction } from "@/app/lib/safeAction";
import { PanelSchema } from "@/app/schemas/PanelSchema";
import { prisma } from "@/app/lib/prisma";
import { UidSchema } from "@/app/schemas/CommonSchema";
import dayjs from "@/app/utils/dayjs";

export const createPanel = safeAction.inputSchema(PanelSchema).action(async({ parsedInput, ctx })=>{

    const adjudicatorIds = parsedInput.adjudicators.map(a=>a.uid);

    const panel = await prisma.panels.create({
        data:{
            competition_id: parsedInput.competitionId,
            name:parsedInput.name,
            panels_adjudicators:{
                create: adjudicatorIds.map(uid=>({
                    adjudicator:{
                        connect:{ uid }
                    }
                }))
            }
        }
    })

    return panel;
})

export const updatePanel = safeAction.inputSchema(PanelSchema).action(async({ parsedInput, ctx })=>{

    const panel = await prisma.panels.findFirst({
        where:{ uid:parsedInput.uid },
        include:{
            panels_adjudicators:{
                include:{ adjudicator:true }
            }
        }
    })

    if(!panel){
        throw new Error('Panel not found');
    }

    const adjudicatorIds = parsedInput.adjudicators.map(a=>a.uid);

    // Update panel name
    await prisma.panels.update({
        where:{ uid:parsedInput.uid },
        data:{
            name:parsedInput.name
        }
    })

    const currentAdjudicatorIds = panel.panels_adjudicators.map(pa=>pa.adjudicator.uid);

    // Adjudicators to add
    const adjudicatorsToAdd = adjudicatorIds.filter(id=>!currentAdjudicatorIds.includes(String(id)));
    // Adjudicators to remove
    const adjudicatorsToRemove = currentAdjudicatorIds.filter(id=>!adjudicatorIds.includes(id));

    // Add new adjudicators
    if(adjudicatorsToAdd.length > 0){
        await prisma.panels_adjudicators.createMany({
            data:adjudicatorsToAdd.map(uid=>({
                panel_id: panel.uid,
                adjudicator_id: String(uid)
            }))
        })
    }

    // Remove adjudicators
    if(adjudicatorsToRemove.length > 0){
        await prisma.panels_adjudicators.deleteMany({
            where:{
                panel_id: panel.uid,
                adjudicator_id:{
                    in:adjudicatorsToRemove
                }
            }
        })
    }

    return panel;

})

export const deletePanel = safeAction.inputSchema(UidSchema).action(async({ parsedInput, ctx })=>{
    // Delete panel
    const panel = await prisma.panels.update({
        where:{ uid:parsedInput },
        data:{
            is_deleted:true,
            deleted_at:dayjs().toDate(),
            deleted_by_id:ctx.user.id,
        }
    })
    return panel;
})


export const getPanels = safeAction.inputSchema(UidSchema).action(async({ parsedInput, ctx })=>{
    return prisma.panels.findMany({
        where:{
            competition_id: parsedInput,
            is_deleted:false
        },
        include:{
            panels_adjudicators:{
                where:{
                    is_deleted:false,
                },
                include:{
                    adjudicator:true
                }
            }
        }
    })

})

export default {
    createPanel,
    updatePanel,
    deletePanel,
    getPanels
}

import { safeAction } from "@/app/lib/safeAction";
import { DancerSchema } from "@/app/schemas/SectionSchema";
import { prisma } from "@/app/lib/prisma";


export const createDancer = safeAction.inputSchema(DancerSchema).action(async({ parsedInput,ctx })=>{

    return prisma.dancers.create({
        data:{
            ...parsedInput,
            number: parseInt(parsedInput.number)
        }
    })

})

export const updateDancer = safeAction.inputSchema(DancerSchema).action(async({ parsedInput,ctx })=>{
    return prisma.dancers.update({
        where:{
            uid:parsedInput.uid
        },
        data:{
            ...parsedInput,
            number: parseInt(parsedInput.number)
        }
    })
})

export const deleteDancer = safeAction.inputSchema(DancerSchema.pick({ uid:true })).action(async({ parsedInput,ctx })=>{

    const currentDance = await prisma.dancers.findUniqueOrThrow({
        where:{
            uid:parsedInput.uid
        },
        include:{
            section:{
                select:{
                    competition_id:true
                }
            }
        }
    });

    const competitionUser = await prisma.competition_users.findFirst({
        where:{
            competition_id:String(currentDance.section.competition_id),
            user_id:ctx.user.id
        }
    })

    return prisma.dancers.update({
        where:{
            uid:parsedInput.uid
        },
        data:{
            deleted_by:{
                connect:{
                    uid:competitionUser?.uid
                }
            }
        }
    })
})

export const getSectionDancers = safeAction.inputSchema(DancerSchema.pick({ section_id:true })).action(async({ parsedInput,ctx })=>{
    const res = await prisma.dancers.findMany({
        where:{
            section_id:parsedInput.section_id,
            deleted_by_id:null
        },
        orderBy:{
            number:'asc'
        }
    })

    return res?.map((dancer)=>({
        ...dancer,
        number:String(dancer.number),
        name:dancer.name||'',
        partner_name:dancer.partner_name||'',
        studio:dancer.studio||'',
        region:dancer.region||'',
        country:dancer.country||'',
    }))
})

export default{
    createDancer,
    updateDancer,
    deleteDancer,
    getSectionDancers
}

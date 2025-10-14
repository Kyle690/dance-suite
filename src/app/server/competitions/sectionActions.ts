import { safeAction } from "@/app/lib/safeAction";
import { SectionSchema } from "@/app/schemas/SectionSchema";
import { prisma } from "@/app/lib/prisma";


export const createSection = safeAction.inputSchema(SectionSchema).action(async({ parsedInput, ctx })=>{

    return prisma.sections.create({
        data:{
            ...parsedInput,
            name: parsedInput?.custom_name ? parsedInput.name: `${parsedInput.age_group} ${parsedInput.level} ${parsedInput.category}`
        }
    })
})

export const updateSection = safeAction.inputSchema(SectionSchema).action(async({ parsedInput, ctx })=>{
    return prisma.sections.update({
        where:{
            uid:parsedInput.uid
        },
        data:{
            ...parsedInput,
            name: parsedInput?.custom_name ? parsedInput.name: `${parsedInput.age_group} ${parsedInput.level} ${parsedInput.category}`
        }
    })
});

export const deleteSection = safeAction.inputSchema(SectionSchema.pick({ uid:true })).action(async({ parsedInput, ctx })=>{
    return prisma.sections.delete({
        where:{
            uid:parsedInput.uid
        }
    })
});

export const getCompetitionSections = safeAction.inputSchema(SectionSchema.pick({ competition_id:true })).action(async({ parsedInput, ctx })=>{
    return prisma.sections.findMany({
        where:{
            competition_id:parsedInput.competition_id,
        }
    })
})

export const getCompetitionSection = safeAction.inputSchema(SectionSchema.pick({ uid:true })).action(async({ parsedInput })=>{
    return prisma.sections.findFirst({
        where:{
            uid:String(parsedInput.uid)
        }
    })
})

export default{
    createSection,
    updateSection,
    deleteSection,
    getCompetitionSections,
    getCompetitionSection
}

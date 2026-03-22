import { safeAction } from "@/app/lib/safeAction";
import { CompetitionDetailsFormSchema, CompetitionUserRequestSchema } from "@/app/schemas/CompetitionDetailsForm";
import { prisma } from "@/app/lib/prisma";
import dayjs from "@/app/utils/dayjs";
import { CompetitionUserRole } from "@prisma/client";
import { z }from'zod';
import { revalidatePath } from "next/cache";

export const createCompetition = safeAction.inputSchema(CompetitionDetailsFormSchema).action(async({ parsedInput, ctx })=>{


    const competition = await prisma.competition.create({
        data:{
            name: parsedInput.name,
            date: dayjs(parsedInput.date).toDate(),
            venue: parsedInput.venue,
            organizer_name: parsedInput.organizer_name,
            organizer_email: parsedInput.organizer_email,
            organization: parsedInput.organization,
            competition_users:{
                create:{
                    role:CompetitionUserRole.SCRUTINEER,
                    user_id: ctx.user.id
                }
            }
        }
    })

    return competition;
})

export const getCompetitions = safeAction.action(async({ ctx })=>{
    return prisma.competition.findMany({
        where:{
            is_deleted:false,
            competition_users:{
                some:{
                    user_id:ctx.user.id
                }
            }
        },
        include:{
            _count:{
                select:{
                    sections:true,
                }
            }
        }
    })
})

export const getCompetition = safeAction.inputSchema(z.string()).action(async({ parsedInput })=>{
    return prisma.competition.findFirst({
        where:{
            uid:parsedInput,
        }
    })
})

export const updateCompetition = safeAction.inputSchema(CompetitionDetailsFormSchema).action(async({ parsedInput, ctx })=>{

    const response = await prisma.competition.update({
        where:{
            uid:parsedInput.uid
        },
        data:{
            name: parsedInput.name,
            date: dayjs(parsedInput.date).toDate(),
            venue: parsedInput.venue,
            organizer_name: parsedInput.organizer_name,
            organizer_email: parsedInput.organizer_email,
            organization: parsedInput.organization,
        }
    })

    revalidatePath(`/competitions/${parsedInput?.uid}`);

    return response;

})

export const getCompetitionUser = safeAction.inputSchema(CompetitionUserRequestSchema).action(async({ parsedInput })=>{
    return prisma.competition_users.findFirst({
        where:{
            competition_id:parsedInput.competitionId,
            user_id:parsedInput.userId,
        }
    })
})

export const updateCompetitionStatus = safeAction.inputSchema(z.string()).action(async({ parsedInput })=>{
    const current = await prisma.competition.findUnique({
        where:{ uid: parsedInput },
        select:{ status: true }
    })

    if(!current) throw new Error('Competition not found');

    const newStatus = current.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';

    return prisma.competition.update({
        where:{ uid: parsedInput },
        data:{ status: newStatus }
    })
})
export default {
    createCompetition,
    getCompetitions,
    getCompetition,
    updateCompetition,
    getCompetitionUser,
    updateCompetitionStatus,
}

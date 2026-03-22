import { safeAction } from "@/app/lib/safeAction";
import { AdjudicatorContactSchema, CompetitionAdjudicatorsSchema } from "@/app/schemas/CompetitionAdjudicatorsSchema";
import { prisma } from "@/app/lib/prisma";
import dayjs from "@/app/utils/dayjs";
import { UidSchema } from "@/app/schemas/CommonSchema";
import { randomUUID } from "crypto";
import { encryptCode, decryptCode } from "@/app/lib/codeEncryption";


const generateLoginCode = (): string => String(Math.floor(100000 + Math.random() * 900000));

const generateToken = (): string => randomUUID();


export const updateAdjudicators = safeAction.inputSchema(CompetitionAdjudicatorsSchema).action(async({
    parsedInput,
    ctx
})=>{

    const adjudicators = await prisma.adjudicator.findMany({
        where:{
            competition_id:parsedInput.competitionId,
            is_deleted:false,
        },
        orderBy:{
            letter:'asc'
        }
    })

    const toCreateWithCodes = parsedInput.adjudicators.filter((a)=>!a.uid).map((a)=>{
        const plainCode = generateLoginCode();
        return {
            data: {
                name: a.name,
                letter: a.letter,
                competition_id: parsedInput.competitionId,
                login_code: encryptCode(plainCode),
                token: generateToken(),
            },
            plainCode,
        };
    });
    const toCreate = toCreateWithCodes.map((c) => c.data);

    const toUpdate = parsedInput.adjudicators.filter((a)=>a.uid).map((a)=>{
        const existing = adjudicators.find((adj) => adj.uid === a.uid);
        const newPlainCode = existing?.login_code ? null : generateLoginCode();
        return {
            uid: a.uid!,
            name: a.name,
            letter: a.letter,
            competition_id: parsedInput.competitionId,
            updated_by: ctx.user?.id,
            login_code: existing?.login_code ?? encryptCode(newPlainCode!),
            newPlainCode, // non-null only when a fresh code was generated
            token: existing?.token ?? generateToken(),
        };
    });

    const toDelete = adjudicators.filter((a)=>!parsedInput.adjudicators.find((na)=>na.uid === a.uid)).map((a)=>a.uid);

    // Create adjudicators individually to capture returned uids for logs
    const createResult = toCreate.length > 0
        ? await prisma.$transaction(toCreate.map((a) => prisma.adjudicator.create({ data: a })))
        : [];

    // Map created records back to their plain codes for logging
    const createdWithPlainCodes = createResult.map((record, i) => ({
        ...record,
        plainCode: toCreateWithCodes[i].plainCode,
    }));

    await prisma.$transaction([
        ...toUpdate.map((a) => prisma.adjudicator.update({
            where: { uid: a.uid },
            data: {
                name: a.name,
                letter: a.letter,
                login_code: a.login_code,
                token: a.token,
            },
        })),
        ...toDelete.map((uid) => prisma.adjudicator.update({
            where: { uid },
            data: {
                is_deleted: true,
                deleted_by_id: ctx.user?.id,
                deleted_at: dayjs().toDate(),
            },
        })),
        ...createdWithPlainCodes.map((a) => prisma.adjudicator_log.create({
            data: {
                adjudicator_id: a.uid,
                action: 'CREATE',
                message: `Adjudicator ${a.letter} - ${a.name} created`,
                details: { login_code: a.plainCode, created_by: ctx.user?.id },
            },
        })),
        ...toUpdate.map((a) => {
            const assignedToken = !adjudicators.find((adj) => adj.uid === a.uid)?.token;
            return prisma.adjudicator_log.create({
                data: {
                    adjudicator_id: a.uid,
                    action: 'UPDATE',
                    message: a.newPlainCode || assignedToken
                        ? `Adjudicator ${a.letter} - ${a.name} updated — credentials assigned`
                        : `Adjudicator ${a.letter} - ${a.name} updated`,
                    details: {
                        updated_by: ctx.user?.id,
                        ...(a.newPlainCode && { login_code_assigned: a.newPlainCode }),
                        ...(assignedToken && { token_assigned: true }),
                    },
                },
            });
        }),
        ...toDelete.map((uid) => {
            const adj = adjudicators.find((a) => a.uid === uid)!;
            return prisma.adjudicator_log.create({
                data: {
                    adjudicator_id: uid,
                    action: 'DELETE',
                    message: `Adjudicator ${adj.letter} - ${adj.name} deleted`,
                    details: { deleted_by: ctx.user?.id },
                },
            });
        }),
    ]);

    return { created: createResult.length, updated: toUpdate.length, deleted: toDelete.length };

})


export const getAdjudicators = safeAction.inputSchema(UidSchema).action(async({ parsedInput })=>{

    const result = await prisma.adjudicator.findMany({
        where:{
            competition_id:parsedInput,
            is_deleted:false
        },
        orderBy:{
            letter:'asc'
        }
    });

    return {
        competitionId:parsedInput,
        adjudicators:result
    }

});

export const getAdjudicatorDetail = safeAction.inputSchema(UidSchema).action(async ({ parsedInput }) => {
    const record = await prisma.adjudicator.findUnique({
        where: { uid: parsedInput },
        include: {
            panels_adjudicators: {
                where: { is_deleted: false },
                include: {
                    panel: {
                        include: {
                            heat: {
                                include: {
                                    section: {
                                        select: { name: true, uid: true }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            adjudicator_logs: {
                orderBy: { created: 'desc' },
                take: 20,
            }
        }
    });

    if (!record) return null;

    return {
        ...record,
        login_code: record.login_code ? decryptCode(record.login_code) : null,
    };
});

export const updateAdjudicatorContact = safeAction.inputSchema(AdjudicatorContactSchema).action(async ({ parsedInput, ctx }) => {
    const updated = await prisma.adjudicator.update({
        where: { uid: parsedInput.uid },
        data: {
            email: parsedInput.email || null,
            phone_number: parsedInput.phone_number || null,
            country_code: parsedInput.country_code || null,
            country_calling_code: parsedInput.country_calling_code || null,
        }
    });

    await prisma.adjudicator_log.create({
        data: {
            adjudicator_id: parsedInput.uid,
            action: 'UPDATE',
            message: 'Contact details updated',
            details: { updated_by: ctx.user?.id },
        }
    });

    return updated;
});

export default{
    updateAdjudicators,
    getAdjudicators,
    getAdjudicatorDetail,
    updateAdjudicatorContact,
}

import { safeAction } from "@/app/lib/safeAction";
import { prisma } from "@/app/lib/prisma";
import { UidSchema } from "@/app/schemas/CommonSchema";
import { decryptCode } from "@/app/lib/codeEncryption";
import { Resend } from "resend";
import dayjs from "@/app/utils/dayjs";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAdjudicatorLoginEmail = safeAction.inputSchema(UidSchema).action(async ({ parsedInput, ctx }) => {
    const adjudicator = await prisma.adjudicator.findUnique({
        where: { uid: parsedInput },
        include: {
            competition: {
                select: { name: true, date: true, venue: true }
            }
        }
    });

    if (!adjudicator) throw new Error('Adjudicator not found');
    if (!adjudicator.email) throw new Error('Adjudicator has no email address');
    if (!adjudicator.login_code) throw new Error('Adjudicator has no login code');

    const plainCode = decryptCode(adjudicator.login_code);
    if (!plainCode) throw new Error('Failed to decrypt login code');

    const competition = adjudicator.competition;
    const competitionDate = dayjs(competition.date).format('MMMM D, YYYY');

    const { error } = await resend.emails.send({
        from: 'Dance Suite <noreply@dance-suite.com>',
        to: adjudicator.email,
        subject: `Your adjudicator login code — ${competition.name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="margin-bottom: 4px;">Dance Suite</h2>
                <p style="color: #666; margin-top: 0;">Adjudicator Login Details</p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

                <p>Hi <strong>${adjudicator.name}</strong>,</p>
                <p>
                    You have been assigned as an adjudicator for
                    <strong>${competition.name}</strong> on ${competitionDate}
                    at ${competition.venue ?? 'TBC'}.
                </p>

                <p>Your login code is:</p>
                <div style="
                    background: #f5f5f5;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    font-size: 36px;
                    font-family: monospace;
                    letter-spacing: 8px;
                    font-weight: bold;
                    margin: 16px 0;
                ">
                    ${plainCode}
                </div>

                <p style="color: #666; font-size: 14px;">
                    Keep this code safe — you will need it to log in on the day of the competition when it is live. 
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">Dance Suite — Competition Management</p>
            </div>
        `,
    });

    if (error) throw new Error(error.message);

    await prisma.adjudicator_log.create({
        data: {
            adjudicator_id: parsedInput,
            action: 'COMMENT',
            message: `Login code email sent to ${adjudicator.email}`,
            details: { sent_by: ctx.user.name }
        },
    });

    return { sent: true };
});

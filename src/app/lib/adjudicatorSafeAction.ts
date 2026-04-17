import 'server-only';
import { createSafeActionClient } from 'next-safe-action';
import { getServerSession } from 'next-auth';
import { adjudicatorAuthOptions } from '@/app/lib/adjudicatorAuth';
import { redirect } from 'next/navigation';
import { headers } from "next/headers";
import { getClientIp } from "next-request-ip";

export const adjudicatorSafeAction = createSafeActionClient({}).use(async ({ next, ctx }) => {
    const session = await getServerSession(adjudicatorAuthOptions);

    if (!session?.adjudicator?.id) {
        redirect('/adjudicator/auth');
    }

    const headersList = await headers();
    const ip = getClientIp(headersList) ?? 'unknown';

    return next({
        ctx: {
            ...ctx,
            adjudicator: session.adjudicator,
            ip,
        },
    });
});

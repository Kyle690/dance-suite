import { createSafeActionClient } from "next-safe-action";
import { redirect } from "next/navigation";
import { headers } from 'next/headers';

export const safeAction = createSafeActionClient({}).use(async({ next, clientInput, ctx })=>{

    const user =  {
        id: 'c4167ebc-2069-43ef-9635-e15edae90139',
        emailAddresses:[ { emailAddress:'test@mail.com' } ],
        fullName:'Test User',
        firstName:'Test'
    }

    // If user is not present, redirect immediately (avoid throwing an error that's caught locally)
    if(!user){
        redirect('/');
    }

    // Read the current request headers and try to derive the current path.
    // When server actions are invoked from the browser, the `Referer` header is usually present
    // and contains the page URL that triggered the action. We parse that to get the pathname.
    const hdrs = await headers();
    const referer = hdrs.get('referer') || hdrs.get('referrer') || null;
    let requestPath: string | null = null;
    if (referer) {
        try {
            requestPath = new URL(referer).pathname;
        } catch {
            // If parsing fails, just leave requestPath as null
            requestPath = null;
        }
    }

    const competitionIdFromPath = requestPath?.split('/')[2] || null;

    try {
        return await next({
            ...clientInput as unknown as object,
            ctx:{
                ...ctx,
                // attach parsed request path (if available) and user info
                path: requestPath,
                competition_id: competitionIdFromPath,
                user:{
                    name: user.fullName || user.firstName || 'User',
                    email: user.emailAddresses[0]?.emailAddress || null,
                    id: user.id
                }
            }
        });
    } catch (error) {
        console.error('Error in safeAction middleware', error);
        redirect('/');
    }
});

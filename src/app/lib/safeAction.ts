import { createSafeActionClient } from "next-safe-action";
import { redirect } from "next/navigation";
import { headers } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';
import { prisma } from "@/app/lib/prisma";

export const safeAction = createSafeActionClient({}).use(async({ next, clientInput, ctx })=>{

    // Get the authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    // If user is not present, redirect to sign-in
    if(!supabaseUser){
        // todo - check later which auth user is required
        redirect('/scrutineer/auth');
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

    const competitionIdFromPath = requestPath?.split('/')[3] || null; // Updated index for /scrutineer/competitions/[id]

    try {
        return await next({
            ...clientInput as unknown as object,
            ctx:{
                ...ctx,
                // attach parsed request path (if available) and user info
                path: requestPath,
                competition_id: competitionIdFromPath,
                user:{
                    name: supabaseUser.user_metadata?.full_name ||
                          `${supabaseUser.user_metadata?.first_name || ''} ${supabaseUser.user_metadata?.last_name || ''}`.trim() ||
                          supabaseUser.email?.split('@')[0] || 'User',
                    email: supabaseUser.email || null,
                    id: supabaseUser.id
                }
            }
        });
    } catch (error) {
        console.error('Error in safeAction middleware', error);
        redirect('/scrutineer/auth');
    }
});


export const unsafeAction = createSafeActionClient({})

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/app/lib/supabase/middleware';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Let NextAuth handle its own API routes without interference
    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Adjudicator route protection via NextAuth JWT
    if (pathname.startsWith('/adjudicator')) {
        if (pathname.startsWith('/adjudicator/auth')) {
            return NextResponse.next();
        }

        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token?.adjudicatorId) {
            const url = request.nextUrl.clone();
            url.pathname = '/adjudicator/auth';
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    }

    // Supabase session refresh for scrutineer and all other routes
    return await updateSession(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv)$).*)',
    ],
};
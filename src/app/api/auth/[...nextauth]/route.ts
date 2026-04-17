import NextAuth from 'next-auth';
import { adjudicatorAuthOptions } from '@/app/lib/adjudicatorAuth';

const handler = NextAuth(adjudicatorAuthOptions);

export { handler as GET, handler as POST };
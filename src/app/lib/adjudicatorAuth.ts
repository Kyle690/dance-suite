import 'server-only';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/app/lib/prisma';
import { decryptCode, encryptCode } from '@/app/lib/codeEncryption';
import { CompetitionStatus } from "@prisma/client";

export const adjudicatorAuthOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'adjudicator-credentials',
            name: 'Adjudicator',
            credentials: {
                competition_id: { label: 'Competition', type: 'text' },
                login_code: { label: 'Login Code', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.login_code) return null;

                const encryptedCode = encryptCode(credentials.login_code);

                console.log(encryptedCode, credentials);

                const adjudicators = await prisma.adjudicator.findMany({
                    where: {
                        is_deleted: false,
                        competition:{
                            uid:credentials.competition_id,
                            status:CompetitionStatus.ACTIVE
                        },
                    },
                    include:{
                        competition:{
                            select:{
                                name:true
                            }
                        }
                    }
                });

                const adjudicator = adjudicators.find((adjudicator)=>{
                    const loginCode = decryptCode(adjudicator.login_code as string);
                    return loginCode === credentials.login_code;
                })

                if (!adjudicator?.login_code) return null;

                const decrypted = decryptCode(adjudicator.login_code);
                if (decrypted !== credentials.login_code) return null;

                await prisma.$transaction([
                    prisma.adjudicator.update({
                        where: { uid: adjudicator.uid },
                        data: { last_login: new Date() },
                    }),
                    prisma.adjudicator_log.create({
                        data: {
                            adjudicator_id: adjudicator.uid,
                            action: 'LOGIN',
                            message: `Adjudicator ${adjudicator.letter} - ${adjudicator.name} signed in`,
                            details: {},
                        },
                    }),
                ]);

                return {
                    id: adjudicator.uid,
                    name: adjudicator.name,
                    email: adjudicator.email,
                    competition_id: adjudicator.competition_id,
                    competition_name:adjudicator.competition.name,
                    letter: adjudicator.letter,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge:24*60*60, // 1 Day
    },
    pages: {
        signIn: '/adjudicator/auth',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.adjudicatorId = user.id;
                token.competition_id = (user as any).competition_id;
                token.competition_name = (user as any).competition_name;
                token.letter = (user as any).letter;
            }
            return token;
        },
        async session({ session, token }) {
            session.adjudicator = {
                id: token.adjudicatorId as string,
                competition_id: token.competition_id as string,
                competition_name:token.competition_name as string,
                letter: token.letter as string,
                name: session.user?.name ?? '',
                email: session.user?.email ?? null,
            };
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

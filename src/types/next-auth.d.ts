import NextAuth from 'next-auth';

declare module 'next-auth' {
    interface Session {
        adjudicator: {
            id: string;
            competition_id: string;
            competition_name:string;
            letter: string;
            name: string;
            email: string | null;
        };
    }

    interface User {
        competition_id: string;
        letter: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        adjudicatorId: string;
        competition_id: string;
        letter: string;
    }
}

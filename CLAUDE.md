# Dance Suite Scrutineer

A dance competition management and scrutineering system built with Next.js 15, MUI, and Supabase.

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **TypeScript**
- **Material UI v7** + MUI X DataGrid + MUI Toolpad Core
- **Prisma** with `@prisma/adapter-pg` (direct `pg` connection, not Prisma's default connection pooling)
- **Supabase** for auth (SSR client via `@supabase/ssr`)
- **next-safe-action** for type-safe server actions
- **TanStack React Query** for client-side data fetching
- **Zod v4** for schema validation
- **@react-pdf/renderer** for PDF generation
- **notistack** for toast notifications
- **papaparse** for CSV import
- **dayjs** for date handling

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run database:generate  # Regenerate Prisma client
npm run database:push      # Push schema to DB
npm run database:studio    # Open Prisma Studio
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth pages (sign-in, sign-up)
│   ├── (pages)/
│   │   └── scrutineer/
│   │       └── competitions/
│   │           ├── page.tsx                    # Competitions list
│   │           └── [competitionId]/
│   │               ├── layout.tsx
│   │               ├── page.tsx
│   │               └── _components/            # Page-local components
│   ├── components/
│   │   ├── dialogs/competition/
│   │   │   └── section/                        # Heat/section dialogs
│   │   ├── forms/                              # Reusable form inputs
│   │   ├── layout/                             # App shell components
│   │   └── pdf/                                # PDF document components
│   ├── contexts/                               # React contexts (AuthContext)
│   ├── hooks/                                  # TanStack Query hooks
│   ├── lib/
│   │   ├── safeAction.ts                       # next-safe-action client with Supabase auth middleware
│   │   ├── skating.ts                          # Skating system algorithm
│   │   └── supabase/                           # Supabase client helpers (server, client, middleware)
│   ├── schemas/                                # Zod schemas for forms/actions
│   ├── server/competitions/                    # Server actions
│   ├── types/                                  # Global TypeScript types
│   └── utils/                                  # Utility functions
├── middleware.ts                               # Supabase session refresh middleware
└── prisma/
    └── schema.prisma
```

## Key Patterns

### Server Actions
All mutations use `next-safe-action`. The `safeAction` client in `src/app/lib/safeAction.ts` automatically:
- Validates Supabase auth; redirects to `/auth/sign-in` if unauthenticated
- Injects `ctx.user`, `ctx.path`, and `ctx.competition_id` (parsed from referer URL at index `[3]` for `/scrutineer/competitions/[id]`)

Example usage:
```ts
export const myAction = safeAction
  .schema(MySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { competition_id, user } = ctx;
    // ...
  });
```

### Data Fetching
Client components fetch via TanStack Query hooks in `src/app/hooks/`. Hooks call server actions or API routes and cache results.

### Auth
- Supabase SSR auth via `@supabase/ssr`
- Middleware in `src/middleware.ts` refreshes sessions on every request
- `AuthContext` provides `user` and `loading` to client components
- Protected routes redirect to `/auth/sign-in`

### Routing
- Auth routes: `/auth/sign-in`, `/auth/sign-up`
- App routes: `/scrutineer/competitions`, `/scrutineer/competitions/[competitionId]`

### PDF Generation
`@react-pdf/renderer` documents in `src/app/components/pdf/`. Server actions in `src/app/server/competitions/pdfActions.ts` handle generation.

### Skating System
The skating algorithm is implemented in `src/app/lib/skating.ts`.

## Domain Concepts

- **Competition**: Top-level event
- **Section**: A division within a competition (e.g., "Novice Latin")
- **Heat**: A round within a section (preliminary, semi-final, final)
- **Adjudicator**: Judge assigned to a panel
- **Panel**: Group of adjudicators for a section
- **Dancer**: Competitor in a section
- **Marks**: Scores/callbacks given by adjudicators per heat

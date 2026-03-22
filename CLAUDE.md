# Dance Suite Scrutineer

A dance competition management and scrutineering system built with Next.js 15, MUI, and Supabase.

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **TypeScript**
- **Material UI v7** + MUI X DataGrid + MUI Toolpad Core (`@toolpad/core`)
- **Prisma v7** with `@prisma/adapter-pg` (direct `pg` connection — no Prisma connection pooling)
- **Supabase** for auth (SSR client via `@supabase/ssr`)
- **next-safe-action** for type-safe server actions
- **TanStack React Query** for client-side data fetching
- **Zod v4** for schema validation
- **react-hook-form** + `@hookform/resolvers` for forms
- **@react-pdf/renderer** for PDF generation
- **notistack** for toast notifications
- **papaparse** for CSV import
- **dayjs** for date handling

## Commands

```bash
npm run dev                # Start dev server (Turbopack)
npm run build              # prisma generate && next build (used by Vercel)
npm run lint               # ESLint
npm run database:generate  # Regenerate Prisma client
npm run database:push      # Push schema to DB
npm run database:studio    # Open Prisma Studio
```

## Routing Structure

```
/                                          # Home page (sign in / view competitions)
/scrutineer/                               # AuthProvider wrapper layout
/scrutineer/auth/                          # Auth page (ScrutineerSignIn / ScrutineerSignup)
/scrutineer/profile/                       # Competitions list (Navbar + Footer)
/scrutineer/profile/[competitionId]/       # Competition detail (Toolpad DashboardLayout)
```

## File Structure

```
src/
├── app/
│   ├── (pages)/scrutineer/
│   │   ├── layout.tsx                         # Wraps all scrutineer pages in AuthProvider
│   │   ├── auth/                              # Auth page
│   │   ├── profile/
│   │   │   ├── page.tsx                       # Competitions list (DataGrid + Navbar + Footer)
│   │   │   └── [competitionId]/
│   │   │       ├── layout.tsx                 # Toolpad DashboardLayout with competition title
│   │   │       ├── page.tsx                   # Tabs: Sections | Heats
│   │   │       └── _components/
│   │   │           ├── SectionsCard.tsx        # Sections DataGrid
│   │   │           └── HeatsCard.tsx          # Heats DataGrid (all heats for competition)
│   ├── components/
│   │   ├── dialogs/competition/               # Competition-level dialogs
│   │   │   └── section/                       # Heat & section dialogs
│   │   │       └── _components/               # Sub-components (SectionHeats, SectionHeatRowButtons, etc.)
│   │   ├── forms/
│   │   │   ├── CustomInput.tsx                # Unified input (text/email/password/select/date/etc.)
│   │   │   └── CustomSelectInput.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                     # Sticky AppBar with brand + ThemeToggleButton + UserMenu
│   │   │   ├── Footer.tsx                     # Copyright footer with current year
│   │   │   ├── ThemeToggleButton.tsx          # Light/dark toggle via useColorScheme
│   │   │   ├── MenuButtons.tsx                # Icon/text button that opens a dropdown Menu
│   │   │   ├── CustomAppTitle.tsx             # Toolpad app title slot (shows competition name/status)
│   │   │   └── CustomToolbarAction.tsx        # Toolpad toolbar actions slot
│   │   ├── pdf/                               # @react-pdf/renderer documents
│   │   └── UserMenu.tsx                       # Avatar dropdown (profile, sign out)
│   ├── contexts/
│   │   └── AuthContext.tsx                    # Supabase user context (user, loading, signOut)
│   ├── hooks/
│   │   ├── useAdjudicators.ts
│   │   └── usePanels.ts
│   ├── lib/
│   │   ├── prisma.ts                          # PrismaClient singleton (server-only)
│   │   ├── safeAction.ts                      # next-safe-action client with Supabase auth middleware
│   │   ├── skating.ts                         # Skating system algorithm
│   │   └── supabase/                          # client.ts | server.ts | middleware.ts
│   ├── schemas/
│   │   ├── AuthSchema.ts                      # SignInSchema, SignUpSchema (Zod)
│   │   ├── CommonSchema.ts
│   │   ├── CompetitionAdjudicatorsSchema.ts
│   │   ├── CompetitionDetailsForm.ts
│   │   ├── MarksSchemas.ts
│   │   ├── PanelSchema.ts
│   │   └── SectionSchema.ts
│   ├── server/competitions/                   # All competition server actions
│   │   ├── index.ts                           # Re-exports everything
│   │   ├── competitionActions.ts
│   │   ├── sectionActions.ts
│   │   ├── heatActions.ts
│   │   ├── marksActions.ts
│   │   ├── adjudicatorActions.ts
│   │   ├── panelActions.ts
│   │   ├── dancerActions.ts
│   │   └── pdfActions.ts
│   ├── server/scrutineer/                     # Scrutineer-specific actions (auth)
│   ├── utils/
│   │   ├── heatUtils.ts                       # getHeatStatusColor, getHeatTypeColor
│   │   └── dayjs.ts
│   ├── constants/dances.ts
│   ├── theme.ts                               # MUI v7 CSS vars theme (light + dark)
│   ├── layout.tsx                             # Root layout (AppRouterCacheProvider + App)
│   └── page.tsx                               # Home page
└── middleware.ts                              # Supabase session refresh
```

## Key Patterns

### Server Actions
All mutations use `next-safe-action`. The `safeAction` client in `src/app/lib/safeAction.ts`:
- Validates Supabase auth; redirects to `/auth/sign-in` if unauthenticated
- Injects `ctx.user`, `ctx.path`, `ctx.competition_id` (parsed from referer at path index `[3]`)

```ts
export const myAction = safeAction
  .inputSchema(MySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { competition_id, user } = ctx;
  });
```

### Forms
All forms use **react-hook-form** + `zodResolver` + `Controller` wrapping `CustomInput`. Follow the pattern in `CompetitionDetailsDialog.tsx`:
```tsx
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => (
    <CustomInput
      {...field}
      value={field.value as any}
      inputType="text"
      error={!!errors.fieldName}
      helperText={errors.fieldName?.message}
      variant="outlined"
    />
  )}
/>
```
Note: cast `value={field.value as any}` and `onChange={handler as any}` to work around the `CustomInputProps` intersection type.

### CustomInput inputTypes
`text` | `email` | `password` (with show/hide toggle) | `number` | `select` | `autocomplete` | `date` | `search` | `textarea` | `checkbox`

### Theme
MUI v7 CSS variables theme in `theme.ts` with `colorSchemes: { light, dark }`. Toggle via `useColorScheme()` from `@mui/material/styles`. The `colorSchemeSelector` is `data-toolpad-color-scheme`.

### Prisma
- Client is in `src/app/lib/prisma.ts` — guarded with `import "server-only"`
- Uses `PrismaPg` adapter with direct `pg` connection string
- `serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg']` in `next.config.ts`

### ESLint
- `indent` rule is **off** (caused stack overflow crashes on complex JSX in Vercel builds)
- `react/jsx-indent` and `react/jsx-indent-props` are set to 4 spaces

## Domain Concepts

| Term | Description |
|---|---|
| Competition | Top-level event |
| Section | Division within a competition (e.g. "Novice Latin") |
| Heat | A round within a section (ROUND, QUARTER_FINAL, SEMI_FINAL, FINAL, UNCONTESTED) |
| Adjudicator | Judge assigned to a panel |
| Panel | Group of adjudicators for a section |
| Dancer | Competitor registered in a section |
| Marks | Scores/callbacks submitted by adjudicators per heat |
| Start List | The set of dancers competing in a specific heat |

## Heat Status Flow
`DRAFT` → `ACTIVE` → `MARSHALLING` → `READY` → `JUDGING` → `REVIEWING` → `CHECKING` → `COMPLETE`
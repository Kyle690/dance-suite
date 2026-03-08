# Finals Result Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a finals result dialog with print support — shows skating working + placings for CHECKING/COMPLETE heats, no approval action.

**Architecture:** Four independent pieces: (1) PDF document component for react-pdf, (2) `printFinalResult` server action, (3) `HeatFinalResultDialog` UI component cloned from the review dialog, (4) wire-up in `SectionHeatRowButtons`. Data flows from `getHeatRoundMarks` → `buildSkatingResults` (pure TS, works server-side) → PDF renderer.

**Tech Stack:** Next.js 15, React 19, TypeScript, MUI 7, @react-pdf/renderer, next-safe-action 8, TanStack Query 5, notistack, @toolpad/core dialogs, Prisma/Zod (for server action input schema)

---

## Context

### Key files to read before starting

- **Design doc:** `docs/plans/2026-03-08-final-result-dialog-design.md`
- **Template dialog (clone this):** `src/app/components/dialogs/competition/section/HeatFinalReviewDialog.tsx`
- **Template PDF (follow this pattern):** `src/app/components/pdf/HeatRoundResultDocument.tsx`
- **Template print action (follow this pattern):** `src/app/server/competitions/pdfActions.ts`
- **Template print dialog pattern:** `src/app/components/dialogs/competition/section/HeatRoundResultDialog.tsx` (for split button)
- **Skating types:** `src/app/lib/skating.ts` — `SkatingResults`, `DanceResult`, `DancerDanceResult`, `CombinedDancerResult`
- **Server actions barrel:** `src/app/server/competitions/index.ts`
- **Wire-up target:** `src/app/components/dialogs/competition/section/_components/SectionHeatRowButtons.tsx`

### Skating types reminder

`DancerDanceResult` has: `dancer_number`, `name`, `partner_name`, `judgeMarks: JudgeMark[]`, `ordinalCounts: number[]`, `majorityAt: number`, `resolvedAt: number`, `place: number`, `rule: 'R9' | 'R10'`

`DanceResult` has: `dance: string`, `majority: number`, `numDancers: number`, `dancers: DancerDanceResult[]`

`CombinedDancerResult` has: `dancer_id`, `dancer_number`, `name`, `partner_name`, `perDancePlaces: { dance: string; place: number }[]`, `total: number`, `place: number`, `rule: 'R9' | 'R11'`

`SkatingResults` has: `perDance: DanceResult[]`, `combined: CombinedDancerResult[]`, `rule11: Rule11Result | null`

`rule11` is `null` when no ties, otherwise `{ explanation: string }`

### getHeatRoundMarks return shape

The action returns `res.data` with:
```ts
{
  item_no: string | null
  section: { name: string | null }
  dances: string[]
  panel: {
    panels_adjudicators: {
      adjudicator_id: string
      adjudicator: { letter: string }
    }[]
  } | null
  start_list: { uid: string; number: number | null; name: string | null; partner_name: string | null }[]
  heat_marks: {
    adjudicator_id: string
    marks: { dancer_id: string | null; dancer_number: number; dance: string; mark: number | null }[]
  }[]
  competition: { name: string | null; venue: string | null; date: Date | null; organization: string | null }
}
```

---

## Task 1: PDF Document Component

**Files:**
- Create: `src/app/components/pdf/HeatFinalResultDocument.tsx`

### Step 1: Create the file with types, styles, and page header

Follow the style constants from `HeatRoundResultDocument.tsx` exactly (same GREY, BORDER, HEADER_BG, formatDate, PageHeader).

```tsx
import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { startCase, toLower } from 'lodash';
import { SkatingResults, DanceResult, DancerDanceResult } from '@/app/lib/skating';

export type FinalPrintMode = 'both' | 'working' | 'result';

export type HeatFinalResultDocumentProps = {
    mode: FinalPrintMode;
    data: {
        item_no: string | null;
        section_name: string | null;
        competition: {
            name: string | null;
            venue: string | null;
            date: Date | string | null;
            organization: string | null;
        };
        adjudicators: { letter: string }[];
        skatingResults: SkatingResults;
    };
};

const GREY = '#555555';
const BORDER = '#cccccc';
const HEADER_BG = '#f0f0f0';
const BOLD_BG = '#fff9c4';   // pale yellow highlight for resolved cell

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 8,
        paddingTop: 24,
        paddingBottom: 24,
        paddingHorizontal: 24,
        color: '#111111',
    },
    headerBlock: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#111111',
        paddingBottom: 4,
        marginBottom: 6,
    },
    compName: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    compMeta: { fontSize: 7, color: GREY },
    heatMeta: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 3 },
    sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 6 },
    panelRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4, gap: 3 },
    panelChip: {
        backgroundColor: HEADER_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
        fontSize: 7,
    },
    danceTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 6, marginBottom: 2 },
    majorityCaption: { fontSize: 7, color: GREY, marginBottom: 4 },
    table: { borderWidth: 1, borderColor: BORDER, borderRadius: 2, overflow: 'hidden' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
    tableRowEven: { backgroundColor: '#fafafa' },
    cell: {
        borderRightWidth: 0.5,
        borderRightColor: BORDER,
        paddingVertical: 2,
        paddingHorizontal: 2,
        textAlign: 'center',
        fontSize: 7,
    },
    cellLast: { borderRightWidth: 0 },
    cellHeader: { fontFamily: 'Helvetica-Bold', backgroundColor: HEADER_BG, fontSize: 7 },
    cellResolved: { fontFamily: 'Helvetica-Bold', backgroundColor: BOLD_BG },
    divider: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 8 },
    // Result page
    resultTable: { borderWidth: 1, borderColor: BORDER, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
    resultRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
});

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}
```

### Step 2: Add PageHeader and WorkingPage

```tsx
const PageHeader = ({ data }: Pick<HeatFinalResultDocumentProps, 'data'>) => {
    const meta = [data.competition.organization, data.competition.venue, formatDate(data.competition.date)]
        .filter(Boolean)
        .join('   ·   ');
    return (
        <View style={styles.headerBlock}>
            <Text style={styles.compName}>{data.competition.name ?? ''}</Text>
            {meta ? <Text style={styles.compMeta}>{meta}</Text> : null}
            <Text style={styles.heatMeta}>
                {`Item No. ${data.item_no ?? ''}  —  ${startCase(toLower(String(data.section_name)))}  —  Finals`}
            </Text>
        </View>
    );
};

// Column width helpers
const NO_W = 22;
const JUDGE_W = 18;
const ORDINAL_W = 20;
const PLACE_W = 26;
const RULE_W = 22;
const DANCE_W = 36;
const TOTAL_W = 26;
const NAME_W = 80;

const WorkingPage = ({ data }: Pick<HeatFinalResultDocumentProps, 'data'>) => {
    const { adjudicators, skatingResults } = data;
    const numJudges = adjudicators.length;

    return (
        <Page size="A4" orientation="landscape" style={styles.page}>
            <PageHeader data={data} />
            <Text style={styles.sectionTitle}>Finals Working — Rules 9, 10 &amp; 11</Text>

            {/* Panel strip */}
            {adjudicators.length > 0 && (
                <View style={styles.panelRow}>
                    {adjudicators.map((adj, i) => (
                        <Text key={i} style={styles.panelChip}>{adj.letter}</Text>
                    ))}
                </View>
            )}

            {/* Per-dance tables */}
            {skatingResults.perDance.map((dr) => {
                const numDancers = dr.numDancers;
                const ordinals = Array.from({ length: numDancers }, (_, i) => i + 1);
                return (
                    <View key={dr.dance}>
                        <Text style={styles.danceTitle}>{startCase(toLower(dr.dance))}</Text>
                        <Text style={styles.majorityCaption}>{`Majority required: ${dr.majority}`}</Text>
                        <View style={styles.table}>
                            {/* Header */}
                            <View style={styles.tableRow}>
                                <Text style={[styles.cell, styles.cellHeader, { width: NO_W }]}>No.</Text>
                                {adjudicators.map((adj, i) => (
                                    <Text key={i} style={[styles.cell, styles.cellHeader, { width: JUDGE_W }]}>{adj.letter}</Text>
                                ))}
                                {ordinals.map((p) => (
                                    <Text key={p} style={[styles.cell, styles.cellHeader, { width: ORDINAL_W }]}>{`1-${p}`}</Text>
                                ))}
                                <Text style={[styles.cell, styles.cellHeader, { width: PLACE_W }]}>Place</Text>
                                <Text style={[styles.cell, styles.cellHeader, styles.cellLast, { width: RULE_W }]}>Rule</Text>
                            </View>
                            {/* Dancer rows */}
                            {dr.dancers.map((dancer, ri) => (
                                <View key={dancer.dancer_id} style={[styles.tableRow, ri % 2 === 0 ? styles.tableRowEven : {}]}>
                                    <Text style={[styles.cell, { width: NO_W }]}>{dancer.dancer_number}</Text>
                                    {adjudicators.map((adj, i) => {
                                        const jm = dancer.judgeMarks.find(j => j.adjudicator_id === adj.uid) ??
                                            dancer.judgeMarks[i];
                                        return (
                                            <Text key={i} style={[styles.cell, { width: JUDGE_W }]}>
                                                {jm?.mark ?? '-'}
                                            </Text>
                                        );
                                    })}
                                    {ordinals.map((p) => {
                                        const isResolved = p === dancer.resolvedAt;
                                        const isPast = dancer.resolvedAt !== Infinity && p > dancer.resolvedAt;
                                        const count = dancer.ordinalCounts[p] ?? 0;
                                        const showSum = isResolved && dancer.rule === 'R10';
                                        const sum = showSum
                                            ? dancer.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= p).reduce((s, jm) => s + jm.mark, 0)
                                            : null;
                                        const display = isPast ? '-' : count > 0 ? (showSum ? `${count}(${sum})` : String(count)) : '';
                                        return (
                                            <Text key={p} style={[styles.cell, { width: ORDINAL_W }, isResolved ? styles.cellResolved : {}]}>
                                                {display}
                                            </Text>
                                        );
                                    })}
                                    <Text style={[styles.cell, { width: PLACE_W }]}>{dancer.place}</Text>
                                    <Text style={[styles.cell, styles.cellLast, { width: RULE_W }]}>{dancer.rule}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            })}

            <View style={styles.divider} />

            {/* Combined result table */}
            <Text style={styles.sectionTitle}>Final Result</Text>
            <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableRow}>
                    <Text style={[styles.cell, styles.cellHeader, { width: NO_W }]}>No.</Text>
                    {skatingResults.perDance.map((dr) => (
                        <Text key={dr.dance} style={[styles.cell, styles.cellHeader, { width: DANCE_W }]}>
                            {startCase(toLower(dr.dance)).substring(0, 5)}
                        </Text>
                    ))}
                    <Text style={[styles.cell, styles.cellHeader, { width: TOTAL_W }]}>Total</Text>
                    <Text style={[styles.cell, styles.cellHeader, { width: PLACE_W }]}>Place</Text>
                    <Text style={[styles.cell, styles.cellHeader, styles.cellLast, { width: RULE_W }]}>Rule</Text>
                </View>
                {skatingResults.combined.map((dancer, ri) => (
                    <View key={dancer.dancer_id} style={[styles.tableRow, ri % 2 === 0 ? styles.tableRowEven : {}]}>
                        <Text style={[styles.cell, { width: NO_W }]}>{dancer.dancer_number}</Text>
                        {dancer.perDancePlaces.map((dp) => (
                            <Text key={dp.dance} style={[styles.cell, { width: DANCE_W }]}>{dp.place}</Text>
                        ))}
                        <Text style={[styles.cell, { width: TOTAL_W, fontFamily: 'Helvetica-Bold' }]}>{dancer.total}</Text>
                        <Text style={[styles.cell, { width: PLACE_W }]}>{dancer.place}</Text>
                        <Text style={[styles.cell, styles.cellLast, { width: RULE_W }]}>{dancer.rule}</Text>
                    </View>
                ))}
            </View>

            {/* Rule 11 section — only when ties */}
            {skatingResults.rule11 && (
                <>
                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Rule 11 — Tie Resolution</Text>
                    <Text style={[styles.majorityCaption, { marginBottom: 4 }]}>{skatingResults.rule11.explanation}</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <Text style={[styles.cell, styles.cellHeader, { width: NO_W }]}>No.</Text>
                            <Text style={[styles.cell, styles.cellHeader, { width: NAME_W }]}>Name</Text>
                            {skatingResults.perDance.map((dr) => (
                                <Text key={dr.dance} style={[styles.cell, styles.cellHeader, { width: DANCE_W }]}>
                                    {startCase(toLower(dr.dance)).substring(0, 5)}
                                </Text>
                            ))}
                            <Text style={[styles.cell, styles.cellHeader, { width: TOTAL_W }]}>Total</Text>
                            <Text style={[styles.cell, styles.cellHeader, styles.cellLast, { width: PLACE_W }]}>Place</Text>
                        </View>
                        {skatingResults.combined
                            .filter(d => d.rule === 'R11')
                            .map((dancer, ri) => (
                                <View key={dancer.dancer_id} style={[styles.tableRow, ri % 2 === 0 ? styles.tableRowEven : {}]}>
                                    <Text style={[styles.cell, { width: NO_W }]}>{dancer.dancer_number}</Text>
                                    <Text style={[styles.cell, { width: NAME_W }]}>
                                        {dancer.partner_name ? `${dancer.name} & ${dancer.partner_name}` : dancer.name}
                                    </Text>
                                    {dancer.perDancePlaces.map((dp) => (
                                        <Text key={dp.dance} style={[styles.cell, { width: DANCE_W }]}>{dp.place}</Text>
                                    ))}
                                    <Text style={[styles.cell, { width: TOTAL_W }]}>{dancer.total}</Text>
                                    <Text style={[styles.cell, styles.cellLast, { width: PLACE_W, fontFamily: 'Helvetica-Bold' }]}>{dancer.place}</Text>
                                </View>
                            ))}
                    </View>
                </>
            )}
        </Page>
    );
};
```

### Step 3: Add ResultPage and export

```tsx
const ResultPage = ({ data }: Pick<HeatFinalResultDocumentProps, 'data'>) => {
    const sorted = [...data.skatingResults.combined].sort((a, b) => a.place - b.place);
    return (
        <Page size="A4" orientation="portrait" style={styles.page}>
            <PageHeader data={data} />
            <Text style={styles.sectionTitle}>Final Result</Text>
            <View style={styles.resultTable}>
                {/* Header */}
                <View style={[styles.resultRow, { backgroundColor: HEADER_BG }]}>
                    <Text style={[styles.cell, styles.cellHeader, { width: 30 }]}>Place</Text>
                    <Text style={[styles.cell, styles.cellHeader, { width: 40 }]}>No.</Text>
                    <Text style={[styles.cell, styles.cellHeader, styles.cellLast, { flex: 1 }]}>Name</Text>
                </View>
                {sorted.map((dancer, ri) => {
                    const name = dancer.partner_name
                        ? `${dancer.name} & ${dancer.partner_name}`
                        : dancer.name;
                    return (
                        <View key={dancer.dancer_id} style={[styles.resultRow, ri % 2 === 0 ? styles.tableRowEven : {}]}>
                            <Text style={[styles.cell, { width: 30, fontFamily: 'Helvetica-Bold' }]}>{dancer.place}</Text>
                            <Text style={[styles.cell, { width: 40 }]}>{dancer.dancer_number}</Text>
                            <Text style={[styles.cell, styles.cellLast, { flex: 1, textAlign: 'left' }]}>{name}</Text>
                        </View>
                    );
                })}
            </View>
        </Page>
    );
};

export const HeatFinalResultDocument = ({ data, mode }: HeatFinalResultDocumentProps) => (
    <Document>
        {(mode === 'both' || mode === 'working') && <WorkingPage data={data} />}
        {(mode === 'both' || mode === 'result') && <ResultPage data={data} />}
    </Document>
);
```

### Step 4: Fix adjudicator lookup in WorkingPage

The `adjudicators` prop has `{ letter: string }` but the judge marks lookup uses `adjudicator_id`. The `DancerDanceResult.judgeMarks` array is ordered the same as the adjudicators array passed to `buildSkatingResults`. So use index-based lookup in the PDF — replace the judge mark cell render:

```tsx
// adjudicators are in same order as judgeMarks array (both sorted by letter)
{dancer.judgeMarks.map((jm, i) => (
    <Text key={i} style={[styles.cell, { width: JUDGE_W }]}>
        {jm.mark > 0 ? jm.mark : '-'}
    </Text>
))}
```

This is simpler and avoids the `adjudicator_id` lookup issue entirely.

### Step 5: Verify it compiles

```bash
cd /Users/kyle/Documents/playground/DS/dance-suite-scrutineer && npm run lint -- --max-warnings=0 2>&1 | grep -E "HeatFinalResultDocument|error" | head -20
```

No errors expected for this file at this point.

### Step 6: Commit

```bash
git add src/app/components/pdf/HeatFinalResultDocument.tsx
git commit -m "feat: add HeatFinalResultDocument PDF component for finals"
```

---

## Task 2: printFinalResult Server Action

**Files:**
- Modify: `src/app/server/competitions/pdfActions.ts`
- Modify: `src/app/server/competitions/index.ts`

### Step 1: Add `printFinalResult` to `pdfActions.ts`

Read `pdfActions.ts` first. Then append:

```ts
import { buildSkatingResults, RawMarkEntry, SkatingAdjudicator, SkatingDancer } from '@/app/lib/skating';
import { HeatFinalResultDocument, FinalPrintMode } from '@/app/components/pdf/HeatFinalResultDocument';
import { sortBy } from 'lodash';

const PrintFinalResultSchema = z.object({
    heat_id: z.string(),
    mode: z.enum(['both', 'working', 'result']),
});

export const printFinalResult = safeAction.inputSchema(PrintFinalResultSchema).action(async ({ parsedInput }) => {
    const res = await getHeatRoundMarks(parsedInput.heat_id);
    if (!res?.data) throw new Error('Heat data not found');

    const data = res.data;

    const adjudicators: SkatingAdjudicator[] = sortBy(
        data.panel?.panels_adjudicators?.map((p: any) => ({
            uid: p.adjudicator_id,
            letter: p.adjudicator.letter,
        })) ?? [],
        'letter',
    );

    const dancers: SkatingDancer[] = sortBy(
        data.start_list?.map((d: any) => ({
            uid: d.uid,
            number: d.number ?? 0,
            name: d.name ?? '',
            partner_name: d.partner_name ?? null,
        })) ?? [],
        'number',
    );

    const rawMarks: RawMarkEntry[] = (data.heat_marks ?? []).map((hm: any) => ({
        adjudicator_id: hm.adjudicator_id,
        adjudicator_letter: adjudicators.find(a => a.uid === hm.adjudicator_id)?.letter ?? '',
        marks: hm.marks.map((m: any) => ({
            dancer_id: m.dancer_id ?? '',
            dancer_number: m.dancer_number,
            dance: m.dance,
            mark: m.mark ?? 0,
        })),
    }));

    const skatingResults = buildSkatingResults(data.dances ?? [], adjudicators, dancers, rawMarks);

    const buffer = await renderToBuffer(
        React.createElement(HeatFinalResultDocument, {
            data: {
                item_no: data.item_no ?? null,
                section_name: data.section?.name ?? null,
                competition: {
                    name: data.competition?.name ?? null,
                    venue: data.competition?.venue ?? null,
                    date: data.competition?.date ?? null,
                    organization: data.competition?.organization ?? null,
                },
                adjudicators: adjudicators.map(a => ({ letter: a.letter })),
                skatingResults,
            },
            mode: parsedInput.mode as FinalPrintMode,
        }) as React.ReactElement<DocumentProps>
    );

    return buffer.toString('base64');
});
```

Note: `getHeatRoundMarks` is already imported at the top of `pdfActions.ts`. If not, add:
```ts
import { getHeatRoundMarks } from '@/app/server/competitions/marksActions';
```

Also need: `import { sortBy } from 'lodash';`

### Step 2: Export from barrel

In `src/app/server/competitions/index.ts`, find the pdfActions exports and add:

```ts
export { printFinalResult } from './pdfActions';
```

### Step 3: Verify

```bash
cd /Users/kyle/Documents/playground/DS/dance-suite-scrutineer && npm run lint -- --max-warnings=0 2>&1 | grep -E "pdfActions|error" | head -20
```

### Step 4: Commit

```bash
git add src/app/server/competitions/pdfActions.ts src/app/server/competitions/index.ts
git commit -m "feat: add printFinalResult server action"
```

---

## Task 3: HeatFinalResultDialog

**Files:**
- Create: `src/app/components/dialogs/competition/section/HeatFinalResultDialog.tsx`

### Step 1: Read these files first

- `src/app/components/dialogs/competition/section/HeatFinalReviewDialog.tsx` — copy the display logic
- `src/app/components/dialogs/competition/section/HeatRoundResultDialog.tsx` — copy the split button + print handler

### Step 2: Create the dialog

The dialog is `HeatFinalReviewDialog` minus approve, plus split print button from `HeatRoundResultDialog`.

```tsx
'use client';
import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
    Alert,
    Box,
    Button,
    ButtonGroup,
    CircularProgress,
    ClickAwayListener,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grow,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { ArrowDropDown, Print } from '@mui/icons-material';
import { DialogProps } from '@toolpad/core';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { sortBy, startCase, toLower } from 'lodash';
import { getHeatRoundMarks, printFinalResult } from '@/app/server/competitions';
import { buildSkatingResults, DanceResult, RawMarkEntry } from '@/app/lib/skating';
import { FinalPrintMode } from '@/app/components/pdf/HeatFinalResultDocument';

type HeatFinalResultDialogProps = {
    heat_id: string;
};

const PRINT_OPTIONS: { label: string; mode: FinalPrintMode }[] = [
    { label: 'Print Working + Results', mode: 'both' },
    { label: 'Print Working Only', mode: 'working' },
    { label: 'Print Results Only', mode: 'result' },
];

const HeatFinalResultDialog: React.FC<DialogProps<HeatFinalResultDialogProps>> = ({
    open,
    onClose,
    payload,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [printing, setPrinting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

    // ── Data loading ───────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['get-final-result-data', payload.heat_id],
        queryFn: async () => {
            const res = await getHeatRoundMarks(payload.heat_id);
            return res.data;
        },
        enabled: open && Boolean(payload.heat_id),
    });

    // ── Skating calculation ────────────────────────────────────────────────────
    const adjudicators = useMemo(
        () =>
            sortBy(
                data?.panel?.panels_adjudicators?.map(p => ({
                    uid: p.adjudicator_id,
                    letter: p.adjudicator.letter,
                })),
                'letter',
            ) ?? [],
        [data],
    );

    const skatingResults = useMemo(() => {
        if (!data) return null;

        const dancers = sortBy(
            data.start_list?.map(d => ({
                uid: d.uid,
                number: d.number ?? 0,
                name: d.name ?? '',
                partner_name: d.partner_name ?? null,
            })),
            'number',
        );

        const rawMarks: RawMarkEntry[] = data.heat_marks.map(hm => ({
            adjudicator_id: hm.adjudicator_id,
            adjudicator_letter: adjudicators.find(a => a.uid === hm.adjudicator_id)?.letter ?? '',
            marks: hm.marks.map(m => ({
                dancer_id: m.dancer_id ?? '',
                dancer_number: m.dancer_number,
                dance: m.dance,
                mark: m.mark ?? 0,
            })),
        }));

        return buildSkatingResults(data.dances ?? [], adjudicators, dancers, rawMarks);
    }, [data, adjudicators]);

    // ── Print handler ──────────────────────────────────────────────────────────
    const handlePrint = useCallback(async (mode: FinalPrintMode) => {
        setMenuOpen(false);
        setPrinting(true);
        try {
            const result = await printFinalResult({ heat_id: payload.heat_id, mode });
            const base64 = result?.data;
            if (!base64) {
                enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
                return;
            }
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch {
            enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
        } finally {
            setPrinting(false);
        }
    }, [payload.heat_id, enqueueSnackbar]);

    // ── Per-dance table renderer ───────────────────────────────────────────────
    const renderDanceTable = (danceResult: DanceResult) => {
        const numDancers = danceResult.numDancers;
        const ordinals = Array.from({ length: numDancers }, (_, i) => i + 1);

        return (
            <Box key={danceResult.dance} mb={4}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    {startCase(toLower(danceResult.dance))}
                </Typography>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 500, '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">No.</TableCell>
                                {adjudicators.map(adj => (
                                    <TableCell key={adj.uid} align="center">{adj.letter}</TableCell>
                                ))}
                                {ordinals.map(p => (
                                    <TableCell key={p} align="center" sx={{ fontFamily: 'monospace' }}>
                                        1-{p}
                                    </TableCell>
                                ))}
                                <TableCell align="center">Place</TableCell>
                                <TableCell align="center">Rule</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {danceResult.dancers.map(dancer => (
                                <TableRow key={dancer.dancer_id}>
                                    <TableCell align="center">{dancer.dancer_number}</TableCell>
                                    {adjudicators.map(adj => {
                                        const jm = dancer.judgeMarks.find(j => j.adjudicator_id === adj.uid);
                                        return (
                                            <TableCell key={adj.uid} align="center">
                                                {jm?.mark && jm.mark > 0 ? jm.mark : '-'}
                                            </TableCell>
                                        );
                                    })}
                                    {ordinals.map(p => {
                                        const isResolvedCell = p === dancer.resolvedAt;
                                        const isPastResolved = dancer.resolvedAt !== Infinity && p > dancer.resolvedAt;
                                        const count = dancer.ordinalCounts[p];
                                        const showSum = isResolvedCell && dancer.rule === 'R10';
                                        const sum = showSum
                                            ? dancer.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= p).reduce((s, jm) => s + jm.mark, 0)
                                            : null;
                                        return (
                                            <TableCell
                                                key={p}
                                                align="center"
                                                sx={isResolvedCell ? { fontWeight: 'bold' } : undefined}
                                            >
                                                {isPastResolved
                                                    ? '-'
                                                    : count > 0
                                                      ? showSum ? `${count}(${sum})` : count
                                                      : ''}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell align="center">{dancer.place}</TableCell>
                                    <TableCell align="center">{dancer.rule}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} fullWidth maxWidth="lg">
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {data?.item_no} — Finals Result
                    </Typography>
                    <Typography variant="h6">
                        {startCase(toLower(String(data?.section?.name)))}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <Stack alignItems="center" justifyContent="center" py={6}>
                        <CircularProgress />
                    </Stack>
                ) : !skatingResults ? null : (
                    <Stack spacing={4} mt={1}>
                        {/* Per-dance tables */}
                        <Box>
                            <Typography variant="h6" mb={2}>Per-Dance Results (Rules 9 &amp; 10)</Typography>
                            {skatingResults.perDance.map(dr => renderDanceTable(dr))}
                        </Box>

                        <Divider />

                        {/* Combined result table */}
                        <Box>
                            <Typography variant="h6" mb={2}>Final Result</Typography>
                            <TableContainer>
                                <Table size="small" sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center">No.</TableCell>
                                            {skatingResults.perDance.map(dr => (
                                                <TableCell key={dr.dance} align="center">
                                                    {startCase(toLower(dr.dance))}
                                                </TableCell>
                                            ))}
                                            <TableCell align="center">Total</TableCell>
                                            <TableCell align="center">Place</TableCell>
                                            <TableCell align="center">Rule</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {skatingResults.combined.map(dancer => (
                                            <TableRow key={dancer.dancer_id}>
                                                <TableCell align="center">{dancer.dancer_number}</TableCell>
                                                {dancer.perDancePlaces.map(dp => (
                                                    <TableCell key={dp.dance} align="center">{dp.place}</TableCell>
                                                ))}
                                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{dancer.total}</TableCell>
                                                <TableCell align="center">{dancer.place}</TableCell>
                                                <TableCell align="center">{dancer.rule}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Rule 11 table */}
                        {skatingResults.rule11 && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="h6" mb={1}>Rule 11 — Tie Resolution</Typography>
                                    <Alert severity="info" sx={{ mb: 2 }}>{skatingResults.rule11.explanation}</Alert>
                                    <TableContainer>
                                        <Table size="small" sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider' } }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align="center">No.</TableCell>
                                                    <TableCell>Name</TableCell>
                                                    {skatingResults.perDance.map(dr => (
                                                        <TableCell key={dr.dance} align="center">
                                                            {startCase(toLower(dr.dance))}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center">Total</TableCell>
                                                    <TableCell align="center">Final Place</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {skatingResults.combined
                                                    .filter(d => d.rule === 'R11')
                                                    .map(dancer => (
                                                        <TableRow key={dancer.dancer_id}>
                                                            <TableCell align="center">{dancer.dancer_number}</TableCell>
                                                            <TableCell>{dancer.name}</TableCell>
                                                            {dancer.perDancePlaces.map(dp => (
                                                                <TableCell key={dp.dance} align="center">{dp.place}</TableCell>
                                                            ))}
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{dancer.total}</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{dancer.place}</TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                <ButtonGroup ref={anchorRef} variant="outlined" size="small" color="primary" disabled={!skatingResults || printing}>
                    <Button
                        onClick={() => handlePrint('both')}
                        startIcon={printing ? <CircularProgress size={14} /> : <Print />}
                    >
                        Print
                    </Button>
                    <Button size="small" onClick={() => setMenuOpen(prev => !prev)} sx={{ px: 0.5, minWidth: 28 }}>
                        <ArrowDropDown />
                    </Button>
                </ButtonGroup>
                <Popper open={menuOpen} anchorEl={anchorRef.current} placement="top-end" transition disablePortal style={{ zIndex: 9999 }}>
                    {({ TransitionProps }) => (
                        <Grow {...TransitionProps} style={{ transformOrigin: 'right bottom' }}>
                            <Paper elevation={4}>
                                <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
                                    <MenuList dense>
                                        {PRINT_OPTIONS.map(opt => (
                                            <MenuItem key={opt.mode} onClick={() => handlePrint(opt.mode)}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
                <Button size="small" color="inherit" variant="contained" onClick={() => onClose()}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default HeatFinalResultDialog;
```

### Step 3: Verify lint

```bash
cd /Users/kyle/Documents/playground/DS/dance-suite-scrutineer && npm run lint -- --max-warnings=0 2>&1 | grep -E "HeatFinalResultDialog|error" | head -20
```

Fix any lint errors before committing.

### Step 4: Commit

```bash
git add src/app/components/dialogs/competition/section/HeatFinalResultDialog.tsx
git commit -m "feat: add HeatFinalResultDialog"
```

---

## Task 4: Wire Up in SectionHeatRowButtons

**Files:**
- Modify: `src/app/components/dialogs/competition/section/_components/SectionHeatRowButtons.tsx`

### Step 1: Read the current file

Read `src/app/components/dialogs/competition/section/_components/SectionHeatRowButtons.tsx` in full.

### Step 2: Add import

Add at the top with the other dialog imports:
```ts
import HeatFinalResultDialog from '@/app/components/dialogs/competition/section/HeatFinalResultDialog';
```

### Step 3: Update CHECKING status block

Find this block (around line 206):
```ts
if(data?.status===HeatStatus.CHECKING){
    return [
        {
            label:'Review Result',
            icon:<ListAlt color={'info'}/>,
            onClick:async()=>{
                await dialogs.open(HeatRoundResultDialog, {
                    heatId:String(data?.uid)
                })
            },
        },
```

Replace the `onClick` to open the correct dialog based on heat type:
```ts
if(data?.status===HeatStatus.CHECKING){
    return [
        {
            label:'Review Result',
            icon:<ListAlt color={'info'}/>,
            onClick:async()=>{
                if (data?.type === HeatType.FINAL) {
                    await dialogs.open(HeatFinalResultDialog, { heat_id: String(data?.uid) });
                } else {
                    await dialogs.open(HeatRoundResultDialog, { heatId: String(data?.uid) });
                }
                refetch();
            },
        },
```

### Step 4: Update COMPLETE status block

Find `defaults[6]` — the "Review Result" entry for COMPLETE status (around line 126):
```ts
{
    label:'Review Result',
    icon:<ListAlt color={'info'}/>,
    onClick:async()=>{
        await dialogs.open(HeatRoundResultDialog, {
            heatId:String(data?.uid)
        })
    },
},
```

Replace the `onClick`:
```ts
{
    label:'Review Result',
    icon:<ListAlt color={'info'}/>,
    onClick:async()=>{
        if (data?.type === HeatType.FINAL) {
            await dialogs.open(HeatFinalResultDialog, { heat_id: String(data?.uid) });
        } else {
            await dialogs.open(HeatRoundResultDialog, { heatId: String(data?.uid) });
        }
    },
},
```

### Step 5: Verify lint

```bash
cd /Users/kyle/Documents/playground/DS/dance-suite-scrutineer && npm run lint -- --max-warnings=0 2>&1 | grep -E "SectionHeatRowButtons|error" | head -20
```

### Step 6: Commit

```bash
git add src/app/components/dialogs/competition/section/_components/SectionHeatRowButtons.tsx
git commit -m "feat: wire up HeatFinalResultDialog for finals in CHECKING/COMPLETE status"
```

---

## Final Verification

```bash
cd /Users/kyle/Documents/playground/DS/dance-suite-scrutineer && npm run lint 2>&1 | tail -5
```

Expected: no errors, warnings acceptable.

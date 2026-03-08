# Finals Result Dialog — Design

**Date:** 2026-03-08

## Goal

Build a `HeatFinalResultDialog` that displays the skating system working and final placings for a completed finals heat (status CHECKING or COMPLETE), with print support. No approval action — print only.

---

## Data Layer

### Reuse: `getHeatRoundMarks(heat_id)`

Same server action used by `HeatFinalReviewDialog`. Returns raw marks, panel, start list, dances, section name. No new server action required for the dialog.

### New server action: `printFinalResult({ heat_id, mode })`

In `pdfActions.ts`:
- Calls `getHeatRoundMarks(heat_id)` to fetch raw data
- Runs `buildSkatingResults` server-side (pure TS, no browser deps)
- Renders `HeatFinalResultDocument` via `renderToBuffer`
- Returns base64-encoded PDF string

Input schema:
```ts
z.object({
    heat_id: z.string(),
    mode: z.enum(['both', 'working', 'result']),
})
```

---

## PDF Document

### `src/app/components/pdf/HeatFinalResultDocument.tsx`

`PrintMode = 'both' | 'working' | 'result'`

**`WorkingPage`** — scrutineering sheet format:
- Page header (competition name, venue, date, item no., section)
- Panel strip (adjudicator chips)
- Per-dance tables (one per dance):
  - Columns: No. | [A] [B] [C]... | [1-1] [1-2] ... [1-N] | Place | Rule
  - Ordinal cells: show cumulative count up to `resolvedAt`, `-` after
  - Bold cell at `resolvedAt`; `count(sum)` format for R10
  - Caption: `Majority required: N`
- Combined result table:
  - Columns: No. | [Dance 1] [Dance 2]... | Total | Place | Rule
- Rule 11 section (conditional): tied dancers, per-dance places, final place

**`ResultPage`** — clean result:
- Page header
- Simple table: No. | Name | Place
- Dancers sorted by place (ascending)

### Document root

```tsx
export const HeatFinalResultDocument = ({ data, mode }) => (
    <Document>
        {(mode === 'both' || mode === 'working') && <WorkingPage data={data} />}
        {(mode === 'both' || mode === 'result') && <ResultPage data={data} />}
    </Document>
);
```

### Data shape passed to document

```ts
type HeatFinalResultDocumentProps = {
    mode: PrintMode;
    data: {
        item_no: string | null;
        section_name: string | null;
        competition: { name; venue; date; organization };
        adjudicators: { letter: string }[];
        skatingResults: SkatingResults;  // from buildSkatingResults
    };
};
```

---

## Dialog UI

### `src/app/components/dialogs/competition/section/HeatFinalResultDialog.tsx`

Payload: `{ heat_id: string }`

**Structure:** Identical content to `HeatFinalReviewDialog` (per-dance ordinal tables, combined result table, Rule 11 section) — copy rendering logic, remove Approve button.

**Footer actions:**
- Split `ButtonGroup` (Print / dropdown arrow) — same pattern as `HeatRoundResultDialog`
- Print options:
  - `Print Working + Results` (`both`) — default button
  - `Print Working Only` (`working`)
  - `Print Results Only` (`result`)
- `Close` button

**Print flow** (same as `HeatRoundResultDialog`):
1. Call `printFinalResult({ heat_id, mode })`
2. Decode base64 → Blob → `URL.createObjectURL` → `window.open`
3. Revoke URL after 10s

---

## Wire-up

### `SectionHeatRowButtons.tsx`

Import `HeatFinalResultDialog`. Replace `HeatRoundResultDialog` for FINAL type heats:

- **CHECKING status** block: open `HeatFinalResultDialog` instead of `HeatRoundResultDialog` when `data.type === HeatType.FINAL`
- **COMPLETE status** block (`defaults[6]`): open `HeatFinalResultDialog` instead of `HeatRoundResultDialog` when `data.type === HeatType.FINAL`

---

## Files Affected

- **New**: `src/app/components/dialogs/competition/section/HeatFinalResultDialog.tsx`
- **New**: `src/app/components/pdf/HeatFinalResultDocument.tsx`
- **Modify**: `src/app/server/competitions/pdfActions.ts` — add `printFinalResult`
- **Modify**: `src/app/server/competitions/index.ts` — export `printFinalResult`
- **Modify**: `src/app/components/dialogs/competition/section/_components/SectionHeatRowButtons.tsx` — wire up new dialog

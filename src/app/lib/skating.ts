// src/app/lib/skating.ts
// Pure functions implementing the Skating System (Rules 9, 10, 11) for ballroom/Latin finals.
// No side effects. All inputs/outputs are plain data.

export type JudgeMark = {
    adjudicator_id: string
    letter: string
    mark: number
}

export type DancerDanceResult = {
    dancer_id: string
    dancer_number: number
    name: string
    partner_name: string | null
    judgeMarks: JudgeMark[]     // raw placement from each judge for this dance
    ordinalCounts: number[]     // index 1..N: count of judges with mark ≤ that ordinal
    majorityAt: number          // first ordinal where count ≥ majority (Infinity if never reached)
    resolvedAt: number          // ordinal where place was definitively resolved (may be > majorityAt for R10)
    place: number
    rule: 'R9' | 'R10'
}

export type DanceResult = {
    dance: string
    majority: number            // threshold (Math.floor(numJudges / 2) + 1)
    numDancers: number
    dancers: DancerDanceResult[]
}

export type CombinedDancerResult = {
    dancer_id: string
    dancer_number: number
    name: string
    partner_name: string | null
    perDancePlaces: { dance: string; place: number }[]
    total: number
    place: number
    rule: 'R9' | 'R11'
}

export type Rule11Result = {
    explanation: string
}

export type SkatingResults = {
    perDance: DanceResult[]
    combined: CombinedDancerResult[]
    rule11: Rule11Result | null
}

export type RawMarkEntry = {
    adjudicator_id: string
    adjudicator_letter: string
    marks: { dancer_id: string; dancer_number: number; dance: string; mark: number }[]
}

export type SkatingDancer = {
    uid: string
    number: number
    name: string
    partner_name: string | null
}

export type SkatingAdjudicator = {
    uid: string
    letter: string
    name:string
}

/**
 * Find the ordinal where the comparison between two dancers sharing the same majorityAt was resolved.
 * Returns the ordinal (>= majorityAt) where count or sum first differs, or Infinity if truly tied.
 */
function findResolvedAt(
    a: { majorityAt: number; ordinalCounts: number[]; judgeMarks: JudgeMark[] },
    b: { majorityAt: number; ordinalCounts: number[]; judgeMarks: JudgeMark[] },
    numDancers: number,
): number {
    const p = a.majorityAt;
    if (p === Infinity) return Infinity;

    if (a.ordinalCounts[p] !== b.ordinalCounts[p]) return p;
    const aSum = a.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= p).reduce((s, jm) => s + jm.mark, 0);
    const bSum = b.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= p).reduce((s, jm) => s + jm.mark, 0);
    if (aSum !== bSum) return p;

    for (let q = p + 1; q <= numDancers; q++) {
        if (a.ordinalCounts[q] !== b.ordinalCounts[q]) return q;
        const aQSum = a.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= q).reduce((s, jm) => s + jm.mark, 0);
        const bQSum = b.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= q).reduce((s, jm) => s + jm.mark, 0);
        if (aQSum !== bQSum) return q;
    }

    return Infinity;
}

/**
 * Compare two dancers within a single dance using Rules 9 & 10.
 * Returns negative if a is better, positive if b is better, 0 if truly tied.
 */
function compareSkating(
    a: Omit<DancerDanceResult, 'place' | 'rule' | 'resolvedAt'>,
    b: Omit<DancerDanceResult, 'place' | 'rule' | 'resolvedAt'>,
    numDancers: number,
): number {
    // Rule 9: lower majorityAt wins
    if (a.majorityAt !== b.majorityAt) {
        return a.majorityAt - b.majorityAt;
    }

    const p = a.majorityAt;
    if (p === Infinity) return 0; // neither reached majority — true tie at this level

    // Rule 10a: higher count at majorityAt wins
    const aCount = a.ordinalCounts[p];
    const bCount = b.ordinalCounts[p];
    if (aCount !== bCount) return bCount - aCount;

    // Rule 10b: lower sum of marks ≤ majorityAt wins
    const aSum = a.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= p).reduce((s, jm) => s + jm.mark, 0);
    const bSum = b.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= p).reduce((s, jm) => s + jm.mark, 0);
    if (aSum !== bSum) return aSum - bSum;

    // Continue to subsequent ordinals (extended Rule 10)
    for (let q = p + 1; q <= numDancers; q++) {
        const aQCount = a.ordinalCounts[q];
        const bQCount = b.ordinalCounts[q];
        if (aQCount !== bQCount) return bQCount - aQCount;

        const aQSum = a.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= q).reduce((s, jm) => s + jm.mark, 0);
        const bQSum = b.judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= q).reduce((s, jm) => s + jm.mark, 0);
        if (aQSum !== bQSum) return aQSum - bQSum;
    }

    return 0; // true tie
}

/**
 * Build skating results for a finals heat.
 *
 * @param dances      Array of dance names in order
 * @param adjudicators Array of adjudicators sorted by letter
 * @param dancers     Array of dancers sorted by number
 * @param rawMarks    Raw marks from heat_marks query
 */
export function buildSkatingResults(
    dances: string[],
    adjudicators: SkatingAdjudicator[],
    dancers: SkatingDancer[],
    rawMarks: RawMarkEntry[],
): SkatingResults {
    const numJudges = adjudicators.length;
    const numDancers = dancers.length;
    const majority = Math.floor(numJudges / 2) + 1;

    // ─── Per-dance results ────────────────────────────────────────────────────
    const perDance: DanceResult[] = dances.map(dance => {
        const dancerData = dancers.map(dancer => {
            const judgeMarks: JudgeMark[] = adjudicators.map(adj => {
                const adjEntry = rawMarks.find(r => r.adjudicator_id === adj.uid);
                const markEntry = adjEntry?.marks.find(m => m.dancer_id === dancer.uid && m.dance === dance);
                return { adjudicator_id: adj.uid, letter: adj.letter, mark: markEntry?.mark ?? 0 };
            });

            // Build ordinal counts (1-indexed, cumulative count of marks ≤ ordinal)
            const ordinalCounts: number[] = [ 0 ]; // index 0 unused
            for (let p = 1; p <= numDancers; p++) {
                ordinalCounts[p] = judgeMarks.filter(jm => jm.mark > 0 && jm.mark <= p).length;
            }

            // Find first ordinal where count ≥ majority
            let majorityAt = Infinity;
            for (let p = 1; p <= numDancers; p++) {
                if (ordinalCounts[p] >= majority) {
                    majorityAt = p;
                    break;
                }
            }

            return {
                dancer_id: dancer.uid,
                dancer_number: dancer.number,
                name: dancer.name,
                partner_name: dancer.partner_name,
                judgeMarks,
                ordinalCounts,
                majorityAt,
            };
        });

        // Sort by skating rules
        const sorted = [ ...dancerData ].sort((a, b) => compareSkating(a, b, numDancers));

        // Assign places (ties share a place; next place skips the tied count)
        const withPlaces: DancerDanceResult[] = [];
        for (let i = 0; i < sorted.length; i++) {
            if (i === 0) {
                withPlaces.push({ ...sorted[i], place: 1, rule: 'R9', resolvedAt: sorted[i].majorityAt });
            } else {
                const prev = withPlaces[i - 1];
                const cmp = compareSkating(sorted[i - 1], sorted[i], numDancers);
                if (cmp === 0) {
                    // True tie — same place, same rule
                    withPlaces.push({ ...sorted[i], place: prev.place, rule: prev.rule, resolvedAt: sorted[i].majorityAt });
                } else {
                    // Determine rule: R10 if another dancer shares the same majorityAt
                    const sharesOrdinal = sorted.some(
                        (d, idx) => idx !== i && d.majorityAt === sorted[i].majorityAt,
                    );
                    withPlaces.push({
                        ...sorted[i],
                        place: i + 1,
                        rule: sharesOrdinal ? 'R10' : 'R9',
                        resolvedAt: sorted[i].majorityAt,
                    });
                }
            }
        }

        // Second pass: for adjacent pairs sharing majorityAt, find the ordinal where
        // the tie was actually broken (may be > majorityAt for extended Rule 10)
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i - 1].majorityAt === sorted[i].majorityAt && sorted[i].majorityAt !== Infinity) {
                const r = findResolvedAt(sorted[i - 1], sorted[i], numDancers);
                withPlaces[i - 1].resolvedAt = Math.max(withPlaces[i - 1].resolvedAt, r);
                withPlaces[i].resolvedAt = Math.max(withPlaces[i].resolvedAt, r);
            }
        }

        return { dance, majority, numDancers, dancers: withPlaces };
    });

    // ─── Combined results (sum per-dance places) ──────────────────────────────
    const combined: CombinedDancerResult[] = dancers.map(dancer => {
        const perDancePlaces = perDance.map(dr => ({
            dance: dr.dance,
            place: dr.dancers.find(d => d.dancer_id === dancer.uid)?.place ?? 0,
        }));
        const total = perDancePlaces.reduce((s, p) => s + p.place, 0);
        return {
            dancer_id: dancer.uid,
            dancer_number: dancer.number,
            name: dancer.name,
            partner_name: dancer.partner_name,
            perDancePlaces,
            total,
            place: 0,
            rule: 'R9' as const,
        };
    });

    combined.sort((a, b) => a.total - b.total);

    // Assign combined places
    for (let i = 0; i < combined.length; i++) {
        if (i === 0) {
            combined[i].place = 1;
            combined[i].rule = 'R9';
        } else {
            if (combined[i].total === combined[i - 1].total) {
                combined[i].place = combined[i - 1].place;
                combined[i].rule = 'R11';
                combined[i - 1].rule = 'R11';
            } else {
                combined[i].place = i + 1;
                combined[i].rule = 'R9';
            }
        }
    }

    // ─── Rule 11: resolve tied combined totals ────────────────────────────────
    const hasTies = combined.some(d => d.rule === 'R11');

    if (hasTies) {
        const groups = new Map<number, CombinedDancerResult[]>();
        combined.forEach(d => {
            if (d.rule === 'R11') {
                const g = groups.get(d.total) ?? [];
                g.push(d);
                groups.set(d.total, g);
            }
        });

        groups.forEach(group => {
            if (group.length < 2) return;

            const resolvedGroup = [ ...group ].sort((a, b) => {
                for (let p = 1; p <= dances.length; p++) {
                    const aCount = a.perDancePlaces.filter(dp => dp.place <= p).length;
                    const bCount = b.perDancePlaces.filter(dp => dp.place <= p).length;
                    if (aCount !== bCount) return bCount - aCount;
                }
                return 0; // true tie — share the place
            });

            const startPlace = group[0].place;
            for (let i = 0; i < resolvedGroup.length; i++) {
                const dancer = combined.find(d => d.dancer_id === resolvedGroup[i].dancer_id)!;
                if (i === 0) {
                    dancer.place = startPlace;
                } else {
                    let trueTie = true;
                    for (let p = 1; p <= dances.length; p++) {
                        const prevCount = resolvedGroup[i - 1].perDancePlaces.filter(dp => dp.place <= p).length;
                        const currCount = resolvedGroup[i].perDancePlaces.filter(dp => dp.place <= p).length;
                        if (prevCount !== currCount) { trueTie = false; break; }
                    }
                    dancer.place = trueTie
                        ? combined.find(d => d.dancer_id === resolvedGroup[i - 1].dancer_id)!.place
                        : startPlace + i;
                }
            }
        });

        const tiedCount = combined.filter(d => d.rule === 'R11').length;
        return {
            perDance,
            combined,
            rule11: {
                explanation: `${tiedCount} dancers tied in combined totals. Rule 11 applied to determine final placings.`,
            },
        };
    }

    return { perDance, combined, rule11: null };
}

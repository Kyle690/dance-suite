import React from 'react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';
import { startCase, toLower } from 'lodash';
import type { SkatingResults, DancerDanceResult } from '@/app/lib/skating';

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
const BOLD_BG = '#fff9c4';

const NO_W = 22;
const JUDGE_W = 18;
const ORDINAL_W = 20;
const PLACE_W = 26;
const RULE_W = 22;
const DANCE_W = 36;
const TOTAL_W = 26;
const NAME_W = 80;

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        paddingTop: 28,
        paddingBottom: 28,
        paddingHorizontal: 28,
        color: '#111111',
    },
    // ---- page header ----
    headerBlock: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#111111',
        paddingBottom: 5,
        marginBottom: 8,
    },
    compName: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 2,
    },
    compMeta: {
        fontSize: 8,
        color: GREY,
    },
    heatMeta: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginTop: 3,
    },
    // ---- section title ----
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 3,
    },
    danceSubtitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginTop: 8,
        marginBottom: 2,
    },
    caption: {
        fontSize: 8,
        color: GREY,
        marginBottom: 4,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        marginVertical: 8,
    },
    rule11Title: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 2,
    },
    rule11Explanation: {
        fontSize: 8,
        color: GREY,
        marginBottom: 4,
    },
    // ---- panel strip ----
    panelRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 5,
        gap: 4,
    },
    panelChip: {
        backgroundColor: HEADER_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 3,
        paddingHorizontal: 5,
        paddingVertical: 2,
        fontSize: 8,
    },
    // ---- table ----
    table: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 2,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: BORDER,
    },
    tableRowEven: {
        backgroundColor: '#fafafa',
    },
    cell: {
        borderRightWidth: 0.5,
        borderRightColor: BORDER,
        paddingVertical: 2,
        paddingHorizontal: 2,
        textAlign: 'center',
        fontSize: 8,
    },
    cellLeft: {
        textAlign: 'left',
    },
    cellLast: {
        borderRightWidth: 0,
    },
    cellHeader: {
        fontFamily: 'Helvetica-Bold',
        backgroundColor: HEADER_BG,
        fontSize: 8,
    },
    cellBold: {
        fontFamily: 'Helvetica-Bold',
    },
    cellResolved: {
        backgroundColor: BOLD_BG,
        fontFamily: 'Helvetica-Bold',
    },
});

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

type PageData = HeatFinalResultDocumentProps['data'];

const PageHeader = ({ data }: { data: PageData }) => {
    const meta = [ data.competition.organization, data.competition.venue, formatDate(data.competition.date) ]
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

function getOrdinalCellContent(dancer: DancerDanceResult, p: number): { text: string; resolved: boolean; past: boolean } {
    const isPast = dancer.resolvedAt !== Infinity && p > dancer.resolvedAt;
    const isResolved = p === dancer.resolvedAt;
    const count = dancer.ordinalCounts[p] ?? 0;

    if (isPast) {
        return { text: '-', resolved: false, past: true };
    }

    if (isResolved && dancer.rule === 'R10') {
        // Show count(sum) format
        const sum = dancer.judgeMarks
            .filter(jm => jm.mark > 0 && jm.mark <= p)
            .reduce((s, jm) => s + jm.mark, 0);
        return { text: `${count}(${sum})`, resolved: true, past: false };
    }

    if (isResolved) {
        return { text: count > 0 ? String(count) : '', resolved: true, past: false };
    }

    return { text: count > 0 ? String(count) : '', resolved: false, past: false };
}

const WorkingPage = ({ data }: { data: PageData }) => {
    const { skatingResults, adjudicators } = data;

    // Build ordinal column headers: 1-1, 1-2, ..., 1-N
    const ordinalHeaders: string[] = [];
    if (skatingResults.perDance.length > 0) {
        const numDancers = skatingResults.perDance[0].numDancers;
        for (let i = 1; i <= numDancers; i++) {
            ordinalHeaders.push(`1-${i}`);
        }
    }

    const danceNames = skatingResults.perDance.map(dr => dr.dance);

    return (
        <Page
            size="A4"
            orientation="landscape"
            style={styles.page}
        >
            <PageHeader data={data} />

            {/* Panel strip */}
            {adjudicators.length > 0 && (
                <View style={styles.panelRow}>
                    {adjudicators.map((adj, i) => (
                        <Text key={i} style={styles.panelChip}>
                            {adj.letter}
                        </Text>
                    ))}
                </View>
            )}

            {/* Per-dance working tables */}
            {skatingResults.perDance.map((danceResult, di) => (
                <View key={di}>
                    <Text style={styles.danceSubtitle}>
                        {startCase(toLower(danceResult.dance))}
                    </Text>
                    <Text style={styles.caption}>
                        {`Majority required: ${danceResult.majority}`}
                    </Text>
                    <View style={styles.table}>
                        {/* Header row */}
                        <View style={styles.tableRow}>
                            <Text style={[ styles.cell, styles.cellHeader, { width: NO_W } ]}>No.</Text>
                            {adjudicators.map((adj, i) => (
                                <Text key={i} style={[ styles.cell, styles.cellHeader, { width: JUDGE_W } ]}>
                                    {adj.letter}
                                </Text>
                            ))}
                            {ordinalHeaders.map((h, i) => (
                                <Text key={i} style={[ styles.cell, styles.cellHeader, { width: ORDINAL_W } ]}>
                                    {h}
                                </Text>
                            ))}
                            <Text style={[ styles.cell, styles.cellHeader, { width: PLACE_W } ]}>Place</Text>
                            <Text style={[ styles.cell, styles.cellHeader, styles.cellLast, { width: RULE_W } ]}>Rule</Text>
                        </View>
                        {/* Data rows */}
                        {danceResult.dancers.map((dancer, ri) => (
                            <View
                                key={ri}
                                style={[ styles.tableRow, ri % 2 === 0 ? styles.tableRowEven : {} ]}
                            >
                                <Text style={[ styles.cell, { width: NO_W } ]}>{dancer.dancer_number}</Text>
                                {adjudicators.map((_adj, i) => {
                                    const mark = dancer.judgeMarks[i]?.mark ?? 0;
                                    return (
                                        <Text key={i} style={[ styles.cell, { width: JUDGE_W } ]}>
                                            {mark === 0 ? '-' : String(mark)}
                                        </Text>
                                    );
                                })}
                                {ordinalHeaders.map((_h, oi) => {
                                    const p = oi + 1;
                                    const { text, resolved } = getOrdinalCellContent(dancer, p);
                                    return (
                                        <Text
                                            key={oi}
                                            style={[
                                                styles.cell,
                                                { width: ORDINAL_W },
                                                resolved ? styles.cellResolved : {},
                                            ]}
                                        >
                                            {text}
                                        </Text>
                                    );
                                })}
                                <Text style={[ styles.cell, { width: PLACE_W } ]}>{dancer.place}</Text>
                                <Text style={[ styles.cell, styles.cellLast, { width: RULE_W } ]}>{dancer.rule}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ))}

            {/* Divider before combined */}
            <View style={styles.divider} />

            {/* Combined result table */}
            <Text style={styles.sectionTitle}>Combined Result</Text>
            <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableRow}>
                    <Text style={[ styles.cell, styles.cellHeader, { width: NO_W } ]}>No.</Text>
                    {danceNames.map((dance, i) => (
                        <Text key={i} style={[ styles.cell, styles.cellHeader, { width: DANCE_W } ]}>
                            {startCase(toLower(dance))}
                        </Text>
                    ))}
                    <Text style={[ styles.cell, styles.cellHeader, styles.cellBold, { width: TOTAL_W } ]}>Total</Text>
                    <Text style={[ styles.cell, styles.cellHeader, { width: PLACE_W } ]}>Place</Text>
                    <Text style={[ styles.cell, styles.cellHeader, styles.cellLast, { width: RULE_W } ]}>Rule</Text>
                </View>
                {/* Data rows */}
                {skatingResults.combined.map((dancer, ri) => (
                    <View
                        key={ri}
                        style={[ styles.tableRow, ri % 2 === 0 ? styles.tableRowEven : {} ]}
                    >
                        <Text style={[ styles.cell, { width: NO_W } ]}>{dancer.dancer_number}</Text>
                        {danceNames.map((dance, i) => {
                            const place = dancer.perDancePlaces.find(p => p.dance === dance)?.place ?? 0;
                            return (
                                <Text key={i} style={[ styles.cell, { width: DANCE_W } ]}>
                                    {place > 0 ? String(place) : ''}
                                </Text>
                            );
                        })}
                        <Text style={[ styles.cell, styles.cellBold, { width: TOTAL_W } ]}>{dancer.total}</Text>
                        <Text style={[ styles.cell, { width: PLACE_W } ]}>{dancer.place}</Text>
                        <Text style={[ styles.cell, styles.cellLast, { width: RULE_W } ]}>{dancer.rule}</Text>
                    </View>
                ))}
            </View>

            {/* Rule 11 section */}
            {skatingResults.rule11 !== null && (
                <View>
                    <View style={styles.divider} />
                    <Text style={styles.rule11Title}>Rule 11 — Tie Resolution</Text>
                    <Text style={styles.rule11Explanation}>{skatingResults.rule11.explanation}</Text>
                    <View style={styles.table}>
                        {/* Header */}
                        <View style={styles.tableRow}>
                            <Text style={[ styles.cell, styles.cellHeader, { width: NO_W } ]}>No.</Text>
                            <Text style={[ styles.cell, styles.cellHeader, styles.cellLeft, { width: NAME_W } ]}>Name</Text>
                            {danceNames.map((dance, i) => (
                                <Text key={i} style={[ styles.cell, styles.cellHeader, { width: DANCE_W } ]}>
                                    {startCase(toLower(dance))}
                                </Text>
                            ))}
                            <Text style={[ styles.cell, styles.cellHeader, styles.cellBold, { width: TOTAL_W } ]}>Total</Text>
                            <Text style={[ styles.cell, styles.cellHeader, styles.cellLast, { width: PLACE_W } ]}>Place</Text>
                        </View>
                        {/* Only R11 dancers */}
                        {skatingResults.combined
                            .filter(d => d.rule === 'R11')
                            .map((dancer, ri) => {
                                const name = dancer.partner_name
                                    ? `${dancer.name} & ${dancer.partner_name}`
                                    : dancer.name;
                                return (
                                    <View
                                        key={ri}
                                        style={[ styles.tableRow, ri % 2 === 0 ? styles.tableRowEven : {} ]}
                                    >
                                        <Text style={[ styles.cell, { width: NO_W } ]}>{dancer.dancer_number}</Text>
                                        <Text style={[ styles.cell, styles.cellLeft, { width: NAME_W } ]}>{name}</Text>
                                        {danceNames.map((dance, i) => {
                                            const place = dancer.perDancePlaces.find(p => p.dance === dance)?.place ?? 0;
                                            return (
                                                <Text key={i} style={[ styles.cell, { width: DANCE_W } ]}>
                                                    {place > 0 ? String(place) : ''}
                                                </Text>
                                            );
                                        })}
                                        <Text style={[ styles.cell, styles.cellBold, { width: TOTAL_W } ]}>{dancer.total}</Text>
                                        <Text style={[ styles.cell, styles.cellLast, { width: PLACE_W } ]}>{dancer.place}</Text>
                                    </View>
                                );
                            })}
                    </View>
                </View>
            )}
        </Page>
    );
};

const ResultPage = ({ data }: { data: PageData }) => {
    const { skatingResults } = data;
    const sorted = [ ...skatingResults.combined ].sort((a, b) => a.place - b.place);

    return (
        <Page
            size="A4"
            orientation="portrait"
            style={styles.page}
        >
            <PageHeader data={data} />

            <Text style={styles.sectionTitle}>Final Result</Text>

            <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableRow}>
                    <Text style={[ styles.cell, styles.cellHeader, { width: PLACE_W } ]}>Place</Text>
                    <Text style={[ styles.cell, styles.cellHeader, { width: NO_W } ]}>No.</Text>
                    <Text style={[ styles.cell, styles.cellHeader, styles.cellLeft, styles.cellLast, { flex: 1 } ]}>Name</Text>
                </View>
                {/* Data rows */}
                {sorted.map((dancer, ri) => {
                    const name = dancer.partner_name
                        ? `${dancer.name} & ${dancer.partner_name}`
                        : dancer.name;
                    return (
                        <View
                            key={ri}
                            style={[ styles.tableRow, ri % 2 === 0 ? styles.tableRowEven : {} ]}
                        >
                            <Text style={[ styles.cell, { width: PLACE_W } ]}>{dancer.place}</Text>
                            <Text style={[ styles.cell, { width: NO_W } ]}>{dancer.dancer_number}</Text>
                            <Text style={[ styles.cell, styles.cellLeft, styles.cellLast, { flex: 1 } ]}>{name}</Text>
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

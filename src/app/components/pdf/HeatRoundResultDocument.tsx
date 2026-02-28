import React from 'react';
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';
import { startCase, toLower } from 'lodash';

export type PrintMode = 'both' | 'result' | 'callback';

export type HeatRoundResultDocumentProps = {
    mode: PrintMode;
    data: {
        item_no?: string | null;
        section_name?: string | null;
        heat_type?: string | null;
        callback_limit?: number | null;
        total_called_back: number;
        competition: {
            name?: string | null;
            venue?: string | null;
            date?: Date | string | null;
            organization?: string | null;
        };
        panel: { letter?: string | null; name?: string | null }[];
        table: {
            headerRows: {
                label: string;
                rowSpan?: number;
                colSpan?: number;
                align?: string;
            }[][];
            rows: (string | number | boolean)[][];
        };
        called_back_dancers: {
            number: number;
            name: string;
            partner_name?: string | null;
        }[];
    };
};

const GREY = '#555555';
const BORDER = '#cccccc';
const HEADER_BG = '#f0f0f0';
const CB_BG = '#e8f5e9';

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
    summary: {
        fontSize: 8,
        color: GREY,
        marginBottom: 5,
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
    tableRowCb: {
        backgroundColor: CB_BG,
    },
    cell: {
        borderRightWidth: 0.5,
        borderRightColor: BORDER,
        paddingVertical: 2,
        paddingHorizontal: 2,
        textAlign: 'center',
        fontSize: 8,
    },
    cellLast: {
        borderRightWidth: 0,
    },
    cellHeader: {
        fontFamily: 'Helvetica-Bold',
        backgroundColor: HEADER_BG,
        fontSize: 8,
    },
    // ---- callback page ----
    cbTable: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 6,
    },
    cbRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: BORDER,
        paddingVertical: 3,
        paddingHorizontal: 4,
    },
    cbHeader: {
        backgroundColor: HEADER_BG,
        fontFamily: 'Helvetica-Bold',
    },
    cbNumCol: { width: 30, textAlign: 'center' },
    cbNoCol: { width: 50, textAlign: 'center' },
    cbNameCol: { flex: 1 },
});

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const PageHeader = ({ data }: Pick<HeatRoundResultDocumentProps, 'data'>) => {
    const meta = [ data.competition.organization, data.competition.venue, formatDate(data.competition.date) ]
        .filter(Boolean)
        .join('   ·   ');

    return (
        <View style={styles.headerBlock}>
            <Text style={styles.compName}>{data.competition.name ?? ''}</Text>
            {meta ? <Text style={styles.compMeta}>{meta}</Text> : null}
            <Text style={styles.heatMeta}>
                {`Item No. ${data.item_no ?? ''}  —  ${startCase(toLower(String(data.section_name)))}  —  ${startCase(toLower(String(data.heat_type)))}`}
            </Text>
        </View>
    );
};

const ResultPage = ({ data }: Pick<HeatRoundResultDocumentProps, 'data'>) => {
    const headerRow1 = data.table.headerRows[0] ?? [];
    const headerRow2 = data.table.headerRows[1] ?? [];

    // Build a flat list of all column leaf positions so we know widths
    // Each row-1 cell gets a proportional width; sub-cells split that width
    const colWidths: number[] = [];
    for (const cell of headerRow1) {
        const span = cell.colSpan ?? 1;
        // Dancer col gets more width, small mark cells get 18pt, total/cb ~30pt
        const label = cell.label.toLowerCase();
        let colW: number;
        if (label.includes('dancer')) colW = 40;
        else if (label.includes('total')) colW = 28;
        else if (label.includes('called') || label.includes('callback')) colW = 45;
        else colW = 18 * span; // per-adjudicator mark columns
        for (let i = 0; i < span; i++) colWidths.push(colW / span);
    }

    return (
        <Page
            size="A4"
            orientation="portrait"
            style={styles.page}
        >
            <PageHeader data={data} />

            <Text style={styles.sectionTitle}>Round Results</Text>
            <Text style={styles.summary}>
                {`Called Back: ${data.total_called_back} / ${data.callback_limit ?? 0}`}
            </Text>

            {/* Panel */}
            {data.panel.length > 0 && (
                <View style={styles.panelRow}>
                    {data.panel.map((adj, i) => (
                        <Text key={i} style={styles.panelChip}>
                            {`${adj.letter ?? '?'}  ${adj.name ?? ''}`}
                        </Text>
                    ))}
                </View>
            )}

            {/* Marks table */}
            <View style={styles.table}>
                {/* Header row 1 */}
                <View style={styles.tableRow}>
                    {headerRow1.map((cell, ci) => {
                        const span = cell.colSpan ?? 1;
                        const w = colWidths
                            .slice(headerRow1.slice(0, ci).reduce((s, c) => s + (c.colSpan ?? 1), 0))
                            .slice(0, span)
                            .reduce((s, w) => s + w, 0);
                        return (
                            <Text
                                key={ci}
                                style={[
                                    styles.cell,
                                    styles.cellHeader,
                                    { width: w },
                                    ci === headerRow1.length - 1 ? styles.cellLast : {},
                                ]}
                            >
                                {cell.label}
                            </Text>
                        );
                    })}
                </View>
                {/* Header row 2 (adjudicator letters) */}
                {headerRow2.length > 0 && (
                    <View style={styles.tableRow}>
                        <Text
                            style={[
                                styles.cell,
                                styles.cellHeader,
                                { width: colWidths[0], fontSize: 7, color: GREY },
                            ]}
                        />
                        {headerRow2.map((cell, ci) => (
                            <Text
                                key={ci}
                                style={[
                                    styles.cell,
                                    styles.cellHeader,
                                    { width: colWidths[ci+1], fontSize: 7, color: GREY },
                                    ci === headerRow2.length - 2 ? styles.cellLast : {},
                                ]}
                            >
                                {cell.label}
                            </Text>
                        ))}
                        <Text
                            style={[
                                styles.cell,
                                styles.cellHeader,
                                { width: 28+45, fontSize: 7, color: GREY },
                            ]}
                        />
                    </View>
                )}
                {/* Data rows */}
                {(data.table.rows ?? []).map((row, ri) => {
                    const calledBack = row[row.length - 1] === true;
                    return (
                        <View
                            key={ri}
                            style={[
                                styles.tableRow,
                                ri % 2 === 0 ? styles.tableRowEven : {},
                                calledBack ? styles.tableRowCb : {},
                            ]}
                        >
                            {row.map((cell, ci) => {
                                let display = '';
                                if (typeof cell === 'boolean') display = cell ? '✓' : '';
                                else if (cell !== null && cell !== undefined) display = String(cell);
                                return (
                                    <Text
                                        key={ci}
                                        style={[
                                            styles.cell,
                                            { width: colWidths[ci] ?? 20 },
                                            ci === row.length - 1 ? styles.cellLast : {},
                                        ]}
                                    >
                                        {display}
                                    </Text>
                                );
                            })}
                        </View>
                    );
                })}
            </View>
        </Page>
    );
};

const CallbackPage = ({ data }: Pick<HeatRoundResultDocumentProps, 'data'>) => {
    return (
        <Page
            size="A4"
            orientation="portrait"
            style={styles.page}
        >
            <PageHeader data={data} />

            <Text style={styles.sectionTitle}>
                {`Called Back — ${data.total_called_back} Dancer${data.total_called_back !== 1 ? 's' : ''}`}
            </Text>

            <View style={styles.cbTable}>
                {/* Header */}
                <View style={[ styles.cbRow, styles.cbHeader ]}>
                    <Text style={[ styles.cell, styles.cbNumCol, styles.cellHeader ]}>#</Text>
                    <Text style={[ styles.cell, styles.cbNoCol, styles.cellHeader ]}>No.</Text>
                    <Text style={[ styles.cell, styles.cbNameCol, styles.cellHeader, styles.cellLast ]}>
                        Name
                    </Text>
                </View>
                {data.called_back_dancers.length === 0 && (
                    <View style={styles.cbRow}>
                        <Text style={[ styles.cell, styles.cellLast, { flex: 1, color: GREY } ]}>
                            No dancers called back
                        </Text>
                    </View>
                )}
                {data.called_back_dancers.map((d, i) => {
                    const name = d.partner_name ? `${d.name} & ${d.partner_name}` : d.name;
                    return (
                        <View
                            key={i}
                            style={[ styles.cbRow, i % 2 === 0 ? styles.tableRowEven : {} ]}
                        >
                            <Text style={[ styles.cell, styles.cbNumCol ]}>{i + 1}</Text>
                            <Text style={[ styles.cell, styles.cbNoCol ]}>{d.number}</Text>
                            <Text style={[ styles.cell, styles.cbNameCol, styles.cellLast ]}>
                                {name}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </Page>
    );
};

export const HeatRoundResultDocument = ({ data, mode }: HeatRoundResultDocumentProps) => {
    return (
        <Document>
            {(mode === 'both' || mode === 'result') && <ResultPage data={data} />}
            {(mode === 'both' || mode === 'callback') && <CallbackPage data={data} />}
        </Document>
    );
};

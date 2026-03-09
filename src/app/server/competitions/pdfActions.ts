"use server";
import { safeAction } from "@/app/lib/safeAction";
import { z } from "zod";
import { getHeatRoundResult, getHeatRoundMarks } from "@/app/server/competitions/marksActions";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { HeatRoundResultDocument, PrintMode } from "@/app/components/pdf/HeatRoundResultDocument";
import { buildSkatingResults, RawMarkEntry, SkatingAdjudicator, SkatingDancer } from "@/app/lib/skating";
import { HeatFinalResultDocument, FinalPrintMode } from "@/app/components/pdf/HeatFinalResultDocument";
import { sortBy } from "lodash";

const PrintHeatResultSchema = z.object({
    heat_id: z.string(),
    mode: z.enum([ 'both', 'result', 'callback' ]),
});

export const printHeatResult = safeAction.inputSchema(PrintHeatResultSchema).action(async ({ parsedInput }) => {
    const result = await getHeatRoundResult(parsedInput.heat_id);

    if (!result?.data) {
        throw new Error('Heat data not found');
    }

    const data = result.data;

    const buffer = await renderToBuffer(
        React.createElement(HeatRoundResultDocument, {
            data: {
                item_no: data.item_no,
                section_name: data.section_name,
                heat_type: data.heat_type,
                callback_limit: data.callback_limit,
                total_called_back: data.total_called_back,
                competition: data.competition,
                panel: (data.panel ?? []).map((adj: any) => ({
                    letter: adj?.letter ?? null,
                    name: adj?.name ?? null,
                })),
                table: data.table,
                called_back_dancers: data.called_back_dancers,
            },
            mode: parsedInput.mode as PrintMode,
        }) as React.ReactElement<DocumentProps>
    );

    return buffer.toString('base64');
});

const PrintFinalResultSchema = z.object({
    heat_id: z.string(),
    mode: z.enum([ 'both', 'working', 'result' ]),
});

export const printFinalResult = safeAction.inputSchema(PrintFinalResultSchema).action(async ({ parsedInput }) => {
    const res = await getHeatRoundMarks(parsedInput.heat_id);
    if (!res?.data) throw new Error('Heat data not found');

    const data = res.data;

    const adjudicators: SkatingAdjudicator[] = sortBy(
        data.panel?.panels_adjudicators?.map((p: any) => ({
            uid: p.adjudicator_id,
            letter: p.adjudicator.letter,
            name: p.adjudicator.name,
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
                    name: data.section?.competition?.name ?? null,
                    venue: data.section?.competition?.venue ?? null,
                    date: data.section?.competition?.date ?? null,
                    organization: data.section?.competition?.organization ?? null,
                },
                adjudicators: adjudicators.map(a => ({ letter: a.letter, name: a.name })),
                skatingResults,
            },
            mode: parsedInput.mode as FinalPrintMode,
        }) as React.ReactElement<DocumentProps>
    );

    return buffer.toString('base64');
});

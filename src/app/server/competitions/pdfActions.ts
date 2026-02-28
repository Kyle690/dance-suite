"use server";
import { safeAction } from "@/app/lib/safeAction";
import { z } from "zod";
import { getHeatRoundResult } from "@/app/server/competitions/marksActions";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { HeatRoundResultDocument, PrintMode } from "@/app/components/pdf/HeatRoundResultDocument";

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

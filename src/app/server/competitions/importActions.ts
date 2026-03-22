import { safeAction } from "@/app/lib/safeAction";
import { CompetitionImportSchema } from "@/app/schemas/SectionSchema";
import { prisma } from "@/app/lib/prisma";
import { groupBy } from "lodash";

export const importCompetition = safeAction.inputSchema(CompetitionImportSchema).action(async ({ parsedInput }) => {
    const { competition_id, rows } = parsedInput;

    // Group rows by section name
    const bySection = groupBy(rows, (r) => r.section_name.trim().toLowerCase());

    const results = {
        sections_created: 0,
        sections_existing: 0,
        dancers_created: 0,
    };

    for (const [sectionKey, sectionRows] of Object.entries(bySection)) {
        const firstRow = sectionRows[0];
        const sectionName = firstRow.section_name.trim();

        // Upsert section by name within this competition
        let section = await prisma.sections.findFirst({
            where: {
                competition_id,
                name: { equals: sectionName, mode: 'insensitive' },
            },
        });

        if (!section) {
            section = await prisma.sections.create({
                data: {
                    competition_id,
                    name: sectionName,
                    custom_name: true,
                    competitive_type: firstRow.competitive_type,
                    entry_type: firstRow.entry_type,
                },
            });
            results.sections_created++;
        } else {
            results.sections_existing++;
        }

        // Create dancers — skip if dancer number already exists in this section
        const existingNumbers = await prisma.dancers.findMany({
            where: {
                section_id: section.uid,
                number: { in: sectionRows.map((r) => parseInt(r.number, 10)) },
                deleted_by_id: null,
            },
            select: { number: true },
        });

        const existingSet = new Set(existingNumbers.map((d) => d.number));

        const toCreate = sectionRows
            .filter((r) => !existingSet.has(parseInt(r.number, 10)))
            .map((r) => ({
                number: parseInt(r.number, 10),
                name: r.name,
                partner_name: r.partner_name || null,
                studio: r.studio || null,
                region: r.region || null,
                country: r.country || null,
                section_id: section!.uid,
                created_type: 'IMPORT' as const,
            }));

        if (toCreate.length > 0) {
            await prisma.dancers.createMany({ data: toCreate });
            results.dancers_created += toCreate.length;
        }
    }

    return results;
});
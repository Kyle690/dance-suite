import { z }from 'zod';

export const RoundMarkSchema =z.array(z.object({
    heat_id:z.string(),
    dance:z.string(),
    letter:z.string(),
    adjudicator_id:z.string(),
    marks:z.array(z.object({
        uid:z.string().min(8),
        number:z.number(),
        name:z.string(),
        partner_name:z.string().nullable().optional(),
    }))
}))

export type RoundMarkSchemaType = z.infer<typeof RoundMarkSchema>;

export const FinalMarkSchema = z.array(z.object({
    heat_id: z.string(),
    dance: z.string(),
    letter: z.string(),
    adjudicator_id: z.string(),
    marks: z.array(z.object({
        uid: z.string().min(8),
        number: z.number(),
        name: z.string(),
        partner_name: z.string().nullable().optional(),
        mark: z.string().min(1),
    }))
}))

export type FinalMarkSchemaType = z.infer<typeof FinalMarkSchema>;

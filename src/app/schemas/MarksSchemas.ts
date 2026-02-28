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
        partner_name:z.string(),
    }))
}))

export type RoundMarkSchemaType = z.infer<typeof RoundMarkSchema>;



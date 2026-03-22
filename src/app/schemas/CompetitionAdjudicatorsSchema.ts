import { z }from 'zod';


export const AdjudicatorSchema = z.object({
    uid:z.string().optional(),
    name:z.string(),
    letter:z.string().min(1).max(2),
})


export const CompetitionAdjudicatorsSchema = z.object({
    competitionId: z.string().min(8),
    adjudicators: z.array(AdjudicatorSchema).min(1),
})

export type CompetitionAdjudicatorsType = z.infer<typeof CompetitionAdjudicatorsSchema>;

export const AdjudicatorContactSchema = z.object({
    uid: z.string(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone_number: z.string().optional().or(z.literal('')),
    country_code: z.string().optional(),
    country_calling_code: z.string().optional(),
});

export type AdjudicatorContactType = z.infer<typeof AdjudicatorContactSchema>;

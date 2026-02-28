import { z }from 'zod';

export const CompetitionDetailsFormSchema = z.object({
    uid:z.string().optional(),
    name:z.string().min(1, 'Name is required'),
    date:z.string(),
    venue:z.string(),
    organizer_name:z.string(),
    organizer_email:z.string(),
    organization:z.string(),
    website:z.string().optional()
})

export type CompetitionDetailsFormType = z.infer<typeof CompetitionDetailsFormSchema>;


export const CompetitionUserRequestSchema = z.object({
    competitionId:z.string(),
    userId:z.string().min(8)
})

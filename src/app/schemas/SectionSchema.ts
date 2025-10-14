import { z }from 'zod';
import { CompetitiveType, SectionAgeGroup, SectionCategory, SectionEntryType, SectionLevel } from "@prisma/client";

export const SectionSchema = z.object({
    uid: z.string().uuid().optional(),
    competition_id: z.string().uuid(),
    name:z.string(),
    age_group: z.enum(SectionAgeGroup),
    level:z.enum(SectionLevel),
    entry_type:z.enum(SectionEntryType),
    category:z.enum(SectionCategory),
    custom_name:z.boolean(),
    competitive_type:z.enum(CompetitiveType)
})

export type SectionSchemaType = z.infer<typeof SectionSchema>;


export const DancerSchema = z.object({
    uid: z.string().uuid().optional(),
    number:z.string(),
    name:z.string(),
    partner_name:z.string().optional().nullable(),
    studio:z.string().optional().nullable(),
    region:z.string().optional().nullable(),
    country:z.string().optional().nullable(),
    section_id:z.string()
}).superRefine((data,ctx)=>{
    if(!parseInt(data.number)){
        ctx.addIssue({
            code:z.ZodIssueCode.custom,
            message:'Number must be numeric',
            path:[ 'number' ]
        })
    }
})

export type DancerSchemaType = z.infer<typeof DancerSchema>;

export const SectionDancersSchema = z.object({
    section_id:z.string().min(8),
    dancers:z.array(DancerSchema),
})

export type SectionDancersSchemaType = z.infer<typeof SectionDancersSchema>;

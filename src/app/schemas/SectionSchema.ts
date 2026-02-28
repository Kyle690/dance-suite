import { z }from 'zod';
import {
    CompetitiveType,
    HeatStatus, HeatType,
    SectionAgeGroup,
    SectionCategory,
    SectionEntryType,
    SectionLevel
} from "@prisma/client";

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

export const SectionHeatSchema = z.object({
    section_id:z.string().min(8),
    uid:z.string().optional(),
    order:z.number(),
    item_no:z.string().min(1),
    status:z.enum(HeatStatus),
    type:z.enum(HeatType),
    callback_limit:z.number(),
    dances:z.array(z.string()).min(1),
    panel_id:z.string().min(8),
}).superRefine((data,ctx)=>{
    if(data.type!==HeatType.FINAL && data.type!==HeatType.UNCONTESTED){
        if(!data.callback_limit || data.callback_limit<1){
            ctx.addIssue({
                path:[ 'callback_limit' ],
                code:z.ZodIssueCode.custom,
                message:'Callback limit must be at least 1 for non-final heats'
            })
        }
    }
})

export type SectionHeatSchemaType = z.infer<typeof SectionHeatSchema>

export const SectionHeatStartListSchema = z.object({
    heat_id:z.string().min(8),
    start_list:z.array(z.string().min(1)),
    to_create:z.array(DancerSchema)
})

export type SectionHeatStartListSchemaType = z.infer<typeof SectionHeatStartListSchema>;


export const SectionHeatRoundResultSchema = z.object({
    heat_id:z.string().min(8),
    results:z.array(z.object({
        dancer_id:z.string().min(8),
        callbacks:z.number().min(0),
        called_back:z.boolean()
    })),
})

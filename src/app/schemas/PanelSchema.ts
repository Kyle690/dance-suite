import { z } from 'zod'
import { AdjudicatorSchema } from "@/app/schemas/CompetitionAdjudicatorsSchema";

export const PanelSchema = z.object({
    uid: z.string().uuid().optional(),
    competitionId: z.string().uuid(),
    name:z.string(),
    adjudicators:z.array(AdjudicatorSchema).min(3)
}).superRefine((data,ctx)=>{
    const adjudicators = data.adjudicators;
    // Ensure number of adjudicators is an odd number
    if(adjudicators.length % 2 === 0){
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Number of adjudicators must be an odd number to ensure majority decisions.',
            path:[ 'adjudicators' ]
        })
    }
})
export type PanelSchemaType = z.infer<typeof PanelSchema>

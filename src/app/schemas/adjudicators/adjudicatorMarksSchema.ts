import { z } from "zod";

const AdjudicatorMarksSchema = z.array(z.object({
    dancer_id:z.string(),
    dancer_number:z.number(),
    dance:z.string(),
    mark:z.number().optional()
}))

export const AdjudicatorMarksRoundSchema = z.object({
    heat_id:z.string(),
    signature:z.string(),
    marks:AdjudicatorMarksSchema,
})

export type AdjudicatorMarksSchemaType = z.infer<typeof AdjudicatorMarksSchema>

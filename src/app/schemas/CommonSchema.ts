import { z }from 'zod';

export const UidSchema = z.string().min(8);
export type UidType = z.infer<typeof UidSchema>;

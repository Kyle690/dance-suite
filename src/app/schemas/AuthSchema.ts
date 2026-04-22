import { z } from 'zod';

export const SignInSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type SignInFormType = z.infer<typeof SignInSchema>;

export const SignUpSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: [ 'confirmPassword' ],
});

export type SignUpFormType = z.infer<typeof SignUpSchema>;

export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export type ForgotPasswordFormType = z.infer<typeof ForgotPasswordSchema>;

export const NewPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: [ 'confirmPassword' ],
});

export type NewPasswordFormType = z.infer<typeof NewPasswordSchema>;

export const UpdateProfileSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
});

export type UpdateProfileFormType = z.infer<typeof UpdateProfileSchema>;

export const AdjudicatorSignInSchema = z.object({
    competition_id: z.uuid(),
    login_code: z.string()
        .length(6, 'Login code must be 6 digits')
        .regex(/^\d+$/, 'Login code must be numeric'),
});

export type AdjudicatorSignInFormType = z.infer<typeof AdjudicatorSignInSchema>;

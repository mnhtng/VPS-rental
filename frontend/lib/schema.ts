import { z } from "zod";

export const registerSchema = z.object({
    name: z.string({ error: "Name is required." })
        .min(2, { error: 'Name must be at least 2 characters long.' })
        .max(100, { error: 'Name must not exceed 100 characters.' }),
    email: z.string({ error: "Email is required." })
        .email({ error: 'Invalid email address.' }),
    password: z.string({ error: "Password is required." })
        .min(8, { error: 'Password must be at least 8 characters long.' })
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' }),
    phone: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string({ error: "Email is required." })
        .email({ error: 'Invalid email address.' }),
    password: z.string({ error: "Password is required." })
})

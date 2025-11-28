import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()), // Normalize email
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .transform((val) => val.trim()), // Trim password
});

// Register schema removed - tenant creation handled separately

export type LoginInput = z.infer<typeof loginSchema>;


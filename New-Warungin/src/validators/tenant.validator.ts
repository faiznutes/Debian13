import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(3, 'Nama Tenant minimal 3 karakter'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  subscriptionPlan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional().default('BASIC'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(3, 'Nama Tenant minimal 3 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  subscriptionPlan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;


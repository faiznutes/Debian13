import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(255),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const getCustomersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'totalOrders']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tenantId: z.string().optional(), // Allow tenantId for SUPER_ADMIN
}).passthrough(); // Allow additional parameters

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type GetCustomersQuery = z.infer<typeof getCustomersQuerySchema>;


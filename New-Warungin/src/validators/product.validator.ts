import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(255),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive('Harga harus lebih dari 0'),
  cost: z.number().min(0, 'Harga pokok tidak boleh negatif').optional().nullable(),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  category: z.string().optional(),
  image: z.string().optional().or(z.literal('')), // Can be URL or base64 data URL
  emoji: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isConsignment: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const getProductsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'price', 'stock', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tenantId: z.string().optional(), // Allow tenantId for SUPER_ADMIN
}).passthrough(); // Allow additional parameters

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;


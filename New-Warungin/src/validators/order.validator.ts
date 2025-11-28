import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().uuid('Product ID harus valid UUID'),
  quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
  price: z.number().positive('Harga harus lebih dari 0'),
  discount: z.number().min(0).optional(), // Optional, not stored in OrderItem model
});

export const createOrderSchema = z.object({
  customerId: z.string().uuid('Customer ID harus valid UUID').optional(),
  memberId: z.string().uuid('Member ID harus valid UUID').optional(),
  temporaryCustomerName: z.string().optional(), // Temporary name (not saved to DB)
  outletId: z.string().uuid('Outlet ID harus valid UUID').optional(),
  items: z.array(orderItemSchema).min(1, 'Minimal 1 item diperlukan'),
  discount: z.number().min(0).default(0),
  sendToKitchen: z.boolean().default(false),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
});

export const updateOrderSchema = z.object({
  items: z.array(orderItemSchema).optional(),
  subtotal: z.string().optional(),
  total: z.string().optional(),
  discount: z.number().min(0).optional(),
  sendToKitchen: z.boolean().optional(),
  temporaryCustomerName: z.string().optional(),
  notes: z.string().optional(),
});

export const getOrdersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  customerId: z.string().uuid().optional(),
  outletId: z.string().uuid().optional(),
  startDate: z.string().optional(), // Accept date string (YYYY-MM-DD) or datetime string
  endDate: z.string().optional(), // Accept date string (YYYY-MM-DD) or datetime string
  sortBy: z.enum(['createdAt', 'total', 'orderNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tenantId: z.string().optional(), // Allow tenantId for SUPER_ADMIN
}).passthrough(); // Allow additional parameters

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;


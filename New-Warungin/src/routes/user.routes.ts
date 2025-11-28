import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import userService from '../services/user.service';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { logAction } from '../middlewares/audit-logger';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  role: z.enum(['ADMIN_TENANT', 'SUPERVISOR', 'CASHIER', 'KITCHEN']),
});

const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional(),
  permissions: z.object({
    canEditOrders: z.boolean().optional(),
    canDeleteOrders: z.boolean().optional(),
    canCancelOrders: z.boolean().optional(),
    canRefundOrders: z.boolean().optional(),
    canViewReports: z.boolean().optional(),
    canEditReports: z.boolean().optional(),
    canExportReports: z.boolean().optional(),
    canManageProducts: z.boolean().optional(),
    canManageCustomers: z.boolean().optional(),
    allowedStoreIds: z.array(z.string()).optional(), // Array of store IDs for supervisor
    assignedStoreId: z.string().optional(), // Single store ID for cashier/kitchen
  }).optional(),
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (ADMIN_TENANT only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - Only tenant admin can view users
 */
router.get(
  '/',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only ADMIN_TENANT can view users
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin can view users' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await userService.getUsers(tenantId, page, limit);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'USER');
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (ADMIN_TENANT only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - Only tenant admin can view user details
 */
router.get(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin can view user details' });
      }

      const user = await userService.getUserById(req.params.id, tenantId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'USER');
    }
  }
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (ADMIN_TENANT only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: Optional password (auto-generated if not provided)
 *               role:
 *                 type: string
 *                 enum: [ADMIN_TENANT, SUPERVISOR, CASHIER, KITCHEN]
 *                 example: CASHIER
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - Only tenant admin can create users
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createUserSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin can create users' });
      }

      const result = await userService.createUser(req.body, tenantId);
      
      // Log audit
      await logAction(
        req as AuthRequest,
        'CREATE',
        'users',
        result.id,
        { email: result.email, name: result.name, role: result.role },
        'SUCCESS'
      );
      
      res.status(201).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      await logAction(req as AuthRequest, 'CREATE', 'users', null, { error: err.message }, 'FAILED', err.message);
      handleRouteError(res, error, 'Failed to create user', 'CREATE_USER');
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (ADMIN_TENANT only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN_TENANT, SUPERVISOR, CASHIER, KITCHEN]
 *               isActive:
 *                 type: boolean
 *               permissions:
 *                 type: object
 *                 properties:
 *                   canEditOrders:
 *                     type: boolean
 *                   canDeleteOrders:
 *                     type: boolean
 *                   canCancelOrders:
 *                     type: boolean
 *                   canRefundOrders:
 *                     type: boolean
 *                   canViewReports:
 *                     type: boolean
 *                   canEditReports:
 *                     type: boolean
 *                   canExportReports:
 *                     type: boolean
 *                   canManageProducts:
 *                     type: boolean
 *                   canManageCustomers:
 *                     type: boolean
 *                   allowedStoreIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   assignedStoreId:
 *                     type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - Only tenant admin can update users
 */
router.put(
  '/:id',
  authGuard,
  subscriptionGuard,
  validate({ body: updateUserSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin can update users' });
      }

      // Check subscription status for ADMIN_TENANT when trying to activate user
      // IMPORTANT: Check total remaining time from ALL subscriptions (basic, boost, max)
      // ADMIN_TENANT can only activate if ANY subscription still has remaining time
      if (userRole === 'ADMIN_TENANT' && req.body.isActive === true) {
        const now = new Date();
        
        // Get all subscriptions that are still active (not expired)
        const activeSubscriptions = await prisma.subscription.findMany({
          where: {
            tenantId,
            status: 'ACTIVE',
            endDate: {
              gt: now, // Only get subscriptions that haven't expired yet
            },
          },
          orderBy: {
            endDate: 'desc', // Get the latest endDate
          },
        });

        // Also check tenant.subscriptionEnd as fallback
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            subscriptionEnd: true,
          },
        });

        if (!tenant) {
          return res.status(404).json({ message: 'Tenant not found' });
        }

        // Get the latest endDate from all sources
        let latestEndDate: Date | null = null;
        
        // Check all active subscriptions
        if (activeSubscriptions.length > 0) {
          latestEndDate = activeSubscriptions[0].endDate;
        }
        
        // Also check tenant.subscriptionEnd (might be later than subscription records)
        if (tenant.subscriptionEnd) {
          if (!latestEndDate || tenant.subscriptionEnd > latestEndDate) {
            latestEndDate = tenant.subscriptionEnd;
          }
        }

        // Block ADMIN_TENANT from activating users if ALL subscriptions are expired (basic 0, boost 0, max 0)
        // Only SUPER_ADMIN can activate users when all subscriptions are expired
        if (!latestEndDate || latestEndDate <= now) {
          return res.status(403).json({ 
            message: 'Tidak dapat mengaktifkan user. Semua langganan (basic, boost, max) telah kedaluwarsa. Silakan perpanjang langganan terlebih dahulu atau hubungi Super Admin.',
            code: 'SUBSCRIPTION_EXPIRED'
          });
        }
      }

      const user = await userService.updateUser(req.params.id, req.body, tenantId, userRole);
      
      // Log audit
      await logAction(
        req as AuthRequest,
        'UPDATE',
        'users',
        user.id,
        { changes: req.body },
        'SUCCESS'
      );
      
      res.json(user);
    } catch (error: unknown) {
      const err = error as Error;
      await logAction(req as AuthRequest, 'UPDATE', 'users', req.params.id, { error: err.message }, 'FAILED', err.message);
      handleRouteError(res, error, 'Failed to update user', 'UPDATE_USER');
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (ADMIN_TENANT only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - Only tenant admin can delete users
 */
router.delete(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only tenant admin can delete users' });
      }

      const user = await userService.getUserById(req.params.id, tenantId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await userService.deleteUser(req.params.id, tenantId);
      
      // Log audit
      await logAction(
        req as AuthRequest,
        'DELETE',
        'users',
        req.params.id,
        { email: user.email, name: user.name },
        'SUCCESS'
      );
      
      res.status(204).send();
    } catch (error: unknown) {
      const err = error as Error;
      await logAction(req as AuthRequest, 'DELETE', 'users', req.params.id, { error: err.message }, 'FAILED', err.message);
      handleRouteError(res, error, 'Failed to delete user', 'DELETE_USER');
    }
  }
);

// Get user password (only for SUPER_ADMIN)
// Returns the default password if available, otherwise resets and returns new password
router.get(
  '/:id/password',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user.role;
      
      // Only SUPER_ADMIN can view user passwords
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can view user passwords' });
      }

      const tenantId = requireTenantId(req);
      const result = await userService.getPassword(req.params.id, tenantId);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'USER');
    }
  }
);

// Reset user password (only for SUPER_ADMIN)
router.post(
  '/:id/reset-password',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user.role;
      
      // Only SUPER_ADMIN can reset user passwords
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can reset user passwords' });
      }

      const tenantId = requireTenantId(req);
      const result = await userService.resetPassword(req.params.id, tenantId);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'USER');
    }
  }
);

// Activate user (only for SUPER_ADMIN)
router.post(
  '/:id/activate',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user.role;
      
      // Only SUPER_ADMIN can activate users
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can activate users' });
      }

      const tenantId = requireTenantId(req);
      const user = await userService.updateUser(req.params.id, { isActive: true }, tenantId);
      res.json(user);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'USER');
    }
  }
);

// Deactivate user (only for SUPER_ADMIN)
router.post(
  '/:id/deactivate',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const userRole = (req as any).user.role;
      
      // Only SUPER_ADMIN can deactivate users
      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only super admin can deactivate users' });
      }

      const tenantId = requireTenantId(req);
      const user = await userService.updateUser(req.params.id, { isActive: false }, tenantId);
      res.json(user);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'USER');
    }
  }
);

/**
 * @swagger
 * /api/users/bulk-update-status:
 *   post:
 *     summary: Bulk update user status (activate/deactivate) (ADMIN_TENANT only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - isActive
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 example: ["user1", "user2"]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Users updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - Only admin can bulk update user status
 */
router.post(
  '/bulk-update-status',
  authGuard,
  subscriptionGuard,
  validate({ body: z.object({ 
    userIds: z.array(z.string()).min(1),
    isActive: z.boolean()
  }) }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userRole = (req as any).user.role;
      
      // Only ADMIN_TENANT and SUPER_ADMIN can bulk update user status
      if (userRole !== 'ADMIN_TENANT' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only admin can bulk update user status' });
      }

      const { userIds, isActive } = req.body;
      const result = await userService.bulkUpdateUserStatus(tenantId, userIds, isActive);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'USER');
    }
  }
);

export default router;


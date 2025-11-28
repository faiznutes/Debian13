import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import outletService from '../services/outlet.service';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import { z } from 'zod';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createOutletSchema = z.object({
  name: z.string().min(1, 'Nama outlet wajib diisi'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const updateOutletSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * @swagger
 * /api/outlets:
 *   get:
 *     summary: Get all outlets for current tenant
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of outlets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Outlet'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const outlets = await outletService.getOutlets(tenantId);
      res.json({ data: outlets });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get outlets', 'GET_OUTLETS');
    }
  }
);

/**
 * @swagger
 * /api/outlets/{id}:
 *   get:
 *     summary: Get outlet by ID
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Outlet ID
 *     responses:
 *       200:
 *         description: Outlet details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Outlet'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const outlet = await outletService.getOutlet(tenantId, req.params.id);
      res.json({ data: outlet });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get outlet', 'GET_OUTLET');
    }
  }
);

/**
 * @swagger
 * /api/outlets:
 *   post:
 *     summary: Create new outlet
 *     tags: [Outlets]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Outlet Pusat
 *               address:
 *                 type: string
 *                 example: "Jl. Raya No. 123"
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *     responses:
 *       201:
 *         description: Outlet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Outlet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createOutletSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const outlet = await outletService.createOutlet(tenantId, req.body);
      res.status(201).json({ data: outlet });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'OUTLET');
    }
  }
);

/**
 * @swagger
 * /api/outlets/{id}:
 *   put:
 *     summary: Update outlet
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Outlet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Outlet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Outlet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put(
  '/:id',
  authGuard,
  subscriptionGuard,
  validate({ body: updateOutletSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const outlet = await outletService.updateOutlet(tenantId, req.params.id, req.body);
      res.json({ data: outlet });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'OUTLET');
    }
  }
);

/**
 * @swagger
 * /api/outlets/{id}:
 *   delete:
 *     summary: Delete outlet (soft delete if has orders)
 *     tags: [Outlets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Outlet ID
 *     responses:
 *       200:
 *         description: Outlet deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Outlet berhasil dihapus"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      await outletService.deleteOutlet(tenantId, req.params.id);
      res.json({ message: 'Outlet berhasil dihapus' });
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'OUTLET');
    }
  }
);

export default router;


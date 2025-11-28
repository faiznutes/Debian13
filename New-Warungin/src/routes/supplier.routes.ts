/**
 * Supplier Routes
 * API endpoints for managing suppliers
 */

import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import supplierService from '../services/supplier.service';
import { z } from 'zod';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

const createSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of suppliers
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
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string | undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      };
      const result = await supplierService.getSuppliers(tenantId, query);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get suppliers', 'GET_SUPPLIERS');
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const supplier = await supplierService.getSupplierById(req.params.id, tenantId);
      res.json(supplier);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get supplier', 'GET_SUPPLIER');
    }
  }
);

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create new supplier
 *     tags: [Suppliers]
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ body: createSupplierSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const supplier = await supplierService.createSupplier(tenantId, req.body);
      res.status(201).json(supplier);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to create supplier', 'CREATE_SUPPLIER');
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Supplier updated
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id',
  authGuard,
  subscriptionGuard,
  validate({ body: updateSupplierSchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const supplier = await supplierService.updateSupplier(req.params.id, tenantId, req.body);
      res.json(supplier);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to update supplier', 'UPDATE_SUPPLIER');
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Supplier deleted
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      await supplierService.deleteSupplier(req.params.id, tenantId);
      res.status(204).send();
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to delete supplier', 'DELETE_SUPPLIER');
    }
  }
);

export default router;


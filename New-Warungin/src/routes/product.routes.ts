import { Router, Request, Response } from 'express';
import { authGuard } from '../middlewares/auth';
import { subscriptionGuard } from '../middlewares/subscription-guard';
import productService from '../services/product.service';
import productAdjustmentService, { createProductAdjustmentSchema } from '../services/product-adjustment.service';
import { createProductSchema, updateProductSchema, getProductsQuerySchema } from '../validators/product.validator';
import { validate } from '../middlewares/validator';
import { requireTenantId } from '../utils/tenant';
import { AuthRequest } from '../middlewares/auth';
import { logAction } from '../middlewares/audit-logger';
import { validateImageUpload } from '../middlewares/file-upload-validator';
import { handleRouteError } from '../utils/route-error-handler';

const router = Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  authGuard,
  subscriptionGuard,
  validate({ query: getProductsQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const result = await productService.getProducts(tenantId, req.query as any);
      res.json(result);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'PRODUCT');
    }
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: integer
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/:id',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const product = await productService.getProductById(req.params.id, tenantId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'PRODUCT');
    }
  }
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Product Name
 *               price:
 *                 type: number
 *                 example: 10000
 *               stock:
 *                 type: integer
 *                 example: 100
 *               category:
 *                 type: string
 *                 example: Category Name
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/',
  authGuard,
  subscriptionGuard,
  validateImageUpload, // Validate image upload security
  validate({ body: createProductSchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const product = await productService.createProduct(req.body, tenantId);
      
      // Log audit
      await logAction(req, 'CREATE', 'products', product.id, { name: product.name, price: product.price }, 'SUCCESS');
      
      res.status(201).json(product);
    } catch (error: unknown) {
      await logAction(req, 'CREATE', 'products', null, { error: (error as Error).message }, 'FAILED', (error as Error).message);
      handleRouteError(res, error, 'Failed to create product', 'CREATE_PRODUCT');
    }
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put(
  '/:id',
  authGuard,
  validateImageUpload, // Validate image upload security
  validate({ body: updateProductSchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const product = await productService.updateProduct(req.params.id, req.body, tenantId);
      
      // Log audit
      await logAction(req, 'UPDATE', 'products', product.id, { changes: req.body }, 'SUCCESS');
      
      res.json(product);
    } catch (error: unknown) {
      await logAction(req, 'UPDATE', 'products', req.params.id, { error: (error as Error).message }, 'FAILED', (error as Error).message);
      handleRouteError(res, error, 'Failed to update product', 'UPDATE_PRODUCT');
    }
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete(
  '/:id',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const product = await productService.getProductById(req.params.id, tenantId);
      await productService.deleteProduct(req.params.id, tenantId);
      
      // Log audit
      if (product) {
        await logAction(req, 'DELETE', 'products', req.params.id, { name: product.name }, 'SUCCESS');
      }
      
      res.status(204).send();
    } catch (error: unknown) {
      await logAction(req, 'DELETE', 'products', req.params.id, { error: (error as Error).message }, 'FAILED', (error as Error).message);
      handleRouteError(res, error, 'Failed to delete product', 'DELETE_PRODUCT');
    }
  }
);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Update product stock
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Stock quantity
 *               operation:
 *                 type: string
 *                 enum: [set, add, subtract]
 *                 default: set
 *                 description: Operation type (set, add, or subtract)
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put(
  '/:id/stock',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const { quantity, operation } = req.body;
      const product = await productService.updateStock(
        req.params.id,
        quantity,
        tenantId,
        operation || 'set'
      );
      res.json(product);
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to process request', 'PRODUCT');
    }
  }
);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/low-stock/all',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const products = await productService.getLowStockProducts(tenantId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/products/adjustments:
 *   get:
 *     summary: Get all product adjustments
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/adjustments',
  authGuard,
  subscriptionGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        productId: req.query.productId as string | undefined,
      };
      const result = await productAdjustmentService.getAdjustments(tenantId, query);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/products/adjustments:
 *   post:
 *     summary: Create product adjustment
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/adjustments',
  authGuard,
  subscriptionGuard,
  validate({ body: createProductAdjustmentSchema }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const userId = req.userId!;
      const adjustment = await productAdjustmentService.createAdjustment(
        req.body,
        tenantId,
        userId
      );
      
      // Log audit
      await logAction(
        req,
        'CREATE',
        'product_adjustments',
        adjustment.id,
        {
          productId: adjustment.productId,
          type: adjustment.type,
          quantity: adjustment.quantity,
          reason: adjustment.reason,
        },
        'SUCCESS'
      );
      
      res.status(201).json(adjustment);
    } catch (error: any) {
      await logAction(req, 'CREATE', 'product_adjustments', null, { error: error.message }, 'FAILED', error.message);
      if (error.message === 'Product not found') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/products/adjustments/{id}:
 *   get:
 *     summary: Get product adjustment by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/adjustments/:id',
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const tenantId = requireTenantId(req);
      const adjustment = await productAdjustmentService.getAdjustmentById(
        req.params.id,
        tenantId
      );
      if (!adjustment) {
        return res.status(404).json({ message: 'Adjustment not found' });
      }
      res.json(adjustment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;


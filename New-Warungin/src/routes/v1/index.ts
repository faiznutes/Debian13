/**
 * API Version 1 Routes
 * All v1 routes are re-exported from main routes
 */

import { Router } from 'express';
import authRoutes from '../auth.routes';
import tenantRoutes from '../tenant.routes';
import productRoutes from '../product.routes';
import orderRoutes from '../order.routes';
import archiveRoutes from '../archive.routes';
import retentionRoutes from '../retention.routes';
// Import other routes as needed

const router = Router();

// Mount all routes under /v1 prefix
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/archives', archiveRoutes);
router.use('/retention', retentionRoutes);
// Add other routes...

export default router;


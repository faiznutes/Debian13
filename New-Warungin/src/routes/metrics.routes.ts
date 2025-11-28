/**
 * Metrics Routes
 * Prometheus metrics endpoint
 */

import { Router, Request, Response } from 'express';
import { register } from '../utils/metrics';

const router = Router();

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     tags: [Metrics]
 *     description: Returns metrics in Prometheus format
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!register || typeof register.metrics !== 'function') {
      return res.status(503).json({ 
        message: 'Metrics not available. Please install prom-client: npm install prom-client' 
      });
    }
    
    res.set('Content-Type', register.contentType || 'text/plain');
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating metrics', error: error.message });
  }
});

export default router;


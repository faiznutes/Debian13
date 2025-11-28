import { Router, Request, Response } from 'express';
import { authGuard, AuthRequest } from '../middlewares/auth';
import sessionService from '../services/session.service';
import { requireTenantId } from '../utils/tenant';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all active sessions for current user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const sessions = await sessionService.getUserSessions(userId);

      res.json({ sessions });
    } catch (error: any) {
      logger.error('Error getting user sessions', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:sessionId',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.userId!;

      // Verify session belongs to user
      const session = await sessionService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: 'Session not found' });
      }

      await sessionService.revokeSession(sessionId);

      res.json({ message: 'Session berhasil di-revoke' });
    } catch (error: any) {
      logger.error('Error revoking session', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/sessions/revoke-all:
 *   post:
 *     summary: Revoke all sessions except current
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/revoke-all',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const currentSessionId = (req as any).sessionId; // Should be set by middleware

      const revokedCount = await sessionService.revokeAllUserSessions(userId, currentSessionId);

      res.json({
        message: `${revokedCount} session berhasil di-revoke`,
        revokedCount,
      });
    } catch (error: any) {
      logger.error('Error revoking all sessions', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/sessions/count:
 *   get:
 *     summary: Get active session count
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/count',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const count = await sessionService.getSessionCount(userId);

      res.json({ count });
    } catch (error: any) {
      logger.error('Error getting session count', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;


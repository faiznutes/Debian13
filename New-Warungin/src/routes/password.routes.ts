import { Router, Request, Response } from 'express';
import { authGuard, AuthRequest } from '../middlewares/auth';
import passwordService from '../services/password.service';
import { updatePasswordSchema } from '../validators/password.validator';
import { validate } from '../middlewares/validator';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/password/check-strength:
 *   post:
 *     summary: Check password strength
 *     tags: [Password]
 */
router.post(
  '/check-strength',
  async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: 'Password is required' });
      }

      const strength = passwordService.checkStrength(password);

      res.json({
        score: strength.score,
        feedback: strength.feedback,
        meetsRequirements: strength.meetsRequirements,
      });
    } catch (error: any) {
      logger.error('Error checking password strength', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/password/update:
 *   post:
 *     summary: Update password
 *     tags: [Password]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/update',
  authGuard,
  validate({ body: updatePasswordSchema as any }),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { oldPassword, newPassword } = req.body;

      await passwordService.updatePassword(userId, oldPassword, newPassword);

      res.json({ message: 'Password berhasil diubah' });
    } catch (error: any) {
      logger.error('Error updating password', { error: error.message, userId: req.userId });
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /api/password/must-change:
 *   get:
 *     summary: Check if password must be changed
 *     tags: [Password]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/must-change',
  authGuard,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const mustChange = await passwordService.mustChangePassword(userId);

      res.json({ mustChange });
    } catch (error: any) {
      logger.error('Error checking must change password', { error: error.message, userId: req.userId });
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;


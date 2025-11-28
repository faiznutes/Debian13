import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validator';
import prisma from '../config/database';

const router = Router();

const contactFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

const demoRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  businessName: z.string().min(1),
  phone: z.string().min(1),
  dateTime: z.string().optional(),
  message: z.string().optional(),
});

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 */
router.post(
  '/',
  validate({ body: contactFormSchema }),
  async (req: Request, res: Response) => {
    try {
      // Save to database
      await prisma.contactSubmission.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          subject: req.body.subject,
          message: req.body.message,
        },
      });
      
      res.json({
        success: true,
        message: 'Pesan Anda telah diterima. Tim kami akan menghubungi Anda segera.',
      });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim pesan. Silakan coba lagi.',
      });
    }
  }
);

/**
 * @swagger
 * /api/contact/demo:
 *   post:
 *     summary: Submit demo request
 *     tags: [Contact]
 */
router.post(
  '/demo',
  validate({ body: demoRequestSchema }),
  async (req: Request, res: Response) => {
    try {
      // Save to database
      await prisma.demoRequest.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          businessName: req.body.businessName,
          phone: req.body.phone,
          dateTime: req.body.dateTime || null,
          message: req.body.message || null,
        },
      });
      
      res.json({
        success: true,
        message: 'Permintaan demo Anda telah diterima. Tim kami akan menghubungi Anda segera.',
      });
    } catch (error: any) {
      console.error('Error submitting demo request:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim permintaan demo. Silakan coba lagi.',
      });
    }
  }
);

export default router;


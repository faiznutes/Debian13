import { Job } from 'bullmq';
import { sendEmail } from '../config/email';
import logger from '../utils/logger';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { to, subject, html } = job.data;

  logger.info(`Processing email job: ${subject} to ${to}`);

  try {
    await sendEmail(to, subject, html);
    logger.info(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
};


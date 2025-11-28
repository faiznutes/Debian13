import nodemailer from 'nodemailer';
import env from './env';

export const emailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.warn('Email service not configured');
    return;
  }

  try {
    await emailTransporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};


/**
 * Email Scheduler Service
 * Manages scheduled email campaigns
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import marketingService from './marketing.service';
import emailAnalyticsService from './email-analytics.service';

interface ScheduleEmailCampaignInput {
  campaignId: string;
  scheduledAt: Date;
  target: 'ALL' | 'MEMBERS' | 'ACTIVE' | 'INACTIVE';
  subject: string;
  content: string;
  templateId?: string;
}

interface UpdateScheduleInput {
  scheduledAt?: Date;
  status?: 'PENDING' | 'SENT' | 'CANCELLED';
}

class EmailSchedulerService {
  /**
   * Schedule an email campaign
   */
  async scheduleCampaign(tenantId: string, data: ScheduleEmailCampaignInput) {
    try {
      // Validate scheduled time is in the future
      if (data.scheduledAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      return await prisma.scheduledEmail.create({
        data: {
          tenantId,
          campaignId: data.campaignId,
          scheduledAt: data.scheduledAt,
          target: data.target,
          subject: data.subject,
          content: data.content,
          templateId: data.templateId,
          status: 'PENDING',
        },
      });
    } catch (error: any) {
      logger.error('Error scheduling email campaign:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled campaigns
   */
  async getScheduledCampaigns(tenantId: string, status?: string) {
    try {
      const where: any = { tenantId };
      if (status) {
        where.status = status;
      }

      return await prisma.scheduledEmail.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
      });
    } catch (error: any) {
      logger.error('Error getting scheduled campaigns:', error);
      throw error;
    }
  }

  /**
   * Get scheduled campaign by ID
   */
  async getScheduledCampaignById(scheduleId: string, tenantId: string) {
    try {
      const schedule = await prisma.scheduledEmail.findFirst({
        where: { id: scheduleId, tenantId },
      });

      if (!schedule) {
        throw new Error('Scheduled campaign not found');
      }

      return schedule;
    } catch (error: any) {
      logger.error('Error getting scheduled campaign:', error);
      throw error;
    }
  }

  /**
   * Update scheduled campaign
   */
  async updateSchedule(scheduleId: string, tenantId: string, data: UpdateScheduleInput) {
    try {
      const schedule = await this.getScheduledCampaignById(scheduleId, tenantId);

      // Validate scheduled time is in the future if updating
      if (data.scheduledAt && data.scheduledAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      return await prisma.scheduledEmail.update({
        where: { id: schedule.id },
        data: {
          ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
          ...(data.status && { status: data.status }),
        },
      });
    } catch (error: any) {
      logger.error('Error updating scheduled campaign:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled campaign
   */
  async cancelSchedule(scheduleId: string, tenantId: string) {
    try {
      const schedule = await this.getScheduledCampaignById(scheduleId, tenantId);

      if (schedule.status === 'SENT') {
        throw new Error('Cannot cancel already sent campaign');
      }

      return await prisma.scheduledEmail.update({
        where: { id: schedule.id },
        data: { status: 'CANCELLED' },
      });
    } catch (error: any) {
      logger.error('Error cancelling scheduled campaign:', error);
      throw error;
    }
  }

  /**
   * Process scheduled emails (called by cron job)
   */
  async processScheduledEmails() {
    try {
      const now = new Date();
      
      // Get all pending scheduled emails that should be sent now
      const scheduledEmails = await prisma.scheduledEmail.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: {
            lte: now,
          },
        },
      });

      const results = {
        processed: 0,
        sent: 0,
        failed: 0,
      };

      for (const schedule of scheduledEmails) {
        try {
          // Send email campaign
          const result = await marketingService.sendEmailCampaign(schedule.tenantId, {
            name: schedule.campaignId,
            content: schedule.content,
            subject: schedule.subject,
            target: schedule.target as any,
          });

          // Track sent events
          if (result.sent > 0) {
            // In production, track each sent email individually
            // For now, we'll just mark the schedule as sent
          }

          // Update schedule status
          await prisma.scheduledEmail.update({
            where: { id: schedule.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          results.processed++;
          results.sent += result.sent;
          results.failed += result.failed;

          logger.info(`Scheduled email campaign ${schedule.id} sent successfully`);
        } catch (error: any) {
          logger.error(`Error processing scheduled email ${schedule.id}:`, error);
          results.failed++;
          
          // Mark as failed after multiple retries
          await prisma.scheduledEmail.update({
            where: { id: schedule.id },
            data: { status: 'FAILED' },
          });
        }
      }

      return results;
    } catch (error: any) {
      logger.error('Error processing scheduled emails:', error);
      throw error;
    }
  }

  /**
   * Get upcoming scheduled campaigns
   */
  async getUpcomingCampaigns(tenantId: string, limit: number = 10) {
    try {
      return await prisma.scheduledEmail.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          scheduledAt: {
            gte: new Date(),
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: limit,
      });
    } catch (error: any) {
      logger.error('Error getting upcoming campaigns:', error);
      throw error;
    }
  }
}

export default new EmailSchedulerService();


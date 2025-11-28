/**
 * Email Analytics Service
 * Tracks email opens, clicks, and engagement metrics
 */

import prisma from '../config/database';
import logger from '../utils/logger';

interface TrackEmailEventInput {
  campaignId?: string;
  email: string;
  eventType: 'SENT' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'UNSUBSCRIBED';
  linkUrl?: string; // For click events
  metadata?: any;
}

class EmailAnalyticsService {
  /**
   * Track email event (sent, opened, clicked, etc.)
   */
  async trackEvent(tenantId: string, data: TrackEmailEventInput) {
    try {
      return await prisma.emailEvent.create({
        data: {
          tenantId,
          campaignId: data.campaignId,
          email: data.email,
          eventType: data.eventType,
          linkUrl: data.linkUrl,
          metadata: data.metadata || {},
        },
      });
    } catch (error: any) {
      logger.error('Error tracking email event:', error);
      throw error;
    }
  }

  /**
   * Get email analytics for a campaign
   */
  async getCampaignAnalytics(tenantId: string, campaignId: string) {
    try {
      const events = await prisma.emailEvent.findMany({
        where: {
          tenantId,
          campaignId,
        },
      });

      const sent = events.filter(e => e.eventType === 'SENT').length;
      const opened = events.filter(e => e.eventType === 'OPENED').length;
      const clicked = events.filter(e => e.eventType === 'CLICKED').length;
      const bounced = events.filter(e => e.eventType === 'BOUNCED').length;
      const unsubscribed = events.filter(e => e.eventType === 'UNSUBSCRIBED').length;

      const uniqueOpens = new Set(events.filter(e => e.eventType === 'OPENED').map(e => e.email)).size;
      const uniqueClicks = new Set(events.filter(e => e.eventType === 'CLICKED').map(e => e.email)).size;

      return {
        campaignId,
        sent,
        opened,
        clicked,
        bounced,
        unsubscribed,
        uniqueOpens,
        uniqueClicks,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        uniqueOpenRate: sent > 0 ? (uniqueOpens / sent) * 100 : 0,
        uniqueClickRate: sent > 0 ? (uniqueClicks / sent) * 100 : 0,
        bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
        unsubscribeRate: sent > 0 ? (unsubscribed / sent) * 100 : 0,
      };
    } catch (error: any) {
      logger.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Get overall email analytics for tenant
   */
  async getOverallAnalytics(tenantId: string, startDate?: Date, endDate?: Date) {
    try {
      const where: any = { tenantId };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const events = await prisma.emailEvent.findMany({
        where,
      });

      const sent = events.filter(e => e.eventType === 'SENT').length;
      const opened = events.filter(e => e.eventType === 'OPENED').length;
      const clicked = events.filter(e => e.eventType === 'CLICKED').length;
      const bounced = events.filter(e => e.eventType === 'BOUNCED').length;

      const uniqueOpens = new Set(events.filter(e => e.eventType === 'OPENED').map(e => e.email)).size;
      const uniqueClicks = new Set(events.filter(e => e.eventType === 'CLICKED').map(e => e.email)).size;

      return {
        sent,
        opened,
        clicked,
        bounced,
        uniqueOpens,
        uniqueClicks,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        uniqueOpenRate: sent > 0 ? (uniqueOpens / sent) * 100 : 0,
        uniqueClickRate: sent > 0 ? (uniqueClicks / sent) * 100 : 0,
        bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      };
    } catch (error: any) {
      logger.error('Error getting overall analytics:', error);
      throw error;
    }
  }

  /**
   * Track email open (via tracking pixel)
   */
  async trackOpen(campaignId: string, email: string, tenantId: string) {
    try {
      // Check if already opened to avoid duplicates
      const existing = await prisma.emailEvent.findFirst({
        where: {
          tenantId,
          campaignId,
          email,
          eventType: 'OPENED',
        },
      });

      if (!existing) {
        return await this.trackEvent(tenantId, {
          campaignId,
          email,
          eventType: 'OPENED',
        });
      }

      return existing;
    } catch (error: any) {
      logger.error('Error tracking email open:', error);
      throw error;
    }
  }

  /**
   * Track email click
   */
  async trackClick(campaignId: string, email: string, linkUrl: string, tenantId: string) {
    try {
      return await this.trackEvent(tenantId, {
        campaignId,
        email,
        eventType: 'CLICKED',
        linkUrl,
      });
    } catch (error: any) {
      logger.error('Error tracking email click:', error);
      throw error;
    }
  }
}

export default new EmailAnalyticsService();


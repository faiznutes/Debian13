import prisma from '../config/database';
import { sendEmail } from '../config/email';
import logger from '../utils/logger';
import smsGatewayService from './sms-gateway.service';
import pushNotificationService from './push-notification.service';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  targetCount: number;
  sentCount?: number;
  createdAt?: Date;
  sentAt?: Date;
}

interface CreateCampaignInput {
  name: string;
  type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PROMO';
  target: 'ALL' | 'MEMBERS' | 'ACTIVE' | 'INACTIVE';
  content: string;
  promoCode?: string;
  subject?: string; // For email campaigns
}

interface CreatePromoInput {
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  code: string;
  startDate: string;
  endDate: string;
}

class MarketingService {
  async getCampaigns(tenantId: string): Promise<Campaign[]> {
    // In production, you'd have a campaigns table
    // For now, return mock data or empty array
    return [];
  }

  async createCampaign(tenantId: string, data: CreateCampaignInput): Promise<Campaign> {
    // In production, save to campaigns table
    // For now, return mock data
    const targetCount = await this.getTargetCount(tenantId, data.target);

    return {
      id: `campaign-${Date.now()}`,
      name: data.name,
      type: data.type,
      status: 'DRAFT',
      targetCount,
      sentCount: 0,
      createdAt: new Date(),
    };
  }

  async sendCampaign(
    tenantId: string, 
    campaignId: string,
    campaignData?: CreateCampaignInput
  ): Promise<any> {
    // In production, fetch campaign from database using campaignId
    // For now, we use campaignData if provided
    
    if (!campaignData) {
      logger.warn(`No campaign data provided for campaign ${campaignId}`);
      return {
        campaignId,
        status: 'FAILED',
        sentAt: new Date(),
        sentCount: 0,
        failedCount: 0,
      };
    }

    let result: { sent: number; failed: number };

    switch (campaignData.type) {
      case 'EMAIL':
        result = await this.sendEmailCampaign(tenantId, {
          name: campaignData.name,
          content: campaignData.content,
          subject: campaignData.subject || campaignData.name,
          target: campaignData.target,
        });
        break;
      
      case 'SMS':
        result = await this.sendSMSCampaign(tenantId, {
          name: campaignData.name,
          content: campaignData.content,
          target: campaignData.target,
        });
        break;
      
      case 'WHATSAPP':
        // WhatsApp integration - similar to SMS
        result = await this.sendSMSCampaign(tenantId, {
          name: campaignData.name,
          content: campaignData.content,
          target: campaignData.target,
          campaignId,
        });
        break;
      
      case 'PUSH':
        result = await this.sendPushCampaign(tenantId, {
          name: campaignData.name,
          title: campaignData.subject || campaignData.name,
          message: campaignData.content,
          target: campaignData.target,
          campaignId,
        });
        break;
      
      case 'PROMO':
        // Promo campaigns can be sent via email or SMS
        // Default to email for now
        result = await this.sendEmailCampaign(tenantId, {
          name: campaignData.name,
          content: campaignData.content,
          subject: campaignData.subject || campaignData.name,
          target: campaignData.target,
        });
        break;
      
      default:
        logger.error(`Unsupported campaign type: ${campaignData.type}`);
        return {
          campaignId,
          status: 'FAILED',
          sentAt: new Date(),
          sentCount: 0,
          failedCount: 0,
        };
    }
    
    logger.info(`Campaign ${campaignId} (${campaignData.type}) sent: ${result.sent} sent, ${result.failed} failed`);
    
    return {
      campaignId,
      status: 'SENT',
      sentAt: new Date(),
      sentCount: result.sent,
      failedCount: result.failed,
    };
  }

  /**
   * Send SMS campaign to target customers
   */
  async sendSMSCampaign(
    tenantId: string,
    campaign: { name: string; content: string; target: string }
  ): Promise<{ sent: number; failed: number }> {
    const customers = await this.getTargetCustomers(tenantId, campaign.target);
    let sent = 0;
    let failed = 0;

    // In production, integrate with SMS gateway (Twilio, etc.)
    // For now, this is a placeholder structure
    logger.info(`SMS Campaign: ${campaign.name} - Target: ${customers.length} customers`);

    // Send SMS in batches to avoid overwhelming the SMS gateway
    const batchSize = 10;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (customer) => {
          try {
            if (customer.phone) {
              // Format phone number (remove +, spaces, etc.)
              const phoneNumber = customer.phone.replace(/[+\s-]/g, '');
              
              // Add country code if not present (assume Indonesia +62)
              const formattedPhone = phoneNumber.startsWith('62') 
                ? `+${phoneNumber}` 
                : phoneNumber.startsWith('0')
                ? `+62${phoneNumber.substring(1)}`
                : `+62${phoneNumber}`;

              const result = await smsGatewayService.sendSMS({
                to: formattedPhone,
                message: campaign.content,
                campaignId: campaign.campaignId,
              });

              if (result.success) {
                sent++;
                logger.info(`SMS sent to ${formattedPhone} for campaign: ${campaign.name}`, {
                  messageId: result.messageId,
                });
              } else {
                failed++;
                logger.error(`Failed to send SMS to ${formattedPhone}:`, result.error);
              }
            }
          } catch (error: any) {
            failed++;
            logger.error(`Failed to send SMS to ${customer.phone}:`, error);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < customers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed };
  }

  /**
   * Send push notification to target customers
   */
  async sendPushNotificationCampaign(
    tenantId: string,
    campaign: { name: string; content: string; target: string; title?: string }
  ): Promise<{ sent: number; failed: number }> {
    const customers = await this.getTargetCustomers(tenantId, campaign.target);
    let sent = 0;
    let failed = 0;

    // In production, integrate with push notification service (Firebase, OneSignal, etc.)
    // For now, this is a placeholder structure
    logger.info(`Push Notification Campaign: ${campaign.name} - Target: ${customers.length} customers`);

    // Mock push notification sending
    for (const customer of customers) {
      try {
        // In production: await pushService.send(customer.id, campaign.title || campaign.name, campaign.content);
        logger.info(`Push notification sent to customer ${customer.id} for campaign: ${campaign.name}`);
        sent++;
      } catch (error: any) {
        failed++;
        logger.error(`Failed to send push notification to customer ${customer.id}:`, error);
      }
    }

    return { sent, failed };
  }

  /**
   * Send email campaign to target customers
   */
  async sendEmailCampaign(
    tenantId: string,
    campaign: { name: string; content: string; subject?: string; target: string }
  ): Promise<{ sent: number; failed: number }> {
    const customers = await this.getTargetCustomers(tenantId, campaign.target);
    let sent = 0;
    let failed = 0;

    // Convert content to HTML if it's plain text
    const htmlContent = campaign.content.includes('<html>') 
      ? campaign.content 
      : `<html><body><p>${campaign.content.replace(/\n/g, '<br>')}</p></body></html>`;

    const subject = campaign.subject || campaign.name;

    // Send emails in batches to avoid overwhelming the email server
    const batchSize = 10;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (customer) => {
          try {
            if (customer.email) {
              await sendEmail(customer.email, subject, htmlContent);
              sent++;
              logger.info(`Email sent to ${customer.email} for campaign: ${campaign.name}`);
            }
          } catch (error: any) {
            failed++;
            logger.error(`Failed to send email to ${customer.email}:`, error);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < customers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed };
  }

  /**
   * Get target customers based on target type
   */
  private async getTargetCustomers(tenantId: string, target: string) {
    switch (target) {
      case 'ALL':
        return await prisma.customer.findMany({
          where: { tenantId },
          select: { id: true, email: true, name: true, phone: true },
        });
      case 'MEMBERS':
        return await prisma.member.findMany({
          where: { tenantId, isActive: true },
          include: { customer: { select: { email: true, name: true, phone: true } } },
        }).then(members => 
          members.map(m => ({
            id: m.customerId,
            email: m.customer?.email || null,
            name: m.customer?.name || m.name,
            phone: m.customer?.phone || m.phone,
          }))
        );
      case 'ACTIVE':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeOrderCustomers = await prisma.order.findMany({
          where: {
            tenantId,
            createdAt: { gte: thirtyDaysAgo },
          },
          distinct: ['customerId'],
          select: { customerId: true },
        });
        const activeCustomerIds = activeOrderCustomers
          .map(o => o.customerId)
          .filter((id): id is string => id !== null);
        
        return await prisma.customer.findMany({
          where: {
            tenantId,
            id: { in: activeCustomerIds },
          },
          select: { id: true, email: true, name: true, phone: true },
        });
      case 'INACTIVE':
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const recentOrderCustomers = await prisma.order.findMany({
          where: {
            tenantId,
            createdAt: { gte: ninetyDaysAgo },
          },
          distinct: ['customerId'],
          select: { customerId: true },
        });
        const recentCustomerIds = recentOrderCustomers
          .map(o => o.customerId)
          .filter((id): id is string => id !== null);
        
        return await prisma.customer.findMany({
          where: {
            tenantId,
            id: { notIn: recentCustomerIds },
          },
          select: { id: true, email: true, name: true, phone: true },
        });
      default:
        return [];
    }
  }

  async createPromo(tenantId: string, data: CreatePromoInput): Promise<any> {
    // In production, save to promos table
    // For now, return mock data
    return {
      id: `promo-${Date.now()}`,
      ...data,
      tenantId,
      createdAt: new Date(),
    };
  }

  /**
   * Get campaign analytics/performance
   */
  async getCampaignAnalytics(tenantId: string, campaignId?: string): Promise<any> {
    try {
      // In production, fetch from campaigns table with analytics
      // For now, return basic analytics structure
      
      if (campaignId) {
        // Get analytics for specific campaign
        return {
          campaignId,
          sentCount: 0,
          deliveredCount: 0,
          openedCount: 0,
          clickedCount: 0,
          conversionCount: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
          roi: 0,
        };
      }

      // Get overall campaign analytics
      const campaigns = await this.getCampaigns(tenantId);
      
      const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
      const totalOpens = campaigns.reduce((sum, c) => sum + (c.opens || 0), 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

      return {
        totalCampaigns: campaigns.length,
        totalSent,
        totalOpens,
        totalClicks,
        totalConversions,
        averageOpenRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
        averageClickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
        averageConversionRate: totalSent > 0 ? (totalConversions / totalSent) * 100 : 0,
        campaigns: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          sentCount: c.sentCount || 0,
          opens: c.opens || 0,
          clicks: c.clicks || 0,
          conversions: c.conversions || 0,
          openRate: (c.sentCount || 0) > 0 ? ((c.opens || 0) / (c.sentCount || 0)) * 100 : 0,
          clickRate: (c.sentCount || 0) > 0 ? ((c.clicks || 0) / (c.sentCount || 0)) * 100 : 0,
        })),
      };
    } catch (error: any) {
      logger.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate ROI for a campaign
   */
  async calculateCampaignROI(tenantId: string, campaignId: string): Promise<number> {
    try {
      // In production, calculate based on:
      // - Campaign cost (SMS/Email service costs)
      // - Revenue generated from campaign (orders with promo code, etc.)
      
      // For now, return mock ROI
      const campaigns = await this.getCampaigns(tenantId);
      const campaign = campaigns.find(c => c.id === campaignId);

      if (!campaign) {
        return 0;
      }

      // Mock calculation: ROI = (Revenue - Cost) / Cost * 100
      // In production, fetch actual revenue from orders with campaign promo code
      const mockRevenue = (campaign.conversions || 0) * 100000; // Mock: 100k per conversion
      const mockCost = (campaign.sentCount || 0) * 100; // Mock: 100 per send
      
      if (mockCost === 0) return 0;
      
      return ((mockRevenue - mockCost) / mockCost) * 100;
    } catch (error: any) {
      logger.error('Error calculating campaign ROI:', error);
      return 0;
    }
  }

  private async getTargetCount(tenantId: string, target: string): Promise<number> {
    switch (target) {
      case 'ALL':
        return await prisma.customer.count({ where: { tenantId } });
      case 'MEMBERS':
        return await prisma.member.count({ where: { tenantId, isActive: true } });
      case 'ACTIVE':
        // Customers with orders in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeCustomers = await prisma.order.findMany({
          where: {
            tenantId,
            createdAt: { gte: thirtyDaysAgo },
          },
          distinct: ['customerId'],
        });
        return activeCustomers.length;
      case 'INACTIVE':
        // Customers without orders in last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const allCustomers = await prisma.customer.count({ where: { tenantId } });
        const inactiveCustomers = await prisma.order.findMany({
          where: {
            tenantId,
            createdAt: { gte: ninetyDaysAgo },
          },
          distinct: ['customerId'],
        });
        return allCustomers - inactiveCustomers.length;
      default:
        return 0;
    }
  }
}

export default new MarketingService();


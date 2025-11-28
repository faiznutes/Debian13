/**
 * Webhook Service
 * Webhook delivery system with retry logic and security
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';

export interface CreateWebhookInput {
  url: string;
  events: string[];
  isActive?: boolean;
  retryCount?: number;
  timeout?: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  attempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
}

export class WebhookService {
  /**
   * Create webhook
   */
  async createWebhook(tenantId: string, data: CreateWebhookInput): Promise<any> {
    // Generate secret for webhook signature
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        tenantId,
        url: data.url,
        events: data.events,
        secret,
        isActive: data.isActive ?? true,
        retryCount: data.retryCount ?? 3,
        timeout: data.timeout ?? 5000,
      },
    });

    logger.info('Webhook created', { webhookId: webhook.id, tenantId });

    return webhook;
  }

  /**
   * Get webhooks for tenant
   */
  async getWebhooks(tenantId: string, includeInactive: boolean = false): Promise<any[]> {
    return await prisma.webhook.findMany({
      where: includeInactive ? { tenantId } : { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update webhook
   */
  async updateWebhook(webhookId: string, tenantId: string, data: Partial<CreateWebhookInput>): Promise<any> {
    return await prisma.webhook.update({
      where: { id: webhookId, tenantId },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.events && { events: data.events }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.retryCount !== undefined && { retryCount: data.retryCount }),
        ...(data.timeout !== undefined && { timeout: data.timeout }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string, tenantId: string): Promise<void> {
    await prisma.webhook.delete({
      where: { id: webhookId, tenantId },
    });

    logger.info('Webhook deleted', { webhookId, tenantId });
  }

  /**
   * Trigger webhook delivery
   */
  async triggerWebhook(tenantId: string, event: string, payload: any, webhookId?: string): Promise<void> {
    // If webhookId is provided, trigger only that webhook (for testing)
    if (webhookId) {
      const webhook = await prisma.webhook.findFirst({
        where: {
          id: webhookId,
          tenantId,
          isActive: true,
        },
      });

      if (webhook) {
        await this.deliverWebhook(webhook.id, event, payload);
      }
      return;
    }

    // Find active webhooks for this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    // Deliver to each webhook
    for (const webhook of webhooks) {
      await this.deliverWebhook(webhook.id, event, payload);
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  private async deliverWebhook(webhookId: string, event: string, payload: any): Promise<void> {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return;
    }

    // Create delivery record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload,
        status: 'PENDING',
        attempts: 0,
      },
    });

    // Attempt delivery
    await this.attemptDelivery(delivery.id, webhook);
  }

  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(deliveryId: string, webhook: any): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      return;
    }

    try {
      // Generate signature
      const signature = this.generateSignature(JSON.stringify(delivery.payload), webhook.secret);

      // Send webhook
      const response = await axios.post(
        webhook.url,
        {
          event: delivery.event,
          payload: delivery.payload,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': delivery.event,
            'Content-Type': 'application/json',
          },
          timeout: webhook.timeout,
        }
      );

      // Success
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'SUCCESS',
          responseCode: response.status,
          responseBody: JSON.stringify(response.data),
          deliveredAt: new Date(),
          attempts: delivery.attempts + 1,
        },
      });

      logger.info('Webhook delivered successfully', { deliveryId, webhookId: webhook.id });
    } catch (error: any) {
      const attempts = delivery.attempts + 1;
      const shouldRetry = attempts < webhook.retryCount;

      if (shouldRetry) {
        // Calculate next retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempts), 60000); // Max 60 seconds
        const nextRetryAt = new Date(Date.now() + delay);

        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'PENDING',
            attempts,
            nextRetryAt,
            responseCode: (error as AxiosError).response?.status,
            responseBody: (error as AxiosError).message,
          },
        });

        // Schedule retry (in production, use job queue)
        setTimeout(() => {
          this.attemptDelivery(deliveryId, webhook);
        }, delay);

        logger.warn('Webhook delivery failed, will retry', {
          deliveryId,
          webhookId: webhook.id,
          attempts,
          nextRetryAt,
        });
      } else {
        // Max retries reached
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'FAILED',
            attempts,
            responseCode: (error as AxiosError).response?.status,
            responseBody: (error as AxiosError).message,
          },
        });

        logger.error('Webhook delivery failed after max retries', {
          deliveryId,
          webhookId: webhook.id,
          attempts,
        });
      }
    }
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhook deliveries
   */
  async getDeliveries(webhookId: string, page: number = 1, limit: number = 50, status?: string): Promise<any> {
    const skip = (page - 1) * limit;

    const where: any = { webhookId };
    if (status) {
      where.status = status;
    }

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    return {
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Replay failed webhook delivery
   */
  async replayDelivery(webhookId: string, deliveryId: string, tenantId: string): Promise<void> {
    // Verify webhook belongs to tenant
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, tenantId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    // Get delivery
    const delivery = await prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, webhookId },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    // Reset delivery status and retry
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PENDING',
        attempts: 0,
        nextRetryAt: new Date(),
      },
    });

    // Attempt delivery again
    await this.attemptDelivery(deliveryId, webhook);
  }
}

export default new WebhookService();


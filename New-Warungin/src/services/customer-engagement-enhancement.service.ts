/**
 * Customer Engagement Enhancement Service
 * Handles birthday reminders, promo automation, feedback system, reviews & ratings
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import marketingService from './marketing.service';
import smsGatewayService from './sms-gateway.service';
import pushNotificationService from './push-notification.service';

interface BirthdayReminder {
  customerId: string;
  customerName: string;
  email?: string;
  phone?: string;
  birthday: Date;
  discountCode?: string;
}

interface CustomerFeedback {
  customerId: string;
  orderId?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

class CustomerEngagementEnhancementService {
  /**
   * Get customers with upcoming birthdays
   */
  async getUpcomingBirthdays(tenantId: string, daysAhead: number = 7): Promise<BirthdayReminder[]> {
    try {
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + daysAhead);

      // Get customers with birthdays in the next N days
      // We need to check birthdays that fall within the date range
      // Since birthday is stored as full date, we need to extract month and day
      const customers = await prisma.customer.findMany({
        where: {
          tenantId,
          birthday: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          birthday: true,
        },
      });

      // Filter customers whose birthday falls within the date range
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();
      const targetMonth = targetDate.getMonth();
      const targetDateNum = targetDate.getDate();

      const upcomingBirthdays = customers
        .filter(customer => {
          if (!customer.birthday) return false;
          const birthday = new Date(customer.birthday);
          const birthdayMonth = birthday.getMonth();
          const birthdayDate = birthday.getDate();

          // Check if birthday falls within the range
          if (birthdayMonth === todayMonth && birthdayDate >= todayDate) {
            if (birthdayMonth === targetMonth) {
              return birthdayDate <= targetDateNum;
            }
            return true;
          }
          if (birthdayMonth > todayMonth && birthdayMonth <= targetMonth) {
            if (birthdayMonth === targetMonth) {
              return birthdayDate <= targetDateNum;
            }
            return true;
          }
          return false;
        })
        .map(customer => ({
          customerId: customer.id,
          customerName: customer.name,
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          birthday: customer.birthday!,
        }));

      return upcomingBirthdays;
    } catch (error: any) {
      logger.error('Error getting upcoming birthdays:', error);
      throw error;
    }
  }

  /**
   * Send birthday reminders with auto discount
   */
  async sendBirthdayReminders(tenantId: string, autoCreateDiscount: boolean = true): Promise<{ sent: number; failed: number }> {
    try {
      const upcomingBirthdays = await this.getUpcomingBirthdays(tenantId, 0); // Today's birthdays
      let sent = 0;
      let failed = 0;

      for (const reminder of upcomingBirthdays) {
        try {
          // Create discount code if enabled
          let discountCode: string | undefined;
          if (autoCreateDiscount) {
            discountCode = await this.createBirthdayDiscount(tenantId, reminder.customerId);
          }

          // Send birthday message via email/SMS
          const message = `Selamat Ulang Tahun ${reminder.customerName}! 🎉${discountCode ? ` Gunakan kode diskon ${discountCode} untuk mendapatkan diskon spesial!` : ''}`;

          // Send email if available
          if (reminder.email) {
            try {
              await marketingService.sendEmailCampaign(tenantId, {
                name: 'Birthday Greeting',
                content: `
                  <h2>Selamat Ulang Tahun ${reminder.customerName}! 🎉</h2>
                  <p>Terima kasih telah menjadi pelanggan setia kami.</p>
                  ${discountCode ? `<p>Gunakan kode diskon <strong>${discountCode}</strong> untuk mendapatkan diskon spesial hari ini!</p>` : ''}
                  <p>Semoga hari ulang tahun Anda penuh kebahagiaan!</p>
                `,
                subject: 'Selamat Ulang Tahun! 🎉',
                target: 'ALL',
              });
            } catch (emailError) {
              logger.error(`Failed to send birthday email to ${reminder.email}:`, emailError);
            }
          }

          // Send SMS if available
          if (reminder.phone) {
            try {
              const phoneNumber = reminder.phone.replace(/[+\s-]/g, '');
              const formattedPhone = phoneNumber.startsWith('62') 
                ? `+${phoneNumber}` 
                : phoneNumber.startsWith('0')
                ? `+62${phoneNumber.substring(1)}`
                : `+62${phoneNumber}`;

              const smsResult = await smsGatewayService.sendSMS({
                to: formattedPhone,
                message,
                campaignId: 'birthday-reminder',
              });
              
              if (!smsResult.success) {
                throw new Error(smsResult.error || 'SMS sending failed');
              }
            } catch (smsError) {
              logger.error(`Failed to send birthday SMS to ${reminder.phone}:`, smsError);
            }
          }

          sent++;
          logger.info(`Birthday reminder sent to ${reminder.customerName}`);
        } catch (error: any) {
          failed++;
          logger.error(`Failed to send birthday reminder to ${reminder.customerId}:`, error);
        }
      }

      return { sent, failed };
    } catch (error: any) {
      logger.error('Error sending birthday reminders:', error);
      throw error;
    }
  }

  /**
   * Create birthday discount code
   */
  private async createBirthdayDiscount(tenantId: string, customerId: string): Promise<string> {
    try {
      // Generate unique discount code
      const discountCode = `BDAY${Date.now().toString().slice(-6)}`;
      
      // Create discount in database
      // Note: Discount model uses discountType and discountValueType, not type and value
      await prisma.discount.create({
        data: {
          tenantId,
          name: `Birthday Discount - ${discountCode}`,
          discountType: 'AMOUNT_BASED',
          discountValue: 10, // 10% discount
          discountValueType: 'PERCENTAGE',
          minAmount: 0, // No minimum purchase required
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
          isActive: true,
          applicableTo: 'ALL',
        },
      });

      return discountCode;
    } catch (error: any) {
      logger.error('Error creating birthday discount:', error);
      // Return empty string if discount creation fails
      return '';
    }
  }

  /**
   * Submit customer feedback/review
   */
  async submitFeedback(
    tenantId: string,
    customerId: string,
    data: { orderId?: string; rating: number; comment?: string; category?: string; isPublic?: boolean }
  ): Promise<CustomerFeedback> {
    try {
      const feedback: CustomerFeedback = {
        customerId,
        orderId: data.orderId,
        rating: data.rating,
        comment: data.comment,
        createdAt: new Date(),
      };

      logger.info('Customer feedback submitted:', feedback);

      const saved = await prisma.customerFeedback.create({
        data: {
          tenantId,
          customerId,
          orderId: data.orderId,
          rating: data.rating,
          comment: data.comment,
          category: data.category,
          isPublic: data.isPublic || false,
          status: 'PENDING',
        },
      });

      return {
        ...feedback,
        id: saved.id,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get customer feedback/reviews
   */
  async getFeedback(tenantId: string, query: { customerId?: string; orderId?: string; page?: number; limit?: number }) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { tenantId };
      if (query.customerId) where.customerId = query.customerId;
      if (query.orderId) where.orderId = query.orderId;

      const [feedbacks, total] = await Promise.all([
        prisma.customerFeedback.findMany({
          where,
          skip,
          take: limit,
          include: {
            customer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.customerFeedback.count({ where }),
      ]);

      return {
        data: feedbacks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Get average rating for tenant
   */
  async getAverageRating(tenantId: string): Promise<{ average: number; count: number }> {
    try {
      const result = await prisma.customerFeedback.aggregate({
        where: { tenantId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return {
        average: result._avg.rating || 0,
        count: result._count.rating || 0,
      };
    } catch (error: any) {
      logger.error('Error getting average rating:', error);
      throw error;
    }
  }

  /**
   * Send promo notifications automatically
   */
  async sendPromoNotifications(
    tenantId: string,
    promoId: string,
    target: 'ALL' | 'MEMBERS' | 'ACTIVE' | 'INACTIVE' = 'ALL'
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get promo details
      const promo = await prisma.discount.findFirst({
        where: { id: promoId, tenantId },
      });

      if (!promo) {
        throw new Error('Promo not found');
      }

      // Create campaign message
      const discountValue = Number(promo.discountValue);
      const discountText = promo.discountValueType === 'PERCENTAGE' 
        ? `${discountValue}%` 
        : `Rp ${discountValue.toLocaleString('id-ID')}`;
      const promoCode = promo.name.split(' - ')[1] || promo.name; // Use name as code identifier
      const message = `Promo Spesial! ${promo.name} - Dapatkan diskon ${discountText}!`;

      // Send via multiple channels
      let totalSent = 0;
      let totalFailed = 0;

      // Email campaign
      try {
        const emailResult = await marketingService.sendEmailCampaign(tenantId, {
          name: promo.name,
          content: `
            <h2>${promo.name}</h2>
            <p>Dapatkan diskon <strong>${discountText}</strong> untuk pembelian Anda!</p>
            ${promo.endDate ? `<p>Berlaku hingga ${new Date(promo.endDate).toLocaleDateString('id-ID')}</p>` : ''}
          `,
          subject: promo.name,
          target,
        });
        totalSent += emailResult.sent;
        totalFailed += emailResult.failed;
      } catch (error) {
        logger.error('Error sending promo email:', error);
      }

      // SMS campaign
      try {
        const smsResult = await marketingService.sendSMSCampaign(tenantId, {
          name: promo.name,
          content: message,
          target,
        });
        totalSent += smsResult.sent;
        totalFailed += smsResult.failed;
      } catch (error) {
        logger.error('Error sending promo SMS:', error);
      }

      // Push notification campaign
      try {
        const pushResult = await marketingService.sendPushCampaign(tenantId, {
          name: promo.name,
          title: promo.name,
          message,
          target,
        });
        totalSent += pushResult.sent;
        totalFailed += pushResult.failed;
      } catch (error) {
        logger.error('Error sending promo push:', error);
      }

      return { sent: totalSent, failed: totalFailed };
    } catch (error: any) {
      logger.error('Error sending promo notifications:', error);
      throw error;
    }
  }

  /**
   * Submit customer review (for products or services)
   */
  async submitCustomerReview(
    tenantId: string,
    customerId: string,
    data: {
      productId?: string;
      orderId?: string;
      rating: number;
      title?: string;
      comment?: string;
      isVerified?: boolean;
    }
  ): Promise<any> {
    try {
      // Verify customer exists
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // If productId provided, verify product exists
      if (data.productId) {
        const product = await prisma.product.findFirst({
          where: { id: data.productId, tenantId },
        });

        if (!product) {
          throw new Error('Product not found');
        }
      }

      const review = await prisma.customerReview.create({
        data: {
          tenantId,
          customerId,
          productId: data.productId,
          orderId: data.orderId,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          isVerified: data.isVerified || false,
          isPublic: true,
          status: 'PENDING',
        },
      });

      logger.info('Customer review submitted:', review);

      return {
        id: review.id,
        customerId: review.customerId,
        productId: review.productId,
        orderId: review.orderId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isVerified: review.isVerified,
        isPublic: review.isPublic,
        status: review.status,
        createdAt: review.createdAt,
      };
    } catch (error: any) {
      logger.error('Error submitting customer review:', error);
      throw error;
    }
  }

  /**
   * Get customer reviews
   */
  async getCustomerReviews(
    tenantId: string,
    query: {
      customerId?: string;
      productId?: string;
      orderId?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { tenantId };
      if (query.customerId) where.customerId = query.customerId;
      if (query.productId) where.productId = query.productId;
      if (query.orderId) where.orderId = query.orderId;
      if (query.status) where.status = query.status;

      const [reviews, total] = await Promise.all([
        prisma.customerReview.findMany({
          where,
          skip,
          take: limit,
          include: {
            customer: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.customerReview.count({ where }),
      ]);

      return {
        data: reviews.map(r => ({
          id: r.id,
          customerId: r.customerId,
          customerName: r.customer.name,
          productId: r.productId,
          productName: r.product?.name,
          orderId: r.orderId,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isVerified: r.isVerified,
          isPublic: r.isPublic,
          helpfulCount: r.helpfulCount,
          status: r.status,
          createdAt: r.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error getting customer reviews:', error);
      throw error;
    }
  }
}

export default new CustomerEngagementEnhancementService();


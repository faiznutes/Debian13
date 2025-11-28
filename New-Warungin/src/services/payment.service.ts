import Midtrans from 'midtrans-client';
import crypto from 'crypto';
import env from '../config/env';
import prisma from '../config/database';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod: 'CASH' | 'QRIS';
  qrCode?: string; // QR Code string untuk QRIS manual
  qrCodeImage?: string; // URL gambar QR Code (opsional)
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  orderId?: string; // For addon/subscription payments
  clientKey?: string; // For frontend Snap.js
  isProduction?: boolean; // For frontend Snap.js
  qrCode?: string;
  status?: string;
  message?: string;
}

class PaymentService {
  private snap: any;
  private coreApi: any;

  constructor() {
    if (env.MIDTRANS_SERVER_KEY && env.MIDTRANS_CLIENT_KEY) {
      // Validate server key format (should start with SB- for sandbox or Mid- for production)
      const serverKey = env.MIDTRANS_SERVER_KEY.trim();
      const isProduction = env.MIDTRANS_IS_PRODUCTION;
      
      if (isProduction && !serverKey.startsWith('Mid-')) {
        console.warn('⚠️  Warning: Production mode but server key does not start with "Mid-". Make sure you are using production keys.');
      } else if (!isProduction && !serverKey.startsWith('SB-')) {
        console.warn('⚠️  Warning: Sandbox mode but server key does not start with "SB-". Make sure you are using sandbox keys.');
      }

      // Initialize Snap (for web payment)
      this.snap = new Midtrans.Snap({
        isProduction: isProduction,
        serverKey: serverKey,
        clientKey: env.MIDTRANS_CLIENT_KEY.trim(),
      });

      // Initialize Core API (for direct payment)
      this.coreApi = new Midtrans.CoreApi({
        isProduction: isProduction,
        serverKey: serverKey,
        clientKey: env.MIDTRANS_CLIENT_KEY.trim(),
      });
      
      console.log('✅ Midtrans initialized:', {
        mode: isProduction ? 'PRODUCTION' : 'SANDBOX',
        serverKeyPrefix: serverKey.substring(0, 3),
      });
    } else {
      console.warn('⚠️  Midtrans not configured. MIDTRANS_SERVER_KEY or MIDTRANS_CLIENT_KEY is missing.');
    }
  }

  /**
   * Create payment transaction
   */
  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Handle cash payment (no external processing needed)
      if (data.paymentMethod === 'CASH') {
        return {
          success: true,
          status: 'CASH',
          message: 'Cash payment processed',
        };
      }

      // Handle QRIS payment (manual QR code input)
      if (data.paymentMethod === 'QRIS') {
        // Untuk sementara, QRIS menggunakan manual QR code input
        // QR code akan disimpan di transaction record
        return {
          success: true,
          status: 'QRIS',
          qrCode: data.qrCode || '',
          message: data.qrCode 
            ? 'QRIS payment processed with manual QR code' 
            : 'QRIS payment - QR code required',
        };
      }

      // Handle BANK_TRANSFER payment (no external processing needed for now)
      if (data.paymentMethod === 'BANK_TRANSFER') {
        return {
          success: true,
          status: 'BANK_TRANSFER',
          message: 'Bank transfer payment processed',
        };
      }

      // Handle SHOPEEPAY payment (no external processing needed for now)
      if (data.paymentMethod === 'SHOPEEPAY') {
        return {
          success: true,
          status: 'SHOPEEPAY',
          message: 'ShopeePay payment processed',
        };
      }

      // Handle DANA payment (no external processing needed for now)
      if (data.paymentMethod === 'DANA') {
        return {
          success: true,
          status: 'DANA',
          message: 'DANA payment processed',
        };
      }

      return {
        success: false,
        message: 'Payment method not supported',
      };
    } catch (error: any) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create payment',
      };
    }
  }

  /**
   * Check payment status and trigger activation if payment is settled
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentResponse> {
    try {
      if (!this.coreApi) {
        return {
          success: false,
          message: 'Midtrans not configured',
        };
      }

      const status = await this.coreApi.transaction.status(orderId);
      
      // If payment is settled and this is an addon/subscription payment, trigger activation
      if ((status.transaction_status === 'settlement' || status.transaction_status === 'capture') &&
          (orderId.startsWith('ADD-') || orderId.startsWith('SUB-') || 
           orderId.startsWith('addon-') || orderId.startsWith('subscription-') || orderId.startsWith('upgrade-'))) {
        
        console.log('Payment is settled, checking if addon/subscription needs activation:', orderId);
        
        // Process payment activation (similar to webhook)
        // This ensures addon is activated even if webhook is not called
        try {
          await this.processPaymentActivation(orderId, status);
        } catch (activationError: any) {
          console.error('Error activating addon/subscription during status check:', activationError);
          // Don't fail the status check, just log the error
        }
      }
      
      return {
        success: true,
        transactionId: status.transaction_id,
        status: status.transaction_status,
        message: status.status_message,
      };
    } catch (error: any) {
      console.error('Payment status check error:', error);
      return {
        success: false,
        message: error.message || 'Failed to check payment status',
      };
    }
  }

  /**
   * Process payment activation (extracted from webhook handler for reuse)
   */
  private async processPaymentActivation(orderId: string, status: any): Promise<void> {
    // Check if this is an addon/subscription payment
    const isAddonPayment = orderId.startsWith('ADD-') || orderId.startsWith('addon-');
    const isSubscriptionPayment = orderId.startsWith('SUB-') || orderId.startsWith('subscription-') || orderId.startsWith('upgrade-');
    
    if (!isAddonPayment && !isSubscriptionPayment) {
      return; // Not an addon/subscription payment
    }

    console.log('Processing payment activation:', {
      orderId,
      transactionStatus: status.transaction_status,
    });

    // Get mapping from database
    let mapping = null;
    try {
      mapping = await prisma.paymentMapping.findUnique({
        where: { orderId },
      });
    } catch (error: any) {
      console.warn('PaymentMapping table might not exist yet:', error.message);
    }

    // Check if already activated (mapping status is SETTLED)
    if (mapping && mapping.status === 'SETTLED') {
      console.log('Payment already processed (status is SETTLED):', orderId);
      return; // Already activated
    }

    let tenantId: string | null = null;
    let itemId: string | null = null;
    let itemType: string | null = null;

    if (mapping) {
      // Use mapping from database
      tenantId = mapping.tenantId;
      itemId = mapping.itemId;
      itemType = mapping.itemType;
    } else {
      // Fallback: Try to parse from orderId (old format)
      if (orderId.startsWith('addon-') || orderId.startsWith('subscription-')) {
        const parts = orderId.split('-');
        if (parts.length >= 3) {
          const potentialTenantId = parts[1];
          if (potentialTenantId && potentialTenantId.length > 10) {
            const tenant = await prisma.tenant.findUnique({
              where: { id: potentialTenantId },
              select: { id: true },
            });
            if (tenant) {
              tenantId = potentialTenantId;
              itemType = parts[0];
              if (parts.length >= 4) {
                const itemIdParts = parts.slice(2, -1);
                itemId = itemIdParts.join('-');
              } else {
                itemId = parts[2] || '';
              }
            }
          }
        }
      }

      // Fallback: Get tenant from email
      if (!tenantId) {
        const tenantEmail = status.customer_details?.email;
        if (tenantEmail) {
          const tenant = await prisma.tenant.findFirst({
            where: { email: tenantEmail },
            select: { id: true },
          });
          tenantId = tenant?.id || null;
        }
      }
    }

    if (!tenantId || !itemId || !itemType) {
      console.error('Could not find payment mapping or parse orderId:', {
        orderId,
        hasMapping: !!mapping,
        tenantId,
        itemId,
        itemType,
        email: status.customer_details?.email,
      });
      return;
    }

    const extractedItemId = itemId;

    if (itemType === 'addon') {
      // Import addon service
      const addonService = await import('./addon.service');
      const { AVAILABLE_ADDONS } = addonService;

      // Find addon info
      const addonInfo = AVAILABLE_ADDONS.find(a => a.id === extractedItemId);

      if (addonInfo) {
        console.log('Activating addon via payment status check:', {
          tenantId,
          addonId: extractedItemId,
          addonName: addonInfo.name,
          orderId,
        });

        try {
          // Subscribe addon
          await addonService.default.subscribeAddon(tenantId, {
            addonId: extractedItemId,
            addonName: addonInfo.name,
            addonType: addonInfo.type,
            limit: addonInfo.defaultLimit ?? undefined,
            duration: 30,
          });

          // Update mapping status
          if (mapping) {
            await prisma.paymentMapping.update({
              where: { orderId },
              data: { status: 'SETTLED' },
            });
          }

          console.log('Addon activated successfully via payment status check:', {
            tenantId,
            addonId: extractedItemId,
          });
        } catch (error: any) {
          console.error('Error activating addon via payment status check:', {
            tenantId,
            addonId: extractedItemId,
            error: error.message,
            stack: error.stack,
          });
          throw error; // Re-throw to be handled by caller
        }
      } else {
        console.error('Addon not found in AVAILABLE_ADDONS:', {
          extractedItemId,
          orderId,
          availableAddonIds: AVAILABLE_ADDONS.map(a => a.id),
        });
      }
    } else if (itemType === 'subscription') {
      // Handle subscription payment
      try {
        let upgradeResult: any = null;

        if (extractedItemId.startsWith('upgrade-')) {
          // Handle upgrade
          const upgradeParts = extractedItemId.split('-');
          const newPlan = upgradeParts[1]?.toUpperCase() as 'BASIC' | 'PRO' | 'ENTERPRISE';
          const upgradeType = upgradeParts[2] as 'temporary' | 'until_end' | 'custom';
          const customDuration = upgradeParts[3] ? parseInt(upgradeParts[3]) : undefined;

          console.log('Upgrading subscription via payment status check:', {
            tenantId,
            newPlan,
            upgradeType,
            customDuration,
            orderId,
          });

          const subscriptionService = await import('./subscription.service');
          upgradeResult = await subscriptionService.default.upgradeSubscription(tenantId, {
            newPlan,
            upgradeType,
            customDuration,
          });

          console.log('Subscription upgraded successfully via payment status check:', {
            newPlan,
            upgradeType,
          });
        } else {
          // Handle extend
          const extendParts = extractedItemId.split('-');
          const plan = extendParts[0]?.toUpperCase() as 'BASIC' | 'PRO' | 'ENTERPRISE';
          const duration = extendParts[1] ? parseInt(extendParts[1]) : 30;

          console.log('Extending subscription via payment status check:', {
            tenantId,
            plan,
            duration,
            orderId,
          });

          const subscriptionService = await import('./subscription.service');
          await subscriptionService.default.extendSubscription(tenantId, {
            plan,
            duration,
          });

          console.log('Subscription extended successfully via payment status check:', { plan, duration });
        }

        // Update mapping status
        if (mapping) {
          await prisma.paymentMapping.update({
            where: { orderId },
            data: { status: 'SETTLED' },
          });
        }
      } catch (error: any) {
        console.error('Error processing subscription payment:', {
          orderId,
          tenantId,
          error: error.message,
          stack: error.stack,
        });
        throw error; // Re-throw to be handled by caller
      }
    }
  }

  /**
   * Handle Midtrans webhook notification
   */
  async handleWebhook(notification: any): Promise<PaymentResponse> {
    try {
      if (!this.coreApi) {
        return {
          success: false,
          message: 'Midtrans not configured',
        };
      }

      const status = await this.coreApi.transaction.notification(notification);
      
      // Check if this is an addon/subscription payment
      const orderId = status.order_id;
      // New format: ADD-{hash}-{timestamp} or SUB-{hash}-{timestamp}
      // Old format (backward compatibility): addon-... or subscription-...
      const isAddonPayment = orderId.startsWith('ADD-') || orderId.startsWith('addon-');
      const isSubscriptionPayment = orderId.startsWith('SUB-') || orderId.startsWith('subscription-') || orderId.startsWith('upgrade-');
      
      if (isAddonPayment || isSubscriptionPayment) {
        console.log('Processing addon/subscription payment webhook:', {
          orderId,
          transactionStatus: status.transaction_status,
          transactionId: status.transaction_id,
        });
        
        if (status.transaction_status === 'settlement' || status.transaction_status === 'capture') {
          // Payment successful - activate addon/subscription using processPaymentActivation
          try {
            await this.processPaymentActivation(orderId, status);
            console.log('Payment activation completed via webhook:', orderId);
          } catch (error: any) {
            console.error('Error processing payment activation in webhook:', {
              orderId,
              error: error.message,
              stack: error.stack,
            });
            // Don't throw - webhook should still return success to Midtrans
            // The payment status check will retry activation later
          }
        } else {
          console.log('Payment not settled yet, status:', status.transaction_status);
        }
      } else {
        // Handle regular order payment
        const order = await prisma.order.findFirst({
          where: { orderNumber: orderId },
        });

        if (order) {
          let orderStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' = 'PENDING';
          
          if (status.transaction_status === 'settlement') {
            orderStatus = 'COMPLETED';
          } else if (status.transaction_status === 'pending') {
            orderStatus = 'PENDING';
          } else if (status.transaction_status === 'cancel' || status.transaction_status === 'expire') {
            orderStatus = 'CANCELLED';
          }

          await prisma.order.update({
            where: { id: order.id },
            data: { status: orderStatus },
          });
        }
      }

      return {
        success: true,
        transactionId: status.transaction_id,
        status: status.transaction_status,
        message: status.status_message,
      };
    } catch (error: any) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        message: error.message || 'Failed to handle webhook',
      };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(orderId: string): Promise<PaymentResponse> {
    try {
      if (!this.coreApi) {
        return {
          success: false,
          message: 'Midtrans not configured',
        };
      }

      const result = await this.coreApi.transaction.cancel(orderId);
      
      return {
        success: true,
        status: result.transaction_status,
        message: 'Payment cancelled',
      };
    } catch (error: any) {
      console.error('Payment cancellation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel payment',
      };
    }
  }

  /**
   * Create Midtrans payment for addon/subscription
   */
  async createAddonPayment(data: {
    tenantId: string;
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
    itemName: string;
    amount: number;
    itemId: string;
    itemType: 'addon' | 'subscription';
  }): Promise<PaymentResponse> {
    try {
      if (!this.snap) {
        console.error('Midtrans Snap not initialized. Check MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in .env');
        return {
          success: false,
          message: 'Midtrans tidak dikonfigurasi. Silakan hubungi administrator.',
        };
      }

      // Validate server key format
      if (!env.MIDTRANS_SERVER_KEY || env.MIDTRANS_SERVER_KEY.length < 20) {
        console.error('Invalid MIDTRANS_SERVER_KEY format');
        return {
          success: false,
          message: 'Konfigurasi Midtrans tidak valid. Silakan hubungi administrator.',
        };
      }

      // Create short orderId to comply with Midtrans 50 character limit
      // Format: {type_prefix}-{hash_8chars}-{timestamp_10chars}
      // type_prefix: "ADD" for addon, "SUB" for subscription (3 chars)
      // hash: First 8 chars of MD5 hash of tenantId+itemId (8 chars)
      // timestamp: Last 10 digits of timestamp (10 chars)
      // Total: 3 + 1 + 8 + 1 + 10 = 23 characters (well under 50 limit)
      const typePrefix = data.itemType === 'addon' ? 'ADD' : 'SUB';
      const hashInput = `${data.tenantId}-${data.itemId}`;
      const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 8).toUpperCase();
      const timestamp = Date.now().toString().slice(-10); // Last 10 digits
      const orderId = `${typePrefix}-${hash}-${timestamp}`;
      
      // Store mapping in database for webhook lookup
      try {
        await prisma.paymentMapping.upsert({
          where: { orderId },
          update: {
            tenantId: data.tenantId,
            itemId: data.itemId,
            itemType: data.itemType,
            itemName: data.itemName,
            amount: data.amount,
            status: 'PENDING',
          },
          create: {
            orderId,
            tenantId: data.tenantId,
            itemId: data.itemId,
            itemType: data.itemType,
            itemName: data.itemName,
            amount: data.amount,
            status: 'PENDING',
          },
        });
      } catch (error: any) {
        console.error('Error storing payment mapping:', error);
        // Continue even if mapping storage fails - we'll handle it in webhook
      }
      
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: data.amount,
        },
        customer_details: {
          first_name: data.tenantName,
          email: data.tenantEmail || '',
          phone: data.tenantPhone || '',
        },
        item_details: [
          {
            id: data.itemId,
            name: data.itemName,
            price: data.amount,
            quantity: 1,
          },
        ],
        callbacks: {
          finish: `${env.FRONTEND_URL}/payment/success`,
          error: `${env.FRONTEND_URL}/payment/error`,
          pending: `${env.FRONTEND_URL}/payment/pending`,
        },
      };

      console.log('Creating Midtrans transaction:', {
        orderId,
        amount: data.amount,
        isProduction: env.MIDTRANS_IS_PRODUCTION,
        serverKeyLength: env.MIDTRANS_SERVER_KEY?.length,
      });

      const transaction = await this.snap.createTransaction(parameter);
      
      return {
        success: true,
        transactionId: transaction.token,
        paymentUrl: transaction.redirect_url, // Keep for backward compatibility
        orderId: orderId, // Include orderId for status checking
        clientKey: env.MIDTRANS_CLIENT_KEY, // Include client key for frontend
        isProduction: env.MIDTRANS_IS_PRODUCTION, // Include production flag
        status: 'pending',
        message: 'Payment token generated',
      };
    } catch (error: any) {
      console.error('Addon payment creation error:', {
        message: error.message,
        apiResponse: error.apiResponse,
        httpStatusCode: error.httpStatusCode,
      });
      
      // Provide more specific error messages
      if (error.httpStatusCode === 401) {
        return {
          success: false,
          message: 'Kunci API Midtrans tidak valid. Pastikan MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY sudah benar di file .env dan sesuai dengan environment (sandbox/production).',
        };
      }
      
      return {
        success: false,
        message: error.message || 'Gagal membuat pembayaran. Silakan coba lagi atau hubungi administrator.',
      };
    }
  }
}

export default new PaymentService();


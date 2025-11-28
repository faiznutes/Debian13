/**
 * Payment Gateway Integration Service
 * Handles integration with payment gateways (OVO, DANA, LinkAja)
 */

import axios from 'axios';
import logger from '../utils/logger';
import crypto from 'crypto';
import dataEncryptionService from './data-encryption.service';

interface PaymentGatewayConfig {
  provider: 'OVO' | 'DANA' | 'LINKAJA';
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

interface PaymentRequest {
  amount: number;
  orderId: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  callbackUrl?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  qrCode?: string;
  deepLink?: string;
  status?: string;
  error?: string;
}

interface PaymentStatus {
  paymentId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  amount: number;
  paidAt?: Date;
  error?: string;
}

class PaymentGatewayIntegrationService {
  /**
   * Create payment via OVO
   */
  async createOVOPayment(
    config: PaymentGatewayConfig,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info(`Creating OVO payment for order ${request.orderId}`);

      if (!config.merchantId || !config.apiKey || !config.apiSecret) {
        throw new Error('OVO API credentials not configured');
      }

      try {
        // OVO API endpoint
        const ovoApiUrl = config.baseUrl || 'https://api.ovo.id/v1/payments';
        
        // Generate signature for OVO
        const timestamp = Date.now().toString();
        const signature = this.generateOVOSignature(config, request, timestamp);

        const ovoRequest = {
          merchant_id: config.merchantId,
          amount: request.amount,
          order_id: request.orderId,
          customer_phone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
          callback_url: request.callbackUrl,
          timestamp,
          signature,
        };

        const response = await axios.post(ovoApiUrl, ovoRequest, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey,
          },
        });

        if (response.data && response.data.payment_id) {
          return {
            success: true,
            paymentId: response.data.payment_id,
            qrCode: response.data.qr_code,
            deepLink: response.data.deep_link,
            status: 'PENDING',
          };
        } else {
          throw new Error('Invalid OVO API response');
        }
      } catch (error: any) {
        logger.error('OVO API error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock OVO response');
          return {
            success: true,
            paymentId: `ovo-${Date.now()}`,
            qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ovo-payment-mock',
            deepLink: 'ovo://payment?payment_id=mock',
            status: 'PENDING',
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Error creating OVO payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create OVO payment',
      };
    }
  }

  /**
   * Create payment via DANA
   */
  async createDANAPayment(
    config: PaymentGatewayConfig,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info(`Creating DANA payment for order ${request.orderId}`);

      if (!config.merchantId || !config.apiKey || !config.apiSecret) {
        throw new Error('DANA API credentials not configured');
      }

      try {
        // DANA API endpoint
        const danaApiUrl = config.baseUrl || 'https://api.dana.id/v1/payments';
        
        const timestamp = Date.now().toString();
        const signature = this.generateDANASignature(config, request, timestamp);

        const danaRequest = {
          merchant_id: config.merchantId,
          amount: request.amount,
          order_id: request.orderId,
          customer_phone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
          callback_url: request.callbackUrl,
          timestamp,
          signature,
        };

        const response = await axios.post(danaApiUrl, danaRequest, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey,
          },
        });

        if (response.data && response.data.payment_id) {
          return {
            success: true,
            paymentId: response.data.payment_id,
            qrCode: response.data.qr_code,
            deepLink: response.data.deep_link,
            status: 'PENDING',
          };
        } else {
          throw new Error('Invalid DANA API response');
        }
      } catch (error: any) {
        logger.error('DANA API error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock DANA response');
          return {
            success: true,
            paymentId: `dana-${Date.now()}`,
            qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=dana-payment-mock',
            deepLink: 'dana://payment?payment_id=mock',
            status: 'PENDING',
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Error creating DANA payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create DANA payment',
      };
    }
  }

  /**
   * Create payment via LinkAja
   */
  async createLinkAjaPayment(
    config: PaymentGatewayConfig,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info(`Creating LinkAja payment for order ${request.orderId}`);

      if (!config.merchantId || !config.apiKey || !config.apiSecret) {
        throw new Error('LinkAja API credentials not configured');
      }

      try {
        // LinkAja API endpoint
        const linkajaApiUrl = config.baseUrl || 'https://api.linkaja.id/v1/payments';
        
        const timestamp = Date.now().toString();
        const signature = this.generateLinkAjaSignature(config, request, timestamp);

        const linkajaRequest = {
          merchant_id: config.merchantId,
          amount: request.amount,
          order_id: request.orderId,
          customer_phone: request.customerPhone,
          description: request.description || `Payment for order ${request.orderId}`,
          callback_url: request.callbackUrl,
          timestamp,
          signature,
        };

        const response = await axios.post(linkajaApiUrl, linkajaRequest, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey,
          },
        });

        if (response.data && response.data.payment_id) {
          return {
            success: true,
            paymentId: response.data.payment_id,
            qrCode: response.data.qr_code,
            deepLink: response.data.deep_link,
            status: 'PENDING',
          };
        } else {
          throw new Error('Invalid LinkAja API response');
        }
      } catch (error: any) {
        logger.error('LinkAja API error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock LinkAja response');
          return {
            success: true,
            paymentId: `linkaja-${Date.now()}`,
            qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=linkaja-payment-mock',
            deepLink: 'linkaja://payment?payment_id=mock',
            status: 'PENDING',
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Error creating LinkAja payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create LinkAja payment',
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    config: PaymentGatewayConfig,
    paymentId: string
  ): Promise<PaymentStatus> {
    try {
      let response: any;

      switch (config.provider) {
        case 'OVO':
          response = await this.checkOVOStatus(config, paymentId);
          break;
        case 'DANA':
          response = await this.checkDANAStatus(config, paymentId);
          break;
        case 'LINKAJA':
          response = await this.checkLinkAjaStatus(config, paymentId);
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      return response;
    } catch (error: any) {
      logger.error('Error checking payment status:', error);
      throw error;
    }
  }

  /**
   * Generate OVO signature
   */
  private generateOVOSignature(
    config: PaymentGatewayConfig,
    request: PaymentRequest,
    timestamp: string
  ): string {
    const data = `${config.merchantId}${request.amount}${request.orderId}${timestamp}${config.apiSecret}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate DANA signature
   */
  private generateDANASignature(
    config: PaymentGatewayConfig,
    request: PaymentRequest,
    timestamp: string
  ): string {
    const data = `${config.merchantId}${request.amount}${request.orderId}${timestamp}${config.apiSecret}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate LinkAja signature
   */
  private generateLinkAjaSignature(
    config: PaymentGatewayConfig,
    request: PaymentRequest,
    timestamp: string
  ): string {
    const data = `${config.merchantId}${request.amount}${request.orderId}${timestamp}${config.apiSecret}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check OVO payment status
   */
  private async checkOVOStatus(config: PaymentGatewayConfig, paymentId: string): Promise<PaymentStatus> {
    // TODO: Implement actual OVO status check API
    return {
      paymentId,
      status: 'PENDING',
      amount: 0,
    };
  }

  /**
   * Check DANA payment status
   */
  private async checkDANAStatus(config: PaymentGatewayConfig, paymentId: string): Promise<PaymentStatus> {
    // TODO: Implement actual DANA status check API
    return {
      paymentId,
      status: 'PENDING',
      amount: 0,
    };
  }

  /**
   * Check LinkAja payment status
   */
  private async checkLinkAjaStatus(config: PaymentGatewayConfig, paymentId: string): Promise<PaymentStatus> {
    // TODO: Implement actual LinkAja status check API
    return {
      paymentId,
      status: 'PENDING',
      amount: 0,
    };
  }
}

export default new PaymentGatewayIntegrationService();


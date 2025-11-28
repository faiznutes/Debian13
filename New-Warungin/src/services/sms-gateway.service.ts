/**
 * SMS Gateway Service
 * Handles SMS sending via multiple providers (Twilio, Zenziva, etc.)
 */

import logger from '../utils/logger';

interface SMSConfig {
  provider: 'TWILIO' | 'ZENZIVA' | 'MOCK';
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string; // For Twilio
  authToken?: string; // For Twilio
  senderId?: string;
}

interface SendSMSInput {
  to: string;
  message: string;
  campaignId?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

class SMSGatewayService {
  private config: SMSConfig;

  constructor() {
    // Load config from environment variables
    this.config = {
      provider: (process.env.SMS_PROVIDER as 'TWILIO' | 'ZENZIVA' | 'MOCK') || 'MOCK',
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET,
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      senderId: process.env.SMS_SENDER_ID || 'WARUNGIN',
    };
  }

  /**
   * Send SMS via configured provider
   */
  async sendSMS(input: SendSMSInput): Promise<SMSResponse> {
    try {
      switch (this.config.provider) {
        case 'TWILIO':
          return await this.sendViaTwilio(input);
        case 'ZENZIVA':
          return await this.sendViaZenziva(input);
        case 'MOCK':
        default:
          return await this.sendViaMock(input);
      }
    } catch (error: any) {
      logger.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(input: SendSMSInput): Promise<SMSResponse> {
    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      // Dynamic import Twilio client
      let twilio: typeof import('twilio');
      try {
        twilio = await import('twilio');
      } catch (importError) {
        throw new Error('twilio package is not installed. Install it with: npm install twilio');
      }
      const client = twilio.default(this.config.accountSid, this.config.authToken);

      const response = await client.messages.create({
        body: input.message,
        from: this.config.senderId,
        to: input.to,
      });

      return {
        success: true,
        messageId: response.sid,
        status: response.status,
      };
    } catch (error: any) {
      logger.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message || 'Twilio SMS failed',
      };
    }
  }

  /**
   * Send SMS via Zenziva
   */
  private async sendViaZenziva(input: SendSMSInput): Promise<SMSResponse> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error('Zenziva credentials not configured');
    }

    try {
      // Zenziva API endpoint
      const url = 'https://console.zenziva.net/reguler/api/sendsms/';
      
      const params = new URLSearchParams({
        userkey: this.config.apiKey,
        passkey: this.config.apiSecret,
        to: input.to,
        message: input.message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (data.status === 1 || data.status === '1') {
        return {
          success: true,
          messageId: data.messageId || data.message_id,
          status: 'sent',
        };
      } else {
        return {
          success: false,
          error: data.text || 'Zenziva SMS failed',
        };
      }
    } catch (error: any) {
      logger.error('Zenziva SMS error:', error);
      return {
        success: false,
        error: error.message || 'Zenziva SMS failed',
      };
    }
  }

  /**
   * Mock SMS sending (for development/testing)
   */
  private async sendViaMock(input: SendSMSInput): Promise<SMSResponse> {
    logger.info(`[MOCK SMS] To: ${input.to}, Message: ${input.message.substring(0, 50)}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      status: 'sent',
    };
  }

  /**
   * Check SMS delivery status
   */
  async checkDeliveryStatus(messageId: string): Promise<SMSResponse> {
    try {
      switch (this.config.provider) {
        case 'TWILIO':
          return await this.checkTwilioStatus(messageId);
        case 'ZENZIVA':
          return await this.checkZenzivaStatus(messageId);
        default:
          return {
            success: true,
            status: 'delivered',
          };
      }
    } catch (error: any) {
      logger.error('Error checking SMS status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check Twilio delivery status
   */
  private async checkTwilioStatus(messageId: string): Promise<SMSResponse> {
    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      let twilio: typeof import('twilio');
      try {
        twilio = await import('twilio');
      } catch (importError) {
        throw new Error('twilio package is not installed. Install it with: npm install twilio');
      }
      const client = twilio.default(this.config.accountSid, this.config.authToken);
      
      const message = await client.messages(messageId).fetch();
      
      return {
        success: true,
        messageId: message.sid,
        status: message.status,
      };
    } catch (error: any) {
      logger.error('Twilio status check error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check Zenziva delivery status
   */
  private async checkZenzivaStatus(messageId: string): Promise<SMSResponse> {
    // Zenziva status check implementation
    // Note: Zenziva may not provide status check API, return default
    return {
      success: true,
      status: 'delivered',
    };
  }

  /**
   * Get SMS balance/credits
   */
  async getBalance(): Promise<{ balance: number; currency?: string }> {
    try {
      switch (this.config.provider) {
        case 'TWILIO':
          return await this.getTwilioBalance();
        case 'ZENZIVA':
          return await this.getZenzivaBalance();
        default:
          return { balance: 0 };
      }
    } catch (error: any) {
      logger.error('Error getting SMS balance:', error);
      return { balance: 0 };
    }
  }

  /**
   * Get Twilio balance
   */
  private async getTwilioBalance(): Promise<{ balance: number; currency: string }> {
    if (!this.config.accountSid || !this.config.authToken) {
      return { balance: 0 };
    }

    try {
      let twilio: typeof import('twilio');
      try {
        twilio = await import('twilio');
      } catch (importError) {
        throw new Error('twilio package is not installed. Install it with: npm install twilio');
      }
      const client = twilio.default(this.config.accountSid, this.config.authToken);
      
      const account = await client.api.accounts(this.config.accountSid).fetch();
      
      return {
        balance: parseFloat(account.balance || '0'),
        currency: account.currency || 'USD',
      };
    } catch (error: any) {
      logger.error('Error getting Twilio balance:', error);
      return { balance: 0 };
    }
  }

  /**
   * Get Zenziva balance
   */
  private async getZenzivaBalance(): Promise<{ balance: number }> {
    // Zenziva balance check implementation
    // Note: Zenziva may not provide balance API
    return { balance: 0 };
  }
}

export default new SMSGatewayService();


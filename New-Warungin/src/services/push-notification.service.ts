/**
 * Push Notification Service
 * Handles push notifications via multiple providers (Firebase, OneSignal, etc.)
 */

import logger from '../utils/logger';

interface PushConfig {
  provider: 'FIREBASE' | 'ONESIGNAL' | 'MOCK';
  apiKey?: string;
  appId?: string;
  restApiKey?: string; // For OneSignal
  projectId?: string; // For Firebase
  serverKey?: string; // For Firebase
}

interface SendPushInput {
  to: string | string[]; // Device token(s) or user ID(s)
  title: string;
  message: string;
  data?: Record<string, any>;
  campaignId?: string;
}

interface PushResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

class PushNotificationService {
  private config: PushConfig;

  constructor() {
    // Load config from environment variables
    this.config = {
      provider: (process.env.PUSH_PROVIDER as 'FIREBASE' | 'ONESIGNAL' | 'MOCK') || 'MOCK',
      apiKey: process.env.PUSH_API_KEY,
      appId: process.env.ONESIGNAL_APP_ID,
      restApiKey: process.env.ONESIGNAL_REST_API_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID,
      serverKey: process.env.FIREBASE_SERVER_KEY,
    };
  }

  /**
   * Send push notification via configured provider
   */
  async sendPush(input: SendPushInput): Promise<PushResponse> {
    try {
      switch (this.config.provider) {
        case 'FIREBASE':
          return await this.sendViaFirebase(input);
        case 'ONESIGNAL':
          return await this.sendViaOneSignal(input);
        case 'MOCK':
        default:
          return await this.sendViaMock(input);
      }
    } catch (error: any) {
      logger.error('Error sending push notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send push notification',
      };
    }
  }

  /**
   * Send push notification via Firebase Cloud Messaging (FCM)
   */
  private async sendViaFirebase(input: SendPushInput): Promise<PushResponse> {
    if (!this.config.serverKey) {
      throw new Error('Firebase server key not configured');
    }

    try {
      // Dynamic import Firebase Admin SDK
      let admin: typeof import('firebase-admin');
      try {
        admin = await import('firebase-admin');
      } catch (importError) {
        throw new Error('firebase-admin package is not installed. Install it with: npm install firebase-admin');
      }
      
      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: this.config.projectId,
              // In production, use service account key from environment or file
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
          });
        } catch (initError: any) {
          // If initialization fails, try with server key only
          logger.warn('Firebase Admin initialization failed, using server key method');
        }
      }

      const tokens = Array.isArray(input.to) ? input.to : [input.to];
      
      // Send to multiple devices
      const message = {
        notification: {
          title: input.title,
          body: input.message,
        },
        data: {
          ...input.data,
          campaignId: input.campaignId || '',
        },
        tokens,
      };

      if (!admin.messaging) {
        throw new Error('Firebase Admin messaging is not available. Please check your Firebase configuration.');
      }
      
      const response = await admin.messaging().sendEachForMulticast(message);

      if (response.successCount > 0) {
        return {
          success: true,
          messageId: response.responses[0].messageId,
          status: 'sent',
        };
      } else {
        return {
          success: false,
          error: 'All push notifications failed',
        };
      }
    } catch (error: any) {
      logger.error('Firebase push error:', error);
      return {
        success: false,
        error: error.message || 'Firebase push failed',
      };
    }
  }

  /**
   * Send push notification via OneSignal
   */
  private async sendViaOneSignal(input: SendPushInput): Promise<PushResponse> {
    if (!this.config.appId || !this.config.restApiKey) {
      throw new Error('OneSignal credentials not configured');
    }

    try {
      const url = 'https://onesignal.com/api/v1/notifications';
      
      const tokens = Array.isArray(input.to) ? input.to : [input.to];
      
      const payload = {
        app_id: this.config.appId,
        include_player_ids: tokens,
        headings: { en: input.title },
        contents: { en: input.message },
        data: {
          ...input.data,
          campaignId: input.campaignId,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.config.restApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.id) {
        return {
          success: true,
          messageId: data.id,
          status: 'sent',
        };
      } else {
        return {
          success: false,
          error: data.errors?.[0] || 'OneSignal push failed',
        };
      }
    } catch (error: any) {
      logger.error('OneSignal push error:', error);
      return {
        success: false,
        error: error.message || 'OneSignal push failed',
      };
    }
  }

  /**
   * Mock push notification (for development/testing)
   */
  private async sendViaMock(input: SendPushInput): Promise<PushResponse> {
    logger.info(`[MOCK PUSH] To: ${Array.isArray(input.to) ? input.to.join(', ') : input.to}, Title: ${input.title}, Message: ${input.message.substring(0, 50)}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock-push-${Date.now()}`,
      status: 'sent',
    };
  }

  /**
   * Send push to multiple users by user IDs
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<{ sent: number; failed: number }> {
    // In production, fetch device tokens from database based on user IDs
    // For now, this is a placeholder structure
    let sent = 0;
    let failed = 0;

    // TODO: Fetch device tokens from database
    // const deviceTokens = await prisma.deviceToken.findMany({
    //   where: { userId: { in: userIds } },
    //   select: { token: true },
    // });

    // Mock device tokens for now
    const deviceTokens: string[] = [];

    for (const token of deviceTokens) {
      try {
        const result = await this.sendPush({
          to: token,
          title,
          message,
          data,
        });
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error: any) {
        logger.error('Error sending push to user:', error);
        failed++;
      }
    }

    return { sent, failed };
  }
}

export default new PushNotificationService();


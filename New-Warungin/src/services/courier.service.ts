/**
 * Courier Service
 * Handles integration with various courier APIs (JNE, J&T, POS Indonesia)
 */

import axios from 'axios';
import logger from '../utils/logger';
import prisma from '../config/database';

export interface CourierConfig {
  courier: 'JNE' | 'JNT' | 'POS';
  apiKey: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;
  weight: number; // in kg
  items: Array<{
    name: string;
    quantity: number;
    value: number;
  }>;
}

export interface ShipmentResponse {
  trackingNumber: string;
  courier: string;
  status: string;
  estimatedDelivery?: Date;
  cost?: number;
  airwayBill?: string;
}

export interface TrackingResponse {
  trackingNumber: string;
  status: string;
  currentLocation?: string;
  history: Array<{
    date: Date;
    status: string;
    location?: string;
    description?: string;
  }>;
  estimatedDelivery?: Date;
}

class CourierService {
  /**
   * Create shipment via JNE API
   */
  async createJNEShipment(
    config: CourierConfig,
    request: CreateShipmentRequest
  ): Promise<ShipmentResponse> {
    try {
      // JNE API integration
      // In production, implement actual JNE API call
      // Example structure:
      /*
      const response = await axios.post(
        config.baseUrl || 'https://api.jne.co.id/v1/shipment',
        {
          username: config.username,
          api_key: config.apiKey,
          from: {
            name: 'Warungin',
            address: '...',
            city: '...',
            postal_code: '...',
          },
          to: {
            name: request.customerName,
            address: request.customerAddress,
            city: request.customerCity,
            postal_code: request.customerPostalCode,
          },
          weight: request.weight,
          goods: request.items,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      */

      logger.info(`Creating JNE shipment for order ${request.orderId}`);
      
      // JNE API Production Integration
      // Note: This requires actual JNE API credentials and endpoint
      // JNE typically uses SOAP API or REST API with authentication
      
      if (!config.apiKey || !config.username) {
        throw new Error('JNE API credentials not configured');
      }

      try {
        // JNE API endpoint (example - actual endpoint may vary)
        const jneApiUrl = config.baseUrl || 'https://api.jne.co.id/v1/shipment';
        
        // JNE API request structure (adjust based on actual JNE API documentation)
        const jneRequest = {
          username: config.username,
          api_key: config.apiKey,
          from: {
            // Get from tenant settings or outlet
            name: 'Warungin',
            address: '...', // Should be configurable
            city: '...',
            postal_code: '...',
            phone: '...',
          },
          to: {
            name: request.customerName,
            address: request.customerAddress,
            city: request.customerCity,
            postal_code: request.customerPostalCode,
            phone: request.customerPhone,
          },
          weight: request.weight,
          goods: request.items.map(item => ({
            name: item.name,
            qty: item.quantity,
            value: item.value,
          })),
        };

        // Make API call to JNE
        const response = await axios.post(jneApiUrl, jneRequest, {
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers as required by JNE
          },
        });

        // Parse JNE response
        if (response.data && response.data.tracking_number) {
          return {
            trackingNumber: response.data.tracking_number,
            courier: 'JNE',
            status: 'CREATED',
            estimatedDelivery: response.data.estimated_delivery 
              ? new Date(response.data.estimated_delivery) 
              : undefined,
            cost: response.data.cost,
            airwayBill: response.data.airway_bill || response.data.tracking_number,
          };
        } else {
          throw new Error('Invalid JNE API response');
        }
      } catch (error: any) {
        logger.error('JNE API error:', error);
        // Fallback to mock if API fails (for development)
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock JNE response due to API error');
          return {
            trackingNumber: `JNE-${Date.now()}`,
            courier: 'JNE',
            status: 'CREATED',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            cost: request.weight * 5000, // Mock cost
            airwayBill: `JNE-${Date.now()}`,
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('JNE shipment creation failed:', error);
      throw new Error(`Failed to create JNE shipment: ${error.message}`);
    }
  }

  /**
   * Create shipment via J&T API
   */
  async createJNTShipment(
    config: CourierConfig,
    request: CreateShipmentRequest
  ): Promise<ShipmentResponse> {
    try {
      logger.info(`Creating J&T shipment for order ${request.orderId}`);
      
      // J&T API Production Integration
      if (!config.apiKey || !config.apiSecret) {
        throw new Error('J&T API credentials not configured');
      }

      try {
        // J&T API endpoint (example - actual endpoint may vary)
        const jntApiUrl = config.baseUrl || 'https://api.jnt.co.id/v1/shipment';
        
        // J&T API request structure
        const jntRequest = {
          api_key: config.apiKey,
          api_secret: config.apiSecret,
          from: {
            name: 'Warungin',
            address: '...',
            city: '...',
            postal_code: '...',
            phone: '...',
          },
          to: {
            name: request.customerName,
            address: request.customerAddress,
            city: request.customerCity,
            postal_code: request.customerPostalCode,
            phone: request.customerPhone,
          },
          weight: request.weight,
          items: request.items,
        };

        const response = await axios.post(jntApiUrl, jntRequest, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.data && response.data.tracking_number) {
          return {
            trackingNumber: response.data.tracking_number,
            courier: 'JNT',
            status: 'CREATED',
            estimatedDelivery: response.data.estimated_delivery 
              ? new Date(response.data.estimated_delivery) 
              : undefined,
            cost: response.data.cost,
            airwayBill: response.data.airway_bill || response.data.tracking_number,
          };
        } else {
          throw new Error('Invalid J&T API response');
        }
      } catch (error: any) {
        logger.error('J&T API error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock J&T response due to API error');
          return {
            trackingNumber: `JNT-${Date.now()}`,
            courier: 'JNT',
            status: 'CREATED',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            cost: request.weight * 4500,
            airwayBill: `JNT-${Date.now()}`,
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('J&T shipment creation failed:', error);
      throw new Error(`Failed to create J&T shipment: ${error.message}`);
    }
  }

  /**
   * Create shipment via POS Indonesia API
   */
  async createPOSShipment(
    config: CourierConfig,
    request: CreateShipmentRequest
  ): Promise<ShipmentResponse> {
    try {
      // POS Indonesia API integration
      // In production, implement actual POS Indonesia API call
      logger.info(`Creating POS shipment for order ${request.orderId}`);
      
      // Mock response for now
      const trackingNumber = `POS${Date.now()}`;
      
      return {
        trackingNumber,
        courier: 'POS',
        status: 'CREATED',
        estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        cost: 10000,
        airwayBill: trackingNumber,
      };
    } catch (error: any) {
      logger.error('POS shipment creation failed:', error);
      throw new Error(`Failed to create POS shipment: ${error.message}`);
    }
  }

  /**
   * Create shipment (auto-select courier based on config)
   */
  async createShipment(
    config: CourierConfig,
    request: CreateShipmentRequest
  ): Promise<ShipmentResponse> {
    switch (config.courier) {
      case 'JNE':
        return await this.createJNEShipment(config, request);
      case 'JNT':
        return await this.createJNTShipment(config, request);
      case 'POS':
        return await this.createPOSShipment(config, request);
      default:
        throw new Error(`Unsupported courier: ${config.courier}`);
    }
  }

  /**
   * Track JNE shipment
   */
  async trackJNE(trackingNumber: string, config: CourierConfig): Promise<TrackingResponse> {
    try {
      // JNE tracking API integration
      // In production, implement actual JNE tracking API call
      logger.info(`Tracking JNE shipment: ${trackingNumber}`);
      
      // Mock response
      return {
        trackingNumber,
        status: 'IN_TRANSIT',
        currentLocation: 'Jakarta',
        history: [
          {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'CREATED',
            location: 'Jakarta',
            description: 'Shipment created',
          },
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'IN_TRANSIT',
            location: 'Jakarta',
            description: 'In transit to destination',
          },
        ],
        estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      };
    } catch (error: any) {
      logger.error('JNE tracking failed:', error);
      throw new Error(`Failed to track JNE shipment: ${error.message}`);
    }
  }

  /**
   * Track J&T shipment
   */
  async trackJNT(trackingNumber: string, config: CourierConfig): Promise<TrackingResponse> {
    try {
      // J&T tracking API integration
      logger.info(`Tracking J&T shipment: ${trackingNumber}`);
      
      // Mock response
      return {
        trackingNumber,
        status: 'IN_TRANSIT',
        currentLocation: 'Bandung',
        history: [
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'CREATED',
            location: 'Bandung',
            description: 'Shipment created',
          },
        ],
        estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      };
    } catch (error: any) {
      logger.error('J&T tracking failed:', error);
      throw new Error(`Failed to track J&T shipment: ${error.message}`);
    }
  }

  /**
   * Track POS Indonesia shipment
   */
  async trackPOS(trackingNumber: string, config: CourierConfig): Promise<TrackingResponse> {
    try {
      // POS Indonesia tracking API integration
      logger.info(`Tracking POS shipment: ${trackingNumber}`);
      
      // Mock response
      return {
        trackingNumber,
        status: 'IN_TRANSIT',
        currentLocation: 'Surabaya',
        history: [
          {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'CREATED',
            location: 'Surabaya',
            description: 'Shipment created',
          },
        ],
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };
    } catch (error: any) {
      logger.error('POS tracking failed:', error);
      throw new Error(`Failed to track POS shipment: ${error.message}`);
    }
  }

  /**
   * Track shipment (auto-select courier)
   */
  async trackShipment(
    trackingNumber: string,
    courier: 'JNE' | 'JNT' | 'POS',
    config: CourierConfig
  ): Promise<TrackingResponse> {
    switch (courier) {
      case 'JNE':
        return await this.trackJNE(trackingNumber, config);
      case 'JNT':
        return await this.trackJNT(trackingNumber, config);
      case 'POS':
        return await this.trackPOS(trackingNumber, config);
      default:
        throw new Error(`Unsupported courier: ${courier}`);
    }
  }

  /**
   * Get courier config from database
   */
  async getCourierConfig(tenantId: string, courier: string): Promise<CourierConfig | null> {
    // In production, fetch from courier_config table
    // For now, return null (needs to be configured)
    return null;
  }

  /**
   * Save courier config to database
   */
  async saveCourierConfig(tenantId: string, config: CourierConfig): Promise<void> {
    // In production, save to courier_config table
    // For now, just log
    logger.info(`Saving courier config for tenant ${tenantId}: ${config.courier}`);
  }
}

export default new CourierService();


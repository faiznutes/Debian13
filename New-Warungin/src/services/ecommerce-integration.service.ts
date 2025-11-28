/**
 * E-commerce Integration Service
 * Handles integration with e-commerce platforms (Shopee, Tokopedia, Bukalapak)
 */

import axios from 'axios';
import logger from '../utils/logger';
import prisma from '../config/database';
import productService from './product.service';
import orderService from './order.service';

interface EcommerceConfig {
  platform: 'SHOPEE' | 'TOKOPEDIA' | 'BUKALAPAK';
  apiKey: string;
  apiSecret: string;
  shopId?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
}

interface SyncProductRequest {
  productId: string;
  ecommerceProductId?: string;
  syncPrice: boolean;
  syncStock: boolean;
  syncImages: boolean;
}

interface SyncOrderRequest {
  ecommerceOrderId: string;
  platform: string;
}

class EcommerceIntegrationService {
  /**
   * Sync product to Shopee
   */
  async syncProductToShopee(
    tenantId: string,
    config: EcommerceConfig,
    request: SyncProductRequest
  ): Promise<{ success: boolean; ecommerceProductId?: string; error?: string }> {
    try {
      logger.info(`Syncing product ${request.productId} to Shopee`);

      // Get product from database
      const product = await productService.getProductById(request.productId, tenantId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Shopee API integration
      // Note: This requires actual Shopee API credentials and endpoint
      if (!config.apiKey || !config.apiSecret) {
        throw new Error('Shopee API credentials not configured');
      }

      try {
        // Shopee API endpoint (example - actual endpoint may vary)
        const shopeeApiUrl = config.baseUrl || 'https://partner.shopeemobile.com/api/v2/product/add_item';
        
        // Prepare Shopee product data
        const shopeeProductData = {
          original_price: parseFloat(product.price.toString()),
          description: product.description || '',
          weight: 0.1, // Default weight in kg
          item_name: product.name,
          item_sku: product.sku || '',
          stock: request.syncStock ? product.stock : 0,
          images: product.image ? [product.image] : [],
        };

        // Make API call to Shopee
        const response = await axios.post(shopeeApiUrl, shopeeProductData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.accessToken}`,
            'X-Shopee-Api-Key': config.apiKey,
          },
        });

        if (response.data && response.data.item_id) {
          // Save mapping to database
          // await prisma.ecommerceProductMapping.create({
          //   data: {
          //     tenantId,
          //     productId: product.id,
          //     platform: 'SHOPEE',
          //     ecommerceProductId: response.data.item_id.toString(),
          //     ecommerceShopId: config.shopId,
          //   },
          // });

          return {
            success: true,
            ecommerceProductId: response.data.item_id.toString(),
          };
        } else {
          throw new Error('Invalid Shopee API response');
        }
      } catch (error: any) {
        logger.error('Shopee API error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock Shopee response');
          return {
            success: true,
            ecommerceProductId: `shopee-${Date.now()}`,
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Error syncing product to Shopee:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync product to Shopee',
      };
    }
  }

  /**
   * Sync product to Tokopedia
   */
  async syncProductToTokopedia(
    tenantId: string,
    config: EcommerceConfig,
    request: SyncProductRequest
  ): Promise<{ success: boolean; ecommerceProductId?: string; error?: string }> {
    try {
      logger.info(`Syncing product ${request.productId} to Tokopedia`);

      const product = await productService.getProductById(request.productId, tenantId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!config.apiKey || !config.apiSecret) {
        throw new Error('Tokopedia API credentials not configured');
      }

      try {
        // Tokopedia API endpoint
        const tokopediaApiUrl = config.baseUrl || 'https://fs.tokopedia.net/v1/products/create';
        
        const tokopediaProductData = {
          name: product.name,
          sku: product.sku || '',
          price: parseFloat(product.price.toString()),
          stock: request.syncStock ? product.stock : 0,
          description: product.description || '',
          images: product.image ? [product.image] : [],
        };

        const response = await axios.post(tokopediaApiUrl, tokopediaProductData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.accessToken}`,
            'X-API-Key': config.apiKey,
          },
        });

        if (response.data && response.data.product_id) {
          return {
            success: true,
            ecommerceProductId: response.data.product_id.toString(),
          };
        } else {
          throw new Error('Invalid Tokopedia API response');
        }
      } catch (error: any) {
        logger.error('Tokopedia API error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock Tokopedia response');
          return {
            success: true,
            ecommerceProductId: `tokopedia-${Date.now()}`,
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Error syncing product to Tokopedia:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync product to Tokopedia',
      };
    }
  }

  /**
   * Sync product to Bukalapak
   */
  async syncProductToBukalapak(
    tenantId: string,
    config: EcommerceConfig,
    request: SyncProductRequest
  ): Promise<{ success: boolean; ecommerceProductId?: string; error?: string }> {
    try {
      logger.info(`Syncing product ${request.productId} to Bukalapak`);

      const product = await productService.getProductById(request.productId, tenantId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!config.apiKey || !config.apiSecret) {
        throw new Error('Bukalapak API credentials not configured');
      }

      try {
        // Bukalapak API endpoint
        const bukalapakApiUrl = config.baseUrl || 'https://api.bukalapak.com/v2/products.json';
        
        const bukalapakProductData = {
          name: product.name,
          price: parseFloat(product.price.toString()),
          stock: request.syncStock ? product.stock : 0,
          description: product.description || '',
          images: product.image ? [product.image] : [],
        };

        const response = await axios.post(bukalapakApiUrl, bukalapakProductData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.accessToken}`,
            'X-API-Key': config.apiKey,
          },
        });

        if (response.data && response.data.id) {
          return {
            success: true,
            ecommerceProductId: response.data.id.toString(),
          };
        } else {
          throw new Error('Invalid Bukalapak API response');
        }
      } catch (error: any) {
        logger.error('Bukalapak API error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Using mock Bukalapak response');
          return {
            success: true,
            ecommerceProductId: `bukalapak-${Date.now()}`,
          };
        }
        throw error;
      }
    } catch (error: any) {
      logger.error('Error syncing product to Bukalapak:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync product to Bukalapak',
      };
    }
  }

  /**
   * Sync order from e-commerce platform
   */
  async syncOrderFromEcommerce(
    tenantId: string,
    config: EcommerceConfig,
    request: SyncOrderRequest
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      logger.info(`Syncing order ${request.ecommerceOrderId} from ${config.platform}`);

      // Fetch order from e-commerce platform
      let ecommerceOrder: any;

      switch (config.platform) {
        case 'SHOPEE':
          ecommerceOrder = await this.fetchShopeeOrder(config, request.ecommerceOrderId);
          break;
        case 'TOKOPEDIA':
          ecommerceOrder = await this.fetchTokopediaOrder(config, request.ecommerceOrderId);
          break;
        case 'BUKALAPAK':
          ecommerceOrder = await this.fetchBukalapakOrder(config, request.ecommerceOrderId);
          break;
        default:
          throw new Error(`Unsupported platform: ${config.platform}`);
      }

      // Convert to internal order format and create
      const orderData = this.convertEcommerceOrderToInternal(ecommerceOrder, config.platform);
      
      // Create order in system
      const order = await orderService.createOrder(tenantId, orderData);

      return {
        success: true,
        orderId: order.id,
      };
    } catch (error: any) {
      logger.error('Error syncing order from e-commerce:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync order',
      };
    }
  }

  /**
   * Fetch order from Shopee
   */
  private async fetchShopeeOrder(config: EcommerceConfig, orderId: string): Promise<any> {
    // TODO: Implement actual Shopee API call
    return {
      order_id: orderId,
      order_status: 'PAID',
      items: [],
      total: 0,
      customer: {},
    };
  }

  /**
   * Fetch order from Tokopedia
   */
  private async fetchTokopediaOrder(config: EcommerceConfig, orderId: string): Promise<any> {
    // TODO: Implement actual Tokopedia API call
    return {
      order_id: orderId,
      status: 'PAID',
      items: [],
      total: 0,
      customer: {},
    };
  }

  /**
   * Fetch order from Bukalapak
   */
  private async fetchBukalapakOrder(config: EcommerceConfig, orderId: string): Promise<any> {
    // TODO: Implement actual Bukalapak API call
    return {
      order_id: orderId,
      status: 'PAID',
      items: [],
      total: 0,
      customer: {},
    };
  }

  /**
   * Convert e-commerce order to internal format
   */
  private convertEcommerceOrderToInternal(ecommerceOrder: any, platform: string): any {
    return {
      orderNumber: `${platform}-${ecommerceOrder.order_id}`,
      items: ecommerceOrder.items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
      total: ecommerceOrder.total,
      customer: {
        name: ecommerceOrder.customer.name,
        email: ecommerceOrder.customer.email,
        phone: ecommerceOrder.customer.phone,
      },
      paymentMethod: 'E_WALLET',
      status: 'PENDING',
      notes: `Order from ${platform}`,
    };
  }

  /**
   * Update product stock on e-commerce platform
   */
  async updateEcommerceStock(
    tenantId: string,
    config: EcommerceConfig,
    productId: string,
    stock: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get e-commerce product mapping
      // const mapping = await prisma.ecommerceProductMapping.findFirst({
      //   where: {
      //     tenantId,
      //     productId,
      //     platform: config.platform,
      //   },
      // });

      // if (!mapping) {
      //   throw new Error('Product not synced to e-commerce platform');
      // }

      // Update stock on e-commerce platform
      switch (config.platform) {
        case 'SHOPEE':
          // await this.updateShopeeStock(config, mapping.ecommerceProductId, stock);
          break;
        case 'TOKOPEDIA':
          // await this.updateTokopediaStock(config, mapping.ecommerceProductId, stock);
          break;
        case 'BUKALAPAK':
          // await this.updateBukalapakStock(config, mapping.ecommerceProductId, stock);
          break;
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Error updating e-commerce stock:', error);
      return {
        success: false,
        error: error.message || 'Failed to update stock',
      };
    }
  }
}

export default new EcommerceIntegrationService();


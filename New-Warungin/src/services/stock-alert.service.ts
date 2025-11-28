/**
 * Stock Alert Service
 * Manages stock alerts and notifications
 */

import prisma from '../config/database';
import logger from '../utils/logger';
import productService from './product.service';
import marketingService from './marketing.service';

class StockAlertService {
  /**
   * Get low stock products
   */
  async getLowStockProducts(tenantId: string) {
    try {
      // Get products with low stock (stock <= minStock)
      // Note: Prisma doesn't support comparing fields directly in where clause
      // So we fetch all active products and filter in memory
      const allProducts = await prisma.product.findMany({
        where: {
          tenantId,
          isActive: true,
        },
      });

      const products = allProducts.filter(p => p.minStock > 0 && p.stock <= p.minStock);

      return products;
    } catch (error: any) {
      logger.error('Error getting low stock products:', error);
      throw error;
    }
  }

  /**
   * Check and send stock alerts
   */
  async checkAndSendStockAlerts(tenantId: string) {
    try {
      const lowStockProducts = await this.getLowStockProducts(tenantId);

      if (lowStockProducts.length === 0) {
        return { sent: 0, message: 'No low stock products found' };
      }

      // Get tenant admin email
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { email: true, name: true },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Prepare alert message
      const productList = lowStockProducts.map(p => 
        `- ${p.name} (SKU: ${p.sku || 'N/A'}): Stock: ${p.stock}, Min: ${p.minStock}`
      ).join('\n');

      const subject = `Stock Alert: ${lowStockProducts.length} Product(s) Low Stock`;
      const content = `
        <h2>Stock Alert</h2>
        <p>Dear ${tenant.name},</p>
        <p>The following products are running low on stock:</p>
        <ul>
          ${lowStockProducts.map(p => 
            `<li><strong>${p.name}</strong> (SKU: ${p.sku || 'N/A'}): Stock: ${p.stock}, Min: ${p.minStock}</li>`
          ).join('')}
        </ul>
        <p>Please consider placing a purchase order to restock these items.</p>
      `;

      // Send email alert (using marketing service)
      try {
        await marketingService.sendEmailCampaign(tenantId, {
          target: 'ALL',
          subject,
          content,
          recipients: [tenant.email],
        });
      } catch (emailError) {
        logger.error('Error sending stock alert email:', emailError);
        // Continue even if email fails
      }

      return {
        sent: 1,
        productsCount: lowStockProducts.length,
        message: `Stock alert sent for ${lowStockProducts.length} product(s)`,
      };
    } catch (error: any) {
      logger.error('Error checking and sending stock alerts:', error);
      throw error;
    }
  }

  /**
   * Get stock alert statistics
   */
  async getStockAlertStats(tenantId: string) {
    try {
      const lowStockProducts = await this.getLowStockProducts(tenantId);
      const outOfStockProducts = await prisma.product.findMany({
        where: {
          tenantId,
          isActive: true,
          stock: 0,
        },
      });

      return {
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalAlerts: lowStockProducts.length + outOfStockProducts.length,
      };
    } catch (error: any) {
      logger.error('Error getting stock alert stats:', error);
      throw error;
    }
  }
}

export default new StockAlertService();


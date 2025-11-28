import prisma from '../config/database';
import orderService from './order.service';
import courierService, { CreateShipmentRequest, CourierConfig } from './courier.service';
import logger from '../utils/logger';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  courier: string;
  trackingNumber?: string;
  status: string;
  createdAt: string;
}

interface CourierSetup {
  courier: string;
  apiKey: string;
}

class DeliveryService {
  async getDeliveryOrders(tenantId: string): Promise<DeliveryOrder[]> {
    // Get orders that have delivery information
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        // Only orders with delivery address or notes indicating delivery
        OR: [
          { notes: { contains: 'delivery', mode: 'insensitive' } },
          { notes: { contains: 'kurir', mode: 'insensitive' } },
        ],
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || order.temporaryCustomerName || 'Guest',
      customerPhone: order.customer?.phone || '-',
      deliveryAddress: order.customer?.address || order.notes || '-',
      courier: this.extractCourierFromNotes(order.notes) || 'MANUAL',
      trackingNumber: this.extractTrackingFromNotes(order.notes),
      status: this.mapOrderStatusToDeliveryStatus(order.status),
      createdAt: order.createdAt.toISOString(),
    }));
  }

  async processDelivery(tenantId: string, orderId: string, data: { trackingNumber?: string; courier?: string }): Promise<any> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order notes with delivery info
    const notes = order.notes || '';
    const newNotes = [
      notes,
      data.courier ? `Courier: ${data.courier}` : '',
      data.trackingNumber ? `Tracking: ${data.trackingNumber}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        notes: newNotes,
        status: 'PROCESSING',
      },
    });

    return updatedOrder;
  }

  async setupCourier(tenantId: string, data: CourierSetup): Promise<any> {
    // Store courier configuration
    const config: CourierConfig = {
      courier: data.courier as 'JNE' | 'JNT' | 'POS',
      apiKey: data.apiKey,
    };
    
    await courierService.saveCourierConfig(tenantId, config);
    
    return {
      tenantId,
      courier: data.courier,
      status: 'active',
      configuredAt: new Date(),
    };
  }

  /**
   * Create shipment via courier API
   */
  async createShipment(
    tenantId: string,
    orderId: string,
    courier: 'JNE' | 'JNT' | 'POS'
  ): Promise<any> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get courier config
    const courierConfig = await courierService.getCourierConfig(tenantId, courier);
    if (!courierConfig) {
      throw new Error(`Courier ${courier} not configured for this tenant`);
    }

    // Prepare shipment request
    const shipmentRequest: CreateShipmentRequest = {
      orderId: order.id,
      customerName: order.customer?.name || order.temporaryCustomerName || 'Guest',
      customerPhone: order.customer?.phone || '',
      customerAddress: order.customer?.address || order.notes || '',
      customerCity: '', // Extract from address or get from customer
      customerPostalCode: '', // Extract from address or get from customer
      weight: order.items.reduce((sum, item) => sum + (item.product?.weight || 0.1) * item.quantity, 0),
      items: order.items.map(item => ({
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        value: item.price * item.quantity,
      })),
    };

    // Create shipment via courier API
    const shipment = await courierService.createShipment(courierConfig, shipmentRequest);

    // Update order with tracking info
    const notes = order.notes || '';
    const newNotes = [
      notes,
      `Courier: ${courier}`,
      `Tracking: ${shipment.trackingNumber}`,
    ]
      .filter(Boolean)
      .join(' | ');

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        notes: newNotes,
        status: 'PROCESSING',
      },
    });

    logger.info(`Shipment created for order ${orderId}: ${shipment.trackingNumber}`);

    return {
      order: updatedOrder,
      shipment,
    };
  }

  /**
   * Track shipment via courier API
   */
  async trackShipment(
    tenantId: string,
    trackingNumber: string,
    courier: 'JNE' | 'JNT' | 'POS'
  ): Promise<any> {
    const courierConfig = await courierService.getCourierConfig(tenantId, courier);
    if (!courierConfig) {
      throw new Error(`Courier ${courier} not configured for this tenant`);
    }

    const tracking = await courierService.trackShipment(trackingNumber, courier, courierConfig);

    // Update order status if found
    const order = await prisma.order.findFirst({
      where: {
        tenantId,
        notes: { contains: trackingNumber },
      },
    });

    if (order) {
      // Map tracking status to order status
      let orderStatus = order.status;
      if (tracking.status === 'DELIVERED') {
        orderStatus = 'COMPLETED';
      } else if (tracking.status === 'IN_TRANSIT' || tracking.status === 'OUT_FOR_DELIVERY') {
        orderStatus = 'PROCESSING';
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus },
      });
    }

    return tracking;
  }

  private extractCourierFromNotes(notes: string | null): string | null {
    if (!notes) return null;
    const courierMatch = notes.match(/Courier:\s*(\w+)/i);
    return courierMatch ? courierMatch[1].toUpperCase() : null;
  }

  private extractTrackingFromNotes(notes: string | null): string | undefined {
    if (!notes) return undefined;
    const trackingMatch = notes.match(/Tracking:\s*([A-Z0-9-]+)/i);
    return trackingMatch ? trackingMatch[1] : undefined;
  }

  private mapOrderStatusToDeliveryStatus(orderStatus: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
      COMPLETED: 'DELIVERED',
      CANCELLED: 'CANCELLED',
    };
    return statusMap[orderStatus] || 'PENDING';
  }

  /**
   * Process webhook from courier service
   */
  async processCourierWebhook(courier: string, webhookData: any): Promise<void> {
    try {
      // Extract tracking number and status from webhook data
      // Format may vary by courier service
      const trackingNumber = webhookData.trackingNumber || webhookData.awb || webhookData.waybill;
      const status = webhookData.status || webhookData.deliveryStatus;
      const location = webhookData.location || webhookData.currentLocation;

      if (!trackingNumber) {
        logger.warn(`Courier webhook missing tracking number: ${JSON.stringify(webhookData)}`);
        return;
      }

      // Find order by tracking number
      const order = await prisma.order.findFirst({
        where: {
          notes: { contains: trackingNumber },
        },
        include: {
          customer: true,
        },
      });

      if (!order) {
        logger.warn(`Order not found for tracking number: ${trackingNumber}`);
        return;
      }

      // Map courier status to order status
      let orderStatus = order.status;
      if (status === 'DELIVERED' || status === 'DELIVERED_TO_CUSTOMER') {
        orderStatus = 'COMPLETED';
      } else if (status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY' || status === 'ON_THE_WAY') {
        orderStatus = 'PROCESSING';
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus },
      });

      // Update notes with latest tracking info
      const notes = order.notes || '';
      const newNotes = [
        notes,
        `Courier Status: ${status}`,
        location ? `Location: ${location}` : '',
        `Updated: ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join(' | ');

      await prisma.order.update({
        where: { id: order.id },
        data: { notes: newNotes },
      });

      logger.info(`Order ${order.id} status updated via courier webhook: ${status}`);

      // Notify customer if delivered
      if (status === 'DELIVERED' && order.customer?.email) {
        // In production, send email/SMS notification
        logger.info(`Order ${order.id} delivered - customer notification should be sent`);
      }
    } catch (error: any) {
      logger.error(`Error processing courier webhook:`, error);
      throw error;
    }
  }
}

export default new DeliveryService();


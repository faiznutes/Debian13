import { PrismaClient } from '@prisma/client';
import prisma from '../config/database';

// 5 Template Receipt yang Lengkap
export const RECEIPT_TEMPLATE_DEFINITIONS = [
  {
    type: 'DEFAULT',
    name: 'Struk Standar',
    paperSize: 'A4',
    description: 'Template standar dengan semua informasi lengkap',
    header: {
      showLogo: true,
      showName: true,
      showAddress: true,
      showPhone: true,
    },
    footer: {
      showThankYou: true,
      showContact: true,
      showSocialMedia: false,
    },
    fields: {
      showOrderNumber: true,
      showDate: true,
      showTime: true,
      showCustomer: true,
      showItems: true,
      showSubtotal: true,
      showDiscount: true,
      showTax: false,
      showTotal: true,
      showPaymentMethod: true,
      showChange: true,
    },
    styles: {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      headerAlign: 'center',
      showBorders: true,
    },
  },
  {
    type: 'MODERN',
    name: 'Struk Modern',
    paperSize: 'A4',
    description: 'Desain modern dengan layout yang rapi dan profesional',
    header: {
      showLogo: true,
      showName: true,
      showAddress: true,
      showPhone: true,
      showQRCode: false,
    },
    footer: {
      showThankYou: true,
      showContact: true,
      showSocialMedia: true,
      showWebsite: true,
    },
    fields: {
      showOrderNumber: true,
      showDate: true,
      showTime: true,
      showCustomer: true,
      showItems: true,
      showSubtotal: true,
      showDiscount: true,
      showTax: true,
      showTotal: true,
      showPaymentMethod: true,
      showChange: true,
      showBarcode: true,
    },
    styles: {
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      headerAlign: 'center',
      showBorders: false,
      useGradient: true,
    },
  },
  {
    type: 'MINIMAL',
    name: 'Struk Minimalis',
    paperSize: 'THERMAL_58',
    description: 'Template minimalis untuk thermal printer 58mm',
    header: {
      showLogo: false,
      showName: true,
      showAddress: false,
      showPhone: false,
    },
    footer: {
      showThankYou: true,
      showContact: false,
      showSocialMedia: false,
    },
    fields: {
      showOrderNumber: true,
      showDate: true,
      showTime: false,
      showCustomer: false,
      showItems: true,
      showSubtotal: false,
      showDiscount: false,
      showTax: false,
      showTotal: true,
      showPaymentMethod: true,
      showChange: true,
    },
    styles: {
      fontSize: '10px',
      fontFamily: 'Courier New, monospace',
      headerAlign: 'center',
      showBorders: false,
    },
  },
  {
    type: 'DETAILED',
    name: 'Struk Detail',
    paperSize: 'A4',
    description: 'Template detail dengan informasi lengkap termasuk pajak dan breakdown',
    header: {
      showLogo: true,
      showName: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showTaxId: true,
    },
    footer: {
      showThankYou: true,
      showContact: true,
      showSocialMedia: true,
      showWebsite: true,
      showTerms: true,
    },
    fields: {
      showOrderNumber: true,
      showDate: true,
      showTime: true,
      showCustomer: true,
      showCustomerAddress: true,
      showItems: true,
      showItemDescription: true,
      showSubtotal: true,
      showDiscount: true,
      showTax: true,
      showServiceCharge: false,
      showTotal: true,
      showPaymentMethod: true,
      showChange: true,
      showBarcode: true,
      showQRCode: false,
    },
    styles: {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      headerAlign: 'center',
      showBorders: true,
      showShadows: true,
    },
  },
  {
    type: 'COMPACT',
    name: 'Struk Kompak',
    paperSize: 'THERMAL_80',
    description: 'Template kompak untuk thermal printer 80mm dengan informasi penting',
    header: {
      showLogo: true,
      showName: true,
      showAddress: true,
      showPhone: false,
    },
    footer: {
      showThankYou: true,
      showContact: true,
      showSocialMedia: false,
    },
    fields: {
      showOrderNumber: true,
      showDate: true,
      showTime: true,
      showCustomer: true,
      showItems: true,
      showSubtotal: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showChange: true,
    },
    styles: {
      fontSize: '11px',
      fontFamily: 'Courier New, monospace',
      headerAlign: 'center',
      showBorders: true,
    },
  },
];

export class ReceiptService {
  async getReceiptTemplates(tenantId: string) {
    const templates = await prisma.receiptTemplate.findMany({
      where: { tenantId },
      orderBy: { isDefault: 'desc' },
    });

    // If no templates, create default templates
    if (templates.length === 0) {
      await this.initializeDefaultTemplates(tenantId);
      return await prisma.receiptTemplate.findMany({
        where: { tenantId },
        orderBy: { isDefault: 'desc' },
      });
    }

    return templates;
  }

  async initializeDefaultTemplates(tenantId: string) {
    const defaultTemplate = RECEIPT_TEMPLATE_DEFINITIONS.find(t => t.type === 'DEFAULT');
    if (defaultTemplate) {
      await prisma.receiptTemplate.create({
        data: {
          tenantId,
          name: defaultTemplate.name,
          templateType: defaultTemplate.type,
          isDefault: true,
          paperSize: defaultTemplate.paperSize,
          header: defaultTemplate.header,
          footer: defaultTemplate.footer,
          fields: defaultTemplate.fields,
          styles: defaultTemplate.styles,
        },
      });
    }
  }

  async getDefaultTemplate(tenantId: string) {
    const template = await prisma.receiptTemplate.findFirst({
      where: {
        tenantId,
        isDefault: true,
      },
    });

    if (!template) {
      // Initialize and return default
      await this.initializeDefaultTemplates(tenantId);
      return await prisma.receiptTemplate.findFirst({
        where: { tenantId, isDefault: true },
      });
    }

    return template;
  }

  async createTemplate(tenantId: string, data: {
    name: string;
    templateType: string;
    paperSize: string;
    header?: any;
    footer?: any;
    fields?: any;
    styles?: any;
  }) {
    // Check if tenant has receipt templates addon
    const hasAddon = await prisma.tenantAddon.findFirst({
      where: {
        tenantId,
        addonType: 'RECEIPT_TEMPLATES',
        status: 'active',
      },
    });

    // If no addon, only allow 1 template (default)
    if (!hasAddon) {
      const existingCount = await prisma.receiptTemplate.count({
        where: { tenantId },
      });
      if (existingCount >= 1) {
        throw new Error('Only 1 receipt template allowed without addon. Subscribe to Receipt Templates addon for more templates.');
      }
    } else {
      // Check limit
      const limit = hasAddon.limit || 5;
      const currentCount = await prisma.receiptTemplate.count({
        where: { tenantId },
      });
      if (currentCount >= limit) {
        throw new Error(`Receipt template limit reached (${limit}). Upgrade your addon for more templates.`);
      }
    }

    // If this is set as default, unset other defaults
    if (data.templateType === 'DEFAULT' || data.name.toLowerCase().includes('default')) {
      await prisma.receiptTemplate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.receiptTemplate.create({
      data: {
        tenantId,
        name: data.name,
        templateType: data.templateType,
        paperSize: data.paperSize,
        isDefault: data.templateType === 'DEFAULT',
        header: data.header || {},
        footer: data.footer || {},
        fields: data.fields || {},
        styles: data.styles || {},
      },
    });
  }

  async updateTemplate(id: string, tenantId: string, data: any) {
    const template = await prisma.receiptTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return prisma.receiptTemplate.update({
      where: { id },
      data,
    });
  }

  async setDefaultTemplate(id: string, tenantId: string) {
    const template = await prisma.receiptTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Unset all defaults
    await prisma.receiptTemplate.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this as default
    return prisma.receiptTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async deleteTemplate(id: string, tenantId: string) {
    const template = await prisma.receiptTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.isDefault) {
      throw new Error('Cannot delete default template. Set another template as default first.');
    }

    return prisma.receiptTemplate.delete({
      where: { id },
    });
  }

  async generateReceipt(orderId: string, tenantId: string, templateId?: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        member: true,
        user: true,
        tenant: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get transaction separately
    const transaction = await prisma.transaction.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });

    const template = templateId
      ? await prisma.receiptTemplate.findFirst({
          where: { id: templateId, tenantId },
        })
      : await this.getDefaultTemplate(tenantId);

    // Ensure template has default fields if not set
    const templateWithDefaults = {
      ...template,
      header: template?.header || {
        showName: true,
        showAddress: true,
      },
      footer: template?.footer || {
        showThankYou: true,
        showContact: true,
      },
      fields: template?.fields || {
        showOrderNumber: true,
        showDate: true,
        showItems: true,
        showSubtotal: true,
        showDiscount: true,
        showTotal: true,
        showPaymentMethod: true,
      },
    };

    return {
      order: {
        ...order,
        transaction,
      },
      template: templateWithDefaults,
      receiptData: {
        orderNumber: order.orderNumber,
        date: order.createdAt,
        customerName: order.member?.name || order.customer?.name || order.temporaryCustomerName || 'Walk-in',
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        })),
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        total: Number(order.total),
        paymentMethod: transaction?.paymentMethod || 'CASH',
        change: transaction?.amount ? Number(transaction.amount) - Number(order.total) : 0,
      },
    };
  }
}

export default new ReceiptService();

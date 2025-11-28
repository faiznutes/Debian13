import prisma from '../config/database';
import { RECEIPT_TEMPLATE_DEFINITIONS } from './receipt.service';

// Platform receipt template tenantId (for Super Admin)
const PLATFORM_TENANT_ID = 'platform';

export class SubscriptionReceiptService {
  async getReceiptTemplates() {
    const templates = await prisma.receiptTemplate.findMany({
      where: { tenantId: PLATFORM_TENANT_ID },
      orderBy: { isDefault: 'desc' },
    });

    // If no templates, create default templates
    if (templates.length === 0) {
      await this.initializeDefaultTemplates();
      return await prisma.receiptTemplate.findMany({
        where: { tenantId: PLATFORM_TENANT_ID },
        orderBy: { isDefault: 'desc' },
      });
    }

    return templates;
  }

  async initializeDefaultTemplates() {
    // Ensure platform tenant exists (or use a special identifier)
    const defaultTemplate = RECEIPT_TEMPLATE_DEFINITIONS.find(t => t.type === 'DEFAULT');
    if (defaultTemplate) {
      // Check if platform tenant exists, if not create it
      let platformTenant = await prisma.tenant.findUnique({
        where: { id: PLATFORM_TENANT_ID },
      });

      if (!platformTenant) {
        try {
          platformTenant = await prisma.tenant.create({
            data: {
              id: PLATFORM_TENANT_ID,
              name: 'Platform',
              slug: 'platform',
              email: 'platform@warungin.com',
              isActive: true,
            },
          });
        } catch (error: any) {
          // If tenant already exists (race condition), fetch it
          if (error.code === 'P2002') {
            platformTenant = await prisma.tenant.findUnique({
              where: { id: PLATFORM_TENANT_ID },
            });
          } else {
            throw error;
          }
        }
      }

      // Check if template already exists
      const existingTemplate = await prisma.receiptTemplate.findFirst({
        where: {
          tenantId: PLATFORM_TENANT_ID,
          isDefault: true,
        },
      });

      if (!existingTemplate) {
        await prisma.receiptTemplate.create({
          data: {
            tenantId: PLATFORM_TENANT_ID,
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
  }

  async getDefaultTemplate() {
    const template = await prisma.receiptTemplate.findFirst({
      where: {
        tenantId: PLATFORM_TENANT_ID,
        isDefault: true,
      },
    });

    if (!template) {
      // Initialize and return default
      await this.initializeDefaultTemplates();
      return await prisma.receiptTemplate.findFirst({
        where: { tenantId: PLATFORM_TENANT_ID, isDefault: true },
      });
    }

    return template;
  }

  async createTemplate(data: {
    name: string;
    templateType: string;
    paperSize: string;
    header?: any;
    footer?: any;
    fields?: any;
    styles?: any;
  }) {
    // Ensure platform tenant exists
    let platformTenant = await prisma.tenant.findUnique({
      where: { id: PLATFORM_TENANT_ID },
    });

    if (!platformTenant) {
      try {
        platformTenant = await prisma.tenant.create({
          data: {
            id: PLATFORM_TENANT_ID,
            name: 'Platform',
            slug: 'platform',
            email: 'platform@warungin.com',
            isActive: true,
          },
        });
      } catch (error: any) {
        // If tenant already exists (race condition), fetch it
        if (error.code === 'P2002') {
          platformTenant = await prisma.tenant.findUnique({
            where: { id: PLATFORM_TENANT_ID },
          });
        } else {
          throw error;
        }
      }
    }

    // If this is set as default, unset other defaults
    if (data.templateType === 'DEFAULT' || data.name.toLowerCase().includes('default')) {
      await prisma.receiptTemplate.updateMany({
        where: { tenantId: PLATFORM_TENANT_ID, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.receiptTemplate.create({
      data: {
        tenantId: PLATFORM_TENANT_ID,
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

  async updateTemplate(id: string, data: any) {
    const template = await prisma.receiptTemplate.findFirst({
      where: { id, tenantId: PLATFORM_TENANT_ID },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return prisma.receiptTemplate.update({
      where: { id },
      data,
    });
  }

  async setDefaultTemplate(id: string) {
    const template = await prisma.receiptTemplate.findFirst({
      where: { id, tenantId: PLATFORM_TENANT_ID },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Unset all defaults
    await prisma.receiptTemplate.updateMany({
      where: { tenantId: PLATFORM_TENANT_ID, isDefault: true },
      data: { isDefault: false },
    });

    // Set this as default
    return prisma.receiptTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async deleteTemplate(id: string) {
    const template = await prisma.receiptTemplate.findFirst({
      where: { id, tenantId: PLATFORM_TENANT_ID },
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

  async generateReceipt(subscriptionId: string, templateId?: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const template = templateId
      ? await prisma.receiptTemplate.findFirst({
          where: { id: templateId, tenantId: PLATFORM_TENANT_ID },
        })
      : await this.getDefaultTemplate();

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

    // Format subscription as receipt data
    const planNames: Record<string, string> = {
      'BASIC': 'Paket Basic',
      'PRO': 'Paket Pro',
      'ENTERPRISE': 'Paket Enterprise',
    };

    return {
      subscription: {
        ...subscription,
      },
      template: templateWithDefaults,
      receiptData: {
        orderNumber: `SUB-${subscription.id.substring(0, 8).toUpperCase()}`,
        date: subscription.createdAt,
        customerName: subscription.tenant.name,
        customerEmail: subscription.tenant.email,
        customerPhone: subscription.tenant.phone,
        customerAddress: subscription.tenant.address,
        items: [
          {
            name: planNames[subscription.plan] || subscription.plan,
            quantity: 1,
            price: Number(subscription.amount),
            subtotal: Number(subscription.amount),
            description: `Langganan ${subscription.plan} dari ${new Date(subscription.startDate).toLocaleDateString('id-ID')} hingga ${new Date(subscription.endDate).toLocaleDateString('id-ID')}`,
          },
        ],
        subtotal: Number(subscription.amount),
        discount: 0,
        total: Number(subscription.amount),
        paymentMethod: 'TRANSFER', // Default for subscriptions
        change: 0,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
      },
    };
  }
}

export default new SubscriptionReceiptService();


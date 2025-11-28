/**
 * Email Template Service
 * Manages email templates for campaigns
 */

import prisma from '../config/database';
import logger from '../utils/logger';

interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[]; // List of available variables like {{name}}, {{email}}, etc.
  category?: string; // PROMOTION, NOTIFICATION, TRANSACTIONAL, etc.
}

interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  variables?: string[];
  category?: string;
  isActive?: boolean;
}

class EmailTemplateService {
  /**
   * Get all email templates for tenant
   */
  async getTemplates(tenantId: string, category?: string) {
    try {
      const where: any = { tenantId };
      if (category) {
        where.category = category;
      }

      return await prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      logger.error('Error getting email templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string, tenantId: string) {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: { id: templateId, tenantId },
      });

      if (!template) {
        throw new Error('Email template not found');
      }

      return template;
    } catch (error: any) {
      logger.error('Error getting email template:', error);
      throw error;
    }
  }

  /**
   * Create new email template
   */
  async createTemplate(tenantId: string, data: CreateEmailTemplateInput) {
    try {
      return await prisma.emailTemplate.create({
        data: {
          tenantId,
          name: data.name,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent || '',
          variables: data.variables || [],
          category: data.category || 'PROMOTION',
          isActive: true,
        },
      });
    } catch (error: any) {
      logger.error('Error creating email template:', error);
      throw error;
    }
  }

  /**
   * Update email template
   */
  async updateTemplate(templateId: string, tenantId: string, data: UpdateEmailTemplateInput) {
    try {
      const template = await this.getTemplateById(templateId, tenantId);

      return await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.subject && { subject: data.subject }),
          ...(data.htmlContent && { htmlContent: data.htmlContent }),
          ...(data.textContent !== undefined && { textContent: data.textContent }),
          ...(data.variables && { variables: data.variables }),
          ...(data.category && { category: data.category }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    } catch (error: any) {
      logger.error('Error updating email template:', error);
      throw error;
    }
  }

  /**
   * Delete email template
   */
  async deleteTemplate(templateId: string, tenantId: string) {
    try {
      const template = await this.getTemplateById(templateId, tenantId);

      await prisma.emailTemplate.delete({
        where: { id: template.id },
      });

      return { message: 'Email template deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting email template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: any, variables: Record<string, string>): { subject: string; html: string; text: string } {
    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent || '';

    // Replace variables in format {{variableName}}
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(regex, variables[key]);
      html = html.replace(regex, variables[key]);
      text = text.replace(regex, variables[key]);
    });

    return { subject, html, text };
  }
}

export default new EmailTemplateService();


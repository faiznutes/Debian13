import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import dashboardRoutes from './dashboard.routes';
import customerRoutes from './customer.routes';
import memberRoutes from './member.routes';
import subscriptionRoutes from './subscription.routes';
import addonRoutes from './addon.routes';
import receiptRoutes from './receipt.routes';
import userRoutes from './user.routes';
import reportRoutes from './report.routes';
import settingsRoutes from './settings.routes';
import tenantProfileRoutes from './tenant-profile.routes';
import paymentRoutes from './payment.routes';
import transactionRoutes from './transaction.routes';
import deliveryRoutes from './delivery.routes';
import marketingRoutes from './marketing.routes';
import analyticsRoutes from './analytics.routes';
import financeRoutes from './finance.routes';
import contactRoutes from './contact.routes';
import outletRoutes from './outlet.routes';
import pdfRoutes from './pdf.routes';
import discountRoutes from './discount.routes';
import quickInsightRoutes from './quick-insight.routes';
import internalRoutes from './internal.routes';
import subscriptionReceiptRoutes from './subscription-receipt.routes';
import rewardRoutes from './reward.routes';
import auditLogRoutes from './audit-log.routes';
import twoFactorRoutes from './2fa.routes';
import sessionRoutes from './session.routes';
import passwordRoutes from './password.routes';
import webhookRoutes from './webhook.routes';
import metricsRoutes from './metrics.routes';
import gdprRoutes from './gdpr.routes';
import employeeRoutes from './employee.routes';
import archiveRoutes from './archive.routes';
import retentionRoutes from './retention.routes';
import emailTemplateRoutes from './email-template.routes';
import emailAnalyticsRoutes from './email-analytics.routes';
import emailSchedulerRoutes from './email-scheduler.routes';
import customerEngagementRoutes from './customer-engagement.routes';
import supplierRoutes from './supplier.routes';
import purchaseOrderRoutes from './purchase-order.routes';
import stockTransferRoutes from './stock-transfer.routes';
import stockAlertRoutes from './stock-alert.routes';
import smsGatewayRoutes from './sms-gateway.routes';
import pushNotificationRoutes from './push-notification.routes';
import customerEngagementEnhancementRoutes from './customer-engagement-enhancement.routes';
import advancedReportingRoutes from './advanced-reporting.routes';
import financialManagementEnhancementRoutes from './financial-management-enhancement.routes';
import advancedAuditRoutes from './advanced-audit.routes';
import ecommerceIntegrationRoutes from './ecommerce-integration.routes';
import aiMlRoutes from './ai-ml.routes';
import accountingIntegrationRoutes from './accounting-integration.routes';
import paymentGatewayIntegrationRoutes from './payment-gateway-integration.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Versioning - v1 routes
import v1Routes from './v1/index';
router.use('/v1', v1Routes);

// API routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);

// Add more routes here
router.use('/members', memberRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/addons', addonRoutes);
router.use('/receipts', receiptRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/tenant', tenantProfileRoutes);
router.use('/payment', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/marketing', marketingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/finance', financeRoutes);
router.use('/quick-insight', quickInsightRoutes);
router.use('/contact', contactRoutes);
router.use('/outlets', outletRoutes);
router.use('/pdf', pdfRoutes);
router.use('/discounts', discountRoutes);
router.use('/internal', internalRoutes);
router.use('/subscription-receipts', subscriptionReceiptRoutes);
router.use('/rewards', rewardRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/2fa', twoFactorRoutes);
router.use('/sessions', sessionRoutes);
router.use('/password', passwordRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/metrics', metricsRoutes);
router.use('/gdpr', gdprRoutes);
router.use('/employees', employeeRoutes);
router.use('/archives', archiveRoutes);
router.use('/retention', retentionRoutes);
router.use('/email-templates', emailTemplateRoutes);
router.use('/email-analytics', emailAnalyticsRoutes);
router.use('/email-scheduler', emailSchedulerRoutes);
router.use('/customer-engagement', customerEngagementRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/stock-transfers', stockTransferRoutes);
router.use('/stock-alerts', stockAlertRoutes);
router.use('/sms-gateway', smsGatewayRoutes);
router.use('/push-notifications', pushNotificationRoutes);
router.use('/customer-engagement', customerEngagementEnhancementRoutes);
router.use('/advanced-reporting', advancedReportingRoutes);
router.use('/financial-management', financialManagementEnhancementRoutes);
router.use('/advanced-audit', advancedAuditRoutes);
router.use('/ecommerce', ecommerceIntegrationRoutes);
router.use('/ai-ml', aiMlRoutes);
router.use('/accounting', accountingIntegrationRoutes);
router.use('/payment-gateway', paymentGatewayIntegrationRoutes);
// etc.

export default router;


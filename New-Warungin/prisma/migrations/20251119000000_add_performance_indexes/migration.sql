-- Add performance indexes for common queries
-- This migration adds indexes to improve query performance

-- Products: Add index for category and isActive (common filters)
CREATE INDEX IF NOT EXISTS "products_category_isActive_idx" ON "products"("tenantId", "category", "isActive");

-- Products: Add index for name search (case-insensitive)
CREATE INDEX IF NOT EXISTS "products_name_search_idx" ON "products"("tenantId", "name" text_pattern_ops);

-- Orders: Add index for status and date range queries
CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx" ON "orders"("tenantId", "status", "createdAt" DESC);

-- Transactions: Add index for payment method and date queries
CREATE INDEX IF NOT EXISTS "transactions_paymentMethod_createdAt_idx" ON "transactions"("tenantId", "paymentMethod", "createdAt" DESC);

-- Users: Add index for role and active status
CREATE INDEX IF NOT EXISTS "users_role_isActive_idx" ON "users"("tenantId", "role", "isActive");

-- Members: Add index for member code search
CREATE INDEX IF NOT EXISTS "members_memberCode_search_idx" ON "members"("tenantId", "memberCode" text_pattern_ops);

-- Customers: Add index for phone search
CREATE INDEX IF NOT EXISTS "customers_phone_search_idx" ON "customers"("tenantId", "phone" text_pattern_ops);

-- Order Items: Add index for product and order queries
CREATE INDEX IF NOT EXISTS "order_items_product_order_idx" ON "order_items"("productId", "orderId");

-- Note: text_pattern_ops is for case-insensitive pattern matching in PostgreSQL
-- These indexes will significantly improve search and filter performance


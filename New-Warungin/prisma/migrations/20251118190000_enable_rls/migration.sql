-- Enable Row-Level Security (RLS) on all tenant-related tables
-- This ensures database-level data isolation for multi-tenant security

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON tenants;
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (true); -- Application level handles tenant access

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_tenant_isolation ON users;
CREATE POLICY user_tenant_isolation ON users
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_tenant_isolation ON products;
CREATE POLICY product_tenant_isolation ON products
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_tenant_isolation ON orders;
CREATE POLICY order_tenant_isolation ON orders
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transaction_tenant_isolation ON transactions;
CREATE POLICY transaction_tenant_isolation ON transactions
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_tenant_isolation ON customers;
CREATE POLICY customer_tenant_isolation ON customers
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS member_tenant_isolation ON members;
CREATE POLICY member_tenant_isolation ON members
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employee_tenant_isolation ON employees;
CREATE POLICY employee_tenant_isolation ON employees
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on outlets table
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outlet_tenant_isolation ON outlets;
CREATE POLICY outlet_tenant_isolation ON outlets
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_tenant_isolation ON reports;
CREATE POLICY report_tenant_isolation ON reports
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_tenant_isolation ON subscriptions;
CREATE POLICY subscription_tenant_isolation ON subscriptions
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on receipt_templates table
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS receipt_template_tenant_isolation ON receipt_templates;
CREATE POLICY receipt_template_tenant_isolation ON receipt_templates
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on discounts table
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS discount_tenant_isolation ON discounts;
CREATE POLICY discount_tenant_isolation ON discounts
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on payment_mappings table
ALTER TABLE payment_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_mapping_tenant_isolation ON payment_mappings;
CREATE POLICY payment_mapping_tenant_isolation ON payment_mappings
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on reward_points table
ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reward_point_tenant_isolation ON reward_points;
CREATE POLICY reward_point_tenant_isolation ON reward_points
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on product_adjustments table
ALTER TABLE product_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_adjustment_tenant_isolation ON product_adjustments;
CREATE POLICY product_adjustment_tenant_isolation ON product_adjustments
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_tenant_isolation ON audit_logs;
CREATE POLICY audit_log_tenant_isolation ON audit_logs
  FOR ALL
  USING (
    "tenantId" IS NULL OR
    current_setting('app.current_tenant_id', true) IS NULL OR
    "tenantId"::text = current_setting('app.current_tenant_id', true)
  );

-- Note: RLS policies use current_setting('app.current_tenant_id') which should be set
-- by the application before executing queries. This is a security measure to ensure
-- database-level isolation even if application-level checks are bypassed.

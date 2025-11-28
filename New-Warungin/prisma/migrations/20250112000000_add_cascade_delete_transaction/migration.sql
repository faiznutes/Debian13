-- AlterTable: Add CASCADE delete to transactions_orderId_fkey
-- This allows orders to be deleted even if they have associated transactions
-- The transactions will be automatically deleted when the order is deleted

-- Drop existing foreign key constraint
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_orderId_fkey";

-- Add new foreign key constraint with CASCADE delete
ALTER TABLE "transactions" 
ADD CONSTRAINT "transactions_orderId_fkey" 
FOREIGN KEY ("orderId") 
REFERENCES "orders"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;


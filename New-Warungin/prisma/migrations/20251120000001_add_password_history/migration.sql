-- Add password history and expiration fields to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "passwordHistory" TEXT,
ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- Add index for users who must change password
CREATE INDEX IF NOT EXISTS "users_mustChangePassword_idx" ON "users"("mustChangePassword") WHERE "mustChangePassword" = true;


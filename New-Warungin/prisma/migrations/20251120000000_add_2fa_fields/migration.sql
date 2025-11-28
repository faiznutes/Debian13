-- Add 2FA fields to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT,
ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" TEXT;

-- Add index for 2FA enabled users
CREATE INDEX IF NOT EXISTS "users_twoFactorEnabled_idx" ON "users"("twoFactorEnabled") WHERE "twoFactorEnabled" = true;


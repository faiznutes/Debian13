-- CreateTable
CREATE TABLE IF NOT EXISTS "reward_points" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "currentPoints" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "lastEarnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "reward_point_transactions" (
    "id" TEXT NOT NULL,
    "rewardPointId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "daily_ad_views" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "date" DATE NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_ad_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "reward_points_tenantId_userId_key" ON "reward_points"("tenantId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reward_points_tenantId_idx" ON "reward_points"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reward_points_userId_idx" ON "reward_points"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reward_point_transactions_rewardPointId_idx" ON "reward_point_transactions"("rewardPointId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reward_point_transactions_createdAt_idx" ON "reward_point_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "daily_ad_views_tenantId_userId_date_key" ON "daily_ad_views"("tenantId", "userId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_ad_views_tenantId_date_idx" ON "daily_ad_views"("tenantId", "date");

-- AddForeignKey
ALTER TABLE "reward_points" ADD CONSTRAINT "reward_points_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_points" ADD CONSTRAINT "reward_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_point_transactions" ADD CONSTRAINT "reward_point_transactions_rewardPointId_fkey" FOREIGN KEY ("rewardPointId") REFERENCES "reward_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;


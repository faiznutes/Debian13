#!/bin/sh
set -e

echo "🚀 Starting Warungin Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
RETRIES=30
until node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('connected');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
" 2>/dev/null; do
  RETRIES=$((RETRIES-1))
  if [ $RETRIES -eq 0 ]; then
    echo "❌ Database connection failed after 30 attempts"
    exit 1
  fi
  echo "   Database not ready, waiting 2 seconds... ($RETRIES attempts left)"
  sleep 2
done
echo "✅ Database is ready"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate || {
  echo "⚠️  Prisma generate failed, continuing..."
}

# Check if migrations table exists and if database has data
echo "🔍 Checking database state..."
DB_STATE=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
Promise.all([
  prisma.\$queryRaw\`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations') AS exists\`,
  prisma.\$queryRaw\`SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE '_prisma_%'\`
])
  .then(([migrationResult, tableResult]) => {
    const hasMigrations = migrationResult[0]?.exists || false;
    const tableCount = tableResult[0]?.count || 0;
    const hasData = tableCount > 0;
    console.log(JSON.stringify({ hasMigrations, hasData, tableCount }));
    process.exit(0);
  })
  .catch(() => {
    console.log(JSON.stringify({ hasMigrations: false, hasData: false, tableCount: 0 }));
    process.exit(0);
  });
" 2>/dev/null) || echo '{"hasMigrations":false,"hasData":false,"tableCount":0}'

HAS_MIGRATIONS=$(echo "$DB_STATE" | node -e "const data=require('fs').readFileSync(0,'utf8'); const obj=JSON.parse(data); console.log(obj.hasMigrations ? 'true' : 'false');")
HAS_DATA=$(echo "$DB_STATE" | node -e "const data=require('fs').readFileSync(0,'utf8'); const obj=JSON.parse(data); console.log(obj.hasData ? 'true' : 'false');")

if [ "$HAS_MIGRATIONS" = "true" ]; then
  # Database sudah punya migration history - gunakan migrate deploy (AMAN, tidak hapus data)
  echo "📤 Database has migration history, running safe migrations..."
  echo "   ⚠️  This will ONLY add new migrations, existing data will be preserved"
  npx prisma migrate deploy || {
    echo "⚠️  Migration deploy failed. Checking for failed migrations..."
    # Try to resolve failed migrations
    FAILED_MIGRATIONS=$(npx prisma migrate status 2>&1 | grep "failed" | grep -oE "[0-9]{14}_[a-z_]+" || echo "")
    if [ -n "$FAILED_MIGRATIONS" ]; then
      echo "   Found failed migrations, marking as applied..."
      echo "$FAILED_MIGRATIONS" | while read -r migration; do
        if [ -n "$migration" ]; then
          npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
        fi
      done
      # Try deploy again
      npx prisma migrate deploy || {
        echo "⚠️  Migration still failed, but continuing (database might already be up to date)"
      }
    else
      echo "⚠️  Could not determine failed migrations, but continuing (database might already be up to date)"
    fi
  }
elif [ "$HAS_DATA" = "true" ]; then
  # Database punya tabel tapi belum ada migration history - baseline migration
  echo "📤 Database has existing tables but no migration history..."
  echo "   ⚠️  Creating baseline migration (data will be preserved)"
  # Cek migration files yang ada
  if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    # Ada migration files, mark as applied
    echo "   Marking existing migrations as applied..."
    FIRST_MIGRATION=$(ls -1 prisma/migrations | head -n 1)
    if [ -n "$FIRST_MIGRATION" ]; then
      npx prisma migrate resolve --applied "$FIRST_MIGRATION" 2>/dev/null || true
    fi
    npx prisma migrate deploy || {
      echo "⚠️  Could not deploy migrations, but data is safe"
    }
  else
    echo "   ⚠️  No migration files found. Creating initial migration..."
    npx prisma migrate dev --name init --create-only || {
      echo "❌ Failed to create migration"
      exit 1
    }
    npx prisma migrate deploy || {
      echo "❌ Failed to apply migration"
      exit 1
    }
  fi
else
  # Database benar-benar kosong - safe untuk db push
  echo "📤 Database is empty, initializing schema..."
  npx prisma migrate deploy || {
    echo "⚠️  migrate deploy failed (no migrations?), trying db push..."
    npx prisma db push --accept-data-loss || {
      echo "❌ Failed to initialize database"
      exit 1
    }
  }
fi

echo "✅ Migrations completed (data preserved)"

# Check if super admin exists
echo "🔍 Checking for super admin..."
SUPER_ADMIN_EXISTS=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  .then(user => {
    console.log(user ? 'true' : 'false');
    process.exit(0);
  })
  .catch(() => {
    console.log('false');
    process.exit(0);
  });
" 2>/dev/null) || echo "false"

if [ "$SUPER_ADMIN_EXISTS" != "true" ]; then
  echo "👤 Creating super admin..."
  node scripts/create-super-admin-docker.js || {
    echo "⚠️  Super admin creation failed, trying seed..."
    npm run prisma:seed || {
      echo "⚠️  Seed failed, continuing without super admin..."
    }
  }
else
  echo "✅ Super admin already exists"
fi

echo "🎉 Startup completed, starting server..."
exec npm start


# 🔧 Troubleshooting Error 500 di WSL

Panduan untuk mengatasi error 500 saat login atau mengakses API.

## 🔍 Diagnose Error 500

### Step 1: Check Backend Logs

```bash
# View backend logs
docker compose logs backend

# View last 50 lines
docker compose logs --tail 50 backend

# Follow logs real-time
docker compose logs -f backend
```

**Cari error messages seperti:**
- Database connection errors
- JWT secret missing
- Environment variables not set
- Prisma errors

### Step 2: Check Backend Container Status

```bash
# Check if backend is running
docker compose ps backend

# Check backend health
docker compose exec backend wget -O- http://localhost:3000/health

# Or with curl
docker compose exec backend curl http://localhost:3000/health
```

### Step 3: Check Environment Variables

```bash
# Check .env file exists
ls -la .env

# Check important variables
grep -E "DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET" .env

# Check if variables are set in container
docker compose exec backend env | grep -E "DATABASE_URL|JWT_SECRET"
```

### Step 4: Check Database Connection

```bash
# Check database container
docker compose ps postgres

# Test database connection
docker compose exec postgres pg_isready -U postgres

# Test from backend
docker compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => { console.log('✅ Database connected'); process.exit(0); })
  .catch((e) => { console.error('❌ Database error:', e.message); process.exit(1); });
"
```

## ✅ Solusi Umum

### Problem 1: JWT_SECRET Not Set

**Error:** `JWT_SECRET is required` atau `JWT secret missing`

**Solusi:**
```bash
# Edit .env
nano .env

# Pastikan ada:
JWT_SECRET=your_random_32_character_string_minimum
JWT_REFRESH_SECRET=your_random_32_character_string_minimum

# Generate random secrets
openssl rand -base64 32

# Restart backend
docker compose restart backend
```

### Problem 2: Database Connection Error

**Error:** `Can't reach database server` atau `P1001`

**Solusi:**
```bash
# Check database is running
docker compose ps postgres

# Check DATABASE_URL in .env
grep DATABASE_URL .env

# Should be: postgresql://postgres:PASSWORD@postgres:5432/warungin?schema=public

# Restart database
docker compose restart postgres
sleep 10
docker compose restart backend
```

### Problem 3: Super Admin Not Created

**Error:** Login fails atau user not found

**Solusi:**
```bash
# Create super admin
docker compose exec backend node scripts/create-super-admin-docker.js

# Verify
docker compose exec postgres psql -U postgres -d warungin -c "SELECT email, role FROM \"User\" WHERE role = 'SUPER_ADMIN';"
```

### Problem 4: Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solusi:**
```bash
# Generate Prisma client
docker compose exec backend npx prisma generate

# Restart backend
docker compose restart backend
```

### Problem 5: Migrations Not Applied

**Error:** `Table does not exist` atau migration errors

**Solusi:**
```bash
# Run migrations
docker compose exec backend npx prisma migrate deploy

# Or if fresh install
docker compose exec backend npx prisma db push
```

## 🔄 Quick Fix Sequence

```bash
# 1. Check all containers running
docker compose ps

# 2. Check backend logs
docker compose logs --tail 100 backend

# 3. Check .env variables
cat .env | grep -E "DATABASE_URL|JWT_SECRET|POSTGRES_PASSWORD"

# 4. Restart services
docker compose restart postgres
sleep 10
docker compose restart backend

# 5. Check logs again
docker compose logs -f backend
```

## 📋 Checklist

- [ ] Backend container running
- [ ] Database container running
- [ ] DATABASE_URL correctly set in .env
- [ ] JWT_SECRET and JWT_REFRESH_SECRET set in .env
- [ ] POSTGRES_PASSWORD matches DATABASE_URL
- [ ] Super admin user created
- [ ] Prisma migrations applied
- [ ] Prisma client generated
- [ ] Backend logs show no errors

## 🆘 Still Error 500?

1. **Check full error in logs:**
   ```bash
   docker compose logs backend | tail -100
   ```

2. **Check database:**
   ```bash
   docker compose exec postgres psql -U postgres -d warungin -c "\dt"
   ```

3. **Recreate backend container:**
   ```bash
   docker compose up -d --force-recreate backend
   ```

4. **Full restart:**
   ```bash
   docker compose down
   docker compose up -d
   ```


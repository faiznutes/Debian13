# 🔍 Full Check Commands - Warungin POS System

**Status:** Production Ready - 100% Complete

---

## 🚀 Quick Start

### Option 1: Using npm scripts (Recommended)

```bash
# Full check (TypeScript + Lint + Prisma)
npm run check:all

# Full check with tests
npm run check:all:with-tests

# Quick check (TypeScript + Lint only)
npm run check:quick

# Type check only (Backend + Frontend)
npm run type-check

# Backend type check only
npm run type-check:backend

# Frontend type check only
npm run type-check:frontend
```

### Option 2: Using scripts

#### Linux/Mac (Bash)
```bash
# Full check
./scripts/full-check.sh

# Full check without tests
./scripts/full-check.sh --skip-tests
```

#### Windows (PowerShell)
```powershell
# Full check
.\scripts\full-check.ps1

# Full check without tests
.\scripts\full-check.ps1 --skip-tests
```

---

## 📋 Individual Commands

### 1. Prisma Validation
```bash
# Validate Prisma schema
npx prisma validate

# Generate Prisma Client
npm run prisma:generate

# Format Prisma schema
npx prisma format
```

### 2. Backend TypeScript Check
```bash
# Type check without building
npx tsc --noEmit

# Build check
npm run build
```

### 3. Frontend TypeScript Check
```bash
cd client

# Type check without building
npx vue-tsc --noEmit

# Build check
npm run build

cd ..
```

### 4. Linting
```bash
# Backend linting
npm run lint

# Frontend linting
cd client
npm run lint
cd ..
```

### 5. Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

---

## 🔧 One-Liner Commands

### Full Check (All at once)
```bash
npx tsc --noEmit && cd client && npx vue-tsc --noEmit && npm run lint && cd .. && npm run lint && npx prisma validate && npm run prisma:generate && echo "✅ All checks passed!"
```

### Type Check Only
```bash
npx tsc --noEmit && cd client && npx vue-tsc --noEmit && cd .. && echo "✅ Type checks passed!"
```

### Lint Check Only
```bash
npm run lint && cd client && npm run lint && cd .. && echo "✅ Lint checks passed!"
```

---

## 🐳 Docker Commands

### If using Docker
```bash
# Backend TypeScript check
docker compose exec backend npx tsc --noEmit

# Frontend TypeScript check
docker compose exec frontend npx vue-tsc --noEmit

# Backend lint
docker compose exec backend npm run lint

# Frontend lint
docker compose exec frontend npm run lint

# Prisma validate
docker compose exec backend npx prisma validate

# Prisma generate
docker compose exec backend npm run prisma:generate
```

---

## 📊 Recommended Check Order

1. **Prisma Validation** - Check database schema first
   ```bash
   npx prisma validate
   ```

2. **Prisma Generate** - Generate Prisma Client
   ```bash
   npm run prisma:generate
   ```

3. **Backend TypeScript** - Check backend types
   ```bash
   npx tsc --noEmit
   ```

4. **Frontend TypeScript** - Check frontend types
   ```bash
   cd client && npx vue-tsc --noEmit && cd ..
   ```

5. **Backend Lint** - Check backend code quality
   ```bash
   npm run lint
   ```

6. **Frontend Lint** - Check frontend code quality
   ```bash
   cd client && npm run lint && cd ..
   ```

7. **Tests** - Run all tests
   ```bash
   npm test
   ```

---

## 🛠️ Troubleshooting

### TypeScript Errors

**Backend TypeScript errors:**
```bash
# Check specific file
npx tsc --noEmit src/path/to/file.ts

# Show all errors
npx tsc --noEmit --pretty
```

**Frontend TypeScript errors:**
```bash
cd client
# Check specific file
npx vue-tsc --noEmit src/path/to/file.vue

# Show all errors
npx vue-tsc --noEmit --pretty
```

### Linting Errors

**Auto-fix linting errors:**
```bash
# Backend
npm run lint -- --fix

# Frontend
cd client
npm run lint  # Already has --fix flag
cd ..
```

### Prisma Errors

**Format Prisma schema:**
```bash
npx prisma format
```

**Reset Prisma (development only):**
```bash
npm run prisma:reset
```

---

## 📝 Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run pre-commit
```

Or use husky:
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
```

---

## ✅ Success Indicators

When all checks pass, you should see:
- ✅ Prisma Schema OK
- ✅ Prisma Client Generated
- ✅ Backend TypeScript OK
- ✅ Frontend TypeScript OK
- ✅ Backend Linting OK
- ✅ Frontend Linting OK
- ✅ Tests OK (if running tests)
- 🎉 All checks passed! ✅

---

## 🚨 Common Issues

### Issue: `vue-tsc` not found
**Solution:**
```bash
cd client
npm install -D vue-tsc
cd ..
```

### Issue: Prisma Client not generated
**Solution:**
```bash
npm run prisma:generate
```

### Issue: TypeScript errors in node_modules
**Solution:**
Check `tsconfig.json` - should exclude `node_modules`

### Issue: Vue TypeScript errors
**Solution:**
```bash
cd client
npm install -D @vue/typescript-plugin
cd ..
```

---

**Last Updated:** 20 November 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅


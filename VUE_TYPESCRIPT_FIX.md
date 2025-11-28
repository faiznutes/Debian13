# 🔧 Fix Vue TypeScript Errors

## Problem
Error TypeScript di file Vue:
- `Cannot find module 'vue' or its corresponding type declarations`
- `Failed to write the global types file`

## Root Cause
`node_modules` tidak ada di folder `client`, sehingga dependencies belum terinstall.

## Solution

### Step 1: Install Dependencies

```powershell
# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Verify Installation

```powershell
# Check if node_modules exists
Test-Path "client\node_modules"
# Should return: True
```

### Step 3: Run TypeScript Check

```powershell
# Check Frontend TypeScript
cd client
npx vue-tsc --noEmit
cd ..
```

### Step 4: Full Check (After Installation)

```powershell
# Run full check
npm run check:all
```

## Quick Fix Script

Jalankan script ini untuk install dependencies dan check:

```powershell
.\scripts\install-and-check.ps1
```

## Manual Check All Vue Files

Setelah dependencies terinstall, check semua file Vue:

```powershell
cd client
npx vue-tsc --noEmit --skipLibCheck
cd ..
```

## Common Issues

### Issue 1: `vue-tsc` not found
**Solution:**
```powershell
cd client
npm install -D vue-tsc
cd ..
```

### Issue 2: Vue types not found
**Solution:**
```powershell
cd client
npm install -D @vue/typescript-plugin
cd ..
```

### Issue 3: Still getting errors after install
**Solution:**
1. Restart VS Code / IDE
2. Run: `cd client && npm install && cd ..`
3. Run: `cd client && npx vue-tsc --noEmit`

## Files to Check

After installing dependencies, check these files:
- ✅ `client/src/views/ai-ml/AIMLFeatures.vue`
- ✅ All other `.vue` files in `client/src`

## Verification

After fixing, you should see:
- ✅ No TypeScript errors in Vue files
- ✅ `vue-tsc --noEmit` passes
- ✅ IDE shows no red squiggles

---

**Last Updated:** 20 November 2024


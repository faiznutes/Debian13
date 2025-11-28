# 📦 Install Node.js - Required for TypeScript Checking

## ⚠️ Current Status

Node.js dan npm **tidak terdeteksi** di PATH system Anda. Ini diperlukan untuk:
- Install dependencies (`npm install`)
- Run TypeScript checking (`npx tsc`, `npx vue-tsc`)
- Run linting (`npm run lint`)
- Run tests (`npm test`)

## 🔧 Solution: Install Node.js

### Step 1: Download Node.js
1. Buka: https://nodejs.org/
2. Download **LTS version** (Long Term Support)
3. Pilih Windows Installer (.msi)

### Step 2: Install Node.js
1. Run installer yang sudah didownload
2. **PENTING:** Pastikan checkbox **"Add to PATH"** dicentang
3. Klik "Next" dan ikuti wizard
4. Klik "Install"
5. Tunggu sampai selesai

### Step 3: Verify Installation
1. **Restart terminal/IDE** (sangat penting!)
2. Buka PowerShell baru
3. Jalankan:
   ```powershell
   node --version
   npm --version
   ```
4. Harus menampilkan versi (contoh: `v20.10.0` dan `10.2.3`)

### Step 4: Install Dependencies
Setelah Node.js terinstall, jalankan:

```powershell
# Install client dependencies
cd client
npm install
cd ..

# Install backend dependencies (jika belum)
npm install
```

### Step 5: Run TypeScript Check
```powershell
# Check Frontend TypeScript
cd client
npx vue-tsc --noEmit
cd ..

# Check Backend TypeScript
npx tsc --noEmit

# Full check
npm run check:all
```

## 🚨 Troubleshooting

### Problem: "node is not recognized"
**Solution:**
1. Restart terminal/IDE
2. Jika masih error, restart komputer
3. Check PATH: `$env:PATH` harus mengandung `C:\Program Files\nodejs`

### Problem: "npm is not recognized"
**Solution:**
1. npm biasanya terinstall bersama Node.js
2. Restart terminal/IDE
3. Jika masih error, reinstall Node.js dengan "Add to PATH" dicentang

### Problem: Script execution policy error
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## ✅ After Installation

Setelah Node.js terinstall dan dependencies terinstall, semua error TypeScript di file Vue akan hilang karena:
- ✅ `node_modules` akan terinstall
- ✅ Vue types akan tersedia
- ✅ TypeScript bisa resolve module 'vue'

## 📝 Quick Commands After Install

```powershell
# 1. Install dependencies
cd client && npm install && cd ..

# 2. Check TypeScript
cd client && npx vue-tsc --noEmit && cd ..

# 3. Full check
npm run check:all
```

---

**Last Updated:** 20 November 2024


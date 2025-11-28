# 📦 Push ke GitHub - Manual Command

Jika `git push` stuck, gunakan command berikut secara manual:

## 🔧 Command Push Manual

### Option 1: Push dengan Timeout
```bash
cd '/mnt/f/Backup W11/Github/Warungin'
timeout 60 git push origin main
```

### Option 2: Push dengan Verbose (untuk debug)
```bash
cd '/mnt/f/Backup W11/Github/Warungin'
GIT_CURL_VERBOSE=1 GIT_TRACE=1 git push origin main
```

### Option 3: Push dengan Credential Helper
```bash
cd '/mnt/f/Backup W11/Github/Warungin'

# Setup credential helper (jika belum)
git config --global credential.helper store

# Push (akan meminta username & password/token sekali)
git push origin main
```

### Option 4: Push dengan Personal Access Token
```bash
cd '/mnt/f/Backup W11/Github/Warungin'

# Gunakan token di URL
git remote set-url origin https://YOUR_TOKEN@github.com/faiznutes/Warungin.git
git push origin main

# Atau push langsung dengan token
git push https://YOUR_TOKEN@github.com/faiznutes/Warungin.git main
```

## 🔑 Setup GitHub Authentication

### 1. Buat Personal Access Token
1. Buka: https://github.com/settings/tokens
2. Klik "Generate new token (classic)"
3. Beri nama: "Warungin Push"
4. Pilih scope: `repo` (full control)
5. Generate dan copy token

### 2. Gunakan Token untuk Push
```bash
# Method 1: Masukkan token saat push
git push origin main
# Username: faiznutes
# Password: <paste_token_here>

# Method 2: Simpan di credential helper
git config --global credential.helper store
git push origin main
# Masukkan username dan token sekali, akan tersimpan

# Method 3: Gunakan di URL (tidak recommended untuk security)
git remote set-url origin https://YOUR_TOKEN@github.com/faiznutes/Warungin.git
```

## 📋 Status Commit Saat Ini

Saat ini ada **2 commits** yang belum di-push:
- `c1df2d9` - Update: 2025-11-23 19:38:29
- `e41fce1` - Update: 2025-11-23 19:36:55

## ✅ Checklist Sebelum Push

- [ ] Pastikan koneksi internet stabil
- [ ] Pastikan GitHub authentication sudah setup
- [ ] Cek branch: `git branch` (harus di `main`)
- [ ] Cek remote: `git remote -v` (harus ke GitHub)
- [ ] Cek status: `git status`

## 🚀 Setelah Push Berhasil

Setelah push berhasil, gunakan command di `VPS_DEPLOY_COMMANDS.md` untuk deploy di VPS.


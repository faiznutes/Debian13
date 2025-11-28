# 🔧 Fix npm ci Error

## Masalah
```
npm error
npm error aliases: clean-install, ic, install-clean, isntall-clean
npm error Run "npm help ci" for more info
```

## Penyebab
1. `package-lock.json` tidak ada atau tidak di-copy ke Docker image
2. `package-lock.json` tidak sync dengan `package.json`
3. `npm ci` memerlukan exact match antara package.json dan package-lock.json

## Solusi yang Sudah Diterapkan

Dockerfile sudah diperbaiki untuk:
1. ✅ Check apakah `package-lock.json` ada sebelum `npm ci`
2. ✅ Fallback ke `npm install` jika `npm ci` gagal
3. ✅ Retry logic untuk network issues

## Quick Fix

### Option 1: Rebuild dengan Dockerfile yang sudah diperbaiki

```bash
cd /home/warungin/Warungin
docker compose build --no-cache backend
```

### Option 2: Regenerate package-lock.json (jika perlu)

Di local machine:
```bash
# Delete old package-lock.json
rm package-lock.json

# Regenerate
npm install

# Commit dan push
git add package-lock.json
git commit -m "Fix: Regenerate package-lock.json"
git push origin main
```

Kemudian di VPS:
```bash
cd /home/warungin/Warungin
git pull origin main
docker compose build --no-cache backend
```

### Option 3: Build dengan npm install saja (skip npm ci)

Edit Dockerfile sementara untuk skip npm ci:
```dockerfile
# Ganti dari:
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Menjadi:
RUN npm install --legacy-peer-deps
```

## Troubleshooting

### Check package-lock.json di Docker Build

```bash
# Build dengan verbose untuk check
docker compose build --progress=plain backend 2>&1 | grep -i "package-lock"

# Atau check di container
docker run --rm -it $(docker images | grep warungin.*backend | head -1 | awk '{print $3}') sh
ls -la package-lock.json
```

### Verify package-lock.json Sync

```bash
# Di local
npm install
npm ci  # Should work without error

# Check for conflicts
npm audit
```

### Force npm install (skip ci)

Jika `npm ci` selalu gagal, gunakan `npm install` saja:

```dockerfile
RUN npm install --legacy-peer-deps || \
    (sleep 10 && npm install --legacy-peer-deps) || \
    (sleep 20 && npm install)
```

## Current Dockerfile Fix

Dockerfile sudah diperbaiki untuk:
- Check `package-lock.json` existence
- Fallback ke `npm install` jika `npm ci` gagal
- Retry logic untuk network issues

Rebuild dengan:
```bash
docker compose build --no-cache backend
```

---

**Note**: Build pertama mungkin lebih lama karena harus download semua dependencies.


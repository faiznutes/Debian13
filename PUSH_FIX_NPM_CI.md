# 🚀 Push Fix npm ci Error ke GitHub

## Perubahan yang Sudah Dibuat

✅ **Dockerfile.backend** sudah diperbaiki:
- Skip `npm ci` yang menyebabkan error
- Langsung pakai `npm install --legacy-peer-deps` dengan retry logic
- Better error handling

## Command untuk Push

Jalankan command berikut di terminal:

```bash
# Add files
git add Dockerfile.backend FIX_NPM_CI_ERROR.md push-fix-npm-ci.sh

# Commit
git commit -m "Fix: npm ci error - Skip npm ci and use npm install directly

- Remove npm ci command that causes errors
- Use npm install --legacy-peer-deps directly with retry logic
- Add better error handling and retry mechanism
- Fix both builder and production stages"

# Push
git push origin main
```

## Atau Gunakan Script

```bash
bash push-fix-npm-ci.sh
```

## Setelah Push, Update di VPS

```bash
# SSH ke VPS
ssh warungin@192.168.0.101

# Di VPS
cd /home/warungin/Warungin
git pull origin main
docker compose down
docker compose build --no-cache backend
docker compose build --no-cache frontend
docker compose up -d
docker compose ps
```

## Perubahan di Dockerfile.backend

**Sebelum:**
```dockerfile
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
```

**Sesudah:**
```dockerfile
RUN npm install --legacy-peer-deps || \
    (echo "First attempt failed, retrying..." && sleep 10 && npm install --legacy-peer-deps) || \
    (echo "Second attempt failed, retrying..." && sleep 20 && npm install --legacy-peer-deps) || \
    (echo "Third attempt, using npm install without legacy-peer-deps..." && sleep 30 && npm install)
```

Ini akan:
1. ✅ Skip npm ci yang error
2. ✅ Langsung pakai npm install dengan retry
3. ✅ Fallback ke npm install tanpa legacy-peer-deps jika perlu

---

**Note**: Setelah push, pull di VPS dan rebuild untuk apply fix.


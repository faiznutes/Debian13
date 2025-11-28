# 🔧 Fix Docker Network Timeout Issue

## Masalah

Saat build Docker, terjadi error:
```
npm error code ETIMEDOUT
npm error network Invalid response body while trying to fetch https://registry.npmjs.org/prisma: read ETIMEDOUT
```

Ini terjadi karena:
- Koneksi internet VPS lambat atau tidak stabil
- Timeout default npm terlalu pendek
- Tidak ada retry mechanism

## Solusi yang Sudah Diterapkan

### 1. Update Dockerfile.backend
- ✅ Menambahkan npm config untuk timeout yang lebih lama (5 menit)
- ✅ Menambahkan retry mechanism (5 kali retry)
- ✅ Menambahkan retry logic untuk `npx prisma generate`
- ✅ Menambahkan retry logic untuk npm install

### 2. Update client/Dockerfile
- ✅ Menambahkan npm config untuk network handling yang lebih baik
- ✅ Menambahkan retry logic untuk npm install

### 3. Script Build dengan Retry
- ✅ `build-docker-retry.sh` - Script untuk build dengan retry otomatis

## Cara Menggunakan

### Option 1: Build Normal (Sudah Diperbaiki)
```bash
docker compose build
```

Dockerfile sudah diperbaiki dengan retry logic, jadi build normal seharusnya sudah bekerja.

### Option 2: Build dengan Script Retry
```bash
bash build-docker-retry.sh
```

Script ini akan:
- Build setiap service dengan retry otomatis (3 kali)
- Clean up setelah setiap failed attempt
- Wait 30 detik antar retry

### Option 3: Build Manual dengan Retry
```bash
# Build backend dengan retry manual
docker compose build backend || \
  (sleep 30 && docker compose build backend) || \
  (sleep 60 && docker compose build backend)

# Build frontend dengan retry manual
docker compose build frontend || \
  (sleep 30 && docker compose build frontend) || \
  (sleep 60 && docker compose build frontend)
```

## Konfigurasi NPM yang Ditambahkan

```dockerfile
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000
```

- **fetch-timeout**: 300000ms (5 menit) - timeout untuk setiap request
- **fetch-retries**: 5 - jumlah retry otomatis
- **fetch-retry-mintimeout**: 20000ms (20 detik) - delay minimum antar retry
- **fetch-retry-maxtimeout**: 120000ms (2 menit) - delay maksimum antar retry

## Troubleshooting

### Jika Masih Timeout

1. **Cek koneksi internet VPS:**
   ```bash
   ssh warungin@192.168.0.101
   ping -c 5 registry.npmjs.org
   curl -I https://registry.npmjs.org
   ```

2. **Coba build dengan no-cache:**
   ```bash
   docker compose build --no-cache
   ```

3. **Clean Docker cache:**
   ```bash
   docker system prune -a -f
   docker compose build
   ```

4. **Gunakan npm registry mirror (jika ada):**
   ```bash
   # Di Dockerfile, tambahkan sebelum npm install:
   RUN npm config set registry https://registry.npmmirror.com
   ```

5. **Build di waktu yang berbeda:**
   - Network mungkin lebih stabil di waktu tertentu
   - Coba build di malam hari atau pagi hari

### Alternative: Build di Local, Push ke Registry

Jika network VPS sangat lambat, bisa build di local dan push ke Docker registry:

```bash
# Di local machine
docker compose build
docker compose push

# Di VPS
docker compose pull
docker compose up -d
```

## Update Script

Script `update-docker.sh` sudah menggunakan build normal yang sudah diperbaiki. Jika masih ada masalah, bisa gunakan:

```bash
# Di VPS, jalankan:
cd /home/warungin/Warungin
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Monitoring Build

Untuk melihat progress build secara real-time:

```bash
docker compose build --progress=plain
```

Atau dengan logs:
```bash
docker compose build 2>&1 | tee build.log
```

---

**Last Updated**: $(date)


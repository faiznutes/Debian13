# 🔧 Fix Build Stuck Issue

## Masalah
Build Docker stuck di step `npm install` atau `npm ci`.

## Solusi Cepat

### 1. Check Status Build yang Berjalan
```bash
bash check-build-status.sh
```

### 2. Kill Stuck Process
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "pkill -f 'docker.*build' || pkill -f 'npm.*install'"
```

### 3. Clean dan Rebuild
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && \
   docker compose down && \
   docker system prune -f && \
   docker compose build --no-cache --progress=plain"
```

### 4. Build dengan Timeout (Recommended)
```bash
bash deploy-vps-with-timeout.sh
```

## Alternatif: Build Step by Step

### Step 1: SSH ke VPS
```bash
ssh warungin@192.168.0.101
```

### Step 2: Di VPS, jalankan:
```bash
cd /home/warungin/Warungin

# Clean previous builds
docker compose down
docker system prune -f

# Build backend dengan output
docker compose build --progress=plain backend 2>&1 | tee backend-build.log

# Jika stuck, buka terminal lain dan check:
tail -f backend-build.log

# Build frontend
docker compose build --progress=plain frontend 2>&1 | tee frontend-build.log

# Start containers
docker compose up -d

# Check status
docker compose ps
```

## Troubleshooting

### Jika npm install sangat lambat
```bash
# Di VPS, coba build dengan registry mirror
ssh warungin@192.168.0.101
cd /home/warungin/Warungin

# Edit Dockerfile.backend sementara untuk gunakan registry mirror
# Atau build dengan environment variable
docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com backend
```

### Jika build timeout
```bash
# Increase Docker build timeout
export DOCKER_CLIENT_TIMEOUT=1200
export COMPOSE_HTTP_TIMEOUT=1200

# Build dengan timeout lebih lama
timeout 1800 docker compose build backend
```

### Check Network di VPS
```bash
ssh warungin@192.168.0.101
ping -c 5 registry.npmjs.org
curl -I https://registry.npmjs.org
```

### Build dengan Verbose Output
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && \
   DOCKER_BUILDKIT=0 docker compose build --progress=plain --no-cache backend 2>&1 | tee /tmp/build.log"
```

## Monitoring Build Progress

### Di Terminal Lain (sementara build berjalan)
```bash
# Check build logs
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "tail -f /tmp/backend-build.log"

# Check Docker processes
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "docker ps -a && docker images | grep warungin"
```

## Quick Fix Command

Jika build stuck, jalankan ini untuk reset dan rebuild:

```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && \
   docker compose down && \
   docker system prune -af && \
   docker volume prune -f && \
   docker compose build --no-cache --progress=plain && \
   docker compose up -d && \
   docker compose ps"
```

---

**Note**: Build pertama kali biasanya lebih lama karena harus download semua dependencies. Build berikutnya akan lebih cepat karena cache.


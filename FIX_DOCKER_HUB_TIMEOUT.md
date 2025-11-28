# 🔧 Fix Docker Hub Timeout Issue

## Masalah
```
failed to solve: DeadlineExceeded: node:18-alpine: failed to resolve source metadata
dial tcp 3.93.227.105:443: i/o timeout
```

Ini terjadi karena VPS tidak bisa connect ke Docker Hub (registry-1.docker.io).

## Solusi Cepat

### Option 1: Setup Docker Registry Mirror (Recommended)

Jalankan script:
```bash
bash fix-docker-hub-timeout.sh
```

### Option 2: Manual Setup Registry Mirror

SSH ke VPS:
```bash
ssh warungin@192.168.0.101
```

Di VPS, jalankan:
```bash
# Create daemon.json
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "max-concurrent-downloads": 10
}
EOF

# Restart Docker
sudo systemctl restart docker
# atau
sudo service docker restart

# Verify
docker info | grep -A 10 "Registry Mirrors"
```

### Option 3: Pull Image dengan Retry Manual

```bash
ssh warungin@192.168.0.101

# Pull dengan retry
for i in {1..5}; do
  echo "Attempt $i/5..."
  timeout 300 docker pull node:18-alpine && break
  sleep 30
done

# Pull images lainnya
docker pull nginx:alpine
docker pull postgres:15-alpine
```

### Option 4: Build dengan Timeout Lebih Lama

```bash
ssh warungin@192.168.0.101
cd /home/warungin/Warungin

# Set timeout lebih lama
export DOCKER_CLIENT_TIMEOUT=1200
export COMPOSE_HTTP_TIMEOUT=1200

# Build dengan timeout
timeout 1800 docker compose build backend
```

### Option 5: Gunakan Image dari Registry Lain

Edit `Dockerfile.backend` sementara:
```dockerfile
# Ganti dari:
FROM node:18-alpine AS backend-builder

# Menjadi:
FROM registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine AS backend-builder
```

Atau pull manual:
```bash
docker pull registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine node:18-alpine
```

## Troubleshooting

### Check Network ke Docker Hub
```bash
ssh warungin@192.168.0.101

# Test connectivity
ping -c 5 registry-1.docker.io
curl -I https://registry-1.docker.io/v2/

# Test DNS
nslookup registry-1.docker.io
```

### Check Docker Daemon Config
```bash
ssh warungin@192.168.0.101
cat /etc/docker/daemon.json
docker info | grep -i registry
```

### Alternative: Build di Local, Push ke Registry

Jika VPS tidak bisa akses Docker Hub, build di local:

```bash
# Di local machine
docker compose build
docker tag warungin-backend:latest your-registry/warungin-backend:latest
docker tag warungin-frontend:latest your-registry/warungin-frontend:latest
docker push your-registry/warungin-backend:latest
docker push your-registry/warungin-frontend:latest

# Di VPS
docker pull your-registry/warungin-backend:latest
docker pull your-registry/warungin-frontend:latest
```

### Use Proxy (jika ada)

```bash
# Setup proxy di Docker daemon
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf > /dev/null <<EOF
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

## Quick Fix Command

Jalankan ini untuk setup registry mirror dan rebuild:

```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "sudo mkdir -p /etc/docker && \
   echo '{\"registry-mirrors\": [\"https://docker.mirrors.ustc.edu.cn\", \"https://hub-mirror.c.163.com\"]}' | sudo tee /etc/docker/daemon.json > /dev/null && \
   sudo systemctl restart docker && \
   sleep 5 && \
   cd /home/warungin/Warungin && \
   docker pull node:18-alpine && \
   docker pull nginx:alpine && \
   docker pull postgres:15-alpine && \
   docker compose build --no-cache && \
   docker compose up -d"
```

## Registry Mirrors yang Bisa Digunakan

1. **USTC Mirror** (China): `https://docker.mirrors.ustc.edu.cn`
2. **163 Mirror** (China): `https://hub-mirror.c.163.com`
3. **Baidu Mirror** (China): `https://mirror.baidubce.com`
4. **Aliyun** (China): `https://registry.cn-hangzhou.aliyuncs.com`

Pilih yang terdekat dengan lokasi VPS Anda.

---

**Note**: Setelah setup registry mirror, restart Docker daemon dan coba build lagi.


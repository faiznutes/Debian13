# Docker Build Troubleshooting

## Error: ENETUNREACH saat Build

Jika muncul error seperti:
```
npm error request to https://registry.npmjs.org/prom-client failed, reason: connect ENETUNREACH
```

## Solusi

### 1. Build dengan Network Host Mode
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && docker compose build --network=host backend"
# Password: 123
```

### 2. Build dengan DNS Custom
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && docker compose build --build-arg BUILDKIT_INLINE_CACHE=1 --network=host backend"
# Password: 123
```

### 3. Skip Rebuild (Gunakan Image yang Ada)
Jika build terus gagal karena network, bisa skip rebuild dan hanya restart:
```bash
bash scripts/pull-and-restart.sh
# Password: 123
```

### 4. Build Manual dengan Retry
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101
# Password: 123

cd /home/warungin/Warungin

# Coba build dengan retry
for i in {1..3}; do
    echo "Attempt $i..."
    docker compose build --network=host backend && break
    sleep 5
done

# Restart
docker compose restart
```

### 5. Check Network dari Container
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "docker run --rm --network=host alpine ping -c 3 registry.npmjs.org"
```

### 6. Gunakan Docker Buildx dengan Network
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && DOCKER_BUILDKIT=1 docker compose build --network=host backend"
```

## Alternative: Build di Local lalu Push Image

Jika network di server bermasalah, bisa build di local:

```bash
# Di local machine
docker build -f Dockerfile.backend -t warungin-backend:latest .
docker save warungin-backend:latest | gzip > warungin-backend.tar.gz

# Transfer ke server
scp warungin-backend.tar.gz warungin@192.168.0.101:/tmp/

# Di server
ssh warungin@192.168.0.101
docker load < /tmp/warungin-backend.tar.gz
cd /home/warungin/Warungin
docker compose up -d backend
```

## Quick Fix: Restart Saja (Tanpa Rebuild)

Jika code tidak berubah banyak, cukup restart:
```bash
bash scripts/pull-and-restart.sh
```


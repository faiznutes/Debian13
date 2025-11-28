# 🚀 Push Perbaikan Network Timeout ke GitHub

## Command untuk Push

Jalankan command berikut di terminal (Git Bash atau PowerShell):

```bash
# 1. Add semua file yang diubah
git add Dockerfile.backend
git add client/Dockerfile
git add update-docker.sh
git add build-docker-retry.sh
git add DOCKER_NETWORK_TIMEOUT_FIX.md
git add UPDATE_DOCKER.md
git add push-fix-network-timeout.sh

# 2. Commit dengan message yang jelas
git commit -m "Fix: Docker network timeout issue - Add npm retry logic and timeout configuration

- Add npm config for longer timeout (5 minutes) and retry mechanism
- Add retry logic for npm install and npx prisma generate
- Update Dockerfile.backend and client/Dockerfile with network handling
- Add build-docker-retry.sh script for build with retry
- Add update-docker.sh with retry logic for VPS deployment
- Add documentation: DOCKER_NETWORK_TIMEOUT_FIX.md and UPDATE_DOCKER.md"

# 3. Push ke GitHub
git push origin main
```

## Atau Gunakan Script

```bash
bash push-fix-network-timeout.sh
```

## Setelah Push

1. **Pull di VPS:**
   ```bash
   ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && git pull origin main'
   ```

2. **Update Docker di VPS:**
   ```bash
   bash update-docker.sh
   ```

   Atau langsung:
   ```bash
   sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
     "cd /home/warungin/Warungin && \
      git pull origin main && \
      docker compose down && \
      docker compose build && \
      docker compose up -d"
   ```

## File yang Akan Di-Push

- ✅ `Dockerfile.backend` - Perbaikan network timeout
- ✅ `client/Dockerfile` - Perbaikan network timeout
- ✅ `update-docker.sh` - Retry logic untuk build
- ✅ `build-docker-retry.sh` - Script build dengan retry
- ✅ `DOCKER_NETWORK_TIMEOUT_FIX.md` - Dokumentasi troubleshooting
- ✅ `UPDATE_DOCKER.md` - Dokumentasi update Docker
- ✅ `push-fix-network-timeout.sh` - Script untuk push

---

**Note**: Pastikan sudah login ke GitHub (Personal Access Token atau SSH key)


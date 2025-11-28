# Command untuk Deploy/Update ke Server

## Path Project
**Main Project:** `/home/warungin/Warungin`
**Alternative:** `/home/warungin/warungin` (ada juga tapi sepertinya folder lain)

## ⚡ Pull & Deploy Lengkap (Recommended)

### Menggunakan Script
```bash
bash scripts/pull-and-deploy.sh
# Password: 123
```
**Script ini akan:**
1. Pull latest code dari GitHub
2. Rebuild backend (dengan no-cache)
3. Restart semua containers
4. Show status dan logs

### Manual Command
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && git pull origin main && docker compose build --no-cache backend && docker compose restart"
# Password: 123
```

## Quick Deploy (Pull & Restart - Tanpa Rebuild)

### Opsi 1: Menggunakan Script
```bash
bash scripts/pull-and-restart.sh
# Password: 123
```
*(Hanya pull dan restart, tanpa rebuild - lebih cepat)*

### Opsi 2: Manual Command
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && git pull && (docker compose restart 2>/dev/null || docker-compose restart)"
# Password: 123
```

## Full Deploy (dengan Rebuild)

### Menggunakan Script
```bash
bash scripts/deploy-to-server.sh
# Password: 123
```

### Manual Command
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101
# Password: 123

# Di dalam SSH:
cd /home/warungin/Warungin
git pull origin main
docker compose build --no-cache backend  # atau docker-compose (v1)
docker compose restart  # atau docker-compose (v1)
docker ps
```

## Command Individual

### 1. Check Status
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && git status && docker ps"
```

### 2. Pull Latest Code
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && git pull origin main"
```

### 3. Rebuild Backend
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && (docker compose build --no-cache backend 2>/dev/null || docker-compose build --no-cache backend)"
```

### 4. Restart All Services
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && (docker compose restart 2>/dev/null || docker-compose restart)"
```

### 5. Check Logs
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && (docker compose logs --tail=50 backend 2>/dev/null || docker-compose logs --tail=50 backend)"
```

### 6. View All Logs
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && (docker compose logs --tail=100 2>/dev/null || docker-compose logs --tail=100)"
```

## Docker Container Status

Saat ini containers yang running:
- ✅ warungin-nginx (healthy)
- ✅ warungin-frontend (healthy)
- ✅ warungin-backend (healthy)
- ✅ warungin-postgres (healthy)
- ⚠️ warungin-cloudflared (unhealthy) - perlu dicek

## Troubleshooting

### Jika ada error saat pull
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && git fetch && git reset --hard origin/main"
```

### Jika container tidak restart
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && (docker compose down && docker compose up -d 2>/dev/null || docker-compose down && docker-compose up -d)"
```

### Check container health
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "docker ps -a"
```

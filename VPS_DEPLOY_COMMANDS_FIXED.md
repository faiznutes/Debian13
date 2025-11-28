# 🚀 Command untuk Deploy di VPS (Fixed)

## ⚠️ FIX GIT OWNERSHIP DULU

Jika mendapat error "dubious ownership", jalankan ini dulu:

```bash
cd /home/warungin/Warungin
git config --global --add safe.directory /home/warungin/Warungin

# Jika login sebagai root, fix ownership juga:
chown -R warungin:warungin /home/warungin/Warungin
```

## 📋 Command Lengkap untuk Deploy

### Option 1: Menggunakan Script (Recommended)
```bash
cd /home/warungin/Warungin
bash FIX_AND_DEPLOY_VPS.sh
```

### Option 2: Manual Step by Step

```bash
# 1. Fix Git ownership (jika error)
cd /home/warungin/Warungin
git config --global --add safe.directory /home/warungin/Warungin

# 2. Pull latest code
git pull origin main

# 3. Stop existing containers
docker compose down

# 4. Build dan start semua services (frontend, backend, database, cloudflare)
docker compose up -d --build

# 5. Tunggu services start
sleep 20

# 6. Cek status
docker compose ps

# 7. Setup firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# 8. Start Cloudflare tunnel (jika dikonfigurasi)
docker compose --profile cloudflare up -d cloudflared

# 9. Cek logs
docker compose logs -f
```

## 🔧 Command Satu Baris (Setelah Fix Git)

```bash
cd /home/warungin/Warungin && git pull origin main && docker compose down && docker compose up -d --build && sleep 20 && docker compose ps
```

## ☁️ Setup Cloudflare Tunnel

```bash
# 1. Edit .env
nano /home/warungin/Warungin/.env

# 2. Tambahkan:
CLOUDFLARE_TUNNEL_TOKEN=your_token_here

# 3. Start tunnel
cd /home/warungin/Warungin
docker compose --profile cloudflare up -d cloudflared

# 4. Cek status
docker compose ps | grep cloudflared
```

## 🔍 Troubleshooting

### Cek Logs
```bash
# Semua services
docker compose logs -f

# Service tertentu
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f cloudflared
```

### Restart Services
```bash
# Restart semua
docker compose restart

# Restart service tertentu
docker compose restart backend
docker compose restart frontend
docker compose restart cloudflared
```

### Rebuild Service Tertentu
```bash
# Rebuild backend
docker compose up -d --build backend

# Rebuild frontend
docker compose up -d --build frontend

# Rebuild cloudflare tunnel
docker compose --profile cloudflare up -d --build cloudflared
```

### Health Check
```bash
# Backend health
curl http://192.168.0.102/api/health

# Frontend
curl http://192.168.0.102

# Backend API
curl http://192.168.0.102/api
```

## 📊 Informasi Akses

- **Frontend:** http://192.168.0.102
- **Backend API:** http://192.168.0.102/api
- **Health Check:** http://192.168.0.102/api/health

## 🔐 Default Credentials

- **Email:** admin@warungin.com
- **Password:** admin123

⚠️ **PENTING:** Ganti password default setelah login pertama!


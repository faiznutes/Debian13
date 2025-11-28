# ✅ Verifikasi Cloudflare Tunnel di WSL

Panduan untuk memverifikasi Cloudflare Tunnel berjalan dengan benar.

## 🔍 Cara Verifikasi

### 1. Check Container Status

```bash
# Check semua containers
docker compose ps

# Check cloudflared khususnya
docker compose ps cloudflared

# Should show: "Up" (not "Restarting")
```

### 2. Check Cloudflared Logs

```bash
# View logs real-time
docker compose logs -f cloudflared

# View last 50 lines
docker compose logs --tail 50 cloudflared
```

**Expected output (berhasil):**
```
INF +--------------------------------------------------------------------------------------------+
INF |  Your quick Tunnel has been created! Visit it:                                             |
INF |  https://pos.faiznute.site                                                                 |
INF +--------------------------------------------------------------------------------------------+
```

### 3. Test Connectivity ke Nginx

**Opsi A: Dari nginx container (disarankan)**
```bash
# Test dari nginx container ke dirinya sendiri
docker compose exec nginx wget -O- http://localhost:80

# Atau test dari backend
docker compose exec backend wget -O- http://nginx:80
```

**Opsi B: Dari host (WSL)**
```bash
# Test dari WSL ke nginx
curl http://localhost:80

# Atau jika port tidak exposed, test dari container lain
docker compose exec backend curl http://nginx:80
```

**Opsi C: Test dari cloudflared (tanpa wget)**
```bash
# Cloudflared tidak punya wget, tapi bisa test dengan curl
docker compose exec cloudflared sh -c "apk add curl && curl http://nginx:80"

# Atau test tunnel info
docker compose exec cloudflared cloudflared tunnel info
```

### 4. Test Tunnel Info

```bash
# Check tunnel status
docker compose exec cloudflared cloudflared tunnel info

# Should show tunnel connection info
```

### 5. Test dari Browser

```bash
# Buka browser dan akses:
# https://pos.faiznute.site (atau domain Anda)

# Atau test dengan curl dari WSL
curl https://pos.faiznute.site
```

## ✅ Checklist Verifikasi

- [ ] Cloudflared container status: "Up" (tidak restarting)
- [ ] Logs menunjukkan tunnel connected
- [ ] Tunnel info command berhasil
- [ ] Nginx accessible dari container lain
- [ ] Domain accessible dari browser
- [ ] HTTPS working (otomatis dari Cloudflare)

## 🔧 Troubleshooting

### Cloudflared Restarting

```bash
# Check logs untuk error
docker compose logs cloudflared

# Check token
grep CLOUDFLARE_TUNNEL_TOKEN .env

# Restart
docker compose restart cloudflared
```

### Cannot Connect to Nginx

```bash
# Pastikan nginx running
docker compose ps nginx

# Test dari backend
docker compose exec backend curl http://nginx:80

# Check nginx logs
docker compose logs nginx
```

### Domain Not Accessible

1. Check Cloudflare Dashboard:
   - Zero Trust > Networks > Tunnels
   - Pastikan tunnel status: "Healthy"
   - Pastikan Public Hostname configured

2. Check Service URL:
   - Harus: `http://nginx:80`
   - Bukan: `http://localhost:80`

3. Tunggu 1-2 menit untuk DNS propagation

## 📊 Monitoring Commands

```bash
# View all logs
docker compose logs -f

# View cloudflared only
docker compose logs -f cloudflared

# Check container status
docker compose ps

# Test connectivity
docker compose exec backend curl http://nginx:80
```


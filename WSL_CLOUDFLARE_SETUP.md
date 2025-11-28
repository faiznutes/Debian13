# ☁️ Setup Cloudflare Tunnel di Docker WSL

Panduan lengkap untuk setup Cloudflare Tunnel di WSL agar aplikasi bisa diakses dari internet.

## 📋 Prerequisites

- ✅ Frontend, Backend, dan Database sudah running di Docker
- ✅ Nginx container sudah running
- ✅ Domain sudah di-manage di Cloudflare (opsional, bisa pakai subdomain gratis)

## 🚀 Step-by-Step Setup

### Step 1: Buat Tunnel di Cloudflare Dashboard

1. **Login ke Cloudflare:**
   - Buka: https://one.dash.cloudflare.com/
   - Login dengan akun Cloudflare Anda

2. **Akses Zero Trust (Gratis):**
   - Klik **Zero Trust** di sidebar (atau buka: https://one.dash.cloudflare.com/)
   - Jika belum ada, klik **Get Started** (gratis untuk personal use)

3. **Buat Tunnel:**
   - Pilih **Networks** > **Tunnels**
   - Klik **Create a tunnel**
   - Pilih **Cloudflared**
   - Beri nama: `warungin-tunnel` (atau nama lain)
   - Klik **Save tunnel**

4. **Copy Tunnel Token:**
   - Setelah tunnel dibuat, Anda akan melihat **Tunnel Token**
   - **⚠️ PENTING:** Copy token ini sekarang! Token hanya ditampilkan sekali
   - Format: `eyJhIjoiMTIzNDU2Nzg5MCIsInQiOiJodHRwczovL2FwaS5jbG91ZGZsYXJlLmNvbS9jbGllbnQvdjQvcmVnaXN0cmF0aW9uIn0=`
   - Token biasanya panjang (100+ karakter)

### Step 2: Configure Public Hostname di Cloudflare

1. **Di Cloudflare Dashboard:**
   - Zero Trust > Networks > Tunnels
   - Pilih tunnel yang baru dibuat (`warungin-tunnel`)
   - Klik **Configure**

2. **Add Public Hostname:**
   - Klik tab **Public Hostname**
   - Klik **Add a public hostname**
   - Isi form:
     - **Subdomain:** `pos` (atau sesuai kebutuhan)
     - **Domain:** Pilih domain Anda (contoh: `faiznute.site`)
       - Jika tidak punya domain, Cloudflare akan berikan subdomain gratis
     - **Service URL:** `http://nginx:80` ⚠️ **PENTING!**
   - Klik **Save hostname**

**⚠️ PENTING untuk Service URL:**
- Gunakan: `http://nginx:80` (bukan `localhost:80`)
- Ini karena cloudflared dan nginx di Docker network yang sama
- Nginx adalah service name di docker-compose.yml

### Step 3: Setup di WSL

```bash
# Masuk ke directory project
cd ~/Warungin

# Edit .env file
nano .env
```

**Tambahkan atau update di .env:**
```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiMTIzNDU2Nzg5MCIsInQiOiJodHRwczovL2FwaS5jbG91ZGZsYXJlLmNvbS9jbGllbnQvdjQvcmVnaXN0cmF0aW9uIn0=
```

**Save dan exit:**
- Tekan `Ctrl+X`
- Tekan `Y` untuk save
- Tekan `Enter` untuk confirm

### Step 4: Start Cloudflare Tunnel

```bash
# Pastikan nginx sudah running
docker compose ps nginx

# Start cloudflared dengan profile cloudflare
docker compose --profile cloudflare up -d cloudflared

# Check status
docker compose ps cloudflared

# View logs (untuk melihat apakah berhasil)
docker compose logs -f cloudflared
```

**Expected output di logs:**
```
INF +--------------------------------------------------------------------------------------------+
INF |  Your quick Tunnel has been created! Visit it:                                             |
INF |  https://pos.faiznute.site                                                                 |
INF +--------------------------------------------------------------------------------------------+
```

### Step 5: Verifikasi

```bash
# 1. Check container status
docker compose ps cloudflared

# Should show: "Up" (not "Restarting")

# 2. Check tunnel info
docker compose exec cloudflared cloudflared tunnel info

# 3. Test connectivity ke nginx
docker compose exec cloudflared wget -O- http://nginx:80

# 4. Test dari browser
# Buka: https://pos.faiznute.site (atau domain Anda)
```

## 🔍 Troubleshooting

### Problem: Cloudflared Restarting Loop

**Gejala:**
```bash
docker compose ps cloudflared
# Shows: Restarting (0) X seconds ago
```

**Solusi:**
```bash
# 1. Check logs
docker compose logs cloudflared

# 2. Check token di .env
grep CLOUDFLARE_TUNNEL_TOKEN .env

# 3. Jika kosong atau salah, update
nano .env
# Pastikan: CLOUDFLARE_TUNNEL_TOKEN=your_token_here

# 4. Restart
docker compose restart cloudflared
```

### Problem: Error 502 Bad Gateway

**Penyebab:** Cloudflare Tunnel tidak bisa reach nginx

**Solusi:**
```bash
# 1. Pastikan nginx running
docker compose ps nginx

# 2. Test connectivity dari cloudflared ke nginx
docker compose exec cloudflared wget -O- http://nginx:80

# 3. Check Service URL di Cloudflare Dashboard
# Pastikan: http://nginx:80 (bukan localhost:80)

# 4. Restart cloudflared
docker compose restart cloudflared
```

### Problem: Token Invalid atau Expired

**Solusi:**
1. Buat tunnel baru di Cloudflare Dashboard
2. Copy token baru
3. Update di `.env`
4. Restart cloudflared:
   ```bash
   docker compose restart cloudflared
   ```

### Problem: Domain Tidak Bisa Diakses

**Checklist:**
- [ ] Cloudflared container running (tidak restarting)
- [ ] Tunnel token valid di `.env`
- [ ] Public hostname configured di Cloudflare Dashboard
- [ ] Service URL: `http://nginx:80`
- [ ] Nginx container running
- [ ] Tunggu 1-2 menit untuk Cloudflare update DNS

## 📊 Monitoring Commands

```bash
# View cloudflared logs
docker compose logs -f cloudflared

# Check tunnel status
docker compose exec cloudflared cloudflared tunnel info

# Check all containers
docker compose ps

# Check nginx logs
docker compose logs -f nginx

# Test connectivity
docker compose exec cloudflared wget -O- http://nginx:80
```

## 🔄 Restart Commands

```bash
# Restart cloudflared saja
docker compose restart cloudflared

# Restart dengan profile cloudflare
docker compose --profile cloudflare down cloudflared
docker compose --profile cloudflare up -d cloudflared

# Full restart (nginx + cloudflared)
docker compose down
docker compose up -d nginx
sleep 10
docker compose --profile cloudflare up -d cloudflared
```

## ✅ Checklist Setup

- [ ] Tunnel dibuat di Cloudflare Dashboard
- [ ] Tunnel Token di-copy
- [ ] Token di-set di `.env` file
- [ ] Public Hostname configured di Cloudflare Dashboard
- [ ] Service URL: `http://nginx:80`
- [ ] Cloudflared container running (tidak restarting)
- [ ] Connectivity test berhasil: `docker compose exec cloudflared wget -O- http://nginx:80`
- [ ] Domain accessible dari browser: `https://pos.faiznute.site`

## 🎯 Quick Reference

```bash
# Start tunnel
docker compose --profile cloudflare up -d cloudflared

# Stop tunnel
docker compose --profile cloudflare down cloudflared

# Check status
docker compose ps cloudflared

# View logs
docker compose logs -f cloudflared

# Test connectivity
docker compose exec cloudflared wget -O- http://nginx:80
```

## 📝 Notes

- Cloudflare Tunnel **GRATIS** untuk personal use
- Tidak perlu buka port di firewall/router
- Otomatis HTTPS (SSL) dari Cloudflare
- Domain bisa menggunakan subdomain gratis dari Cloudflare
- Tunnel token hanya ditampilkan sekali saat dibuat, simpan dengan aman!

## 🔗 Referensi

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Setup Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)
- Troubleshooting: Lihat `CLOUDFLARE_TROUBLESHOOTING.md`


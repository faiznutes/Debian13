# 🔧 Setup Cloudflare Tunnel - Step by Step

Panduan lengkap untuk setup Cloudflare Tunnel dengan benar.

## ⚠️ Error: "You did not specify any valid additional argument"

Error ini terjadi karena `TUNNEL_TOKEN` tidak ter-set atau tidak ter-pass dengan benar ke cloudflared.

## ✅ Solusi

### Langkah 1: Buat Tunnel di Cloudflare Dashboard

1. **Login ke Cloudflare Dashboard:**
   - Buka: https://one.dash.cloudflare.com/
   - Login dengan akun Cloudflare Anda

2. **Buat Tunnel:**
   - Klik **Zero Trust** di sidebar
   - Pilih **Networks** > **Tunnels**
   - Klik **Create a tunnel**
   - Pilih **Cloudflared**
   - Beri nama tunnel (contoh: `warungin-tunnel`)
   - Klik **Save tunnel**

3. **Copy Tunnel Token:**
   - Setelah tunnel dibuat, Anda akan melihat **Tunnel Token**
   - **⚠️ PENTING:** Copy token ini sekarang! Token hanya ditampilkan sekali.
   - Format token: `eyJhIjoi...` (panjang string)

### Langkah 2: Setup di Server

```bash
# Edit .env file
nano .env

# Tambahkan atau update:
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token_here

# Save dan exit (Ctrl+X, Y, Enter)
```

**Contoh .env:**
```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiMTIzNDU2Nzg5MCIsInQiOiJodHRwczovL2FwaS5jbG91ZGZsYXJlLmNvbS9jbGllbnQvdjQvcmVnaXN0cmF0aW9uIn0=
```

### Langkah 3: Configure Public Hostname

1. **Di Cloudflare Dashboard:**
   - Zero Trust > Networks > Tunnels
   - Pilih tunnel yang baru dibuat
   - Klik **Configure**

2. **Add Public Hostname:**
   - Klik tab **Public Hostname**
   - Klik **Add a public hostname**
   - Isi:
     - **Subdomain:** `pos` (atau sesuai kebutuhan)
     - **Domain:** `faiznute.site` (domain Anda)
     - **Service URL:** `http://nginx:80` ⚠️ **PENTING: Gunakan ini!**
   - Klik **Save hostname**

**⚠️ PENTING:** 
- Service URL harus: `http://nginx:80` (bukan `localhost:80`)
- Ini karena cloudflared dan nginx di Docker network yang sama

### Langkah 4: Restart Cloudflared

```bash
# Pull perubahan terbaru (jika ada)
git pull origin main

# Restart cloudflared
docker compose --profile cloudflare down cloudflared
docker compose --profile cloudflare up -d cloudflared

# Check status
docker compose ps cloudflared

# Check logs
docker compose logs -f cloudflared
```

### Langkah 5: Verifikasi

```bash
# Run verification script
bash verify-cloudflared.sh

# Check tunnel info
docker compose exec cloudflared cloudflared tunnel info

# Test connectivity
docker compose exec cloudflared wget -O- http://nginx:80
```

## 🔍 Troubleshooting

### Token tidak ter-set

```bash
# Check token di .env
grep CLOUDFLARE_TUNNEL_TOKEN .env

# Jika kosong, set token
nano .env
# Tambahkan: CLOUDFLARE_TUNNEL_TOKEN=your_token
```

### Token invalid atau expired

1. Buat tunnel baru di Cloudflare Dashboard
2. Copy token baru
3. Update di `.env`
4. Restart cloudflared

### Cloudflared masih restarting

```bash
# Check logs untuk error
docker compose logs cloudflared

# Check token format
grep CLOUDFLARE_TUNNEL_TOKEN .env

# Token harus panjang (minimal 100 karakter)
# Format: eyJhIjoi...
```

### Error 502 setelah setup

1. Pastikan Service URL di Cloudflare Dashboard: `http://nginx:80`
2. Tunggu 1-2 menit untuk Cloudflare update
3. Test dari browser: `https://pos.faiznute.site`

## 📋 Checklist

- [ ] Tunnel dibuat di Cloudflare Dashboard
- [ ] Tunnel Token di-copy
- [ ] Token di-set di `.env` file
- [ ] Public Hostname configured di Cloudflare Dashboard
- [ ] Service URL: `http://nginx:80`
- [ ] Cloudflared container running (tidak restarting)
- [ ] Connectivity test berhasil: `docker compose exec cloudflared wget -O- http://nginx:80`
- [ ] Domain accessible dari browser

## 🔗 Referensi

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Create Named Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)

---

**Last Updated:** 2025-11-19


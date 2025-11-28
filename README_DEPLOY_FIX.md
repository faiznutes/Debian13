# 🚀 Deploy dengan DNS Fix

## Masalah yang Terjadi

Deployment gagal karena DNS di server tidak bisa resolve `registry-1.docker.io`:
```
dial tcp: lookup registry-1.docker.io on 127.0.0.53:53: server misbehaving
```

## ✅ Solusi - Script Sudah Di-Update

Script `FINAL_DEPLOY.sh` sudah di-update untuk:
1. ✅ **Fix DNS** - Otomatis set DNS ke Google DNS (8.8.8.8)
2. ✅ **Retry mechanism** - Retry pull images 3x jika gagal
3. ✅ **Continue build** - Tetap build meskipun pull gagal

## 🚀 Cara Menjalankan

Jalankan script yang sudah di-update:

```bash
bash FINAL_DEPLOY.sh
# Password: 123
```

Script akan:
1. Fix DNS configuration
2. Test DNS connection
3. Update repository dari GitHub
4. Pull Docker images (dengan retry)
5. Build dan start containers

## 🔧 Manual Fix (Jika Perlu)

Jika script masih gagal, fix DNS manual:

```bash
ssh warungin@192.168.0.101
# Password: 123

# Fix DNS
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF'

# Test
nslookup registry-1.docker.io

# Deploy
cd /home/warungin/Warungin
docker compose down
docker compose pull
docker compose up -d --build
```

## 📝 Catatan

- DNS fix memerlukan sudo (password mungkin diperlukan)
- Jika DNS masih bermasalah, coba restart: `sudo systemctl restart systemd-resolved`
- Docker akan tetap mencoba pull images saat build meskipun `docker compose pull` gagal


# 📊 Status Deploy - Clone & Push ke Docker

## ⚠️ Status Koneksi

Dari environment ini (PowerShell/WSL), koneksi SSH ke `192.168.0.101` masih **timeout**. 

**Tapi** karena Anda sudah bisa connect via Git Bash manual, script sudah siap untuk dijalankan!

## ✅ Script yang Sudah Dibuat

### 1. **`FINAL_DEPLOY.sh`** - RECOMMENDED ⭐
Script lengkap untuk clone terbaru dan deploy ke Docker.

**Cara pakai:**
```bash
# Di Git Bash
cd "f:\Backup W11\Github\Warungin"
bash FINAL_DEPLOY.sh
# Masukkan password: 123
```

### 2. **`DEPLOY_NOW.sh`**
Alternatif script dengan heredoc.

### 3. **`server-deploy.sh`**
Script untuk dijalankan langsung di server (setelah connect).

## 🚀 Quick Deploy Command

Setelah connect via SSH, jalankan command ini:

```bash
cd /home/warungin && \
if [ -d Warungin ]; then \
  cd Warungin && git fetch origin && git reset --hard origin/main; \
else \
  git clone https://github.com/faiznutes/Warungin.git && cd Warungin; \
fi && \
docker compose down 2>/dev/null; \
docker compose pull 2>/dev/null; \
docker compose up -d --build; \
docker compose ps
```

## 📋 Yang Akan Dilakukan

1. ✅ Connect ke server `warungin@192.168.0.101`
2. ✅ Clone/Pull repository terbaru dari `https://github.com/faiznutes/Warungin.git`
3. ✅ Stop containers yang sedang berjalan
4. ✅ Pull latest Docker images
5. ✅ Build dan start containers dengan `docker compose up -d --build`
6. ✅ Tampilkan status containers

## 🔍 Verifikasi Setelah Deploy

```bash
# Status containers
docker compose ps

# Logs
docker compose logs -f

# Health check
curl http://localhost/api/health
```

## 🌐 Akses Aplikasi

- **Frontend:** http://192.168.0.101
- **Backend API:** http://192.168.0.101/api
- **Health Check:** http://192.168.0.101/api/health

## 💡 Catatan

Karena koneksi dari environment ini timeout, silakan jalankan script `FINAL_DEPLOY.sh` di **Git Bash** untuk deploy otomatis. Script sudah lengkap dan siap digunakan!


# 📋 Summary: Clone & Deploy ke Docker

## Status
✅ SSH connection sudah berhasil via Git Bash ke `warungin@192.168.0.101`

## Script yang Tersedia

### 1. `RUN_DEPLOY.sh` - **RECOMMENDED**
Script lengkap untuk clone terbaru dan deploy ke Docker.
**Jalankan di Git Bash:**
```bash
bash RUN_DEPLOY.sh
# Masukkan password: 123
```

### 2. `remote-deploy-now.sh`
Script untuk dijalankan di server (setelah connect via SSH).
**Cara pakai:**
```bash
# 1. Connect ke server
ssh warungin@192.168.0.101
# Password: 123

# 2. Upload script (dari Git Bash lokal)
scp remote-deploy-now.sh warungin@192.168.0.101:/tmp/

# 3. Jalankan di server
bash /tmp/remote-deploy-now.sh
```

### 3. Manual Command (One-Line)
Setelah connect via SSH, jalankan:
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

## Yang Akan Dilakukan

1. ✅ Clone/Pull repository terbaru dari GitHub: `https://github.com/faiznutes/Warungin.git`
2. ✅ Stop containers yang sedang berjalan
3. ✅ Pull latest Docker images
4. ✅ Build dan start containers dengan Docker Compose
5. ✅ Tampilkan status containers

## Verifikasi Setelah Deploy

```bash
# Cek status
docker compose ps

# Cek logs
docker compose logs -f

# Health check
curl http://localhost/api/health
```

## Akses Aplikasi

- **Frontend:** http://192.168.0.101
- **Backend API:** http://192.168.0.101/api
- **Health Check:** http://192.168.0.101/api/health

## Catatan

Dari environment PowerShell/WSL ini, koneksi SSH masih timeout. Tapi karena Anda sudah bisa connect via Git Bash, silakan jalankan script `RUN_DEPLOY.sh` di Git Bash untuk deploy otomatis.


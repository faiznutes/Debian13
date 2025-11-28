# 🚀 Cara Menjalankan Deploy

## Quick Start

Karena koneksi SSH dari environment ini timeout, silakan jalankan script di **Git Bash**:

```bash
cd "f:\Backup W11\Github\Warungin"
bash DEPLOY_NOW.sh
```

**Password:** `123` (masukkan saat diminta)

## Apa yang Akan Dilakukan

1. ✅ Connect ke server `warungin@192.168.0.101`
2. ✅ Clone/Pull repository terbaru dari GitHub
3. ✅ Stop containers yang sedang berjalan
4. ✅ Pull latest Docker images
5. ✅ Build dan start containers
6. ✅ Tampilkan status

## Manual Command (Alternatif)

Jika script tidak berjalan, connect manual dan jalankan:

```bash
# 1. Connect ke server
ssh warungin@192.168.0.101
# Password: 123

# 2. Jalankan command ini:
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

## Verifikasi

Setelah deploy, cek:

```bash
# Status containers
docker compose ps

# Logs
docker compose logs -f

# Health check
curl http://localhost/api/health
```

## Akses Aplikasi

- **Frontend:** http://192.168.0.101
- **Backend API:** http://192.168.0.101/api


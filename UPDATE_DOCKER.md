# 🔄 Update Docker dari GitHub ke VPS

## Cara 1: Menggunakan Script (Recommended)

Jalankan script `update-docker.sh`:

```bash
bash update-docker.sh
```

Script ini akan otomatis:
1. ✅ Connect ke VPS warungin@192.168.0.101
2. ✅ Pull latest code dari GitHub
3. ✅ Stop containers yang berjalan
4. ✅ Rebuild Docker images
5. ✅ Start containers baru
6. ✅ Check status dan health

## Cara 2: Command Manual (SSH Langsung)

### Option A: Menggunakan sshpass (Auto Password)

```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && \
   git fetch origin && \
   git pull origin main && \
   docker compose down && \
   docker compose pull postgres redis nginx && \
   docker compose up -d --build && \
   docker compose ps"
```

### Option B: SSH Manual (Input Password)

```bash
ssh warungin@192.168.0.101
```

Kemudian di server, jalankan:

```bash
cd /home/warungin/Warungin
git fetch origin
git pull origin main
docker compose down
docker compose pull postgres redis nginx
docker compose up -d --build
docker compose ps
```

## Cara 3: One-Line Command (Lengkap)

```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && \
   if [ -d .git ]; then \
     git fetch origin && git pull origin main || git pull origin master; \
   else \
     git clone https://github.com/faiznutes/Warungin.git /home/warungin/Warungin-temp && \
     mv /home/warungin/Warungin-temp/* /home/warungin/Warungin-temp/.* /home/warungin/Warungin/ 2>/dev/null || true; \
   fi && \
   docker compose down && \
   docker compose pull postgres redis nginx 2>/dev/null || true && \
   docker compose up -d --build && \
   sleep 10 && \
   docker compose ps"
```

## Command Breakdown

### 1. Update Code dari GitHub
```bash
cd /home/warungin/Warungin
git fetch origin
git pull origin main
```

### 2. Stop Containers
```bash
docker compose down
```

### 3. Pull Base Images (Optional, untuk mempercepat)
```bash
docker compose pull postgres redis nginx
```

### 4. Rebuild dan Start
```bash
docker compose up -d --build
```

### 5. Check Status
```bash
docker compose ps
docker compose logs -f
```

## Troubleshooting

### Jika Git Pull Gagal
```bash
cd /home/warungin/Warungin
git fetch origin
git reset --hard origin/main
```

### Jika Docker Build Gagal
```bash
cd /home/warungin/Warungin
docker compose down
docker system prune -f
docker compose up -d --build --force-recreate
```

### View Logs untuk Debug
```bash
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose logs -f'
```

### Restart Service Tertentu
```bash
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose restart backend'
```

## Quick Reference

| Tugas | Command |
|-------|---------|
| Update & Deploy | `bash update-docker.sh` |
| View Logs | `ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose logs -f'` |
| Check Status | `ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose ps'` |
| Restart All | `ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose restart'` |
| Stop All | `ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose down'` |
| Rebuild Only | `ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose up -d --build'` |

## Catatan

- **Password SSH**: `123` (sesuai dengan `connect-ssh.sh`)
- **Server**: `warungin@192.168.0.101`
- **Directory**: `/home/warungin/Warungin`
- **GitHub Repo**: `https://github.com/faiznutes/Warungin.git`

---

**Last Updated**: $(date)


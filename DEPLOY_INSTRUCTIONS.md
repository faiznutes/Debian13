# 🚀 Deploy ke VPS - Instruksi Lengkap

## Cara Termudah

Jalankan script berikut:

```bash
bash DEPLOY_VPS_NOW.sh
```

## Atau Command Manual

Jika script tidak jalan, jalankan command berikut satu per satu:

### 1. Pull dari GitHub
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && git pull origin main"
```

### 2. Stop Containers
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose down"
```

### 3. Build Containers (dengan retry)
```bash
# Build backend
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose build backend || (sleep 30 && docker compose build backend)"

# Build frontend
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose build frontend || (sleep 30 && docker compose build frontend)"
```

### 4. Start Containers
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose up -d"
```

### 5. Check Status
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose ps"
```

## One-Line Command (Lengkap)

```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && \
   git pull origin main && \
   docker compose down && \
   docker compose build backend || (sleep 30 && docker compose build backend) && \
   docker compose build frontend || (sleep 30 && docker compose build frontend) && \
   docker compose up -d && \
   sleep 20 && \
   docker compose ps"
```

## Tanpa sshpass (Input Password Manual)

Jika tidak ada sshpass, gunakan:

```bash
ssh warungin@192.168.0.101
```

Kemudian di server, jalankan:

```bash
cd /home/warungin/Warungin
git pull origin main
docker compose down
docker compose build
docker compose up -d
docker compose ps
```

## Troubleshooting

### Jika Build Timeout
```bash
# Build dengan no-cache
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose build --no-cache"
```

### Jika Container Tidak Start
```bash
# Check logs
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose logs -f"
```

### Restart Services
```bash
sshpass -p "123" ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 \
  "cd /home/warungin/Warungin && docker compose restart"
```

---

**Note**: Pastikan sshpass terinstall atau gunakan SSH key untuk passwordless login.

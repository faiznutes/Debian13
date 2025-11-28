# WSL Deploy Guide

## ⚠️ Catatan Penting

Jika WSL tidak bisa connect ke VPS (No route to host), gunakan **Git Bash** yang sudah bekerja:
```bash
# Dari Git Bash (bukan WSL)
bash scripts/pull-and-deploy.sh
```

## Quick Deploy dari WSL

### 1. Install expect dulu (sekali saja)
```bash
bash scripts/wsl-install-expect.sh
```

### 2. Pull & Restart (Cepat)
```bash
bash scripts/wsl-deploy-with-password.sh
# Password: 123
```

### 2. Pull & Deploy Lengkap (dengan Rebuild)
```bash
bash scripts/wsl-pull-and-deploy.sh
# Password: 123
```

## Manual Command dari WSL

### Pull & Restart
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && git pull && docker compose restart"
# Password: 123
```

### Pull & Deploy Lengkap
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /home/warungin/Warungin && git pull && docker compose build --network=host backend && docker compose restart"
# Password: 123
```

## Setup SSH Key di WSL (Optional)

Jika ingin tanpa password, setup SSH key:

```bash
# Install expect jika belum ada
sudo apt-get update && sudo apt-get install -y expect

# Setup SSH key
bash scripts/wsl-connect-vps.sh
# Password: 123 (hanya sekali)
```

## Troubleshooting

### Jika koneksi timeout dari WSL
WSL mungkin tidak bisa reach IP 192.168.0.101. Solusi:
1. Gunakan Git Bash untuk SSH (sudah bekerja)
2. Atau setup SSH key di WSL menggunakan Windows key

### Install expect di WSL
```bash
sudo apt-get update
sudo apt-get install -y expect
```

### Test koneksi
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "echo 'Connection OK' && hostname"
# Password: 123
```

## File Scripts

- `scripts/wsl-deploy-with-password.sh` - Quick deploy dengan password
- `scripts/wsl-pull-and-deploy.sh` - Full deploy dengan password
- `scripts/wsl-connect-vps.sh` - Setup SSH key di WSL
- `scripts/wsl-deploy.sh` - Deploy menggunakan SSH key (jika sudah setup)


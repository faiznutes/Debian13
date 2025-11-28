# 🚀 Alternatif Deploy - Jika SSH Timeout

## Masalah

SSH connection timeout saat menjalankan `FINAL_DEPLOY.sh`:
```
ssh: connect to host 192.168.0.101 port 22: Connection timed out
```

## Solusi

### Opsi 1: Connect Manual & Jalankan Script di Server

1. **Connect ke server via Git Bash:**
   ```bash
   ssh warungin@192.168.0.101
   # Password: 123
   ```

2. **Upload script ke server:**
   ```bash
   # Dari Git Bash lokal
   scp deploy-direct.sh warungin@192.168.0.101:/tmp/
   # Password: 123
   ```

3. **Jalankan script di server:**
   ```bash
   # Di server
   bash /tmp/deploy-direct.sh
   ```

### Opsi 2: Copy-Paste Command Langsung

Setelah connect ke server, copy-paste command ini:

```bash
# Fix DNS
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF'

# Update repository
cd /home/warungin
if [ -d Warungin ]; then
    cd Warungin
    git fetch origin
    git reset --hard origin/main
else
    git clone https://github.com/faiznutes/Warungin.git
    cd Warungin
fi

# Deploy
docker compose down 2>/dev/null
docker compose pull || echo "Pull failed, continuing..."
docker compose up -d --build
sleep 15
docker compose ps
```

### Opsi 3: Retry Script dengan Timeout Lebih Lama

Script `FINAL_DEPLOY.sh` sudah di-update dengan timeout lebih lama (60 detik). Coba jalankan lagi:

```bash
bash FINAL_DEPLOY.sh
```

### Opsi 4: Check Server Status

Pastikan server masih running:

```bash
# Test ping
ping 192.168.0.101

# Test SSH port
telnet 192.168.0.101 22
# atau
nc -zv 192.168.0.101 22
```

## Troubleshooting

### Jika SSH masih timeout:

1. **Check server status:**
   - Apakah server masih menyala?
   - Apakah IP address masih sama?

2. **Check network:**
   ```bash
   ping 192.168.0.101
   traceroute 192.168.0.101
   ```

3. **Check SSH service di server:**
   ```bash
   # Di server (jika bisa connect via console)
   sudo systemctl status ssh
   sudo systemctl restart ssh
   ```

4. **Check firewall:**
   ```bash
   # Di server
   sudo ufw status
   sudo ufw allow 22/tcp
   ```

## File yang Tersedia

- `FINAL_DEPLOY.sh` - Script utama (sudah di-update dengan timeout lebih lama)
- `deploy-direct.sh` - Script untuk dijalankan langsung di server
- `DEPLOY_ALTERNATIVES.md` - File ini


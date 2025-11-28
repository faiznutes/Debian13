# 🔧 Fix DNS Issue & Deploy

## Masalah yang Terjadi

Deployment gagal karena masalah DNS di server:
```
failed to do request: Head "https://registry-1.docker.io/v2/library/node/manifests/18-alpine": 
dial tcp: lookup registry-1.docker.io on 127.0.0.53:53: server misbehaving
```

## Solusi

### Opsi 1: Fix DNS dan Deploy (Recommended)

Jalankan script yang sudah di-update:
```bash
bash FINAL_DEPLOY.sh
```

Script sudah di-update untuk:
- ✅ Fix DNS configuration (menggunakan Google DNS 8.8.8.8)
- ✅ Retry mechanism untuk pull Docker images
- ✅ Continue build meskipun pull gagal

### Opsi 2: Fix DNS Manual Dulu

1. **Fix DNS di server:**
```bash
bash quick-fix-dns.sh
# Password: 123
```

2. **Kemudian deploy:**
```bash
bash FINAL_DEPLOY.sh
```

### Opsi 3: Fix DNS dan Deploy Sekaligus

```bash
bash fix-dns-and-deploy.sh
```

## Manual Fix (Jika Script Gagal)

Connect ke server dan jalankan:

```bash
ssh warungin@192.168.0.101
# Password: 123

# Fix DNS
sudo bash -c 'cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF'

# Test DNS
nslookup registry-1.docker.io

# Deploy
cd /home/warungin/Warungin
docker compose down
docker compose pull
docker compose up -d --build
docker compose ps
```

## Catatan

- DNS fix mungkin perlu sudo password
- Jika DNS masih bermasalah, coba restart network: `sudo systemctl restart systemd-resolved`
- Atau gunakan DNS alternatif: Cloudflare (1.1.1.1) atau OpenDNS (208.67.222.222)


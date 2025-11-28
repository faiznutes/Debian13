# Cara Check Server dan Mencari Project Path

## Method 1: Menggunakan Script (Recommended)

Jalankan di **Git Bash**:

```bash
bash scripts/check-server-manual.sh
```

**Password:** `123` (akan diminta saat connect)

## Method 2: Manual Command

Jalankan di **Git Bash**:

```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101
# Password: 123
```

Kemudian di dalam SSH, jalankan:

```bash
# Cek current directory
pwd

# Cek home directory
ls -la ~

# Cari docker-compose.yml
find ~ -name "docker-compose.yml" -type f 2>/dev/null

# Cari directory warungin
find ~ -type d -iname "*warungin*" 2>/dev/null

# Cek lokasi umum
ls -la ~/Warungin 2>/dev/null
ls -la ~/warungin 2>/dev/null
ls -la ~/projects/Warungin 2>/dev/null
```

## Method 3: One-liner Command

Jalankan di **Git Bash**:

```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "pwd && echo '---' && ls -la ~ && echo '---' && find ~ -name 'docker-compose.yml' -type f 2>/dev/null"
# Password: 123
```

## Setelah Menemukan Path

Setelah menemukan path project, gunakan:

```bash
cd /path/yang/ditemukan
git pull
docker-compose restart
```

atau

```bash
cd ~/Warungin  # atau path yang ditemukan
git pull
docker-compose restart
```


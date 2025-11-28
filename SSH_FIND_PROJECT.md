# Command untuk Mencari Path Project di Server

## Command untuk Menemukan Lokasi Project

### 1. Cek Lokasi Umum
```bash
# Cek beberapa lokasi umum
ls -la ~/Warungin
ls -la ~/warungin
ls -la ~/projects/Warungin
ls -la /var/www/warungin
ls -la /opt/warungin
```

### 2. Cari File docker-compose.yml
```bash
find ~ -name "docker-compose.yml" -type f 2>/dev/null
```

### 3. Cari File package.json yang berisi "warungin"
```bash
find ~ -name "package.json" -type f 2>/dev/null | xargs grep -l "warungin" 2>/dev/null
```

### 4. Cek Directory Saat Ini
```bash
pwd
ls -la
```

### 5. Cek Home Directory
```bash
ls -la ~
```

### 6. Cari Semua Directory dengan Nama "warungin"
```bash
find ~ -type d -iname "*warungin*" 2>/dev/null
```

### 7. Cek Docker Containers (untuk melihat working directory)
```bash
docker ps
docker inspect <container_name> | grep -i "workingdir\|source"
```

### 8. Cek Process yang Running (untuk melihat path)
```bash
ps aux | grep -i warungin
```

## Setelah Menemukan Path, Gunakan Command Ini:

### Jika project di ~/Warungin:
```bash
cd ~/Warungin
git pull
docker-compose restart
```

### Jika project di /var/www/warungin:
```bash
cd /var/www/warungin
git pull
docker-compose restart
```

### Atau gunakan path yang ditemukan:
```bash
cd /path/yang/ditemukan
git pull
docker-compose restart
```

## Quick Command (Jalankan Semua Sekaligus):
```bash
PROJECT_PATH=$(find ~ -name "docker-compose.yml" -type f 2>/dev/null | head -1 | xargs dirname)
if [ -n "$PROJECT_PATH" ]; then
    echo "Project found at: $PROJECT_PATH"
    cd "$PROJECT_PATH"
    git pull
    docker-compose restart
else
    echo "Project not found. Please check manually."
fi
```


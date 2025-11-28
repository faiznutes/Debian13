# SSH Connection Commands

## Manual SSH Connection (Git Bash)

### Opsi 1: SSH Langsung (akan prompt password)
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101
# Password: 123
```

### Opsi 2: SSH dengan Command Sekaligus
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "echo 'Connected successfully'; hostname; whoami; pwd"
# Password: 123
```

### Opsi 3: Menggunakan Script Expect (jika expect terinstall)
```bash
# Install expect di Git Bash (jika belum ada)
# Atau gunakan WSL: sudo apt-get install expect

# Jalankan script
bash scripts/ssh-with-password.sh
```

### Opsi 4: SSH dengan Key-based Authentication (Recommended)
```bash
# Generate SSH key (jika belum ada)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key ke server
ssh-copy-id warungin@192.168.0.101
# Password: 123

# Setelah itu bisa SSH tanpa password
ssh warungin@192.168.0.101
```

### Opsi 5: SSH dengan Config File
Buat file `~/.ssh/config`:
```
Host warungin-server
    HostName 192.168.0.101
    User warungin
    StrictHostKeyChecking no
```

Kemudian jalankan:
```bash
ssh warungin-server
# Password: 123
```

## Quick Commands untuk Testing

### Test Connection
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "echo 'Connection OK'"
```

### Check Server Info
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "hostname && whoami && uname -a"
```

### Check Disk Space
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "df -h"
```

### Check Docker Status
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "docker ps && docker-compose ps"
```

### Deploy/Update Code
```bash
ssh -o StrictHostKeyChecking=no warungin@192.168.0.101 "cd /path/to/project && git pull && docker-compose restart"
```

## Troubleshooting

### Jika SSH timeout
```bash
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 warungin@192.168.0.101
```

### Jika port SSH berbeda (bukan 22)
```bash
ssh -o StrictHostKeyChecking=no -p 2222 warungin@192.168.0.101
```

### Verbose mode untuk debugging
```bash
ssh -v warungin@192.168.0.101
```


# Cara Connect ke Server Warungin

## Informasi Server
- **Host:** `warungin@192.168.0.101`
- **Password:** `123`

## Metode Koneksi

### 1. Git Bash / WSL (Recommended)

#### A. Menggunakan Script (Otomatis dengan sshpass)
```bash
bash connect-ssh.sh
```

**Note:** Jika `sshpass` belum terinstall:
- **WSL/Ubuntu:** `sudo apt-get install sshpass`
- **Git Bash:** Download dari [GitHub](https://github.com/keimpx/sshpass-windows) atau gunakan metode B

#### B. Manual (Interaktif - Masukkan Password)
```bash
ssh warungin@192.168.0.101
# Password: 123
```

#### C. Dengan sshpass (Non-Interaktif)
```bash
sshpass -p '123' ssh -o StrictHostKeyChecking=no warungin@192.168.0.101
```

### 2. PowerShell

#### A. Menggunakan Script
```powershell
.\connect-ssh.ps1
```

#### B. Manual
```powershell
ssh warungin@192.168.0.101
# Masukkan password: 123
```

**Note:** PowerShell SSH tidak mendukung automatic password input, jadi Anda harus memasukkan password secara manual.

### 3. WSL (Windows Subsystem for Linux)

```bash
# Install sshpass jika belum ada
sudo apt-get update
sudo apt-get install sshpass

# Connect dengan password otomatis
sshpass -p '123' ssh -o StrictHostKeyChecking=no warungin@192.168.0.101

# Atau manual
ssh warungin@192.168.0.101
# Password: 123
```

## Setup SSH Key (Passwordless Login)

Untuk koneksi tanpa password di masa depan, jalankan:

```bash
bash scripts/setup-ssh-key.sh
```

Setelah setup, Anda bisa connect dengan:
```bash
ssh warungin-vps
```

## Troubleshooting

### Connection Timeout
Jika mendapat error "Connection timed out":
1. Pastikan server menyala dan dapat dijangkau
2. Cek IP address: `ping 192.168.0.101`
3. Pastikan Anda berada di network yang sama
4. Cek firewall di server

### Permission Denied
Jika mendapat error "Permission denied":
1. Pastikan username dan password benar
2. Cek apakah SSH service berjalan di server: `sudo systemctl status ssh`
3. Cek SSH config di server: `/etc/ssh/sshd_config`

### Install sshpass di WSL
```bash
sudo apt-get update
sudo apt-get install sshpass
```

### Install sshpass di Git Bash (Windows)
Download dari: https://github.com/keimpx/sshpass-windows
Atau gunakan metode manual/interaktif.


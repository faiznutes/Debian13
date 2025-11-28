# Status Koneksi SSH ke Warungin Server

## Hasil Test Koneksi

### ✅ Server Reachable
- **IP:** 192.168.0.101
- **Ping:** ✅ Berhasil (4ms RTT)
- **Network:** ✅ Terhubung ke network yang sama (192.168.0.x)

### ❌ SSH Service Tidak Berjalan
- **Port 22:** ❌ Connection Refused
- **Error:** `ssh: connect to host 192.168.0.101 port 22: Connection refused`

## Masalah

SSH service tidak berjalan di server atau port 22 ditutup oleh firewall.

## Solusi

### 1. Nyalakan SSH Service di Server

Jika Anda punya akses fisik/console ke server, jalankan:

```bash
# Ubuntu/Debian
sudo systemctl start ssh
sudo systemctl enable ssh
sudo systemctl status ssh

# CentOS/RHEL
sudo systemctl start sshd
sudo systemctl enable sshd
sudo systemctl status sshd
```

### 2. Buka Port 22 di Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp
sudo ufw status

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# Atau iptables langsung
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

### 3. Cek SSH Service

```bash
# Cek apakah SSH service berjalan
sudo systemctl status ssh
# atau
sudo systemctl status sshd

# Cek apakah port 22 listening
sudo netstat -tlnp | grep :22
# atau
sudo ss -tlnp | grep :22
```

### 4. Install SSH Server (jika belum terinstall)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install openssh-server

# CentOS/RHEL
sudo yum install openssh-server
```

## Setelah SSH Service Berjalan

Setelah SSH service berjalan, Anda bisa connect dengan:

```bash
# Git Bash / WSL
bash connect-ssh.sh

# Atau manual
ssh warungin@192.168.0.101
# Password: 123
```

## Setup Passwordless Login

Setelah bisa connect, setup SSH key untuk passwordless login:

```bash
bash scripts/setup-ssh-key.sh
```

## Script yang Tersedia

1. **`connect-ssh.sh`** - Connect dengan password (Git Bash/WSL)
2. **`connect-ssh.ps1`** - Connect dengan password (PowerShell)
3. **`connect-ssh-auto.sh`** - Auto-detect port dan connect
4. **`scripts/setup-ssh-key.sh`** - Setup passwordless login


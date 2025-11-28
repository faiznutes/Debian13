# 🔐 Remote Access ke WSL via SSH

Panduan untuk setup remote access ke WSL menggunakan SSH dengan password "123".

## 🚀 Quick Setup

### Step 1: Setup SSH di WSL

```bash
# Masuk ke WSL
wsl

# Clone/pull repository
cd ~/Warungin
git pull origin main

# Jalankan setup script
bash scripts/setup-wsl-ssh.sh
```

### Step 2: Get IP Address

```bash
# Di WSL, dapatkan IP address
hostname -I | awk '{print $1}'

# Atau
ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
```

### Step 3: Allow Port 22 di Windows Firewall

**Dari PowerShell (Admin):**
```powershell
# Allow SSH port
netsh advfirewall firewall add rule name="WSL SSH" dir=in action=allow protocol=TCP localport=22

# Atau via GUI:
# Windows Security > Firewall > Advanced Settings > Inbound Rules > New Rule
# Port > TCP > 22 > Allow
```

### Step 4: Test Connection

**Dari Windows (PowerShell atau CMD):**
```powershell
# Test SSH connection
ssh root@<WSL_IP_ADDRESS>

# Password: 123
```

**Dari machine lain:**
```bash
ssh root@<WSL_IP_ADDRESS>
# Password: 123
```

## 📋 Manual Setup (Jika Script Tidak Berfungsi)

### 1. Install OpenSSH Server

```bash
# Di WSL
echo '123' | sudo -S apt-get update
echo '123' | sudo -S apt-get install -y openssh-server
```

### 2. Configure SSH

```bash
# Edit SSH config
echo '123' | sudo -S nano /etc/ssh/sshd_config

# Pastikan ada:
# PasswordAuthentication yes
# PermitRootLogin yes
```

### 3. Set Root Password

```bash
# Set password untuk root
echo 'root:123' | sudo -S chpasswd
```

### 4. Start SSH Service

```bash
# Start SSH
echo '123' | sudo -S service ssh start

# Enable auto-start
echo '123' | sudo -S systemctl enable ssh
# atau
echo '123' | sudo -S update-rc.d ssh defaults
```

## 🔍 Verifikasi

### Check SSH Status

```bash
# Di WSL
sudo service ssh status

# Check SSH listening
sudo netstat -tlnp | grep :22
# atau
sudo ss -tlnp | grep :22
```

### Test dari WSL Sendiri

```bash
# Test SSH local
ssh root@localhost
# Password: 123
```

### Test dari Windows

```powershell
# Get WSL IP
wsl hostname -I

# SSH ke WSL
ssh root@<IP_FROM_ABOVE>
# Password: 123
```

## 🔧 Troubleshooting

### SSH Service Tidak Start

```bash
# Check error
sudo service ssh status
sudo journalctl -u ssh

# Start manual
sudo service ssh start
sudo /usr/sbin/sshd -D &
```

### Cannot Connect dari Windows

1. **Check WSL IP:**
   ```bash
   wsl hostname -I
   ```

2. **Check Firewall:**
   ```powershell
   # Di PowerShell (Admin)
   netsh advfirewall firewall show rule name="WSL SSH"
   ```

3. **Check SSH Port:**
   ```bash
   # Di WSL
   sudo netstat -tlnp | grep :22
   ```

### Password Tidak Bekerja

```bash
# Reset password
echo 'root:123' | sudo -S chpasswd

# Test password
su - root
# Password: 123
```

### IP Address Berubah Setiap Restart

WSL IP bisa berubah setiap restart. Solusi:

1. **Gunakan WSL hostname:**
   ```bash
   # Di Windows hosts file
   # C:\Windows\System32\drivers\etc\hosts
   # Tambahkan:
   <WSL_IP> wsl-ubuntu
   
   # Connect dengan:
   ssh root@wsl-ubuntu
   ```

2. **Setup Static IP (Advanced):**
   - Gunakan WSL2 dengan static IP configuration
   - Atau gunakan port forwarding dari Windows

## 📝 Command Reference

```bash
# Start SSH
sudo service ssh start

# Stop SSH
sudo service ssh stop

# Restart SSH
sudo service ssh restart

# Check status
sudo service ssh status

# View logs
sudo tail -f /var/log/auth.log

# Get IP
hostname -I | awk '{print $1}'
```

## 🔐 Security Notes

⚠️ **PENTING untuk Production:**
- Ganti password default "123" dengan password yang kuat
- Disable root login, gunakan user biasa dengan sudo
- Setup SSH keys instead of password
- Change default SSH port (22)
- Setup fail2ban untuk brute force protection
- Only allow specific IPs if possible

**Untuk Development/Testing:**
- Password "123" OK untuk local network
- Pastikan firewall configured dengan benar
- Jangan expose ke public internet tanpa security

## ✅ Checklist

- [ ] OpenSSH Server installed
- [ ] SSH configured (PasswordAuthentication yes)
- [ ] Root password set to "123"
- [ ] SSH service running
- [ ] Port 22 allowed in Windows Firewall
- [ ] Can connect from Windows: `ssh root@<WSL_IP>`
- [ ] Can connect from other machines (optional)

## 🎯 Quick Test

```bash
# Di WSL
hostname -I | awk '{print $1}'  # Copy IP ini

# Di Windows PowerShell
ssh root@<IP_DARI_ATAS>
# Password: 123
```

Jika berhasil, Anda akan masuk ke WSL via SSH!


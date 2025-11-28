# 🔧 Fix SSH Password di WSL

## ✅ Setup Sudah Berhasil!

SSH sudah terinstall dan configured. Tinggal fix password dan firewall.

## 🔐 Fix Root Password

**Problem:** `chpasswd: line 1: missing new password`

**Solusi:**

```bash
# Method 1: Gunakan echo dengan format yang benar
echo 'root:123' | sudo chpasswd

# Method 2: Atau set langsung
sudo passwd root
# Masukkan password: 123
# Konfirmasi: 123

# Method 3: Atau gunakan chpasswd dengan format berbeda
echo "root:123" | sudo chpasswd
```

**Verifikasi password:**
```bash
# Test password
su - root
# Masukkan: 123
# Jika berhasil, exit dengan: exit
```

## 🔥 Fix Windows Firewall

**Problem:** `netsh: command not found` (karena dijalankan dari WSL)

**Solusi:** Jalankan dari Windows PowerShell (bukan dari WSL)

**Dari Windows PowerShell (Admin):**
```powershell
# Allow SSH port
netsh advfirewall firewall add rule name="WSL SSH" dir=in action=allow protocol=TCP localport=22

# Atau via GUI:
# 1. Buka Windows Security
# 2. Firewall & network protection
# 3. Advanced settings
# 4. Inbound Rules > New Rule
# 5. Port > TCP > 22 > Allow
```

## ✅ Verifikasi SSH Setup

```bash
# Di WSL - Check SSH status
sudo service ssh status

# Check SSH listening
sudo netstat -tlnp | grep :22
# atau
sudo ss -tlnp | grep :22

# Get IP address
hostname -I | awk '{print $1}'
# IP Anda: 172.27.30.45
```

## 🔗 Test Connection

### Dari Windows PowerShell:

```powershell
# Test SSH connection
ssh root@172.27.30.45
# Password: 123
```

### Dari WSL Sendiri (test local):

```bash
# Test SSH local
ssh root@localhost
# Password: 123

# Atau test dengan IP
ssh root@172.27.30.45
# Password: 123
```

## 🔧 Complete Fix Sequence

```bash
# 1. Fix root password
echo "root:123" | sudo chpasswd

# 2. Verify password works
su - root
# Password: 123
# Jika berhasil, ketik: exit

# 3. Restart SSH
sudo service ssh restart

# 4. Check SSH status
sudo service ssh status

# 5. Get IP
hostname -I | awk '{print $1}'
```

**Kemudian dari Windows PowerShell (Admin):**
```powershell
# Allow firewall
netsh advfirewall firewall add rule name="WSL SSH" dir=in action=allow protocol=TCP localport=22

# Test connection
ssh root@172.27.30.45
# Password: 123
```

## 🐛 Troubleshooting

### Password Masih Tidak Bekerja

```bash
# Reset password dengan method berbeda
sudo passwd root
# Masukkan: 123
# Konfirmasi: 123

# Atau
sudo usermod -p $(openssl passwd -1 123) root

# Test
su - root
# Password: 123
```

### SSH Service Tidak Running

```bash
# Start SSH
sudo service ssh start

# Check status
sudo service ssh status

# Check logs
sudo tail -f /var/log/auth.log
```

### Cannot Connect dari Windows

1. **Check WSL IP (bisa berubah):**
   ```bash
   wsl hostname -I
   ```

2. **Check Firewall:**
   ```powershell
   # Di PowerShell (Admin)
   netsh advfirewall firewall show rule name="WSL SSH"
   ```

3. **Test dari WSL sendiri dulu:**
   ```bash
   ssh root@localhost
   # Password: 123
   ```

## 📝 Quick Reference

**IP WSL Anda:** `172.27.30.45`

**Command untuk connect:**
```bash
ssh root@172.27.30.45
# Password: 123
```

**Note:** IP WSL bisa berubah setiap restart. Gunakan `hostname -I` untuk cek IP terbaru.


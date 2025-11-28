# 🔧 Fix SSH Connection - No Route to Host

## Masalah
```
ssh: connect to host 192.168.0.101 port 22: No route to host
```

## Troubleshooting Steps

### 1. Check Network Connectivity

```bash
# Ping test
ping -c 5 192.168.0.101

# Check if host is reachable
ping 192.168.0.101
```

**Jika ping gagal:**
- VPS mungkin mati atau tidak running
- IP address salah
- Network routing issue
- VPS tidak di network yang sama

### 2. Check SSH Port

```bash
# Test port 22
timeout 5 bash -c "echo > /dev/tcp/192.168.0.101/22" && echo "Port open" || echo "Port closed"

# Atau dengan telnet
telnet 192.168.0.101 22

# Atau dengan nc (netcat)
nc -zv 192.168.0.101 22
```

### 3. Check from Different Network

Jika dari WSL tidak bisa, coba dari:
- Windows PowerShell
- Windows CMD
- Network yang berbeda

### 4. Check VPS Status

Jika punya akses ke VPS (via console/VNC):
```bash
# Check SSH service
sudo systemctl status ssh
# atau
sudo systemctl status sshd

# Start SSH if not running
sudo systemctl start ssh
sudo systemctl enable ssh

# Check firewall
sudo ufw status
sudo ufw allow 22/tcp

# Check SSH is listening
sudo netstat -tlnp | grep :22
# atau
sudo ss -tlnp | grep :22
```

### 5. Check Network Interface

Di VPS:
```bash
# Check IP address
ip addr show
# atau
ifconfig

# Check routing
ip route show
# atau
route -n
```

### 6. Check Firewall Rules

Di VPS:
```bash
# UFW (Ubuntu)
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw reload

# iptables
sudo iptables -L -n | grep 22
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# firewalld (CentOS/RHEL)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

## Solutions

### Solution 1: VPS di Network Berbeda

Jika VPS di network berbeda (misalnya di router lain):

```bash
# Check default gateway
ip route | grep default

# Check if VPS is in same subnet
# Your IP: check dengan 'ip addr' atau 'ifconfig'
# VPS IP: 192.168.0.101
# Should be in same subnet (192.168.0.x)
```

### Solution 2: VPS Mati atau Tidak Running

1. Check VPS status di hosting provider
2. Restart VPS jika perlu
3. Check console/VNC access

### Solution 3: SSH Service Tidak Running

Di VPS (via console):
```bash
sudo systemctl start ssh
sudo systemctl enable ssh
sudo systemctl status ssh
```

### Solution 4: Firewall Blocking

Di VPS:
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

### Solution 5: SSH Config Issue

Di VPS, check `/etc/ssh/sshd_config`:
```bash
sudo nano /etc/ssh/sshd_config

# Pastikan:
# Port 22
# ListenAddress 0.0.0.0 (atau IP VPS)
# PermitRootLogin yes (atau sesuai kebutuhan)

# Restart SSH
sudo systemctl restart ssh
```

### Solution 6: Network Routing Issue

Check routing table:
```bash
# Di local machine (WSL)
ip route show

# Check if route to 192.168.0.0/24 exists
# If not, add route:
sudo ip route add 192.168.0.0/24 via <gateway_ip>
```

## Quick Diagnostic Script

Jalankan:
```bash
bash fix-ssh-connection.sh
```

## Alternative: Use Different Connection Method

### Via Windows (jika WSL tidak bisa)

Di PowerShell atau CMD:
```powershell
ssh warungin@192.168.0.101
```

### Via VPN/Proxy

Jika VPS hanya accessible via VPN:
```bash
# Connect to VPN first
# Then try SSH
ssh warungin@192.168.0.101
```

### Via Public IP (jika ada)

Jika VPS punya public IP:
```bash
ssh warungin@<public_ip>
```

## Check VPS dari Provider

1. Login ke hosting provider dashboard
2. Check VPS status (running/stopped)
3. Check network settings
4. Check firewall rules
5. Use VNC/Console access untuk troubleshoot

## Common Issues

### Issue 1: WSL Network Isolation
WSL mungkin tidak bisa akses local network. Coba dari Windows langsung.

### Issue 2: Windows Firewall
Windows Firewall mungkin block connection. Check Windows Firewall settings.

### Issue 3: Router/Firewall
Router atau network firewall mungkin block. Check router settings.

### Issue 4: VPS Network Config
VPS network interface mungkin down atau misconfigured.

## Next Steps

1. **Ping test**: `ping 192.168.0.101`
2. **Port test**: `nc -zv 192.168.0.101 22`
3. **Check VPS status** di provider dashboard
4. **Try from Windows** (bukan WSL)
5. **Check firewall** di VPS dan local network

---

**Note**: Jika VPS tidak bisa diakses sama sekali, mungkin perlu:
- Restart VPS
- Check network configuration
- Contact hosting provider


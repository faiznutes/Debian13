# VPS Connection Status

## ❌ Status: VPS Tidak Dapat Dijangkau

**Host:** warungin@192.168.0.101

### Hasil Test:
- ❌ Ping: Failed (100% packet loss)
- ❌ SSH Port 22: No route to host
- ❌ SSH Connection: Timeout/No route to host

## Kemungkinan Penyebab

1. **VPS Down/Offline**
   - VPS mungkin sedang mati atau restart
   - Check di hosting panel/VPS provider

2. **Network Routing Issue**
   - IP 192.168.0.101 mungkin tidak ada di network yang sama
   - VPS mungkin menggunakan IP yang berbeda

3. **Firewall Blocking**
   - Firewall di VPS mungkin memblokir koneksi
   - Router/firewall network mungkin memblokir

4. **SSH Service Down**
   - SSH service di VPS mungkin tidak running
   - Port 22 mungkin diubah

## Troubleshooting Steps

### 1. Check VPS Status
- Login ke hosting panel/VPS provider
- Check apakah VPS running
- Check IP address yang benar

### 2. Verify IP Address
```bash
# Pastikan IP benar
ping 192.168.0.101

# Check routing
traceroute 192.168.0.101
```

### 3. Check dari Network Lain
- Coba dari device lain di network yang sama
- Coba dari mobile hotspot (jika VPS public IP)

### 4. Check SSH Service di VPS
Jika punya akses lain ke VPS:
```bash
# Check SSH service
sudo systemctl status ssh
sudo systemctl status sshd

# Check port
sudo netstat -tlnp | grep 22
```

### 5. Check Firewall
```bash
# Di VPS
sudo ufw status
sudo iptables -L
```

## Script untuk Check

Jalankan script check:
```bash
bash scripts/check-vps-connection.sh
```

## Alternatif

Jika VPS menggunakan IP public atau domain:
- Update IP di script
- Atau gunakan domain name jika ada

## Next Steps

1. **Verify VPS Status** - Check di hosting panel
2. **Verify IP Address** - Pastikan 192.168.0.101 benar
3. **Check Network** - Pastikan di network yang sama
4. **Contact Support** - Jika VPS managed, contact provider


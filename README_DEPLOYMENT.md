# 🚀 Deployment Guide - Warungin ke Server

Panduan lengkap untuk deploy Warungin ke server via SSH.

## 📋 Prerequisites

### Di Local Machine (Windows/Linux/Mac)
- Git terinstall
- SSH client terinstall
- sshpass terinstall (opsional, untuk password authentication)
  ```bash
  # Ubuntu/Debian
  sudo apt-get install sshpass
  
  # Mac
  brew install sshpass
  ```

### Di Server
- Ubuntu 20.04+ atau Debian 11+
- Docker & Docker Compose terinstall
- Git terinstall
- SSH service running
- User `warungin` dengan sudo access (opsional)

## 🔧 Setup SSH Connection

### Opsi 1: Setup SSH Key (Passwordless - Recommended)

```bash
# Generate dan copy SSH key
bash setup-ssh-key.sh
```

Script ini akan:
1. Generate SSH key
2. Copy public key ke server
3. Setup passwordless login

### Opsi 2: Manual SSH Key Setup

```bash
# Generate key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_warungin

# Copy ke server
ssh-copy-id -i ~/.ssh/id_rsa_warungin.pub warungin@192.168.0.101

# Atau manual
cat ~/.ssh/id_rsa_warungin.pub | ssh warungin@192.168.0.101 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

### Opsi 3: Gunakan Password (dengan sshpass)

Jika tidak ingin setup SSH key, script akan menggunakan password dengan sshpass.

## 🚀 Deploy ke Server

### Quick Deploy

```bash
bash deploy-ssh.sh
```

Script ini akan:
1. ✅ Test SSH connection
2. ✅ Check Docker installation
3. ✅ Clone/update repository dari GitHub
4. ✅ Setup environment (.env)
5. ✅ Build dan start Docker containers
6. ✅ Check service health

### Manual Deploy

```bash
# 1. SSH ke server
ssh warungin@192.168.0.101

# 2. Clone repository
git clone https://github.com/faiznutes/Warungin.git
cd Warungin

# 3. Setup environment
cp env.example .env
nano .env  # Edit konfigurasi

# 4. Deploy
docker compose up -d --build

# 5. Check status
docker compose ps
docker compose logs -f
```

## ⚙️ Konfigurasi Server

### Install Docker (jika belum)

```bash
# Di server
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add user to docker group (optional)
sudo usermod -aG docker warungin
```

### Setup Firewall

```bash
# Di server
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

### Setup Domain & SSL (Opsional)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com
```

## 📝 Environment Variables

Edit `.env` file di server:

```bash
ssh warungin@192.168.0.101
nano /home/warungin/Warungin/.env
```

**Penting:** Pastikan untuk mengubah:
- `POSTGRES_PASSWORD` - Password database yang kuat
- `JWT_SECRET` - Random string minimal 32 karakter
- `JWT_REFRESH_SECRET` - Random string minimal 32 karakter
- `FRONTEND_URL` - URL server (http://192.168.0.101 atau domain)
- `BACKEND_URL` - URL backend API
- `CORS_ORIGIN` - URL yang diizinkan

## 🔄 Update Application

### Via Script (Recommended)

```bash
bash deploy-ssh.sh
```

Script akan otomatis:
- Pull latest changes dari GitHub
- Rebuild containers
- Restart services

### Manual Update

```bash
# Di server
cd /home/warungin/Warungin
git pull origin main
docker compose up -d --build
```

## 📊 Monitoring

### View Logs

```bash
# Semua services
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose logs -f'

# Service tertentu
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose logs -f backend'
```

### Check Status

```bash
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose ps'
```

### Restart Services

```bash
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose restart'
```

### Stop Services

```bash
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose down'
```

## 🐛 Troubleshooting

### SSH Connection Failed

```bash
# Test connection
ssh warungin@192.168.0.101

# Check if server is reachable
ping 192.168.0.101

# Check SSH service
ssh warungin@192.168.0.101 'sudo systemctl status ssh'
```

### Docker Not Found

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker warungin
# Logout and login again
```

### Port Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop conflicting service
sudo systemctl stop apache2  # or nginx
```

### Database Connection Error

- Pastikan `DATABASE_URL` di `.env` benar
- Pastikan postgres container running
- Check logs: `docker compose logs postgres`

## 📚 Perintah Berguna

```bash
# Backup database
ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && docker compose exec postgres pg_dump -U postgres warungin > backup.sql'

# View container resource usage
ssh warungin@192.168.0.101 'docker stats'

# Clean up unused Docker resources
ssh warungin@192.168.0.101 'docker system prune -a'
```

## 🔐 Security Best Practices

1. **Ganti password default** di `.env`
2. **Setup SSH key** untuk passwordless login
3. **Firewall:** Hanya buka port yang diperlukan
4. **SSL:** Setup HTTPS dengan Let's Encrypt
5. **Backup:** Setup automatic backup untuk database
6. **Update:** Update sistem dan Docker images secara berkala

---

**Server Info:**
- Host: `warungin@192.168.0.101`
- Directory: `/home/warungin/Warungin`
- Frontend: `http://192.168.0.101`
- Backend API: `http://192.168.0.101/api`


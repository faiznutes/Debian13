# Deployment Status Report - WSL

**Tanggal Check:** $(date)

## 📊 Status Summary

### ❌ Deployment Belum Siap

## 🔍 Detail Status

### 1. Docker Installation
- **Status:** ❌ **TIDAK TERINSTALL**
- **Detail:** Docker belum terinstall di WSL
- **Solusi:** 
  - Install Docker langsung di WSL: `bash scripts/wsl-install-docker.sh`
  - Atau aktifkan WSL integration di Docker Desktop Windows

### 2. Docker Containers
- **Status:** ❌ **TIDAK ADA CONTAINERS**
- **Detail:** Tidak ada containers yang berjalan
- **Services yang seharusnya ada:**
  - ❌ PostgreSQL (warungin-postgres)
  - ❌ Backend (warungin-backend)
  - ❌ Frontend (warungin-frontend)
  - ❌ Nginx (warungin-nginx)
  - ❌ Cloudflare Tunnel (warungin-cloudflared)

### 3. Database (PostgreSQL)
- **Status:** ❌ **TIDAK RUNNING**
- **Detail:** Container database tidak ditemukan

### 4. Backend Service
- **Status:** ❌ **TIDAK RUNNING**
- **Detail:** Container backend tidak ditemukan

### 5. Frontend Service
- **Status:** ❌ **TIDAK RUNNING**
- **Detail:** Container frontend tidak ditemukan

### 6. Cloudflare Tunnel
- **Status:** ⚠️ **TIDAK RUNNING**
- **Detail:** Container Cloudflare tunnel tidak ditemukan

## 🚀 Langkah-langkah untuk Setup Deployment

### Step 1: Install Docker di WSL
```bash
cd ~/Warungin
bash scripts/wsl-install-docker.sh
```

Atau manual:
```bash
# Update packages
echo '123' | sudo -S apt-get update

# Install prerequisites
echo '123' | sudo -S apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
echo '123' | sudo -S apt-get update
echo '123' | sudo -S apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
echo '123' | sudo -S usermod -aG docker $USER

# Start Docker
echo '123' | sudo -S service docker start

# Logout and login again, or:
newgrp docker
```

### Step 2: Setup Environment Variables
```bash
cd ~/Warungin
cp env.example .env
nano .env
```

**Important variables:**
- `POSTGRES_PASSWORD` - Strong password
- `JWT_SECRET` - Random 32+ characters
- `JWT_REFRESH_SECRET` - Random 32+ characters
- `FRONTEND_URL` - Your domain
- `BACKEND_URL` - Your API URL
- `CORS_ORIGIN` - CORS origin
- `MIDTRANS_*` - Payment gateway credentials
- `SMTP_*` - Email credentials
- `CLOUDFLARE_TUNNEL_TOKEN` - Cloudflare tunnel token (optional)

### Step 3: Install Dependencies
```bash
cd ~/Warungin

# Backend dependencies
npm install --legacy-peer-deps

# Frontend dependencies
cd client
npm install --legacy-peer-deps
cd ..
```

### Step 4: Build Docker Images
```bash
cd ~/Warungin
docker compose build
```

### Step 5: Start Services
```bash
cd ~/Warungin

# Start database first
docker compose up -d postgres
sleep 10

# Start all services
docker compose up -d
```

### Step 6: Start Cloudflare Tunnel (Optional)
```bash
cd ~/Warungin
docker compose --profile cloudflare up -d cloudflared
```

### Step 7: Verify Deployment
```bash
cd ~/Warungin
bash scripts/check-deployment-status.sh
```

## 📋 Checklist Deployment

- [ ] Docker installed di WSL
- [ ] Docker daemon running
- [ ] .env file configured
- [ ] Dependencies installed
- [ ] Docker images built
- [ ] PostgreSQL container running
- [ ] Backend container running
- [ ] Frontend container running
- [ ] Nginx container running
- [ ] Cloudflare tunnel running (optional)
- [ ] Database migrations applied
- [ ] Services accessible

## 🔧 Useful Commands

```bash
# Check status
bash scripts/check-deployment-status.sh

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Rebuild and restart
docker compose up -d --build
```

## 📝 Notes

- Docker Desktop di Windows perlu diintegrasikan dengan WSL jika ingin menggunakan Docker Desktop
- Atau install Docker langsung di WSL untuk production deployment
- Pastikan semua environment variables sudah dikonfigurasi dengan benar
- Cloudflare tunnel hanya diperlukan jika ingin menggunakan Cloudflare untuk public access


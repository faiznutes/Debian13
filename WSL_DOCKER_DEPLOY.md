# Setup Docker di WSL untuk Deployment

Panduan lengkap untuk setup Docker di WSL hingga siap deploy.

## Quick Start

Jalankan script setup otomatis:
```bash
cd ~/Warungin
bash scripts/wsl-docker-setup.sh
```

## Manual Setup (Step by Step)

### 1. Install Docker

```bash
# Update packages
echo '123' | sudo -S apt-get update

# Install prerequisites
echo '123' | sudo -S apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
echo '123' | sudo -S apt-get update
echo '123' | sudo -S apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
echo '123' | sudo -S usermod -aG docker $USER

# Start Docker service
echo '123' | sudo -S service docker start

# Logout and login again, or run:
newgrp docker
```

### 2. Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -S bash -
echo '123' | sudo -S apt-get install -y nodejs

# Verify
node --version
npm --version
```

### 3. Setup Repository

```bash
# Clone repository (jika belum)
cd ~
git clone https://github.com/faiznutes/Warungin.git
cd ~/Warungin

# Atau update jika sudah ada
cd ~/Warungin
git pull origin main
```

### 4. Setup Environment Variables

```bash
cd ~/Warungin

# Copy env.example to .env
cp env.example .env

# Edit .env file
nano .env
```

**Important variables to update:**
- `FRONTEND_URL` - URL frontend Anda
- `BACKEND_URL` - URL backend Anda  
- `CORS_ORIGIN` - CORS origin
- `POSTGRES_PASSWORD` - Password database (strong password)
- `JWT_SECRET` - Random 32+ characters
- `JWT_REFRESH_SECRET` - Random 32+ characters
- `MIDTRANS_*` - Midtrans credentials
- `SMTP_*` - Email SMTP credentials

### 5. Install Dependencies

```bash
cd ~/Warungin

# Install backend dependencies
npm install --legacy-peer-deps

# Install client dependencies
cd client
npm install --legacy-peer-deps
cd ..
```

### 6. Build Docker Images

```bash
cd ~/Warungin

# Make sure Docker is running
echo '123' | sudo -S service docker start

# Build images
docker compose build
```

### 7. Start Containers

```bash
cd ~/Warungin

# Start all services
docker compose up -d

# Or start step by step
docker compose up -d postgres
sleep 10
docker compose up -d
```

### 8. Verify Deployment

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Check specific service
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

## Useful Commands

### Docker Management

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f [service-name]

# Rebuild and restart
docker compose up -d --build

# Remove everything (including volumes)
docker compose down -v
```

### Database Management

```bash
# Access PostgreSQL
docker compose exec postgres psql -U postgres -d warungin

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker compose exec backend npx prisma generate
```

### Troubleshooting

```bash
# Check Docker status
sudo service docker status

# Start Docker
sudo service docker start

# Check container logs
docker compose logs [service-name]

# Restart specific service
docker compose restart [service-name]

# Rebuild specific service
docker compose build [service-name]
docker compose up -d [service-name]
```

## Deployment Checklist

- [ ] Docker installed and running
- [ ] Node.js installed
- [ ] Repository cloned/updated
- [ ] .env file configured
- [ ] Dependencies installed
- [ ] Docker images built
- [ ] Containers running
- [ ] Database migrations applied
- [ ] Services accessible
- [ ] Logs checked

## Status Check

Jalankan script untuk check status:
```bash
bash scripts/wsl-deploy-status.sh
```

## Next Steps After Setup

1. **Configure Domain**: Update FRONTEND_URL, BACKEND_URL, CORS_ORIGIN in .env
2. **Setup SSL**: Configure SSL certificates for production
3. **Setup Cloudflare**: Configure Cloudflare tunnel if needed
4. **Create Super Admin**: Run super admin creation script
5. **Test Deployment**: Verify all services are working

## Production Deployment

Untuk production, pastikan:
- Strong passwords in .env
- SSL certificates configured
- Firewall rules configured
- Backup strategy in place
- Monitoring setup
- Log rotation configured


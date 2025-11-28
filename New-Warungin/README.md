# Warungin - Multi-Tenant POS System

Sistem Point of Sale (POS) multi-tenant untuk UMKM dengan teknologi modern: Node.js, TypeScript, Vue.js, PostgreSQL, dan Docker.

## 🚀 Quick Start (Deploy ke VPS)

### Prerequisites

- VPS/Server dengan Ubuntu 20.04+ atau Debian 11+
- Docker & Docker Compose terinstall
- Domain name (opsional, untuk HTTPS)
- SSH access ke server

### 1. Clone Repository

```bash
git clone https://github.com/your-username/Warungin.git
cd Warungin
```

### 2. Setup Environment Variables

```bash
cp env.example .env
nano .env  # Edit dengan konfigurasi Anda
```

**Penting:** Pastikan untuk mengubah:
- `POSTGRES_PASSWORD` - Password database yang kuat
- `JWT_SECRET` - Random string minimal 32 karakter
- `JWT_REFRESH_SECRET` - Random string minimal 32 karakter
- `FRONTEND_URL` - URL domain Anda (contoh: `https://pos.example.com`)
- `BACKEND_URL` - URL backend (contoh: `https://pos.example.com/api`)
- `CORS_ORIGIN` - URL yang diizinkan untuk CORS
- Konfigurasi SMTP untuk email
- Konfigurasi Midtrans untuk payment gateway

### 3. Deploy dengan Docker

```bash
# Build dan start semua services
docker compose up -d

# Lihat logs
docker compose logs -f

# Cek status
docker compose ps
```

### 4. Setup Database & Super Admin

Setelah container berjalan, database akan otomatis di-migrate dan super admin akan dibuat.

**Default Super Admin:**
- Email: `admin@warungin.com`
- Password: `admin123`

**⚠️ PENTING:** Ganti password default setelah login pertama!

### 5. Akses Aplikasi

- **Frontend:** `http://your-server-ip` atau `https://your-domain.com`
- **Backend API:** `http://your-server-ip/api` atau `https://your-domain.com/api`
- **Health Check:** `http://your-server-ip/api/health`

## 📁 Struktur Project

```
Warungin/
├── client/              # Frontend (Vue.js)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── src/                 # Backend (Node.js/TypeScript)
│   ├── app.ts
│   └── ...
├── prisma/              # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── scripts/             # Utility scripts
│   └── docker-startup.sh
├── nginx/               # Nginx configuration
│   └── conf.d/
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile.backend   # Backend Dockerfile
└── .env                 # Environment variables (buat dari env.example)
```

## 🐳 Docker Services

- **postgres** - PostgreSQL 15 database
- **redis** - Redis cache (optional, enable dengan profile)
- **backend** - Node.js backend API
- **frontend** - Vue.js frontend (served via Nginx)
- **nginx** - Reverse proxy & load balancer

## 🔧 Management Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### Restart Services
```bash
docker compose restart
```

### View Logs
```bash
# Semua services
docker compose logs -f

# Service tertentu
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Rebuild After Code Changes
```bash
# Rebuild semua
docker compose up -d --build

# Rebuild service tertentu
docker compose up -d --build backend
docker compose up -d --build frontend
```

### Database Management
```bash
# Masuk ke database container
docker compose exec postgres psql -U postgres -d warungin

# Backup database
docker compose exec postgres pg_dump -U postgres warungin > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres -d warungin < backup.sql
```

### Create Super Admin
```bash
docker compose exec backend node scripts/create-super-admin-docker.js
```

## 🔐 Security Best Practices

1. **Ganti semua password default** di `.env`
2. **Gunakan HTTPS** untuk production (setup SSL certificate)
3. **Firewall:** Hanya buka port 80, 443, dan 22 (SSH)
4. **Database:** Jangan expose port 5432 ke public
5. **Backup:** Setup automatic backup untuk database
6. **Update:** Update Docker images secara berkala

## 📝 Environment Variables

Lihat `env.example` untuk daftar lengkap environment variables yang diperlukan.

### Variables Penting:

- `DATABASE_URL` - Connection string PostgreSQL
- `JWT_SECRET` - Secret untuk JWT token (minimal 32 karakter)
- `FRONTEND_URL` - URL frontend application
- `BACKEND_URL` - URL backend API
- `CORS_ORIGIN` - Allowed origins untuk CORS

## 🛠️ Development

### Local Development (tanpa Docker)

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Setup database
cp env.example .env
# Edit .env dengan database lokal

# Run migrations
npm run prisma:migrate

# Start backend
npm run dev

# Start frontend (terminal baru)
cd client
npm run dev
```

## 📦 Production Deployment Checklist

- [ ] Clone repository ke server
- [ ] Copy `env.example` ke `.env` dan konfigurasi
- [ ] Ganti semua password default
- [ ] Setup domain dan DNS
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Konfigurasi firewall
- [ ] Setup automatic backup
- [ ] Test semua functionality
- [ ] Monitor logs dan performance

## 🔄 Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker compose up -d --build

# Run migrations (otomatis via docker-startup.sh)
# Atau manual:
docker compose exec backend npx prisma migrate deploy
```

## 📊 Monitoring

### Health Checks

Semua services memiliki health check:
- Backend: `http://localhost:3000/health`
- Frontend: `http://localhost:80`
- Nginx: `http://localhost:80`

### View Container Status

```bash
docker compose ps
```

### Resource Usage

```bash
docker stats
```

## 🐛 Troubleshooting

### Container tidak start
```bash
# Cek logs
docker compose logs [service-name]

# Cek status
docker compose ps
```

### Database connection error
- Pastikan `DATABASE_URL` di `.env` benar
- Pastikan postgres container sudah running
- Cek network: `docker network ls`

### Frontend tidak load
- Cek apakah frontend container running
- Cek nginx logs: `docker compose logs nginx`
- Pastikan `FRONTEND_URL` di `.env` benar

### Permission denied
```bash
# Fix permissions
sudo chown -R $USER:$USER .
```

## 📚 Documentation

- [API Documentation](./docs/api.md) - API endpoints
- [Database Schema](./prisma/schema.prisma) - Prisma schema
- [Deployment Guide](./docs/deployment.md) - Detailed deployment guide

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

Untuk bantuan dan pertanyaan:
- Open an issue di GitHub
- Email: support@warungin.com

---

**Made with ❤️ for UMKM Indonesia**


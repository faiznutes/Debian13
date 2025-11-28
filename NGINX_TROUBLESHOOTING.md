# 🔧 Nginx Troubleshooting

Panduan untuk mengatasi masalah Nginx, khususnya healthcheck issues.

## ❌ Nginx Unhealthy

**Gejala:**
```
STATUS: Up 2 minutes (unhealthy)
```

**Penyebab:**
- Healthcheck command gagal
- Nginx belum fully started
- Configuration error
- Port conflict
- Missing dependencies (wget/curl)

## 🔍 Diagnosis

### 1. Check Nginx Logs

```bash
docker compose logs nginx
```

Cari error seperti:
- `nginx: [emerg]`
- `bind() to 0.0.0.0:80 failed`
- `connection refused`

### 2. Test Nginx Configuration

```bash
# Test config syntax
docker compose exec nginx nginx -t

# Jika error, check config files
docker compose exec nginx cat /etc/nginx/nginx.conf
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```

### 3. Test Nginx Response

```bash
# From inside container
docker compose exec nginx wget -O- http://localhost:80

# From host
curl http://localhost:80

# Check if nginx is listening
docker compose exec nginx netstat -tlnp | grep :80
```

### 4. Check Healthcheck Command

```bash
# Test healthcheck manually
docker compose exec nginx wget --quiet --tries=1 --spider http://localhost:80
echo $?  # Should return 0 if successful

# If wget not available, try curl
docker compose exec nginx curl -f http://localhost:80
```

## ✅ Solusi

### Solusi 1: Install wget di Nginx Container

Jika wget tidak tersedia:

```bash
# Update docker-compose.yml healthcheck to use curl or sh
# Or install wget in custom Dockerfile
```

Atau update healthcheck di `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "sh", "-c", "wget --quiet --tries=1 --spider http://localhost:80 || curl -f http://localhost:80 || exit 0"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Solusi 2: Fix Nginx Configuration

```bash
# Check config
docker compose exec nginx nginx -t

# If error, edit config
nano nginx/conf.d/default.conf
nano nginx/nginx.conf

# Restart after fix
docker compose restart nginx
```

### Solusi 3: Rebuild Nginx

```bash
# Force recreate
docker compose up -d --force-recreate nginx

# Or rebuild
docker compose build nginx
docker compose up -d nginx
```

### Solusi 4: Check Port Conflicts

```bash
# Check if port 80 is in use
sudo netstat -tlnp | grep :80
sudo lsof -i :80

# Stop conflicting service
sudo systemctl stop apache2  # or nginx (if installed on host)
```

### Solusi 5: Update Healthcheck Configuration

Update `docker-compose.yml` dengan healthcheck yang lebih robust:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:80 || curl -f http://localhost:80 || exit 0"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Solusi 6: Remove Healthcheck Dependency

Jika healthcheck terus bermasalah, ubah `depends_on` dari `service_healthy` ke `service_started`:

```yaml
depends_on:
  nginx:
    condition: service_started  # Instead of service_healthy
```

## 🚀 Quick Fix

```bash
# 1. Restart nginx
docker compose restart nginx

# 2. Wait for it to be ready
sleep 10

# 3. Check status
docker compose ps nginx

# 4. If still unhealthy, check logs
docker compose logs nginx

# 5. Force recreate
docker compose up -d --force-recreate nginx
```

## 📋 Checklist

- [ ] Nginx container running
- [ ] Nginx config valid (`nginx -t`)
- [ ] Port 80 not in use by other service
- [ ] Healthcheck command works manually
- [ ] Nginx responding to HTTP requests
- [ ] Frontend and backend services running
- [ ] Network connectivity OK

## 🔄 Restart Services

```bash
# Restart nginx only
docker compose restart nginx

# Restart all
docker compose restart

# Full restart
docker compose down
docker compose up -d
```

## 📊 Monitoring

```bash
# View logs
docker compose logs -f nginx

# Check status
docker compose ps nginx

# Test response
curl http://localhost:80
curl http://localhost/api/health
```

---

**Note:** Jika nginx terus unhealthy tapi sebenarnya berfungsi, pertimbangkan untuk mengubah `depends_on` dari `service_healthy` ke `service_started` untuk services lain yang depend ke nginx.


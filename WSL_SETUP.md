# Setup WSL untuk Git Clone

Dokumentasi untuk setup WSL (Windows Subsystem for Linux) untuk melakukan git clone dan development.

## Status Setup

✅ WSL Ubuntu 22.04 sudah terinstall dan berjalan
✅ Git sudah terinstall (version 2.34.1)
✅ Git config sudah di-setup dengan default values
✅ Repository sudah di-clone ke: `~/Warungin`

## Lokasi Repository di WSL

```bash
cd ~/Warungin
# atau
cd /home/warungin/Warungin
```

## Update Git Config (Opsional)

Jika ingin mengubah nama dan email git:

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@example.com"
```

## Setup SSH Key untuk GitHub (Opsional)

Jika ingin menggunakan SSH untuk push/pull (lebih aman):

```bash
# Jalankan script interaktif
./scripts/setup-wsl-git.sh

# Atau manual:
ssh-keygen -t ed25519 -C "email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub  # Copy ini ke GitHub Settings > SSH keys
```

## Menggunakan Repository

### Masuk ke WSL
```powershell
wsl
```

### Masuk ke directory project
```bash
cd ~/Warungin
```

### Pull latest changes
```bash
git pull origin main
```

### Push changes
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Scripts yang Tersedia

1. **`scripts/setup-wsl-quick.sh`** - Quick setup git config (non-interactive)
2. **`scripts/setup-wsl-git.sh`** - Full setup dengan SSH key (interactive)
3. **`scripts/clone-to-wsl.sh`** - Clone repository ke WSL

## Akses File dari Windows

File di WSL bisa diakses dari Windows melalui:
- `\\wsl$\Ubuntu-22.04\home\warungin\Warungin`
- Atau melalui Windows Explorer: `\\wsl$\Ubuntu-22.04`

## Troubleshooting

### Git tidak terdeteksi
```bash
sudo apt-get update
sudo apt-get install -y git
```

### Permission denied saat push
- Pastikan SSH key sudah ditambahkan ke GitHub
- Atau gunakan HTTPS dengan personal access token

### File path issues
- Gunakan path Linux di dalam WSL: `~/Warungin`
- Gunakan path Windows di PowerShell: `F:\Backup W11\Github\Warungin`

## Next Steps

1. Update git config dengan nama dan email Anda
2. Setup SSH key jika ingin menggunakan SSH
3. Mulai development di WSL!


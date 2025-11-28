# SSH Setup Guide - Passwordless Login

## Quick Setup

### 1. Setup SSH Key (Sekali Saja)
```bash
bash scripts/setup-ssh-key.sh
```
**Password:** `123` (hanya sekali saat copy key)

Setelah ini, Anda bisa connect tanpa password!

### 2. Test Connection
```bash
bash scripts/test-ssh-connection.sh
```

## Manual Setup

### Step 1: Generate SSH Key
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_warungin -N "" -C "warungin-vps"
```

### Step 2: Copy Public Key ke Server
```bash
ssh-copy-id -i ~/.ssh/id_rsa_warungin.pub warungin@192.168.0.101
# Password: 123
```

Atau manual:
```bash
cat ~/.ssh/id_rsa_warungin.pub | ssh warungin@192.168.0.101 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
# Password: 123
```

### Step 3: Setup SSH Config
Edit `~/.ssh/config`:
```
Host warungin-vps
    HostName 192.168.0.101
    User warungin
    IdentityFile ~/.ssh/id_rsa_warungin
    StrictHostKeyChecking no
```

### Step 4: Test
```bash
ssh warungin-vps
# Should connect without password!
```

## Usage Setelah Setup

### Connect Tanpa Password
```bash
ssh warungin-vps
```

### Atau dengan key langsung
```bash
ssh -i ~/.ssh/id_rsa_warungin warungin@192.168.0.101
```

### Run Command Langsung
```bash
ssh warungin-vps "cd /home/warungin/Warungin && git pull && docker compose restart"
```

### Update Deploy Scripts
Setelah setup SSH key, semua script deploy akan otomatis tanpa password!

## Troubleshooting

### Jika key tidak bekerja
```bash
# Check key permissions
chmod 600 ~/.ssh/id_rsa_warungin
chmod 644 ~/.ssh/id_rsa_warungin.pub
chmod 700 ~/.ssh

# Check server permissions
ssh warungin@192.168.0.101 "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

### Test key manually
```bash
ssh -v -i ~/.ssh/id_rsa_warungin warungin@192.168.0.101
```

### Regenerate key
```bash
rm ~/.ssh/id_rsa_warungin*
bash scripts/setup-ssh-key.sh
```


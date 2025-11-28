# Script untuk menghapus file yang tidak diperlukan
# Hanya menyisakan: frontend, backend, database, dan config cloudflare tunnel

Write-Host "==========================================" -ForegroundColor Blue
Write-Host "🧹 Cleaning Repository" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue
Write-Host ""

$deletedCount = 0
$errorCount = 0

# Function untuk menghapus file dengan error handling
function Remove-FileSafe {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        try {
            Remove-Item $FilePath -Force -ErrorAction Stop
            Write-Host "  ✅ Deleted: $FilePath" -ForegroundColor Green
            $script:deletedCount++
            return $true
        }
        catch {
            Write-Host "  ❌ Error deleting: $FilePath - $_" -ForegroundColor Red
            $script:errorCount++
            return $false
        }
    }
    return $false
}

# Function untuk menghapus folder dengan error handling
function Remove-FolderSafe {
    param([string]$FolderPath)
    
    if (Test-Path $FolderPath) {
        try {
            Remove-Item $FolderPath -Recurse -Force -ErrorAction Stop
            Write-Host "  ✅ Deleted folder: $FolderPath" -ForegroundColor Green
            $script:deletedCount++
            return $true
        }
        catch {
            Write-Host "  ❌ Error deleting folder: $FolderPath - $_" -ForegroundColor Red
            $script:errorCount++
            return $false
        }
    }
    return $false
}

Write-Host "📝 Step 1: Removing unnecessary .md files..." -ForegroundColor Yellow

# Hapus semua .md kecuali README.md dan setup-cloudflare-tunnel.md
$mdFiles = Get-ChildItem -Path . -Filter "*.md" -Recurse -File | Where-Object {
    $_.Name -ne "README.md" -and 
    $_.Name -ne "setup-cloudflare-tunnel.md" -and
    $_.FullName -notlike "*\client\*" -and
    $_.FullName -notlike "*\node_modules\*"
}

foreach ($file in $mdFiles) {
    Remove-FileSafe $file.FullName
}

Write-Host ""
Write-Host "📝 Step 2: Removing unnecessary .sh files..." -ForegroundColor Yellow

# File .sh yang harus DISISAKAN:
$keepShFiles = @(
    "FIX_AND_DEPLOY_VPS.sh",
    "scripts\docker-startup.sh"
)

# Hapus semua .sh kecuali yang penting
$shFiles = Get-ChildItem -Path . -Filter "*.sh" -Recurse -File | Where-Object {
    $keep = $false
    foreach ($keepFile in $keepShFiles) {
        if ($_.FullName -like "*\$keepFile" -or $_.Name -eq $keepFile) {
            $keep = $true
            break
        }
    }
    -not $keep -and $_.FullName -notlike "*\node_modules\*"
}

foreach ($file in $shFiles) {
    Remove-FileSafe $file.FullName
}

Write-Host ""
Write-Host "📝 Step 3: Removing .ps1 files (not needed in GitHub)..." -ForegroundColor Yellow

# Hapus semua .ps1
$ps1Files = Get-ChildItem -Path . -Filter "*.ps1" -Recurse -File | Where-Object {
    $_.FullName -notlike "*\node_modules\*"
}

foreach ($file in $ps1Files) {
    Remove-FileSafe $file.FullName
}

Write-Host ""
Write-Host "📝 Step 4: Removing .txt files..." -ForegroundColor Yellow

# Hapus semua .txt
$txtFiles = Get-ChildItem -Path . -Filter "*.txt" -Recurse -File | Where-Object {
    $_.FullName -notlike "*\node_modules\*"
}

foreach ($file in $txtFiles) {
    Remove-FileSafe $file.FullName
}

Write-Host ""
Write-Host "📝 Step 5: Removing .bat files..." -ForegroundColor Yellow

# Hapus semua .bat
$batFiles = Get-ChildItem -Path . -Filter "*.bat" -Recurse -File | Where-Object {
    $_.FullName -notlike "*\node_modules\*"
}

foreach ($file in $batFiles) {
    Remove-FileSafe $file.FullName
}

Write-Host ""
Write-Host "📝 Step 6: Removing unnecessary files in root..." -ForegroundColor Yellow

# File-file yang tidak diperlukan di root
$unnecessaryFiles = @(
    "rincian",
    "connect-ssh.sh",
    "connect-ssh.ps1",
    "connect-ssh-auto.sh",
    "copy-and-push.sh",
    "push-to-github.sh",
    "push-to-github.ps1",
    "push-to-github-auto.sh",
    "push-to-github-only.sh",
    "push-and-deploy-vps.sh",
    "push-fix-network-timeout.sh",
    "push-fix-npm-ci.sh",
    "QUICK_PUSH.sh",
    "deploy-vps.sh",
    "deploy-vps-now.sh",
    "deploy-now.sh",
    "deploy-direct.sh",
    "deploy-ssh.sh",
    "deploy-via-ssh.sh",
    "deploy-to-vps-complete.sh",
    "deploy-vps-with-timeout.sh",
    "quick-deploy.sh",
    "quick-fix-dns.sh",
    "fix-502-error.sh",
    "fix-cloudflared-connectivity.sh",
    "fix-cloudflared-network.sh",
    "fix-dns-and-deploy.sh",
    "fix-docker-hub-timeout.sh",
    "fix-nginx-healthcheck.sh",
    "fix-ssh-connection.sh",
    "fix-stuck-build-now.sh",
    "check-build-status.sh",
    "check-cloudflared.sh",
    "check-vps-connectivity.sh",
    "verify-cloudflared.sh",
    "verify-structure.sh",
    "update-docker.sh",
    "build-docker-retry.sh",
    "clone-and-deploy.sh",
    "remote-deploy-now.sh",
    "remote-exec-deploy.sh",
    "server-deploy.sh",
    "setup-ssh-key.sh",
    "FINAL_DEPLOY.sh",
    "DEPLOY_NOW.sh",
    "DEPLOY_VPS_NOW.sh",
    "RUN_DEPLOY.sh"
)

foreach ($file in $unnecessaryFiles) {
    if (Test-Path $file) {
        Remove-FileSafe $file
    }
}

Write-Host ""
Write-Host "📝 Step 7: Cleaning scripts folder..." -ForegroundColor Yellow

# File di scripts/ yang harus DISISAKAN:
$keepScripts = @(
    "docker-startup.sh",
    "create-super-admin-docker.js"
)

# Hapus semua file di scripts/ kecuali yang penting
if (Test-Path "scripts") {
    $scriptFiles = Get-ChildItem -Path "scripts" -File | Where-Object {
        $keep = $false
        foreach ($keepFile in $keepScripts) {
            if ($_.Name -eq $keepFile) {
                $keep = $true
                break
            }
        }
        -not $keep
    }
    
    foreach ($file in $scriptFiles) {
        Remove-FileSafe $file.FullName
    }
}

Write-Host ""
Write-Host "📝 Step 8: Removing unnecessary .md in client folder..." -ForegroundColor Yellow

# Hapus .md di client folder
$clientMdFiles = Get-ChildItem -Path "client" -Filter "*.md" -Recurse -File -ErrorAction SilentlyContinue
foreach ($file in $clientMdFiles) {
    Remove-FileSafe $file.FullName
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Blue
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Files deleted: $deletedCount" -ForegroundColor Green
Write-Host "  - Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "📁 Remaining files:" -ForegroundColor Cyan
Write-Host "  ✅ Frontend: client/" -ForegroundColor Green
Write-Host "  ✅ Backend: src/" -ForegroundColor Green
Write-Host "  ✅ Database: prisma/" -ForegroundColor Green
Write-Host "  ✅ Docker: docker-compose.yml, Dockerfile.backend" -ForegroundColor Green
Write-Host "  ✅ Nginx: nginx/" -ForegroundColor Green
Write-Host "  ✅ Cloudflare: env.example, setup-cloudflare-tunnel.md" -ForegroundColor Green
Write-Host "  ✅ Scripts: scripts/docker-startup.sh, scripts/create-super-admin-docker.js" -ForegroundColor Green
Write-Host "  ✅ Deploy: FIX_AND_DEPLOY_VPS.sh" -ForegroundColor Green
Write-Host "  ✅ Docs: README.md" -ForegroundColor Green
Write-Host ""




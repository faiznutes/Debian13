# PowerShell script untuk push perbaikan network timeout ke GitHub
# Usage: .\push-to-github.ps1

Write-Host "🚀 Push Perbaikan Network Timeout ke GitHub" -ForegroundColor Blue
Write-Host ""

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git tidak terinstall!" -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Bukan git repository!" -ForegroundColor Red
    exit 1
}

# Check remote
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
    Write-Host "❌ Remote belum di-setup!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Remote: $remoteUrl" -ForegroundColor Green

# Check current branch
$branch = git branch --show-current 2>$null
if (-not $branch) {
    $branch = "main"
}

Write-Host "Branch: $branch" -ForegroundColor Yellow
Write-Host ""

# Add files
Write-Host "📝 Adding files..." -ForegroundColor Yellow
git add Dockerfile.backend
git add client/Dockerfile
git add update-docker.sh
git add build-docker-retry.sh
git add DOCKER_NETWORK_TIMEOUT_FIX.md
git add UPDATE_DOCKER.md
git add push-fix-network-timeout.sh
git add PUSH_NOW.md

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ Semua file sudah up-to-date" -ForegroundColor Green
    exit 0
}

# Show what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
$commitMsg = @"
Fix: Docker network timeout issue - Add npm retry logic and timeout configuration

- Add npm config for longer timeout (5 minutes) and retry mechanism
- Add retry logic for npm install and npx prisma generate
- Update Dockerfile.backend and client/Dockerfile with network handling
- Add build-docker-retry.sh script for build with retry
- Add update-docker.sh with retry logic for VPS deployment
- Add documentation: DOCKER_NETWORK_TIMEOUT_FIX.md and UPDATE_DOCKER.md
"@

git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Commit created" -ForegroundColor Green

# Push
Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Push gagal!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Kemungkinan penyebab:" -ForegroundColor Yellow
    Write-Host "  1. Authentication belum di-setup"
    Write-Host "  2. Network/connection issue"
    Write-Host ""
    Write-Host "Solusi:" -ForegroundColor Yellow
    Write-Host "  1. Setup Personal Access Token di GitHub"
    Write-Host "  2. Atau setup SSH key"
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ Push berhasil!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Perbaikan network timeout sudah di-push ke GitHub!" -ForegroundColor Blue
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Pull di VPS: ssh warungin@192.168.0.101 'cd /home/warungin/Warungin && git pull origin main'"
Write-Host "  2. Update Docker: bash update-docker.sh"
Write-Host ""


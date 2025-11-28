# PowerShell script untuk connect ke server Warungin dengan password
# Usage: .\connect-ssh.ps1

$host = "warungin@192.168.0.101"
$password = "123"

Write-Host "=========================================="
Write-Host "Connecting to Warungin Server"
Write-Host "Host: $host"
Write-Host "=========================================="
Write-Host ""

# PowerShell SSH connection (requires OpenSSH client)
# Note: PowerShell SSH doesn't support automatic password input
# You'll need to enter password manually or use SSH keys

Write-Host "Connecting to server..."
Write-Host "Password: $password"
Write-Host ""

ssh -o StrictHostKeyChecking=no $host


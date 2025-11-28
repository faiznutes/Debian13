#!/bin/bash
# Script untuk upload dan execute di server

SSH_USER="warungin"
SSH_HOST="192.168.0.101"

# Encode script sebagai base64
SCRIPT_B64=$(cat << 'SCRIPT_END' | base64 -w 0
#!/bin/bash
cd /home/warungin
if [ -d Warungin ]; then
    echo "📦 Updating repository..."
    cd Warungin
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
    echo "✅ Repository updated"
else
    echo "📦 Cloning repository..."
    git clone https://github.com/faiznutes/Warungin.git
    cd Warungin
    echo "✅ Repository cloned"
fi
echo ""
echo "🐳 Deploying with Docker..."
docker compose down 2>/dev/null || true
docker compose pull 2>/dev/null || true
docker compose up -d --build
echo ""
echo "⏳ Waiting 10 seconds..."
sleep 10
echo ""
echo "📊 Service Status:"
docker compose ps
echo ""
echo "🎉 Deployment selesai!"
SCRIPT_END
)

echo "Uploading and executing script on server..."
echo "Password: 123"
echo ""

# Upload script via echo dan base64 decode
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "echo '$SCRIPT_B64' | base64 -d | bash"


#!/bin/bash

# SSH Permission Denied Fix for Vast.ai
# Run this script on your Mac to fix SSH connection issues

echo "🔧 Fixing SSH Permission Denied for Vast.ai"
echo "============================================"
echo ""

# Step 1: Check if SSH key exists
echo "Step 1: Checking for existing SSH keys..."
if [ -f ~/.ssh/id_ed25519.pub ]; then
    echo "✅ SSH key found: ~/.ssh/id_ed25519.pub"
    echo ""
    echo "Your PUBLIC key (copy this to Vast.ai):"
    echo "----------------------------------------"
    cat ~/.ssh/id_ed25519.pub
    echo "----------------------------------------"
elif [ -f ~/.ssh/id_rsa.pub ]; then
    echo "✅ SSH key found: ~/.ssh/id_rsa.pub"
    echo ""
    echo "Your PUBLIC key (copy this to Vast.ai):"
    echo "----------------------------------------"
    cat ~/.ssh/id_rsa.pub
    echo "----------------------------------------"
else
    echo "❌ No SSH key found. Generating new one..."
    echo ""
    read -p "Enter your email: " email
    ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
    echo ""
    echo "✅ SSH key generated!"
    echo ""
    echo "Your PUBLIC key (copy this to Vast.ai):"
    echo "----------------------------------------"
    cat ~/.ssh/id_ed25519.pub
    echo "----------------------------------------"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Copy the PUBLIC key above"
echo "2. Go to: https://cloud.vast.ai/account/"
echo "3. Click 'SSH Keys' tab"
echo "4. Click 'Add SSH Key'"
echo "5. Paste the key"
echo "6. Restart your Vast.ai instance"
echo ""
echo "Then try connecting again!"
echo ""

# Step 2: Fix permissions
echo "Step 2: Fixing SSH directory permissions..."
chmod 700 ~/.ssh 2>/dev/null
chmod 600 ~/.ssh/id_* 2>/dev/null
chmod 644 ~/.ssh/*.pub 2>/dev/null
chmod 644 ~/.ssh/known_hosts 2>/dev/null
echo "✅ Permissions fixed"
echo ""

# Step 3: Test SSH agent
echo "Step 3: Starting SSH agent..."
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519 2>/dev/null || ssh-add ~/.ssh/id_rsa 2>/dev/null
echo "✅ SSH key added to agent"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Now copy the SSH command from Vast.ai and try again."

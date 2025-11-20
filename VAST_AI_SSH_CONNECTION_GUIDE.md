# Vast.ai SSH Connection Guide

## 🔐 Step-by-Step SSH Connection Instructions

### 1️⃣ Get Your SSH Connection Details from Vast.ai

1. **Login to Vast.ai Dashboard**
   ```
   https://cloud.vast.ai/instances/
   ```

2. **Find Your Running Instance**
   - Look for your instance in the "Instances" list
   - It should show status: "Running" (green)

3. **Click "Connect" or SSH Icon**
   - You'll see SSH connection details like:
   ```
   ssh -p 12345 root@ssh.vast.ai -L 8080:localhost:8080
   ```
   
   **OR** it might show:
   ```
   ssh -p 12345 root@185.123.45.67
   ```

### 2️⃣ Copy Your SSH Command

**Example formats you might see:**

**Format A (SSH Proxy):**
```bash
ssh -p 12345 root@ssh.vast.ai -L 8000:localhost:8000
```

**Format B (Direct IP):**
```bash
ssh -p 12345 root@185.123.45.67
```

**What the parts mean:**
- `-p 12345` = Port number (yours will be different)
- `root` = Username (usually "root")
- `ssh.vast.ai` OR `IP address` = Host
- `-L 8000:localhost:8000` = Port forwarding (optional, for local access)

---

## 🖥️ Connect from macOS Terminal

### Method 1: Direct Connection (Recommended)

1. **Open Terminal** (Cmd + Space, type "Terminal")

2. **Paste your SSH command from Vast.ai:**
   ```bash
   ssh -p YOUR_PORT root@YOUR_HOST
   ```

3. **First-time connection warning:**
   ```
   The authenticity of host '[ssh.vast.ai]:12345' can't be established.
   ECDSA key fingerprint is SHA256:xxxxxxxxxxxxx
   Are you sure you want to continue connecting (yes/no)?
   ```
   
   **Type:** `yes` and press Enter

4. **Enter password** (if prompted)
   - Vast.ai usually uses SSH keys, but if asked for password, check your Vast.ai dashboard

5. **You're connected!** You should see:
   ```
   root@vast-instance:~#
   ```

### Method 2: With Port Forwarding (For Local Access to Hallo3)

This allows you to access `http://localhost:8000` from your Mac instead of using the public IP.

```bash
ssh -p YOUR_PORT root@YOUR_HOST -L 8000:localhost:8000
```

**Example:**
```bash
ssh -p 12345 root@ssh.vast.ai -L 8000:localhost:8000
```

Then in your `.env`:
```bash
HALLO3_URL=http://localhost:8000
```

---

## 🛠️ Troubleshooting SSH Connection Issues

### Issue 1: "Connection refused"

**Cause:** Instance might not be running or port is wrong

**Solution:**
```bash
# 1. Check instance status on Vast.ai dashboard
# 2. Verify the port number is correct
# 3. Try restarting the instance
```

### Issue 2: "Permission denied (publickey)"

**Cause:** SSH key not configured

**Solution A - Generate and Upload SSH Key:**
```bash
# 1. Generate SSH key on your Mac (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location: ~/.ssh/id_ed25519
# Optional: Enter passphrase or leave empty

# 2. Copy your public key
cat ~/.ssh/id_ed25519.pub

# 3. Go to Vast.ai → Account → SSH Keys
# 4. Click "Add SSH Key"
# 5. Paste the public key
# 6. Restart your instance
```

**Solution B - Use Password Authentication:**
```bash
# Some Vast.ai instances allow password
ssh -p YOUR_PORT root@YOUR_HOST -o PreferredAuthentications=password
```

### Issue 3: "ssh: connect to host ssh.vast.ai port 12345: Operation timed out"

**Cause:** Firewall or network blocking SSH

**Solution:**
```bash
# 1. Check your firewall settings (System Settings → Network → Firewall)
# 2. Try from a different network (mobile hotspot)
# 3. Contact Vast.ai support
```

### Issue 4: "Host key verification failed"

**Cause:** Instance was restarted and has new host key

**Solution:**
```bash
# Remove old host key
ssh-keygen -R "[ssh.vast.ai]:12345"

# Or if using direct IP:
ssh-keygen -R "[185.123.45.67]:12345"

# Then try connecting again
```

---

## 🚀 After Successful Connection

### Quick Test Commands

```bash
# 1. Check you're connected
whoami
# Should show: root

# 2. Check GPU availability
nvidia-smi
# Should show GPU details

# 3. Check disk space
df -h

# 4. Check running processes
ps aux | grep python
```

---

## 🎬 Setup Hallo3 Server

### Option 1: Use the Automated Setup Script

```bash
# 1. While connected via SSH, create the setup file
cd /workspace
nano setup.sh

# 2. Paste the contents from 'vast-ai-setup.sh' file
# (The one in your project root)

# 3. Save and exit (Ctrl+X, Y, Enter)

# 4. Make executable and run
chmod +x setup.sh
./setup.sh

# Script will:
# - Install dependencies
# - Clone Hallo3
# - Download models
# - Start Flask server
# - Show your HALLO3_URL at the end
```

### Option 2: Manual Setup

```bash
# 1. Check if Python is installed
python --version

# 2. Clone Hallo3 (if not already done)
cd /workspace
git clone https://github.com/fudan-generative-vision/hallo3.git
cd hallo3

# 3. Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install flask

# 4. Check if requirements.txt exists
ls -la | grep requirements

# 5. Install if exists
pip install -r requirements.txt

# 6. Download models (10-20 GB, takes time)
pip install "huggingface_hub[cli]"
huggingface-cli download fudan-generative-ai/hallo3 --local-dir ./pretrained_models

# 7. Create Flask server
nano app.py
# Paste contents from 'vast-ai-hallo3-server.py'
# Save: Ctrl+X, Y, Enter

# 8. Start server
python app.py
# Or run in background:
nohup python app.py > server.log 2>&1 &

# 9. Check if server is running
curl http://localhost:8000/health
```

---

## 🌐 Get Your HALLO3_URL

### Method 1: Using Port Forwarding (Recommended for Development)

**If you connected with:**
```bash
ssh -p 12345 root@ssh.vast.ai -L 8000:localhost:8000
```

**Then use in `.env`:**
```bash
HALLO3_URL=http://localhost:8000
```

**Pros:** Secure, no need for public IP
**Cons:** Only works while SSH connection is active

### Method 2: Using Public IP (Recommended for Production)

**While connected via SSH:**
```bash
# Get public IP
curl ifconfig.me
# Output: 185.123.45.67
```

**Then use in `.env`:**
```bash
HALLO3_URL=http://185.123.45.67:8000
```

**Pros:** Works from anywhere, persistent
**Cons:** Exposed to internet (ensure firewall rules)

### Method 3: Using Vast.ai Hostname

**Check your instance details on Vast.ai dashboard:**
```
Instance IP: 185.123.45.67
SSH: ssh -p 12345 root@ssh.vast.ai
```

**Use the IP from dashboard:**
```bash
HALLO3_URL=http://185.123.45.67:8000
```

---

## ✅ Verify Everything Works

### Test 1: Health Check (from SSH)
```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "device": "cuda",
  "cuda_available": true,
  "gpu_name": "NVIDIA GeForce RTX 3090"
}
```

### Test 2: Health Check (from your Mac)

**If using port forwarding:**
```bash
curl http://localhost:8000/health
```

**If using public IP:**
```bash
curl http://185.123.45.67:8000/health
```

### Test 3: Generate Test Video (from SSH)

```bash
# Create test files
cd /workspace
wget https://via.placeholder.com/512 -O test.jpg
# Or use any image on the server

# Test generation (this will fail without actual Hallo3 setup, but tests the endpoint)
curl -X POST http://localhost:8000/generate \
  -F "image=@test.jpg" \
  -F "audio=@test.mp3" \
  -o output.mp4
```

---

## 📋 Common Vast.ai SSH Commands Cheat Sheet

```bash
# Connect to instance
ssh -p PORT root@HOST

# Connect with port forwarding
ssh -p PORT root@HOST -L 8000:localhost:8000

# Copy file TO instance
scp -P PORT /local/file.py root@HOST:/workspace/

# Copy file FROM instance
scp -P PORT root@HOST:/workspace/file.mp4 ~/Downloads/

# Keep SSH connection alive (in ~/.ssh/config)
cat >> ~/.ssh/config << EOF
Host vast
    HostName ssh.vast.ai
    User root
    Port YOUR_PORT
    ServerAliveInterval 60
    ServerAliveCountMax 120
EOF

# Then connect with:
ssh vast

# Disconnect (but keep server running)
exit

# Or: Ctrl+D
```

---

## 🔧 macOS SSH Configuration (Optional)

Create a config file for easier connections:

```bash
# Edit SSH config
nano ~/.ssh/config

# Add this:
Host vast-ai
    HostName ssh.vast.ai
    User root
    Port YOUR_PORT
    LocalForward 8000 localhost:8000
    ServerAliveInterval 60
    ServerAliveCountMax 120

# Save: Ctrl+X, Y, Enter

# Now connect with just:
ssh vast-ai
```

---

## 🆘 Still Can't Connect? Quick Checklist

- [ ] Instance is "Running" (green) on Vast.ai dashboard
- [ ] SSH port number is correct (check dashboard)
- [ ] Using correct hostname (ssh.vast.ai or direct IP)
- [ ] SSH key uploaded to Vast.ai account
- [ ] No firewall blocking port on your Mac
- [ ] Terminal has network access
- [ ] Vast.ai account has funds/credits
- [ ] Instance hasn't timed out (check running time)

---

## 📞 Get Help

**Vast.ai Support:**
- Discord: https://discord.gg/vast-ai
- Email: support@vast.ai
- Docs: https://vast.ai/docs/

**Check Server Logs:**
```bash
# If Flask server was started with nohup
tail -f /workspace/hallo3/server.log

# Check Python processes
ps aux | grep python

# Kill stuck processes
pkill -f python
```

---

## 🎯 Summary - Quick Start

**3 Simple Steps:**

1. **Get SSH command from Vast.ai dashboard**
   ```
   https://cloud.vast.ai/instances/
   ```

2. **Connect from Mac Terminal**
   ```bash
   ssh -p YOUR_PORT root@YOUR_HOST -L 8000:localhost:8000
   ```

3. **Get IP and update .env**
   ```bash
   # On SSH:
   curl ifconfig.me
   
   # On Mac, update .env:
   HALLO3_URL=http://YOUR_IP:8000
   ```

Done! 🎉

---

**Need to start the Flask server?**
```bash
cd /workspace/hallo3
nohup python app.py > server.log 2>&1 &
```

**Check if it's running:**
```bash
curl http://localhost:8000/health
```

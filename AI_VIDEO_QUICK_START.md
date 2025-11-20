# AI Video Generation - Quick Reference

## 🚀 Quick Start (5 Steps)

### 1️⃣ Get Your Vast.ai Instance URL

```bash
# SSH into your Vast.ai instance
ssh -p <PORT> root@<YOUR_VAST_IP>

# Check if server is running
ps aux | grep python
netstat -tlnp | grep 8000

# Get your public IP
curl ifconfig.me
# Output: 185.123.45.67 (example)
```

### 2️⃣ Update .env File

```bash
# Replace with your actual IP from Step 1
HALLO3_URL=http://185.123.45.67:8000
```

### 3️⃣ Test Connection

```bash
# From your local machine
curl http://185.123.45.67:8000/health

# Should return:
# {"status":"healthy","device":"cuda","cuda_available":true,...}
```

### 4️⃣ Deploy Component

Add to any product page (admin/owner only):

```tsx
import ProductVideoGenerator from '@/components/ProductVideoGenerator';

<ProductVideoGenerator 
  productId={product.id} 
  imageUrl={product.links_to_image}
  productName={product.name}
  productDescription={product.description}
/>
```

### 5️⃣ Generate Video

1. Click "🎬 Generate AI Talking Video" button
2. Wait 30-60 seconds
3. Video appears with download option
4. Stored in R2: `{org_id}/videos/ai-generated/{filename}.mp4`

---

## 🔧 Vast.ai Setup (First Time Only)

### Option A: Use Provided Setup Script

```bash
# 1. Copy script to Vast.ai instance
scp -P <PORT> vast-ai-setup.sh root@<IP>:/workspace/

# 2. SSH and run
ssh -p <PORT> root@<IP>
cd /workspace
chmod +x vast-ai-setup.sh
./vast-ai-setup.sh

# Script will output your HALLO3_URL at the end
```

### Option B: Manual Setup

```bash
# SSH into instance
ssh -p <PORT> root@<IP>

# Install dependencies
apt update && apt install -y git wget python3-pip

# Clone Hallo3
git clone https://github.com/fudan-generative-vision/hallo3.git
cd hallo3

# Install requirements
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
pip install flask

# Download models
huggingface-cli download fudan-generative-ai/hallo3 --local-dir ./pretrained_models

# Copy Flask server
# (Use provided vast-ai-hallo3-server.py)

# Start server
nohup python app.py > server.log 2>&1 &
```

---

## 🐛 Troubleshooting

### "Connection refused"
```bash
# Check if Flask is running
ps aux | grep python

# Check logs
tail -f /workspace/hallo3/server.log

# Restart server
cd /workspace/hallo3
nohup python app.py > server.log 2>&1 &
```

### "GPU failed" or "Timeout"
```bash
# Check GPU availability
nvidia-smi

# Check CUDA in Python
python -c "import torch; print(torch.cuda.is_available())"

# Upgrade to larger GPU on Vast.ai
# Recommended: RTX 3090 (24GB) or RTX 4090 (24GB)
```

### "Admin access required"
```sql
-- Update user role in Supabase
UPDATE profiles 
SET role = 'admin' 
WHERE id = '<your-user-id>';
```

---

## 📊 File Structure

```
move-plan-next/
├── .env                                    # ← ADD HALLO3_URL HERE
├── src/
│   ├── components/
│   │   └── ProductVideoGenerator.tsx      # ✅ Frontend component
│   ├── app/api/
│   │   └── generate-video/
│   │       └── route.ts                   # ✅ API endpoint
│   └── lib/
│       └── r2.ts                          # ✅ R2 upload helper
├── AI_VIDEO_GENERATION_SETUP.md           # 📚 Full documentation
├── vast-ai-hallo3-server.py               # 🖥️ Flask server
└── vast-ai-setup.sh                       # 🚀 Auto setup script
```

---

## 💡 Tips

1. **Use SSH Tunnel for Security**:
   ```bash
   ssh -p <PORT> root@<IP> -L 8000:localhost:8000
   # Then use: HALLO3_URL=http://localhost:8000
   ```

2. **Monitor GPU Usage**:
   ```bash
   watch -n 1 nvidia-smi
   ```

3. **Check API Logs**:
   ```bash
   # Production (Vercel)
   vercel logs --follow
   
   # Development
   npm run dev
   # Look for [generate-video] logs
   ```

4. **Cost Optimization**:
   - Pause Vast.ai instance when not in use
   - Use "On-demand" instead of "Interruptible" for reliability
   - RTX 3090: ~$0.20-0.40/hour = ~$3-6/month for 10 videos/day

---

## 🎯 Production Checklist

- [ ] Vast.ai instance running with public IP
- [ ] Flask server accessible at `:8000/health`
- [ ] `HALLO3_URL` in `.env` (local)
- [ ] `HALLO3_URL` in Vercel environment variables
- [ ] Test generation with sample product
- [ ] Verify R2 storage in organization folder
- [ ] Check video playback in browser
- [ ] Set up monitoring/alerts for GPU downtime

---

## 📞 Support

**Files Created**:
- ✅ `/src/app/api/generate-video/route.ts` - API endpoint
- ✅ `/src/components/ProductVideoGenerator.tsx` - UI component
- ✅ `/src/lib/r2.ts` - Added `uploadToR2Generic()`
- ✅ `AI_VIDEO_GENERATION_SETUP.md` - Full docs
- ✅ `vast-ai-hallo3-server.py` - Flask server
- ✅ `vast-ai-setup.sh` - Auto setup script

**Next**: Get your Vast.ai instance IP and update `HALLO3_URL`!

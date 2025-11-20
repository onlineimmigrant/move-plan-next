# AI Video Generation with Hallo3 - Complete Setup Guide

## 🎯 Overview

This system generates AI talking videos from product images using:
- **Hallo3** (AI video generation on Vast.ai GPU)
- **Edge-TTS** (Free text-to-speech)
- **Cloudflare R2** (Video storage with org isolation)
- **Next.js API Routes** (Orchestration)

## 📋 System Architecture

```
User uploads image → Edge-TTS generates audio → Hallo3 creates video → R2 stores → User downloads
                          ↓
                   [Product Image]
                          ↓
              ┌─────────────────────┐
              │  ProductVideoGen    │  (Frontend Component)
              └──────────┬──────────┘
                         │
                         ↓
              ┌─────────────────────┐
              │ /api/generate-video │  (API Route)
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓               ↓
    [Edge-TTS]      [Hallo3 GPU]     [R2 Storage]
    (Audio)         (Video Gen)     (Org-scoped)
```

## 🚀 Current Implementation Status

### ✅ Completed
1. **R2 Integration** (`/src/lib/r2.ts`)
   - `uploadToR2Generic()` - Generic upload with org isolation
   - Organization-scoped storage: `{org_id}/videos/ai-generated/{filename}.mp4`
   - Reuses existing `product-videos` bucket

2. **API Route** (`/src/app/api/generate-video/route.ts`)
   - User authentication & authorization (admin/owner only)
   - TTS audio generation via Edge-TTS
   - Hallo3 GPU integration
   - R2 upload with error handling
   - 2-minute timeout for GPU processing

3. **Frontend Component** (`/src/components/ProductVideoGenerator.tsx`)
   - Custom script input (max 500 chars)
   - Auto-generated scripts from product description
   - Progress indicators
   - Error handling
   - Video preview & download

### ⚠️ Pending: Vast.ai GPU Connection

## 🖥️ Vast.ai GPU Setup - CRITICAL STEPS

### Current Status
Your Vast.ai instance is running with this script. **However**, you need to get the correct connection URL.

### How to Get Your HALLO3_URL

#### Option 1: SSH Tunnel (Recommended - More Secure)
```bash
# 1. Get SSH connection from Vast.ai dashboard
ssh -p <PORT> root@<INSTANCE_IP> -L 8000:localhost:8000

# 2. In .env, use:
HALLO3_URL=http://localhost:8000
```

#### Option 2: Direct HTTP Connection
```bash
# 1. Go to https://cloud.vast.ai/instances/
# 2. Find your running instance
# 3. Look for "Public IP Address" or "SSH Connection"
# 4. Format: http://<PUBLIC_IP>:8000

# Example .env:
HALLO3_URL=http://185.123.45.67:8000
```

#### Option 3: Check Instance Logs
```bash
# SSH into your Vast.ai instance
ssh -p <PORT> root@<INSTANCE_IP>

# Check if Flask server is running
ps aux | grep python
netstat -tlnp | grep 8000

# Test locally
curl http://localhost:8000/generate -X POST -F "image=@test.jpg" -F "audio=@test.mp3"
```

### Verify Hallo3 is Working

```bash
# From your local machine
curl -X POST http://<YOUR_VAST_IP>:8000/generate \
  -F "image=@/path/to/test-image.jpg" \
  -F "audio=@/path/to/test-audio.mp3" \
  -o test-output.mp4

# Should return a .mp4 file
```

### Troubleshooting Vast.ai Connection

#### Issue: "Connection Refused"
**Cause**: Port 8000 not exposed or firewall blocking

**Solution**:
```bash
# SSH into instance
ssh -p <PORT> root@<INSTANCE_IP>

# Check if app is running
ps aux | grep python
lsof -i :8000

# Restart Flask server with correct host binding
cd /workspace/hallo3
nohup python app.py &

# Verify app.run has host="0.0.0.0"
```

#### Issue: "Timeout after 2 minutes"
**Cause**: GPU processing takes too long or instance underpowered

**Solution**:
- Choose GPU with at least 24GB VRAM (RTX 3090, RTX 4090, or A6000)
- Check Vast.ai instance isn't overloaded
- Consider increasing timeout in `/api/generate-video/route.ts`

#### Issue: "CUDA Out of Memory"
**Cause**: GPU RAM insufficient

**Solution**:
- Upgrade to larger GPU on Vast.ai
- Reduce batch size in Hallo3 config
- Downscale input image resolution

## 🔧 Environment Variables

### Required in `.env`:

```bash
# Existing Cloudflare R2 Config (already set)
CLOUDFLARE_API_TOKEN=4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g
R2_ACCOUNT_ID=148ea28e9ba5c752eb75dc3225df2e2c
R2_BUCKET_NAME=product-videos
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-6891bafd3bd54c36b02da71be2099135.r2.dev

# NEW: Hallo3 GPU Server URL (UPDATE THIS!)
# Get from: https://cloud.vast.ai/instances/
HALLO3_URL=http://YOUR-INSTANCE-IP:8000
```

## 📝 Usage Example

### In Product Page (Admin/Owner Only)

```tsx
// src/app/products/[id]/page.tsx
import ProductVideoGenerator from '@/components/ProductVideoGenerator';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  
  return (
    <div>
      {/* Product details... */}
      
      {/* AI Video Generator (only for admins) */}
      <ProductVideoGenerator 
        productId={product.id} 
        imageUrl={product.links_to_image}
        productName={product.name}
        productDescription={product.description}
      />
    </div>
  );
}
```

### Generated Video Storage Structure

```
R2 Bucket: product-videos
├── {org_id}/
│   └── videos/
│       └── ai-generated/
│           ├── product-abc123-xyz789.mp4
│           ├── product-def456-uvw123.mp4
│           └── ...
```

### API Response

```json
{
  "success": true,
  "videoUrl": "https://pub-6891bafd3bd54c36b02da71be2099135.r2.dev/{org_id}/videos/ai-generated/product-abc-xyz.mp4",
  "fileName": "product-abc-xyz.mp4",
  "size": 2457600,
  "organizationId": "de0d5c21-787f-49c2-a665-7ff8e599c891"
}
```

## 🔐 Security & Permissions

### Access Control
- **Required Role**: `admin` or `owner` (from profiles table)
- **Authentication**: Supabase JWT via `Authorization: Bearer {token}`
- **Organization Isolation**: Videos scoped by `organization_id`

### Rate Limiting Recommendations
```typescript
// Consider adding rate limiting in route.ts:
// - Max 10 videos/hour per user
// - Max 100 videos/day per organization
// - Queue system for concurrent requests
```

## 💰 Cost Considerations

### Vast.ai GPU Costs
- **RTX 3090 (24GB)**: ~$0.20-0.40/hour
- **RTX 4090 (24GB)**: ~$0.40-0.60/hour
- **A6000 (48GB)**: ~$0.60-1.00/hour

**Monthly estimate** (10 videos/day, 2 min/video):
- Daily: 20 minutes GPU = ~$0.10-0.20
- Monthly: ~$3-6

### R2 Storage Costs
- **Storage**: $0.015/GB/month
- **Egress**: Free (first 10GB), then $0.36/GB
- **Operations**: Class B (writes) $0.36/million

**Monthly estimate** (300 videos, 2MB each):
- Storage: 600MB = ~$0.01/month
- Egress: Negligible with CDN caching

## 🚦 Next Steps

### Immediate Actions Required:

1. **Get Vast.ai URL** ⚡ CRITICAL
   ```bash
   # Go to: https://cloud.vast.ai/instances/
   # Copy your instance's public IP
   # Update .env: HALLO3_URL=http://<IP>:8000
   ```

2. **Test Hallo3 Endpoint**
   ```bash
   curl http://<YOUR_IP>:8000/generate \
     -X POST \
     -F "image=@test.jpg" \
     -F "audio=@test.mp3"
   ```

3. **Deploy to Vercel** (if not already)
   - Add `HALLO3_URL` to Vercel environment variables
   - Restart deployment

### Optional Enhancements:

1. **Queue System** - Use BullMQ or Inngest for background processing
2. **Webhook Notifications** - Alert when video generation completes
3. **Video Gallery** - Browse all AI-generated videos per organization
4. **Batch Generation** - Generate videos for multiple products at once
5. **Custom Avatars** - Allow users to upload custom talking head images
6. **Voice Selection** - Add dropdown for different TTS voices

## 📊 Monitoring & Debugging

### Check API Logs
```bash
# Vercel logs (production)
vercel logs

# Local development
# Check console for [generate-video] prefixed logs
```

### Test Flow Manually

```bash
# 1. Test TTS
curl -X POST https://edge-tts.vercel.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"en-US-AriaNeural"}'

# 2. Test Hallo3
curl -X POST http://<YOUR_IP>:8000/generate \
  -F "image=@image.jpg" \
  -F "audio=@audio.mp3" \
  -o output.mp4

# 3. Test full API (requires auth token)
curl -X POST http://localhost:3000/api/generate-video \
  -H "Authorization: Bearer <TOKEN>" \
  -F "image=@image.jpg" \
  -F "script=Test video" \
  -F "productId=123"
```

## 🐛 Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Unauthorized" | Missing/invalid auth token | Check Supabase session in frontend |
| "Admin access required" | User not admin/owner | Verify `profiles.role` |
| "Organization not found" | Missing org_id in profile | Check user profile setup |
| "GPU failed" | Hallo3 server down/wrong URL | Verify HALLO3_URL and instance status |
| "Timeout" | GPU processing too slow | Increase timeout or upgrade GPU |
| "Failed to upload to R2" | Invalid R2 credentials | Check CLOUDFLARE_API_TOKEN |

## 📚 References

- [Hallo3 GitHub](https://github.com/fudan-generative-vision/hallo3)
- [Vast.ai Documentation](https://vast.ai/docs/)
- [Edge-TTS](https://github.com/rany2/edge-tts)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

---

**Status**: ✅ Code Complete | ⚠️ Awaiting Vast.ai URL Configuration

**Last Updated**: November 19, 2025

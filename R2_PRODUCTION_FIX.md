# R2 Storage Production Deployment Guide

## Problem
- ❌ R2 images/videos not loading in production
- ❌ Error: "Failed to list images"
- ❌ CORS sync not working

## Root Cause
**Missing environment variables in Vercel production deployment**

## Solution

### Step 1: Add Environment Variables to Vercel

Go to: **Vercel Dashboard → Settings → Environment Variables**

Add these 5 variables (copy values from `.env` file):

```
CLOUDFLARE_API_TOKEN=4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g
R2_ACCOUNT_ID=148ea28e9ba5c752eb75dc3225df2e2c
R2_BUCKET_NAME=product-videos
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-6891bafd3bd54c36b02da71be2099135.r2.dev
SYNC_API_SECRET=VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4=
```

**Important:** Select **Production** environment for each variable.

### Step 2: Redeploy

After adding environment variables:
```bash
git push  # Triggers automatic deployment
```

Or manually redeploy in Vercel dashboard.

### Step 3: Verify

Run the verification script:
```bash
./check-production-env.sh
```

Expected output:
```
✅ R2 CORS API is working!
```

### Step 4: Set Up Automatic CORS Sync (Optional)

Follow instructions in: `setup-supabase-database-webhook.md`

This enables automatic CORS updates when you add new organization domains.

## Testing After Deployment

1. **Test R2 image loading:**
   - Go to: https://codedharmony.app/admin/products
   - Edit any product
   - Open "Media" tab
   - Should see R2 images listed (no errors)

2. **Test R2 video loading:**
   - Same as above, check video tab
   - Videos should load from R2 storage

3. **Test CORS sync:**
   ```bash
   curl -X GET https://codedharmony.app/api/sync-r2-cors
   ```
   Should return current CORS configuration

## Troubleshooting

### Still getting "Failed to list images"?
- Check Vercel deployment logs for errors
- Verify environment variables are set for **Production** (not Preview)
- Redeploy after adding variables

### CORS errors in browser console?
- Run manual sync: `node sync-r2-cors-now.js`
- Or use API: `curl -X POST https://codedharmony.app/api/sync-r2-cors -H "x-webhook-secret: YOUR_SECRET"`

### Videos/images not displaying?
- Check `NEXT_PUBLIC_R2_PUBLIC_URL` is set correctly
- Verify bucket name matches: `product-videos`
- Check Cloudflare R2 bucket settings

## Files Modified

- `/src/app/api/r2-videos/route.ts` - Added credential validation
- `/src/app/api/r2-images/route.ts` - Added credential validation  
- `/src/app/api/products/[id]/r2-images/route.ts` - Added credential validation
- `/src/lib/cloudflareR2.ts` - Added validation function
- `check-production-env.sh` - Verification script

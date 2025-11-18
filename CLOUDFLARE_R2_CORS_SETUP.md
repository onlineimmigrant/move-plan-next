# Cloudflare R2 CORS Configuration

## Problem
Videos stored in R2 cannot be played in the browser. Error: `MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4)

## Root Cause
The R2 bucket doesn't have CORS (Cross-Origin Resource Sharing) headers configured, so browsers block video playback.

## Solution
Configure CORS on your R2 bucket to allow video playback from your domain.

### Option 1: Using Cloudflare Dashboard (Easiest)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Click on your bucket: **product-videos**
4. Go to the **Settings** tab
5. Scroll to **CORS Policy**
6. Click **Add CORS Policy** or **Edit**
7. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://codedharmony.app",
      "https://*.codedharmony.app"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

8. Click **Save**

### Option 2: Using Wrangler CLI

If you have Wrangler installed:

```bash
# Install wrangler if needed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create a CORS configuration file
cat > r2-cors.json << 'EOF'
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://codedharmony.app",
      "https://*.codedharmony.app"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration
wrangler r2 bucket cors put product-videos --file r2-cors.json --account-id 148ea28e9ba5c752eb75dc3225df2e2c
```

### Option 3: Using Cloudflare API

```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/148ea28e9ba5c752eb75dc3225df2e2c/r2/buckets/product-videos/cors" \
  -H "Authorization: Bearer 4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g" \
  -H "Content-Type: application/json" \
  --data '[
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://codedharmony.app",
        "https://*.codedharmony.app"
      ],
      "AllowedMethods": [
        "GET",
        "HEAD"
      ],
      "AllowedHeaders": [
        "*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type"
      ],
      "MaxAgeSeconds": 3600
    }
  ]'
```

## Verify CORS is Working

After applying CORS configuration:

1. Wait 1-2 minutes for changes to propagate
2. Refresh your product page
3. Try playing an R2 video
4. Check browser console - should now show:
   - `[Video Player] Load started`
   - `[Video Player] Metadata loaded`
   - `[Video Player] Can play`
   - `[Video Player] Playing`

## Additional Notes

- **AllowedOrigins**: Add all domains where your app runs (localhost, production, staging)
- **AllowedMethods**: `GET` and `HEAD` are sufficient for video playback
- **AllowedHeaders**: `*` allows all headers (can be more restrictive if needed)
- **ExposeHeaders**: These headers are needed for proper video streaming
- **MaxAgeSeconds**: How long browsers cache the CORS preflight response (3600 = 1 hour)

## Troubleshooting

If videos still don't play after CORS configuration:

1. **Check Network tab** in browser DevTools:
   - Look for the video request
   - Check Response Headers for `Access-Control-Allow-Origin`
   
2. **Clear browser cache** and hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

3. **Verify CORS with curl**:
   ```bash
   curl -I -H "Origin: http://localhost:3000" \
     "https://pub-6891bafd3bd54c36b02da71be2099135.r2.dev/6695b959-45ef-44b4-a68c-9cd0fe0e25a3/videos/QOx84LIFM4kZQDOoHKpW6.mp4"
   ```
   
   Should see: `Access-Control-Allow-Origin: http://localhost:3000` in response headers

## Production Deployment

When deploying to production, make sure to:
1. Add your production domain to `AllowedOrigins`
2. Update CORS configuration to include all domains
3. Consider using environment variables for domain configuration

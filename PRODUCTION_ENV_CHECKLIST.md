# Production Environment Variables Checklist

## Required for R2 CORS Auto-Sync

Make sure these environment variables are set in **Vercel → Settings → Environment Variables** (Production):

### Cloudflare R2 Configuration
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with R2 permissions
- `R2_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_BUCKET_NAME` - Name of your R2 bucket (e.g., "product-videos")

### CORS Sync Authentication
- `SYNC_API_SECRET` - Secret for webhook authentication (should match the one in Supabase webhook)

## How to Check in Vercel

1. Go to https://vercel.com/your-project/settings/environment-variables
2. Verify all 4 variables above are set for **Production** environment
3. If missing, add them and redeploy

## How to Test

After setting environment variables:

```bash
# Test the sync endpoint
curl -X POST https://codedharmony.app/api/sync-r2-cors \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SYNC_API_SECRET" \
  -d '{"event":"test"}'

# Should return: {"success":true,"message":"R2 CORS configuration synced successfully..."}
```

## Current Status

❌ Production deployment failing - environment variables likely missing
✅ Local development working (variables in .env)

## Next Steps

1. Add missing environment variables to Vercel
2. Redeploy the application
3. Set up Supabase Database Webhook (see setup-supabase-database-webhook.md)
4. Test automatic CORS sync by updating organization domains

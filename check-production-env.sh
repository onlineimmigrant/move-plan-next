#!/bin/bash

# Check Production Environment Variables in Vercel
# Run this after deploying to verify all R2 variables are set

echo "🔍 Checking Vercel Production Environment Variables..."
echo ""

REQUIRED_VARS=(
  "CLOUDFLARE_API_TOKEN"
  "R2_ACCOUNT_ID"
  "R2_BUCKET_NAME"
  "SYNC_API_SECRET"
  "NEXT_PUBLIC_R2_PUBLIC_URL"
)

echo "Required Environment Variables for R2:"
for var in "${REQUIRED_VARS[@]}"; do
  echo "  - $var"
done

echo ""
echo "📋 To set these in Vercel:"
echo "1. Go to: https://vercel.com/[your-project]/settings/environment-variables"
echo "2. Add each variable with values from your .env file"
echo "3. Select 'Production' environment"
echo "4. Redeploy your application"
echo ""

echo "🧪 Testing production API endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://codedharmony.app/api/sync-r2-cors \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4=" \
  -d '{"event":"test"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Status Code: $HTTP_CODE"
echo "Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ R2 CORS API is working!"
else
  echo "❌ R2 CORS API failed!"
  if echo "$BODY" | grep -q "not configured"; then
    echo "   → Missing environment variables in Vercel"
    echo "   → Add them in Vercel dashboard and redeploy"
  fi
fi

echo ""
echo "📝 Next steps:"
echo "1. Add missing environment variables to Vercel"
echo "2. Redeploy the application"
echo "3. Run this script again to verify"
echo "4. Set up Supabase Database Webhook (see setup-supabase-database-webhook.md)"

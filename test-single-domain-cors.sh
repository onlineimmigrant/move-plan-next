#!/bin/bash

# Test R2 CORS with single domain
# This tests if the Cloudflare API accepts a minimal CORS configuration

ACCOUNT_ID="148ea28e9ba5c752eb75dc3225df2e2c"
BUCKET_NAME="product-videos"
API_TOKEN="4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g"

echo "======================================"
echo "Testing R2 CORS with Single Domain"
echo "======================================"
echo ""
echo "Domain: montchain.tech"
echo "Bucket: $BUCKET_NAME"
echo ""

# Test with minimal CORS configuration
response=$(curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/cors" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '[
    {
      "AllowedOrigins": [
        "https://montchain.tech"
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
  ]')

# Check result
if echo "$response" | grep -q '"success":true'; then
  echo "✅ SUCCESS! CORS configured for montchain.tech"
  echo ""
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  echo ""
  echo "Next steps:"
  echo "1. Wait 1-2 minutes for changes to propagate"
  echo "2. Test video playback on montchain.tech"
  echo "3. If successful, we can add more domains"
else
  echo "❌ Failed to configure CORS"
  echo ""
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  echo ""
  echo "This might indicate an API change or authentication issue"
fi

#!/bin/bash

# Script to configure CORS on Cloudflare R2 bucket
# This allows browsers to play videos from the R2 bucket

ACCOUNT_ID="148ea28e9ba5c752eb75dc3225df2e2c"
BUCKET_NAME="product-videos"
API_TOKEN="4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g"

echo "Configuring CORS for R2 bucket: $BUCKET_NAME"
echo ""

# Configure CORS
response=$(curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/cors" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '[
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://codedharmony.app",
        "https://*.codedharmony.app",
        "https://metexam.com",
        "https://*.metexam.com"
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
        "Content-Type",
        "Content-Range",
        "Accept-Ranges"
      ],
      "MaxAgeSeconds": 3600
    }
  ]')

# Check if successful
if echo "$response" | grep -q '"success":true'; then
  echo "✅ CORS configuration applied successfully!"
  echo ""
  echo "CORS Policy:"
  echo "  - Allowed Origins: localhost:3000, codedharmony.app, metexam.com (+ subdomains)"
  echo "  - Allowed Methods: GET, HEAD"
  echo "  - Cache Duration: 1 hour"
  echo ""
  echo "Wait 1-2 minutes for changes to propagate, then refresh your product page."
  echo "Videos should now play without CORS errors."
else
  echo "❌ Failed to configure CORS"
  echo ""
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  echo ""
  echo "Please try configuring CORS manually via Cloudflare Dashboard:"
  echo "https://dash.cloudflare.com/ → R2 → product-videos → Settings → CORS Policy"
fi

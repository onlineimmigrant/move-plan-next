#!/bin/bash

# Clear all CORS rules from R2 bucket
ACCOUNT_ID="148ea28e9ba5c752eb75dc3225df2e2c"
BUCKET_NAME="product-videos"
API_TOKEN="4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g"

echo "======================================"
echo "Clearing R2 CORS Configuration"
echo "======================================"
echo ""

# Delete CORS configuration
response=$(curl -s -X DELETE \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/cors" \
  -H "Authorization: Bearer $API_TOKEN")

if echo "$response" | grep -q '"success":true'; then
  echo "✅ SUCCESS! CORS configuration deleted"
  echo ""
  echo "$response" | jq .
  echo ""
  echo "All CORS rules have been removed from bucket: $BUCKET_NAME"
else
  echo "❌ Failed to delete CORS"
  echo ""
  echo "$response" | jq .
fi

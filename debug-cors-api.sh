#!/bin/bash

# Debug R2 CORS API call
ACCOUNT_ID="148ea28e9ba5c752eb75dc3225df2e2c"
BUCKET_NAME="product-videos"
API_TOKEN="4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g"

echo "Testing different CORS payloads..."
echo ""

# Test 1: Absolute minimal
echo "Test 1: Minimal payload"
curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/cors" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"AllowedOrigins":["https://montchain.tech"],"AllowedMethods":["GET"]}]' \
  | jq .

echo ""
echo "Test 2: With MaxAgeSeconds"
curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/cors" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"AllowedOrigins":["https://montchain.tech"],"AllowedMethods":["GET"],"MaxAgeSeconds":3600}]' \
  | jq .

echo ""
echo "Test 3: GET current CORS config"
curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/cors" \
  -H "Authorization: Bearer $API_TOKEN" \
  | jq .

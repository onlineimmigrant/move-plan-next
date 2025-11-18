#!/bin/bash

# Set CORS for montchain.tech using correct API format
ACCOUNT_ID="148ea28e9ba5c752eb75dc3225df2e2c"
BUCKET_NAME="product-videos"
API_TOKEN="4EcATZ-xSB42joRPEbn_3gXbVjISjkTEb-ZG9r5g"

echo "======================================"
echo "Adding montchain.tech to R2 CORS"
echo "======================================"
echo ""

# Include all existing domains PLUS montchain.tech
response=$(curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/cors" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "allowed": {
          "origins": [
            "http://localhost:3000",
            "https://codedharmony.app",
            "https://metexam.co.uk",
            "https://lekcie.org",
            "https://onlineimmigrant.com",
            "https://getmespace.com",
            "https://codedharmany-move-plan-next.vercel.app",
            "https://montchain.tech"
          ],
          "methods": ["GET", "HEAD", "PUT", "POST", "DELETE"]
        }
      }
    ]
  }')

if echo "$response" | grep -q '"success":true'; then
  echo "✅ SUCCESS! CORS configured with all domains"
  echo ""
  echo "$response" | jq .
  echo ""
  echo "Domains configured:"
  echo "  - http://localhost:3000"
  echo "  - https://codedharmony.app"
  echo "  - https://metexam.co.uk"
  echo "  - https://lekcie.org"
  echo "  - https://onlineimmigrant.com"
  echo "  - https://getmespace.com"
  echo "  - https://codedharmany-move-plan-next.vercel.app"
  echo "  - https://montchain.tech (NEW)"
  echo ""
  echo "Wait 1-2 minutes for propagation"
else
  echo "❌ Failed"
  echo ""
  echo "$response" | jq .
fi

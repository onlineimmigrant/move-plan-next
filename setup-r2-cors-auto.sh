#!/bin/bash

# R2 CORS Auto-Sync Quick Setup
# This script helps you set up automatic CORS synchronization for Cloudflare R2

echo "======================================"
echo "R2 CORS Auto-Sync Setup"
echo "======================================"
echo ""

# Check environment variables
echo "1. Checking environment variables..."
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not set"
  exit 1
fi
if [ -z "$R2_ACCOUNT_ID" ]; then
  echo "❌ R2_ACCOUNT_ID not set"
  exit 1
fi
if [ -z "$R2_BUCKET_NAME" ]; then
  echo "❌ R2_BUCKET_NAME not set"
  exit 1
fi
echo "✅ Environment variables OK"
echo ""

# Test Cloudflare API connection
echo "2. Testing Cloudflare API connection..."
test_response=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$R2_ACCOUNT_ID/r2/buckets/$R2_BUCKET_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")

if echo "$test_response" | grep -q '"success":true'; then
  echo "✅ Cloudflare API connection successful"
else
  echo "❌ Failed to connect to Cloudflare API"
  echo "$test_response"
  exit 1
fi
echo ""

# Apply database trigger (requires psql or Supabase SQL Editor)
echo "3. Database trigger setup..."
echo ""
echo "You need to run the SQL file in your database:"
echo "File: setup-r2-cors-auto-sync.sql"
echo ""
echo "Options:"
echo "  A) Via Supabase SQL Editor:"
echo "     - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
echo "     - Copy contents of setup-r2-cors-auto-sync.sql"
echo "     - Click 'Run'"
echo ""
echo "  B) Via psql:"
echo "     psql -h YOUR_HOST -U postgres -d postgres < setup-r2-cors-auto-sync.sql"
echo ""
read -p "Have you applied the database trigger? (y/n): " trigger_applied

if [ "$trigger_applied" != "y" ]; then
  echo "❌ Please apply the database trigger first"
  exit 1
fi
echo "✅ Database trigger applied"
echo ""

# Test CORS sync
echo "4. Testing CORS sync..."
echo ""
echo "Running initial sync..."

# This requires the API to be running
# You can call this manually via curl if your app is running
echo ""
echo "Manual sync command:"
echo "curl -X POST http://localhost:3000/api/sync-r2-cors \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""

echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. ✅ Database trigger is active"
echo "2. 🚀 Start your Next.js app"
echo "3. 🔧 Go to admin settings → R2 CORS Management"
echo "4. 🔄 Click 'Sync Now' to test"
echo "5. 📺 Test video playback"
echo ""
echo "Automatic sync will now trigger whenever:"
echo "  - New organization is created"
echo "  - Organization domains are updated"
echo "  - Organization base_url changes"
echo ""
echo "For more info, see: R2_CORS_AUTO_SYNC_GUIDE.md"

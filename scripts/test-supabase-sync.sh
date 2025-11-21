#!/bin/bash

# Test script to verify Supabase redirect URL sync setup
# Usage: ./test-supabase-sync.sh

echo "🧪 Testing Supabase Redirect URL Sync Setup"
echo "==========================================="
echo ""

# Check environment variables
echo "1️⃣  Checking environment variables..."
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "   ⚠️  SUPABASE_ACCESS_TOKEN not set"
  echo "   💡 Add to .env: SUPABASE_ACCESS_TOKEN=your_token"
else
  echo "   ✅ SUPABASE_ACCESS_TOKEN is set"
fi

if [ -z "$SYNC_API_SECRET" ]; then
  echo "   ⚠️  SYNC_API_SECRET not set"
  echo "   💡 Using default from .env file"
else
  echo "   ✅ SYNC_API_SECRET is set"
fi

echo ""

# Test GET endpoint (view current URLs)
echo "2️⃣  Testing GET /api/sync-supabase-redirects..."
RESPONSE=$(curl -s "http://localhost:3000/api/sync-supabase-redirects" 2>&1)
if [ $? -eq 0 ]; then
  echo "$RESPONSE" | jq '.' 2>/dev/null
  if [ $? -eq 0 ]; then
    COUNT=$(echo "$RESPONSE" | jq -r '.count' 2>/dev/null)
    echo "   ✅ API responding - $COUNT redirect URLs configured"
  else
    echo "   ⚠️  API returned non-JSON response"
    echo "$RESPONSE"
  fi
else
  echo "   ❌ Failed to connect to API"
  echo "   💡 Make sure your dev server is running: npm run dev"
fi

echo ""

# Test database query
echo "3️⃣  Testing database query..."
echo "   Run this SQL in Supabase to see your organizations:"
echo ""
echo "   SELECT id, name, base_url, domains FROM organizations;"
echo ""

# Instructions
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Get Supabase Access Token:"
echo "   https://app.supabase.com/account/tokens"
echo ""
echo "2. Add to .env file:"
echo "   SUPABASE_ACCESS_TOKEN=sbp_xxx..."
echo ""
echo "3. Apply database migration:"
echo "   See: migrations/sync-supabase-redirects-trigger.sql"
echo ""
echo "4. Test the sync:"
echo "   ./scripts/sync-supabase-redirects.sh"
echo ""
echo "5. Add a test domain:"
echo "   UPDATE organizations"
echo "   SET domains = array_append(domains, 'test.example.com')"
echo "   WHERE name = 'Coded Harmony';"
echo ""

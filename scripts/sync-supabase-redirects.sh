#!/bin/bash

# Script to manually sync Supabase redirect URLs
# Usage: ./sync-supabase-redirects.sh

SYNC_API_SECRET="${SYNC_API_SECRET:-VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4=}"
API_URL="${1:-https://codedharmony.app/api/sync-supabase-redirects}"

echo "🔄 Syncing Supabase redirect URLs..."
echo "API URL: $API_URL"
echo ""

# First, get current redirect URLs
echo "📋 Current redirect URLs:"
curl -s "$API_URL" | jq '.'
echo ""
echo "---"
echo ""

# Then, trigger the sync
echo "🚀 Triggering sync..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $SYNC_API_SECRET")

echo "$RESPONSE" | jq '.'

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo ""
  echo "✅ Supabase redirect URLs synced successfully!"
  COUNT=$(echo "$RESPONSE" | jq -r '.count')
  echo "📊 Total redirect URLs configured: $COUNT"
else
  echo ""
  echo "❌ Failed to sync redirect URLs"
  ERROR=$(echo "$RESPONSE" | jq -r '.error')
  echo "Error: $ERROR"
  exit 1
fi

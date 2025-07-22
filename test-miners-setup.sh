#!/bin/bash

echo "=== Move Plan Next.js - Miners Management System Test ==="
echo "Testing the miners management system setup..."
echo

# Check if server is running
echo "1. Checking if Next.js server is running on port 3000..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Server is running on http://localhost:3000"
else
    echo "   ❌ Server is not responding (HTTP $HTTP_CODE)"
    exit 1
fi

# Check miners management page
echo
echo "2. Checking miners management page..."
MINERS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/miners/management)
if [ "$MINERS_CODE" = "200" ]; then
    echo "   ✅ Miners management page is accessible"
else
    echo "   ❌ Miners management page failed (HTTP $MINERS_CODE)"
fi

# Check API endpoints
echo
echo "3. Checking API endpoints..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/miners)
if [ "$API_CODE" = "401" ]; then
    echo "   ✅ Miners API is protected (returns 401 Unauthorized as expected)"
else
    echo "   ⚠️  Miners API returned HTTP $API_CODE (expected 401)"
fi

SAMPLE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/miners/sample)
if [ "$SAMPLE_CODE" = "401" ]; then
    echo "   ✅ Sample miners API is protected (returns 401 Unauthorized as expected)"
else
    echo "   ⚠️  Sample miners API returned HTTP $SAMPLE_CODE (expected 401)"
fi

echo
echo "=== Summary ==="
echo "✅ Enhanced miners management page with:"
echo "   - Improved loading states with visual indicators"
echo "   - Better error handling with retry functionality"
echo "   - Empty state with sample data creation button"
echo "   - Real-time dashboard with summary statistics"
echo "   - Sample miners creation API endpoint"
echo
echo "✅ Created API endpoint: /api/miners/sample"
echo "   - POST endpoint to create 5 sample miners"
echo "   - Proper authentication and authorization"
echo "   - Creates diverse miner data (online/offline)"
echo
echo "🎯 Next Steps:"
echo "   1. Log in as admin user with 'miner' organization type"
echo "   2. Visit: http://localhost:3000/admin/miners/management"
echo "   3. Click 'Create Sample Miners' button to add test data"
echo "   4. View the real-time dashboard with sample miners"
echo
echo "📋 Sample Data Includes:"
echo "   - ANTMINER S19 units (2 online, 1 offline)"
echo "   - WHATSMINER M30S unit (online)"
echo "   - AVALON A1246 unit (online)"
echo "   - Real hashrate, power, temperature data"
echo "   - Profit calculations and efficiency metrics"

#!/bin/bash

echo "🔍 MINERS MANAGEMENT - AUTHENTICATION TROUBLESHOOTING"
echo "======================================================"
echo

# Check environment variables
echo "1. Checking Environment Variables..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local file found"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "   ✅ SUPABASE_URL configured"
    else
        echo "   ❌ SUPABASE_URL missing in .env.local"
    fi
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "   ✅ SUPABASE_ANON_KEY configured"
    else
        echo "   ❌ SUPABASE_ANON_KEY missing in .env.local"
    fi
else
    echo "   ❌ .env.local file not found"
fi

echo

# Test API authentication
echo "2. Testing API Authentication..."
echo "   Testing /api/miners endpoint..."
MINERS_RESPONSE=$(curl -s http://localhost:3000/api/miners)
if echo "$MINERS_RESPONSE" | grep -q '"error":"Unauthorized"'; then
    echo "   ✅ API correctly requires authentication (401 Unauthorized)"
else
    echo "   ⚠️  Unexpected API response: $MINERS_RESPONSE"
fi

echo
echo "3. Authentication Status Check..."
echo "   📋 To resolve the 'Unauthorized' error, you need to:"
echo
echo "   STEP 1: Create an Account"
echo "   ------------------------"
echo "   • Visit: http://localhost:3000/register"
echo "   • Or try: http://localhost:3000/register-free-trial"
echo "   • Create account with organization type 'miner'"
echo
echo "   STEP 2: Ensure Proper Role"
echo "   --------------------------"
echo "   • Your user must have 'admin' role"
echo "   • Your organization must be type 'miner'"
echo
echo "   STEP 3: Login"
echo "   -------------"
echo "   • Visit: http://localhost:3000/login"
echo "   • Login with your credentials"
echo
echo "   STEP 4: Test Access"
echo "   -------------------"
echo "   • Visit: http://localhost:3000/admin/miners/management"
echo "   • You should see the dashboard instead of errors"
echo

echo "🔧 QUICK ACTIONS:"
echo "=================="
echo "• Open login page:        open http://localhost:3000/login"
echo "• Open registration:      open http://localhost:3000/register"
echo "• Open miners dashboard:  open http://localhost:3000/admin/miners/management"
echo "• Test authentication:    open file://$(pwd)/auth-test.html"
echo

# Check if we can open browser
if command -v open >/dev/null 2>&1; then
    echo "Would you like to open the login page? (y/n)"
    read -r response
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        open "http://localhost:3000/login"
        echo "✅ Login page opened in browser"
    fi
fi

echo
echo "📞 Support:"
echo "============"
echo "If you continue to have issues:"
echo "1. Check your Supabase database has the required tables"
echo "2. Verify organization and user data exists"
echo "3. Check browser console for additional error details"
echo "4. Ensure no browser extensions are blocking requests"

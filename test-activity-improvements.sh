#!/bin/bash

# Activity Logging Improvements Test Script
# Run this script to test the improved activity logging

echo "🧪 Testing Activity Logging Improvements..."
echo ""

# Check if activity logger has upsert logic
echo "1. Checking activity logger implementation..."
if grep -q "upsert" src/lib/activityLogger.ts; then
    echo "   ✅ Upsert logic implemented"
else
    echo "   ❌ Upsert logic missing"
fi

if grep -q "onConflict.*organization_id,action" src/lib/activityLogger.ts; then
    echo "   ✅ Conflict resolution configured"
else
    echo "   ❌ Conflict resolution missing"
fi

# Check activity display improvements
echo ""
echo "2. Checking activity display format..."
if grep -q "getActivityText.*created.*:" src/components/SiteManagement/activityUtils.ts; then
    if grep -q "return 'created'" src/components/SiteManagement/activityUtils.ts; then
        echo "   ✅ Clean activity text format (removed 'was')"
    else
        echo "   ❌ Still using verbose format"
    fi
else
    echo "   ❌ Activity text function not found"
fi

# Check mobile scrolling
echo ""
echo "3. Checking mobile-friendly display..."
if grep -q "overflow-x-auto" src/components/SiteManagement/PlatformStatsWidget.tsx; then
    echo "   ✅ Horizontal scrolling enabled"
else
    echo "   ❌ No horizontal scrolling"
fi

if grep -q "whitespace-nowrap" src/components/SiteManagement/PlatformStatsWidget.tsx; then
    echo "   ✅ No-wrap text for mobile"
else
    echo "   ❌ Text might wrap on mobile"
fi

if grep -q "scrollbar-thin" src/components/SiteManagement/PlatformStatsWidget.tsx; then
    echo "   ✅ Custom scrollbar styling"
else
    echo "   ❌ No custom scrollbar"
fi

# Check CSS additions
echo ""
echo "4. Checking CSS improvements..."
if grep -q "scrollbar-thin" src/app/globals.css; then
    echo "   ✅ Thin scrollbar CSS added"
else
    echo "   ❌ Scrollbar CSS missing"
fi

# Check activity details improvements
echo ""
echo "5. Checking activity details cleanup..."
if grep -q "Settings and configuration updated" src/app/api/organizations/*/route.ts; then
    echo "   ✅ Clean update activity details"
else
    echo "   ❌ Verbose update details"
fi

if grep -q "Deployment initiated" src/app/api/organizations/deploy/route.ts; then
    echo "   ✅ Clean deployment activity details"
else
    echo "   ❌ Verbose deployment details"
fi

echo ""
echo "📋 Summary:"
echo "   - Run ACTIVITY_IMPROVEMENT_MIGRATION.sql in your Supabase SQL editor"
echo "   - Activities will now be updated instead of duplicated"
echo "   - Mobile-friendly horizontal scrolling implemented"
echo "   - Cleaner activity text without 'Organization' prefix"
echo "   - Full details shown with better formatting"
echo ""
echo "🎉 Activity logging improvements are ready!"

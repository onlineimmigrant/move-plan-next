#!/bin/bash

# Simple migration runner for development
# This script connects to Supabase and runs the migration

echo "🚀 Running database migration for organization activities..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Source environment variables
source .env.local

# Check for database URL or try to use Supabase CLI
if [ -n "$SUPABASE_DATABASE_URL" ]; then
    echo "📊 Connecting to database using SUPABASE_DATABASE_URL..."
    echo "🔧 Running migration: 002_organization_activities.sql"
    psql "$SUPABASE_DATABASE_URL" -f database/migrations/002_organization_activities.sql
elif command -v supabase &> /dev/null; then
    echo "📊 Using Supabase CLI to run migration..."
    echo "🔧 Running migration: 002_organization_activities.sql"
    
    # Check if project is linked
    if [ ! -f .supabase/config.toml ]; then
        echo "⚠️  Project not linked to Supabase CLI"
        echo "To link your project, run: supabase link --project-ref $NEXT_PUBLIC_SUPABASE_PROJECT_ID"
        echo ""
        echo "Alternative: Add SUPABASE_DATABASE_URL to .env.local:"
        echo "SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.$NEXT_PUBLIC_SUPABASE_PROJECT_ID.supabase.co:5432/postgres"
        exit 1
    fi
    
    # Run migration through Supabase CLI
    supabase db reset --linked
    cat database/migrations/002_organization_activities.sql | supabase db shell
else
    echo "❌ No database connection method found"
    echo ""
    echo "Option 1: Add database URL to .env.local:"
    echo "SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.$NEXT_PUBLIC_SUPABASE_PROJECT_ID.supabase.co:5432/postgres"
    echo ""
    echo "Option 2: Install Supabase CLI and link project:"
    echo "npm install -g supabase"
    echo "supabase link --project-ref $NEXT_PUBLIC_SUPABASE_PROJECT_ID"
    echo ""
    echo "Option 3: Run SQL manually in Supabase Dashboard > SQL Editor"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "📋 The organization_activities table has been created"
    echo "🔒 Row Level Security policies have been set up"
    echo "🎯 Sample data has been inserted for testing"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

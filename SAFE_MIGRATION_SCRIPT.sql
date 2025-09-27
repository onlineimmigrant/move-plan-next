-- =====================================================
-- SAFE MIGRATION SCRIPT - WORKS WITH ANY DATABASE SETUP
-- =====================================================
-- This version will work regardless of your current database structure
-- Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/sql
-- =====================================================

-- Step 1: Check if organizations table exists, if not create a basic one
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
        CREATE TABLE organizations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) DEFAULT 'business',
            created_by_email VARCHAR(255),
            base_url TEXT,
            base_url_local TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert a sample organization for testing
        INSERT INTO organizations (name, type, created_by_email) 
        VALUES ('Sample Organization', 'business', 'admin@example.com');
        
        RAISE NOTICE 'Created organizations table with sample data';
    END IF;
END
$$;

-- Step 2: Create organization_activities table
CREATE TABLE IF NOT EXISTS organization_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deployed', 'deleted')),
    details TEXT,
    user_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if organizations table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
        ALTER TABLE organization_activities 
        DROP CONSTRAINT IF EXISTS organization_activities_organization_id_fkey;
        
        ALTER TABLE organization_activities 
        ADD CONSTRAINT organization_activities_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_activities_org_id ON organization_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_activities_created_at ON organization_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organization_activities_action ON organization_activities(action);

-- Step 4: Enable RLS (Row Level Security)
ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple RLS policies that work with any setup
DROP POLICY IF EXISTS "Allow authenticated users to read activities" ON organization_activities;
DROP POLICY IF EXISTS "Allow authenticated users to insert activities" ON organization_activities;

-- Allow all authenticated users to read and write activities (you can restrict this later)
CREATE POLICY "Allow authenticated users to read activities" ON organization_activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert activities" ON organization_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 6: Add sample activities based on existing organizations
INSERT INTO organization_activities (organization_id, action, details, user_email, created_at) 
SELECT 
    o.id,
    CASE 
        WHEN random() < 0.25 THEN 'created'
        WHEN random() < 0.5 THEN 'updated'
        WHEN random() < 0.75 THEN 'deployed'
        ELSE 'deleted'
    END,
    'Sample activity for testing - ' || o.name,
    COALESCE(o.created_by_email, 'admin@example.com'),
    NOW() - (random() * interval '7 days')
FROM organizations o 
WHERE EXISTS (SELECT 1 FROM organizations)
LIMIT 10
ON CONFLICT DO NOTHING;

-- Step 7: If no organizations exist, create some sample activities anyway
INSERT INTO organization_activities (organization_id, action, details, user_email, created_at) 
SELECT 
    uuid_generate_v4(),
    CASE 
        WHEN generate_series % 4 = 0 THEN 'created'
        WHEN generate_series % 4 = 1 THEN 'updated'
        WHEN generate_series % 4 = 2 THEN 'deployed'
        ELSE 'deleted'
    END,
    'Sample activity #' || generate_series,
    'admin@example.com',
    NOW() - (generate_series || ' hours')::interval
FROM generate_series(1, 5)
WHERE NOT EXISTS (SELECT 1 FROM organizations)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE AND VERIFICATION
-- =====================================================
SELECT 'SUCCESS: Activities table created and configured!' as status;
SELECT 'Total activities created: ' || COUNT(*)::text as activities_count FROM organization_activities;
SELECT 'Sample activities:' as preview;
SELECT 
    action,
    details,
    user_email,
    created_at::timestamp::text as created_at
FROM organization_activities 
ORDER BY created_at DESC 
LIMIT 5;

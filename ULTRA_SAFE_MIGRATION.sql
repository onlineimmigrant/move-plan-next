-- =====================================================
-- 100% SAFE MIGRATION SCRIPT - NO DESTRUCTIVE OPERATIONS
-- =====================================================
-- This version only CREATES, never DROPS or ALTERS existing data
-- Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/sql
-- =====================================================

-- Step 1: Create organization_activities table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS organization_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deployed', 'deleted')),
    details TEXT,
    user_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_organization_activities_org_id ON organization_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_activities_created_at ON organization_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organization_activities_action ON organization_activities(action);

-- Step 3: Enable RLS (Row Level Security) - safe operation
ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (only if they don't exist)
-- Note: These will only be created if they don't already exist
DO $$
BEGIN
    -- Create read policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_activities' 
        AND policyname = 'Allow authenticated users to read activities'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow authenticated users to read activities" ON organization_activities FOR SELECT USING (auth.role() = ''authenticated'')';
    END IF;
    
    -- Create insert policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_activities' 
        AND policyname = 'Allow authenticated users to insert activities'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow authenticated users to insert activities" ON organization_activities FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
    END IF;
END
$$;

-- Step 5: Add sample activities (only if table is empty)
INSERT INTO organization_activities (organization_id, action, details, user_email, created_at) 
SELECT 
    uuid_generate_v4(),
    CASE 
        WHEN generate_series % 4 = 1 THEN 'created'
        WHEN generate_series % 4 = 2 THEN 'updated'
        WHEN generate_series % 4 = 3 THEN 'deployed'
        ELSE 'deleted'
    END,
    'Sample activity #' || generate_series || ' for testing',
    'admin@example.com',
    NOW() - (generate_series || ' hours')::interval
FROM generate_series(1, 5)
WHERE NOT EXISTS (SELECT 1 FROM organization_activities)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION - Shows what was created
-- =====================================================
SELECT 'SUCCESS: Migration completed safely!' as status;

-- Show table info
SELECT 
    'organization_activities table exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'organization_activities') 
         THEN 'YES' 
         ELSE 'NO' 
    END as table_status;

-- Show RLS status
SELECT 
    'Row Level Security enabled: ' || 
    CASE WHEN relrowsecurity 
         THEN 'YES' 
         ELSE 'NO' 
    END as rls_status
FROM pg_class 
WHERE relname = 'organization_activities';

-- Show policies
SELECT 'Policies created: ' || COUNT(*)::text as policies_count
FROM pg_policies 
WHERE tablename = 'organization_activities';

-- Show sample data
SELECT 'Sample activities created: ' || COUNT(*)::text as activities_count 
FROM organization_activities;

-- Preview sample activities
SELECT 
    action,
    details,
    user_email,
    created_at::timestamp::text as created_at
FROM organization_activities 
ORDER BY created_at DESC 
LIMIT 3;

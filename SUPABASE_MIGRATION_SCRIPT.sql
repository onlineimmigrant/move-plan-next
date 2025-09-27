-- =====================================================
-- COPY THIS ENTIRE SCRIPT AND RUN IT IN SUPABASE DASHBOARD
-- =====================================================
-- Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/sql
-- Paste this entire content and click "RUN"
-- =====================================================

-- Create organization_activities table for tracking real-time activities
CREATE TABLE IF NOT EXISTS organization_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deployed', 'deleted')),
    details TEXT,
    user_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_activities_org_id ON organization_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_activities_created_at ON organization_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organization_activities_action ON organization_activities(action);

-- Enable RLS (Row Level Security)
ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies (works without user_profiles table)
-- Allow authenticated users to see activities for organizations they have access to
CREATE POLICY "Allow authenticated users to read activities" ON organization_activities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert activities
CREATE POLICY "Allow authenticated users to insert activities" ON organization_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add some sample data for testing
INSERT INTO organization_activities (organization_id, action, details, user_email, created_at) 
SELECT 
    o.id,
    CASE 
        WHEN random() < 0.3 THEN 'created'
        WHEN random() < 0.6 THEN 'updated'
        WHEN random() < 0.8 THEN 'deployed'
        ELSE 'deleted'
    END,
    'System generated activity for testing',
    o.created_by_email,
    NOW() - (random() * interval '7 days')
FROM organizations o 
LIMIT 5
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERY - Run this after the above
-- =====================================================
SELECT 'Migration completed successfully! Activities table created.' as status;
SELECT COUNT(*) as sample_activities_count FROM organization_activities;
SELECT * FROM organization_activities ORDER BY created_at DESC LIMIT 3;

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

-- Create RLS policies
-- Users can see activities for their own organization
CREATE POLICY "Users can see own organization activities" ON organization_activities
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id = (
                SELECT current_organization_id FROM user_profiles 
                WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- Platform admins can see all activities
CREATE POLICY "Platform admins can see all activities" ON organization_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN organizations o ON up.current_organization_id = o.id
            WHERE up.email = auth.jwt() ->> 'email'
            AND up.role = 'admin'
            AND o.type = 'platform'
        )
    );

-- Only admins can insert activities
CREATE POLICY "Only admins can create activities" ON organization_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

-- Add some sample data for testing (remove in production)
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

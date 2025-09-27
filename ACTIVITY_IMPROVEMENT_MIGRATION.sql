-- =====================================================
-- ACTIVITY LOGGING IMPROVEMENT MIGRATION
-- =====================================================
-- Adds unique constraint to prevent duplicate activities
-- for the same organization and action type
-- =====================================================

-- Step 1: Add a unique constraint on organization_id and action
-- This will allow only one activity per organization per action type
ALTER TABLE organization_activities 
ADD CONSTRAINT unique_org_action 
UNIQUE (organization_id, action);

-- Step 2: Create index for better upsert performance
CREATE INDEX IF NOT EXISTS idx_org_activities_upsert 
ON organization_activities(organization_id, action);

-- Verification
SELECT 'SUCCESS: Unique constraint added for better activity logging!' as status;

-- Show constraint info
SELECT 
    'Unique constraint exists: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_org_action'
    ) THEN 'YES' ELSE 'NO' END as constraint_status;

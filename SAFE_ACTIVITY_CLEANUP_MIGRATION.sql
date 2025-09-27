-- =====================================================
-- SAFE ACTIVITY LOGGING IMPROVEMENT WITH CLEANUP
-- =====================================================
-- This script safely removes duplicates before adding constraints
-- =====================================================

-- Step 1: Clean up duplicate activities (keep the most recent one for each org+action combo)
WITH ranked_activities AS (
    SELECT id, 
           ROW_NUMBER() OVER (
               PARTITION BY organization_id, action 
               ORDER BY created_at DESC
           ) as rn
    FROM organization_activities
)
DELETE FROM organization_activities 
WHERE id IN (
    SELECT id 
    FROM ranked_activities 
    WHERE rn > 1
);

-- Step 2: Now we can safely add the unique constraint
ALTER TABLE organization_activities 
ADD CONSTRAINT unique_org_action 
UNIQUE (organization_id, action);

-- Step 3: Create index for better upsert performance
CREATE INDEX IF NOT EXISTS idx_org_activities_upsert 
ON organization_activities(organization_id, action);

-- Step 4: Add UPDATE policy for upsert operations
DO $$
BEGIN
    -- Create update policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_activities' 
        AND policyname = 'Allow authenticated users to update activities'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow authenticated users to update activities" ON organization_activities FOR UPDATE USING (auth.role() = ''authenticated'')';
    END IF;
END
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'SUCCESS: Duplicates cleaned and unique constraint added!' as status;

-- Show remaining activities count
SELECT 
    'Total activities after cleanup: ' || COUNT(*)::text as total_count,
    'Unique org+action combinations: ' || COUNT(DISTINCT (organization_id, action))::text as unique_combinations
FROM organization_activities;

-- Show constraint info
SELECT 
    'Unique constraint exists: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_org_action'
    ) THEN 'YES' ELSE 'NO' END as constraint_status;

-- Show any remaining duplicates (should be 0)
SELECT 
    'Remaining duplicates: ' || COUNT(*)::text as duplicate_count
FROM (
    SELECT organization_id, action, COUNT(*) as cnt
    FROM organization_activities
    GROUP BY organization_id, action
    HAVING COUNT(*) > 1
) duplicates;

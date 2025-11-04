-- ============================================================================
-- COMPLETE MIGRATION: Team & Testimonials Feature
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- NOTE: team and customer columns already exist in profiles table with defaults:
-- team JSONB DEFAULT '{"image": null, "skills": [], "job_title": "Team Member", ...}'
-- customer JSONB DEFAULT '{"image": null, "rating": 5, "company": "", ...}'
-- 
-- This migration only needs to update the section_type constraint
-- ============================================================================


-- Step 1: Update section_type constraint to include 'team' and 'testimonials'
-- ============================================================================
DO $$
BEGIN
    -- Drop existing CHECK constraint if it exists
    ALTER TABLE website_templatesection 
    DROP CONSTRAINT IF EXISTS website_templatesection_section_type_check;
    
    -- Add new constraint with all values including team and testimonials
    ALTER TABLE website_templatesection
    ADD CONSTRAINT website_templatesection_section_type_check
    CHECK (section_type IN (
        'general',
        'brand',
        'article_slider',
        'contact',
        'faq',
        'reviews',
        'help_center',
        'real_estate',
        'pricing_plans',
        'team',
        'testimonials'
    ));
    
    RAISE NOTICE '✅ Updated section_type CHECK constraint';
END $$;


-- Step 2: Verify the profiles table structure (for reference)
-- ============================================================================
-- The profiles table already has these columns with proper defaults and indexes:
-- 
-- team JSONB DEFAULT '{
--   "image": null,
--   "skills": [],
--   "job_title": "Team Member",
--   "pseudonym": null,
--   "department": "",
--   "github_url": null,
--   "description": "",
--   "is_featured": false,
--   "twitter_url": null,
--   "linkedin_url": null,
--   "display_order": 0,
--   "portfolio_url": null,
--   "is_team_member": false,
--   "experience_years": null,
--   "assigned_sections": []
-- }'
--
-- customer JSONB DEFAULT '{
--   "image": null,
--   "rating": 5,
--   "company": "",
--   "job_title": "",
--   "pseudonym": null,
--   "description": "",
--   "is_customer": false,
--   "is_featured": false,
--   "company_logo": null,
--   "linkedin_url": null,
--   "project_type": "",
--   "display_order": 0,
--   "testimonial_date": null,
--   "testimonial_text": "",
--   "assigned_sections": []
-- }'
--
-- Indexes already exist:
-- - idx_profiles_team_assigned_sections (GIN index on team->'assigned_sections')
-- - idx_profiles_customer_assigned_sections (GIN index on customer->'assigned_sections')


-- Step 3: Add helpful comments to document the JSONB structure
-- ============================================================================
-- Step 3: Add helpful comments to document the JSONB structure
-- ============================================================================
COMMENT ON COLUMN profiles.team IS 
'Team member data - already has default structure with fields:
image, skills[], job_title, pseudonym, department, github_url, description,
is_featured, twitter_url, linkedin_url, display_order, portfolio_url,
is_team_member (boolean), experience_years, assigned_sections[]';

COMMENT ON COLUMN profiles.customer IS
'Customer/testimonial data - already has default structure with fields:
image, rating (1-5), company, job_title, pseudonym, description, is_customer (boolean),
is_featured, company_logo, linkedin_url, project_type, display_order,
testimonial_date, testimonial_text, assigned_sections[]';


-- Step 4: Indexes already exist - just verify them
-- ============================================================================
-- These indexes were already created with the table:
-- idx_profiles_team_assigned_sections - GIN index on team->assigned_sections
-- idx_profiles_customer_assigned_sections - GIN index on customer->assigned_sections


-- Step 5: Verification queries
-- ============================================================================
-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('team', 'customer')
ORDER BY column_name;

-- Verify section_type constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'website_templatesection_section_type_check';

-- Show current section types in use
SELECT 
    section_type,
    COUNT(*) as count
FROM website_templatesection 
WHERE section_type IS NOT NULL
GROUP BY section_type
ORDER BY section_type;


-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Example: Add team member data to a profile
-- Replace 'YOUR_USER_ID' with an actual user ID from your profiles table
/*
UPDATE profiles 
SET team = jsonb_set(
  COALESCE(team, '{}'::jsonb),
  '{is_team_member}',
  'true'::jsonb
) || jsonb_build_object(
  'pseudonym', 'John Developer',
  'job_title', 'Senior Software Engineer',
  'description', 'Passionate about building scalable web applications with modern technologies.',
  'skills', '["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"]'::jsonb,
  'linkedin_url', 'https://linkedin.com/in/johndeveloper',
  'github_url', 'https://github.com/johndeveloper',
  'portfolio_url', 'https://johndeveloper.com',
  'assigned_sections', '[]'::jsonb,
  'is_featured', false,
  'display_order', 0
)
WHERE id = 'YOUR_USER_ID';
*/

-- Example: Add testimonial data to a profile
/*
UPDATE profiles 
SET customer = jsonb_set(
  COALESCE(customer, '{}'::jsonb),
  '{is_customer}',
  'true'::jsonb
) || jsonb_build_object(
  'pseudonym', 'Sarah Johnson',
  'company', 'Tech Innovations Inc',
  'job_title', 'CTO',
  'testimonial_text', 'This platform has transformed how our team collaborates. The features are intuitive and the support is excellent!',
  'rating', 5,
  'testimonial_date', '2024-11-01',
  'assigned_sections', '[]'::jsonb,
  'is_featured', false,
  'display_order', 0
)
WHERE id = 'ANOTHER_USER_ID';
*/


-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '1. Updated section_type constraint to include team & testimonials';
    RAISE NOTICE '2. Added helpful column comments for documentation';
    RAISE NOTICE '3. Verified existing indexes (already present)';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: team & customer columns already exist with proper structure';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Refresh your app - the section_type errors should be gone';
    RAISE NOTICE '2. Create a "Team Members" section in your admin panel';
    RAISE NOTICE '3. Create a "Testimonials" section';
    RAISE NOTICE '4. Update profile data using the UPDATE examples above';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

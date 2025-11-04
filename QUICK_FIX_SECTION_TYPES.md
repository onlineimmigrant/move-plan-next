# Quick Fix: Add Team and Testimonials Section Types

## Problems
1. Console error when trying to save sections: `API Error Response: {}`
2. Console error when viewing team/testimonials sections: `Error fetching team members: {}`

These happen because:
- The database constraint doesn't allow 'team' or 'testimonials' section types
- The `profiles` table doesn't have `team` and `customer` columns yet

## Solution - Run Complete Migration

### Single SQL File (Recommended) ✅

Open Supabase SQL Editor and run the complete migration file:
📁 `/database/migrations/COMPLETE_TEAM_TESTIMONIALS_MIGRATION.sql`

This will:
1. ✅ Add `team` and `customer` columns to profiles table
2. ✅ Update section_type constraint to include 'team' and 'testimonials'
3. ✅ Add helpful documentation comments
4. ✅ Create performance indexes
5. ✅ Verify everything worked

### Manual Steps (Alternative)

If you prefer to run commands individually:

```sql
-- 1. Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS team JSONB DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT NULL;

-- 2. Update section_type constraint
ALTER TABLE website_templatesection 
DROP CONSTRAINT IF EXISTS website_templatesection_section_type_check;

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
```

### Verify It Worked

After running the migration:
1. ✅ Refresh your app - all errors should be gone
2. ✅ You should see helpful error messages with SQL if columns are missing
3. ✅ Try creating a new "Team Members" section
4. ✅ Try creating a new "Testimonials" section
5. ✅ Save them - should work without errors

## What Was Added
- **Database Columns:**
  - `profiles.team` - JSONB column for team member data
  - `profiles.customer` - JSONB column for customer testimonial data

- **Section Types:**
  - 'team' - Display team member profiles
  - 'testimonials' - Display customer testimonials with ratings

- **Components:**
  - ✅ TeamMember.tsx - with error handling and migration instructions
  - ✅ Testimonials.tsx - with error handling and migration instructions
  - ✅ All TypeScript types updated
  - ✅ Modal UI options added

## Next Steps

### 1. Add Team Member Data
```sql
UPDATE profiles 
SET team = '{
  "is_team_member": true,
  "pseudonym": "John Developer",
  "job_title": "Senior Software Engineer",
  "bio": "Passionate about building scalable applications",
  "skills": ["React", "TypeScript", "Node.js"],
  "social_links": {
    "linkedin": "https://linkedin.com/in/john",
    "github": "https://github.com/john"
  },
  "assigned_sections": []
}'::jsonb
WHERE id = 'user-uuid-here';
```

### 2. Add Testimonial Data
```sql
UPDATE profiles 
SET customer = '{
  "is_customer": true,
  "pseudonym": "Sarah Johnson",
  "company": "Tech Corp",
  "job_title": "CTO",
  "testimonial_text": "Amazing product!",
  "rating": 5,
  "testimonial_date": "2024-11-01",
  "assigned_sections": []
}'::jsonb
WHERE id = 'user-uuid-here';
```

## Troubleshooting

### Still seeing errors?
1. Make sure you ran the COMPLETE migration file
2. Check Supabase SQL Editor for any error messages
3. Verify columns exist: 
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('team', 'customer');
   ```
4. Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)

### Need help?
Check the error message shown in the red box on the page - it includes the exact SQL you need to run!

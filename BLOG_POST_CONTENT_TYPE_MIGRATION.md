# Blog Post Content Type Migration Guide

## Overview
This migration adds support for Markdown content format to the `blog_post` table, enabling the editor to store and render content in both HTML and Markdown formats.

## Changes
- **New Column**: `content_type` - VARCHAR(20) with values 'html' or 'markdown'
- **Default Value**: 'html' (backward compatible with existing posts)
- **Constraint**: CHECK constraint ensures only 'html' or 'markdown' values
- **Index**: Added btree index on content_type for faster filtering

## Apply Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're in the project directory
cd /Users/ois/move-plan-next

# Apply the migration
supabase db push

# Or if you want to apply specific migration file
supabase db push --file supabase/migrations/20251102_add_content_type_to_blog_post.sql
```

### Option 2: Manual SQL Execution
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20251102_add_content_type_to_blog_post.sql`
4. Execute the SQL

### Option 3: Using psql
```bash
# Connect to your database
psql your_database_connection_string

# Execute the migration file
\i supabase/migrations/20251102_add_content_type_to_blog_post.sql
```

## Rollback
If you need to rollback this migration:

```bash
# Using Supabase SQL Editor or psql
# Execute the rollback file:
supabase/migrations/20251102_rollback_content_type_from_blog_post.sql
```

## Testing the Migration

After applying, verify with:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_post' 
AND column_name = 'content_type';

-- Check constraint exists
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'blog_post_content_type_check';

-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'blog_post' 
AND indexname = 'idx_blog_post_content_type';

-- Verify all existing posts have 'html' content_type
SELECT content_type, COUNT(*) 
FROM blog_post 
GROUP BY content_type;
```

## Next Steps

After successful migration:

1. ✅ Migration applied
2. Update TypeScript types to include content_type
3. Update PostEditor component to support Markdown mode
4. Update post rendering logic to handle Markdown content
5. Test creating/editing posts in both HTML and Markdown modes

## Notes

- All existing posts will automatically have `content_type = 'html'`
- New posts default to 'html' unless explicitly set to 'markdown'
- The column is NOT NULL with a default value for data integrity
- Index added for performance when filtering by content type

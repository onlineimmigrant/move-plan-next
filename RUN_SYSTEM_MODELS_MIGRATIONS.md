# Run System Models Migrations

## Current Issue
The `ai_models_system` table doesn't exist yet. You need to run the migrations in the correct order.

## Required Migrations (In Order)

### 1. Create ai_models_system table
```sql
-- File: database/migrations/001_create_ai_models_system.sql
-- Run this first in Supabase SQL Editor
```

### 2. Enhance organizations table  
```sql
-- File: database/migrations/002_enhance_organizations_table.sql
-- Adds `type` and `pricing_plan` columns to organizations
```

### 3. Create org_system_model_config table
```sql
-- File: database/migrations/003_create_org_system_model_config.sql
-- Junction table for org-specific model configurations
```

### 4. Create ai_model_usage table
```sql
-- File: database/migrations/004_create_ai_model_usage.sql
-- Usage tracking for system models
```

### 5. Add superadmin role support (MUST RUN BEFORE 005!)
```sql
-- File: database/migrations/007_add_superadmin_role_support.sql
-- Creates helper functions needed by RLS policies
-- Creates is_superadmin(), is_admin(), get_user_role(), etc.
```

### 6. Setup RLS policies
```sql
-- File: database/migrations/005_setup_rls_policies.sql
-- Enables Row Level Security using functions from step 5
```

### 7. Seed system models (sample data)
```sql
-- File: database/migrations/006_seed_system_models.sql
-- Insert 6 sample system models
-- ⚠️ IMPORTANT: Replace 'PLACEHOLDER_API_KEY' with real API keys!
```

## Quick Run Instructions

1. **Open Supabase Dashboard** → SQL Editor

2. **Run each migration** in order (copy/paste and execute):
   - 001_create_ai_models_system.sql
   - 002_enhance_organizations_table.sql
   - 003_create_org_system_model_config.sql
   - 004_create_ai_model_usage.sql
   - 007_add_superadmin_role_support.sql (run BEFORE 005!)
   - 005_setup_rls_policies.sql
   - 006_seed_system_models.sql

3. **Promote yourself to superadmin**:
```sql
SELECT * FROM promote_to_superadmin('your-email@example.com');
```

4. **Verify**:
```sql
-- Check table exists
SELECT COUNT(*) FROM ai_models_system;

-- Check your role
SELECT u.email, p.role 
FROM profiles p 
INNER JOIN auth.users u ON u.id = p.id 
WHERE u.email = 'your-email@example.com';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'ai_models_system';
```

## After Running Migrations

Once migrations are complete, the issues will be fixed:
1. ✅ `ai_models_system` table will exist
2. ✅ Superadmin can query all system models
3. ✅ RLS policies will allow superadmin full access
4. ✅ You can access `/superadmin/system-models` page

## Notes

- You mentioned running migrations 001-006 successfully before, but the table doesn't exist
- This suggests either:
  - Migration 001 wasn't run on your current database
  - You're connected to a different database
  - Migration was rolled back
- Please verify which database you're connected to in your `.env.local`

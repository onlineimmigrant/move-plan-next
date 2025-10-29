# System AI Models - Database Migrations

## Overview

This directory contains SQL migration files for implementing the System AI Models feature - a multi-tenant AI model management system with tiered access control.

## Migration Files

⚠️ **IMPORTANT: MIGRATION ORDER**

Due to dependencies, migrations **MUST** be run in this specific order:

### Phase 1: Database Foundation

1. **001_create_ai_models_system.sql**
   - Creates `ai_models_system` table for system-wide AI model templates
   - Managed by superadmin
   - Includes targeting by organization type and pricing plan
   - Supports token limits and trial models

2. **002_enhance_organizations_table.sql**
   - Adds pricing plan column to existing `organizations` table
   - Adds token quota tracking fields
   - Uses existing `organizations.type` column (no new business_type needed)

3. **003_create_org_system_model_config.sql**
   - Creates junction table for admin control over system models
   - Allows admins to enable/disable models for their users
   - Supports custom per-user token limits

4. **004_create_ai_model_usage.sql**
   - Creates usage tracking table for quota enforcement
   - Records token usage per user, per model, per period
   - Supports daily, weekly, and monthly tracking

5. **007_add_superadmin_role_support.sql** ⚠️ **RUN THIS BEFORE 005**
   - Extends profiles table to support three-tier roles (superadmin/admin/user)
   - Creates helper functions used by RLS policies
   - Creates role change audit table
   - **CRITICAL**: Migration 005 depends on functions created here

6. **005_setup_rls_policies.sql** ⚠️ **RUN THIS AFTER 007**
   - Implements Row Level Security for all tables
   - Uses helper functions from migration 007
   - Superadmin: full access to everything
   - Admin: filtered access to system models, full control of org config
   - User: access only to enabled models, own usage data

7. **006_seed_system_models.sql**
   - Seeds sample system models for testing
   - Includes models for various organization types
   - Contains free, paid, and trial models

**Why this order?** Migration 005 uses functions like `is_superadmin()` and `get_user_organization_id()` that are created in migration 007. Running 005 before 007 will fail with "function does not exist" errors.

📖 **See detailed guide**: [MIGRATION_ORDER_SUPERADMIN.md](./MIGRATION_ORDER_SUPERADMIN.md)

## How to Run

### 🚨 CRITICAL STEPS BEFORE RUNNING MIGRATIONS

1. **Read the migration order guide first**: [MIGRATION_ORDER_SUPERADMIN.md](./MIGRATION_ORDER_SUPERADMIN.md)
2. **Run migrations 001-004 first** (database tables)
3. **Then run migration 007** (superadmin support) 
4. **Create your first superadmin** immediately after 007
5. **Then run migrations 005-006** (RLS policies and seed data)

### Option 1: Supabase Dashboard (Recommended for initial setup)

1. Log into Supabase Dashboard
2. Go to SQL Editor
3. **Run migrations in this EXACT order:**
   - 001_create_ai_models_system.sql
   - 002_enhance_organizations_table.sql
   - 003_create_org_system_model_config.sql
   - 004_create_ai_model_usage.sql
   - 007_add_superadmin_role_support.sql ⚠️
   - **STOP HERE** - Run this query:
     ```sql
     SELECT * FROM promote_to_superadmin('your-email@example.com');
     ```
   - 005_setup_rls_policies.sql
   - 006_seed_system_models.sql
4. Verify no errors

### Option 2: Supabase CLI

```bash
# Make sure migrations are in database/migrations/
cd /Users/ois/move-plan-next

# Run migrations individually in correct order
psql $DATABASE_URL -f database/migrations/001_create_ai_models_system.sql
psql $DATABASE_URL -f database/migrations/002_enhance_organizations_table.sql
psql $DATABASE_URL -f database/migrations/003_create_org_system_model_config.sql
psql $DATABASE_URL -f database/migrations/004_create_ai_model_usage.sql
psql $DATABASE_URL -f database/migrations/007_add_superadmin_role_support.sql

# STOP - Create first superadmin via Supabase dashboard SQL editor:
# SELECT * FROM promote_to_superadmin('your-email@example.com');

# Then continue:
psql $DATABASE_URL -f database/migrations/005_setup_rls_policies.sql
psql $DATABASE_URL -f database/migrations/006_seed_system_models.sql
```

### Option 3: Node.js Script

```bash
# Not recommended - doesn't handle superadmin promotion step
npm run migrate:system-models
```

## Verification Steps

After running migrations, verify:

### 1. Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'ai_models_system',
    'org_system_model_config', 
    'ai_model_usage'
  );
```

Should return 3 rows.

### 2. Organizations Enhanced
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN (
    'pricing_plan',
    'token_quota_monthly',
    'token_usage_current',
    'token_reset_date'
  );
```

Should return 4 rows.

### 3. RLS Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'ai_models_system',
    'org_system_model_config',
    'ai_model_usage'
  );
```

All should show `rowsecurity = true`.

### 4. Policies Created
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'ai_models_system',
    'org_system_model_config',
    'ai_model_usage'
  )
ORDER BY tablename, policyname;
```

Should return multiple policies for each table.

### 5. Sample Data Inserted
```sql
SELECT COUNT(*) as model_count 
FROM ai_models_system;
```

Should return 6 (or however many seed models were inserted).

## Rollback (if needed)

If you need to undo these migrations:

```sql
-- WARNING: This will delete all data in these tables!

-- Drop RLS policies first
DROP POLICY IF EXISTS "Superadmin full access to system models" ON ai_models_system;
DROP POLICY IF EXISTS "Admin read filtered system models" ON ai_models_system;
DROP POLICY IF EXISTS "User read enabled system models" ON ai_models_system;
-- ... (drop all policies)

-- Drop tables
DROP TABLE IF EXISTS ai_model_usage CASCADE;
DROP TABLE IF EXISTS org_system_model_config CASCADE;
DROP TABLE IF EXISTS ai_models_system CASCADE;

-- Remove columns from organizations (optional - may want to keep)
ALTER TABLE organizations DROP COLUMN IF EXISTS pricing_plan;
ALTER TABLE organizations DROP COLUMN IF EXISTS token_quota_monthly;
ALTER TABLE organizations DROP COLUMN IF EXISTS token_usage_current;
ALTER TABLE organizations DROP COLUMN IF EXISTS token_reset_date;

-- Drop functions
DROP FUNCTION IF EXISTS plan_level_sufficient;
DROP FUNCTION IF EXISTS update_ai_models_system_updated_at;
DROP FUNCTION IF EXISTS update_org_system_model_config_updated_at;
```

## Important Notes

### 1. Organization Types
This system uses the **existing** `organizations.type` column. Available types are defined in `/src/components/SiteManagement/types.ts`:

- immigration
- solicitor
- finance
- education
- job
- beauty
- doctor
- services
- realestate
- construction
- software
- marketing
- consulting
- automotive
- hospitality
- retail
- healthcare
- transportation
- technology
- general
- platform

### 2. API Keys
The seed data contains `PLACEHOLDER_API_KEY`. **Replace these with actual API keys** before deploying to production.

### 3. Token Limits
Default token limits in seed data are examples. Adjust based on your:
- Cost structure
- Usage patterns
- Pricing strategy

### 4. Pricing Plans
The system uses 4 plan levels (hierarchy):
1. `free` (lowest)
2. `starter`
3. `pro`
4. `enterprise` (highest)

Models with `required_plan = 'pro'` are available to `pro` and `enterprise` orgs.

### 5. Performance Considerations
- All tables have appropriate indexes
- Consider partitioning `ai_model_usage` when it grows large (millions of rows)
- Monitor query performance and add indexes as needed

### 6. Security
- RLS policies assume auth.jwt() provides `role` and `organization_id` claims
- Verify your auth setup matches these assumptions
- Test policies thoroughly before production deployment

### 7. Removed Features
Based on user feedback, we **removed**:
- ❌ `organizations.business_type` (using existing `type` column instead)
- ❌ `can_create_custom_models` (all admins/users can create models by default)
- ❌ `max_custom_models` (will be managed at application level later)

## Next Steps

After migrations are complete:

1. ✅ Verify all tables and policies
2. ✅ Replace placeholder API keys
3. ✅ Adjust token limits as needed
4. 📋 Update TypeScript types (Phase 2)
5. 📋 Build superadmin portal (Phase 3)
6. 📋 Update admin interface (Phase 4)
7. 📋 Update user interface (Phase 5)

## Support

For questions or issues:
- Check [SYSTEM_AI_MODELS_ARCHITECTURE.md](../docs/SYSTEM_AI_MODELS_ARCHITECTURE.md) for detailed design
- Review [SYSTEM_AI_MODELS_FOUNDATION_PLAN.md](../docs/SYSTEM_AI_MODELS_FOUNDATION_PLAN.md) for implementation roadmap
- Open an issue in the repository

## Changelog

- **2025-10-29**: Initial migration files created
  - Phase 1.1-1.6: Database foundation complete
  - Using existing `organizations.type` column
  - Simplified by removing unnecessary columns

-- Migration: Row Level Security policies for System AI Models
-- Description: Security policies for ai_models_system, org_system_model_config, and ai_model_usage

## ⚠️ IMPORTANT: Migration Order-- Date: 2025-10-29

-- Phase: 1.5 - Database Foundation

Due to dependencies between migrations, you **MUST** run them in this specific order:

-- ============================================================================

### Correct Order:-- ASSUMPTIONS ABOUT AUTH

```-- ============================================================================

1. 001_create_ai_models_system.sql-- This migration uses helper functions from migration 007_add_superadmin_role_support.sql

2. 002_enhance_organizations_table.sql-- Make sure to run migration 007 BEFORE running this migration, or the policies will fail

3. 003_create_org_system_model_config.sql-- 

4. 004_create_ai_model_usage.sql-- Available helper functions:

5. 007_add_superadmin_role_support.sql  ⚠️ RUN THIS BEFORE 005!-- - auth.uid(): UUID of the authenticated user (Supabase built-in)

6. 005_setup_rls_policies.sql-- - is_superadmin(): Returns true if current user has role='superadmin'

7. 006_seed_system_models.sql-- - is_admin(): Returns true if current user has role='admin'

```-- - get_user_role(): Returns the role text of current user

-- - get_user_organization_id(): Returns the organization_id of current user

## Why This Order?--

-- NOTE: If you run migrations in order, migration 007 will be executed AFTER this one.

**Migration 005** (RLS policies) depends on helper functions created in **Migration 007** (superadmin support):-- In that case, this migration will initially fail. Solution:

- `is_superadmin()`-- 1. Run migration 007 first (add superadmin support)

- `is_admin()`-- 2. Then run migration 005 (RLS policies)

- `get_user_role()`-- OR: Manually create the helper functions before running this migration

- `get_user_organization_id()`

-- ============================================================================

If you try to run 005 before 007, you'll get errors like:-- AI_MODELS_SYSTEM TABLE POLICIES

```-- ============================================================================

ERROR: function is_superadmin() does not exist

```-- Enable RLS

ALTER TABLE ai_models_system ENABLE ROW LEVEL SECURITY;

## Step-by-Step Deployment

-- Policy 1: Superadmin has full access (all operations)

### Step 1: Run Migrations 001-004CREATE POLICY "Superadmin full access to system models"

✅ You've already completed these (as mentioned in your message)  ON ai_models_system

  FOR ALL

### Step 2: Run Migration 007 (Superadmin Support)  TO authenticated

```sql  USING (

-- In Supabase SQL Editor:    is_superadmin()

-- Copy and paste contents of 007_add_superadmin_role_support.sql  )

-- Click "Run"  WITH CHECK (

```    is_superadmin()

  );

**What this does:**

- Adds constraint to `profiles.role` column (superadmin/admin/user)-- Policy 2: Admin can read models filtered by their org type and plan

- Creates helper functions for role checksCREATE POLICY "Admin read filtered system models"

- Creates `promote_to_superadmin()` function  ON ai_models_system

- Creates `role_change_audit` table  FOR SELECT

- Sets up trigger to log role changes  TO authenticated

  USING (

**Verify it worked:**    is_admin()

```sql    AND is_active = true

-- Check constraint exists    AND (

SELECT conname, pg_get_constraintdef(oid)       -- Check if model is available to all org types (empty array)

FROM pg_constraint       organization_types = '{}'

WHERE conrelid = 'profiles'::regclass       OR 

AND conname = 'profiles_role_check';      -- Or check if org's type is in the model's allowed types

      EXISTS (

-- Check helper functions exist        SELECT 1 

SELECT routine_name         FROM organizations 

FROM information_schema.routines         WHERE id = get_user_organization_id()

WHERE routine_schema = 'public'         AND type = ANY(ai_models_system.organization_types)

AND routine_name IN ('is_superadmin', 'is_admin', 'get_user_role', 'get_user_organization_id');      )

    )

-- Should return 4 rows    -- Note: Pricing plan filtering should be done in application layer

```    -- since we need to compare plan hierarchy (free < starter < pro < enterprise)

  );

### Step 3: Promote Your First Superadmin

🚨 **CRITICAL STEP** - Do this immediately after Step 2-- Policy 3: Users can read models that are:

--   a) Active system-wide

```sql--   b) Available to their org type

-- Replace with YOUR actual email--   c) Enabled by their admin (in org_system_model_config)

SELECT * FROM promote_to_superadmin('your-email@example.com');CREATE POLICY "User read enabled system models"

  ON ai_models_system

-- Verify the promotion  FOR SELECT

SELECT u.email, p.role, p.updated_at  TO authenticated

FROM profiles p  USING (

INNER JOIN auth.users u ON u.id = p.id    get_user_role() = 'user'

WHERE u.email = 'your-email@example.com';    AND is_active = true

    AND (

-- Should show role='superadmin'      -- Check org type match

```      organization_types = '{}'

      OR EXISTS (

**Why this is critical:**        SELECT 1 

- Without a superadmin, you won't be able to access system models        FROM organizations 

- The RLS policies in migration 005 require at least one superadmin        WHERE id = get_user_organization_id()

- This should be done via direct SQL (Supabase dashboard), not via API        AND type = ANY(ai_models_system.organization_types)

      )

### Step 4: Run Migration 005 (RLS Policies)    )

```sql    AND (

-- In Supabase SQL Editor:      -- Check if admin enabled this model for users

-- Copy and paste contents of 005_setup_rls_policies.sql      EXISTS (

-- Click "Run"        SELECT 1 

```        FROM org_system_model_config

        WHERE system_model_id = ai_models_system.id

**What this does:**        AND organization_id = get_user_organization_id()

- Enables Row Level Security on all 3 new tables        AND is_enabled_for_users = true

- Creates policies using the helper functions from migration 007      )

- Restricts access based on role (superadmin/admin/user)    )

  );

**Verify it worked:**

```sql-- ============================================================================

-- Check RLS is enabled-- ORG_SYSTEM_MODEL_CONFIG TABLE POLICIES

SELECT tablename, rowsecurity-- ============================================================================

FROM pg_tables

WHERE schemaname = 'public'-- Enable RLS

AND tablename IN ('ai_models_system', 'org_system_model_config', 'ai_model_usage');ALTER TABLE org_system_model_config ENABLE ROW LEVEL SECURITY;



-- All should show rowsecurity = true-- Policy 1: Superadmin can see all configs

CREATE POLICY "Superadmin full access to model configs"

-- Check policies exist  ON org_system_model_config

SELECT tablename, policyname  FOR ALL

FROM pg_policies  TO authenticated

WHERE schemaname = 'public'  USING (

AND tablename IN ('ai_models_system', 'org_system_model_config', 'ai_model_usage')    is_superadmin()

ORDER BY tablename, policyname;  )

  WITH CHECK (

-- Should return ~10 policies    is_superadmin()

```  );



### Step 5: Run Migration 006 (Seed Data)-- Policy 2: Admin can manage configs for their organization

```sqlCREATE POLICY "Admin manage org model configs"

-- In Supabase SQL Editor:  ON org_system_model_config

-- Copy and paste contents of 006_seed_system_models.sql  FOR ALL

-- Click "Run"  TO authenticated

```  USING (

    is_admin()

**What this does:**    AND organization_id = get_user_organization_id()

- Creates 6 sample system AI models  )

- Provides examples for different org types and pricing plans  WITH CHECK (

    is_admin()

**Verify it worked:**    AND organization_id = get_user_organization_id()

```sql  );

SELECT id, name, organization_types, required_plan, is_active

FROM ai_models_system-- Policy 3: Users can read configs for their organization (to see enabled models)

ORDER BY created_at;CREATE POLICY "User read org model configs"

  ON org_system_model_config

-- Should return 6 rows  FOR SELECT

```  TO authenticated

  USING (

### Step 6: Test Superadmin Access    organization_id = get_user_organization_id()

```sql  );

-- As the superadmin user, test access to system models

SELECT COUNT(*) as total_models-- ============================================================================

FROM ai_models_system;-- AI_MODEL_USAGE TABLE POLICIES

-- ============================================================================

-- Should return: 6

-- Enable RLS

-- View role change auditALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;

SELECT * FROM role_change_audit

ORDER BY changed_at DESC;-- Policy 1: Superadmin can see all usage data

CREATE POLICY "Superadmin view all usage"

-- Should show your promotion to superadmin  ON ai_model_usage

```  FOR SELECT

  TO authenticated

## Post-Deployment Tasks  USING (

    is_superadmin()

### 1. Update Placeholder API Keys  );

All seed models use `PLACEHOLDER_API_KEY`. Replace with real keys:

-- Policy 2: Admin can view usage for their organization

```sqlCREATE POLICY "Admin view org usage"

UPDATE ai_models_system  ON ai_model_usage

SET api_key = 'your-actual-openai-key'  FOR SELECT

WHERE api_key = 'PLACEHOLDER_API_KEY'  TO authenticated

AND provider = 'openai';  USING (

    is_admin()

UPDATE ai_models_system    AND organization_id = get_user_organization_id()

SET api_key = 'your-actual-anthropic-key'  );

WHERE api_key = 'PLACEHOLDER_API_KEY'

AND provider = 'anthropic';-- Policy 3: Users can view their own usage

```CREATE POLICY "User view own usage"

  ON ai_model_usage

### 2. Adjust Token Limits  FOR SELECT

Review and adjust token limits based on your pricing strategy:  TO authenticated

  USING (

```sql    user_id = auth.uid()

-- View current limits  );

SELECT name, required_plan, token_limit_amount, token_limit_period

FROM ai_models_system-- Policy 4: System can insert usage records (authenticated users making requests)

ORDER BY required_plan, name;CREATE POLICY "System insert usage records"

  ON ai_model_usage

-- Update as needed  FOR INSERT

UPDATE ai_models_system  TO authenticated

SET token_limit_amount = 100000  WITH CHECK (

WHERE id = 'specific-model-id';    -- User can only insert their own usage

```    user_id = auth.uid()

    AND organization_id = get_user_organization_id()

### 3. Set Pricing Plans on Organizations  );

Initialize pricing plans for existing organizations:

-- Policy 5: No one can update or delete usage records (audit trail)

```sql-- Only superadmin can do this via direct SQL if needed

-- Set default free plan for all existing orgs

UPDATE organizations-- ============================================================================

SET pricing_plan = 'free',-- HELPER FUNCTIONS (Optional)

    token_quota_monthly = 10000,-- ============================================================================

    token_usage_current = 0,

    token_reset_date = date_trunc('month', CURRENT_DATE + INTERVAL '1 month')-- Function to check if a plan level is sufficient

WHERE pricing_plan IS NULL;CREATE OR REPLACE FUNCTION plan_level_sufficient(

  user_plan TEXT,

-- Upgrade specific organizations  required_plan TEXT

UPDATE organizations)

SET pricing_plan = 'pro',RETURNS BOOLEAN AS $$

    token_quota_monthly = 100000DECLARE

WHERE type = 'solicitor' -- or specific org criteria  plan_levels JSONB := '{

AND pricing_plan = 'free';    "free": 0,

```    "starter": 1,

    "pro": 2,

### 4. Test Role Hierarchy    "enterprise": 3

```sql  }'::JSONB;

-- Create test users with different rolesBEGIN

-- (This should be done via your app, but here's the SQL for reference)  RETURN (plan_levels ->> user_plan)::INTEGER >= (plan_levels ->> required_plan)::INTEGER;

END;

-- Admin user (already exists in your system)$$ LANGUAGE plpgsql IMMUTABLE;

SELECT u.email, p.role

FROM profiles pCOMMENT ON FUNCTION plan_level_sufficient IS 'Helper function to check if user plan meets required plan level. Returns true if user_plan >= required_plan in hierarchy.';

INNER JOIN auth.users u ON u.id = p.id

WHERE p.role = 'admin'-- ============================================================================

LIMIT 5;-- TESTING QUERIES (for verification)

-- ============================================================================

-- Regular users

SELECT u.email, p.role-- Test 1: Verify superadmin can see all system models

FROM profiles p-- SELECT COUNT(*) FROM ai_models_system; -- Should return all

INNER JOIN auth.users u ON u.id = p.id

WHERE p.role = 'user'-- Test 2: Verify admin sees only models for their org type

LIMIT 5;-- SET request.jwt.claims = '{"role": "admin", "organization_id": "xxx"}';

```-- SELECT COUNT(*) FROM ai_models_system; -- Should return filtered



## Rollback Instructions-- Test 3: Verify user sees only enabled models

-- SET request.jwt.claims = '{"role": "user", "organization_id": "xxx"}';

If something goes wrong, rollback in **reverse order**:-- SELECT COUNT(*) FROM ai_models_system; -- Should return enabled only



```sql-- Test 4: Verify usage tracking isolation

-- 1. Drop seed data-- SELECT * FROM ai_model_usage; -- Should only see own usage

DELETE FROM ai_models_system;

-- ============================================================================

-- 2. Drop RLS policies-- IMPORTANT NOTES

DROP POLICY IF EXISTS "Superadmin full access to system models" ON ai_models_system;-- ============================================================================

DROP POLICY IF EXISTS "Admin read filtered system models" ON ai_models_system;

DROP POLICY IF EXISTS "User read enabled system models" ON ai_models_system;-- 1. Pricing Plan Filtering:

DROP POLICY IF EXISTS "Superadmin full access to model configs" ON org_system_model_config;--    RLS policies check org type match, but pricing plan comparison should be 

DROP POLICY IF EXISTS "Admin manage org model configs" ON org_system_model_config;--    done in application layer using plan_level_sufficient() or similar logic.

DROP POLICY IF EXISTS "User read org model configs" ON org_system_model_config;--    This is because RLS can't easily compare plan hierarchy.

DROP POLICY IF EXISTS "Superadmin view all usage" ON ai_model_usage;

DROP POLICY IF EXISTS "Admin view org usage" ON ai_model_usage;-- 2. Performance:

DROP POLICY IF EXISTS "User view own usage" ON ai_model_usage;--    These policies use EXISTS clauses which may impact performance with large

DROP POLICY IF EXISTS "System insert usage records" ON ai_model_usage;--    datasets. Monitor query performance and add indexes as needed.



ALTER TABLE ai_models_system DISABLE ROW LEVEL SECURITY;-- 3. Auth Claims:

ALTER TABLE org_system_model_config DISABLE ROW LEVEL SECURITY;--    Verify your auth.jwt() structure matches these policies. Adjust as needed.

ALTER TABLE ai_model_usage DISABLE ROW LEVEL SECURITY;

-- 4. Service Role:

-- 3. Drop superadmin support--    Background jobs (token resets, etc.) should use service role to bypass RLS.

DROP TRIGGER IF EXISTS trigger_log_role_change ON profiles;

DROP FUNCTION IF EXISTS log_role_change();-- 5. Audit Trail:

DROP TABLE IF EXISTS role_change_audit;--    Usage records are insert-only for regular users. Deletion requires superadmin.

DROP FUNCTION IF EXISTS promote_to_superadmin(TEXT);
DROP FUNCTION IF EXISTS get_user_organization_id();
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS is_admin_or_superadmin();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_superadmin();
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 4. Drop other tables (if needed)
DROP TABLE IF EXISTS ai_model_usage;
DROP TABLE IF EXISTS org_system_model_config;
ALTER TABLE organizations DROP COLUMN IF EXISTS pricing_plan;
ALTER TABLE organizations DROP COLUMN IF EXISTS token_quota_monthly;
ALTER TABLE organizations DROP COLUMN IF EXISTS token_usage_current;
ALTER TABLE organizations DROP COLUMN IF EXISTS token_reset_date;
DROP TABLE IF EXISTS ai_models_system;
```

## Common Issues & Solutions

### Issue 1: "function is_superadmin() does not exist"
**Solution:** You ran migration 005 before 007. Run 007 first, then re-run 005.

### Issue 2: "new row violates check constraint profiles_role_check"
**Solution:** You're trying to set a role that's not in ['superadmin', 'admin', 'user']. Check your role values.

### Issue 3: RLS blocks all queries
**Solution:** Make sure you promoted at least one user to superadmin (Step 3). Without any superadmin, no one can manage system models.

### Issue 4: Can't promote user to superadmin
**Solution:** Use direct SQL in Supabase dashboard:
```sql
SELECT * FROM promote_to_superadmin('your-email@example.com');
```

### Issue 5: Policies still reference auth.jwt()
**Solution:** You have an old version of 005. Make sure to use the updated version that uses helper functions (is_superadmin(), etc.).

## Security Checklist

Before going to production:

- [ ] At least one user promoted to superadmin
- [ ] Superadmin promotion function access restricted (only via direct SQL)
- [ ] All placeholder API keys replaced
- [ ] Token limits reviewed and adjusted
- [ ] Pricing plans set on all organizations
- [ ] RLS enabled on all tables
- [ ] Test with superadmin user
- [ ] Test with admin user
- [ ] Test with regular user
- [ ] Review role_change_audit table
- [ ] Backup database before deployment

## Next Steps

After successful deployment:

1. **Phase 2**: Create TypeScript types and utilities (see SYSTEM_AI_MODELS_FOUNDATION_PLAN.md)
2. **Phase 3**: Build superadmin portal UI
3. **Phase 4**: Add admin "System Models" tab
4. **Phase 5**: Add user "Templates" view
5. **Phase 6**: Implement usage tracking
6. **Phase 7-8**: Testing and production deployment

## Questions?

If you encounter issues:
1. Check the verification queries in each migration file
2. Review the role_change_audit table for security events
3. Ensure migrations ran in correct order
4. Check Supabase logs for detailed error messages

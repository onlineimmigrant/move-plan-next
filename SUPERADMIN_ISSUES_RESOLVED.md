# Superadmin System Models - Issue Resolution

## Issues Identified

### Issue 1: Translation Error ✅ FIXED
**Error:**
```
Error: MISSING_MESSAGE: Could not resolve `admin` in messages for locale `en`.
```

**Root Cause:**
- The superadmin pages were trying to use `useTranslations('admin')` 
- The translation namespace `'admin'` doesn't exist in the i18n messages
- Superadmin is a separate portal and shouldn't share admin translations

**Solution Applied:**
- Removed `useTranslations` import from `superadmin/system-models/page.tsx`
- Removed `const t = useTranslations('admin');` line
- Using plain English text in the UI (appropriate for system-level interface)

**Files Modified:**
- `/src/app/[locale]/superadmin/system-models/page.tsx`

---

### Issue 2: No Models Fetched ⚠️ REQUIRES DATABASE SETUP
**Problem:**
- No system models are being fetched from the database
- The `ai_models_system` table doesn't exist

**Root Cause:**
- The system models migrations haven't been run yet
- Even though you mentioned running migrations 001-006 successfully before, the database check shows the table doesn't exist:
  ```sql
  ERROR: relation "ai_models_system" does not exist
  ```

**Possible Reasons:**
1. Migrations were run on a different database
2. You're currently connected to a different database in `.env.local`
3. Migrations were rolled back
4. Migrations weren't actually executed

**Solution Required:**
You need to run the system models migrations in the correct order. See `RUN_SYSTEM_MODELS_MIGRATIONS.md` for detailed instructions.

---

## Migration Order (CRITICAL)

The migrations MUST be run in this specific order:

1. ✅ **001_create_ai_models_system.sql** - Creates the main table
2. ✅ **002_enhance_organizations_table.sql** - Adds type/plan columns
3. ✅ **003_create_org_system_model_config.sql** - Junction table
4. ✅ **004_create_ai_model_usage.sql** - Usage tracking
5. ✅ **007_add_superadmin_role_support.sql** - ⚠️ RUN THIS BEFORE 005!
6. ✅ **005_setup_rls_policies.sql** - Requires functions from 007
7. ✅ **006_seed_system_models.sql** - Sample data

### Why This Order?
Migration 005 (RLS policies) uses helper functions created in migration 007:
- `is_superadmin()` - Check if user is superadmin
- `is_admin()` - Check if user is admin
- `get_user_role()` - Get user's role
- `get_user_organization_id()` - Get user's organization

If you run 005 before 007, you'll get:
```
ERROR: function is_superadmin() does not exist
```

---

## Quick Fix Steps

### Step 1: Verify Database Connection
Check which database you're connected to:

```bash
# Check your .env.local file
cat .env.local | grep DATABASE_URL

# Or check if Supabase client is configured
cat .env.local | grep NEXT_PUBLIC_SUPABASE_URL
```

Make sure you're connected to the correct Supabase project.

### Step 2: Run Migrations in Supabase Dashboard

1. Open Supabase Dashboard → SQL Editor
2. Run each migration file in order (copy/paste contents)
3. Wait for "Success" message before running next one

### Step 3: Promote Yourself to Superadmin

After running migration 007, promote your user:

```sql
-- Replace with your actual email
SELECT * FROM promote_to_superadmin('your-email@example.com');

-- Verify the promotion
SELECT u.email, p.role, p.updated_at
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

### Step 4: Verify System Models Table

```sql
-- Check table exists
SELECT COUNT(*) FROM ai_models_system;
-- Should return: 6 (after running migration 006)

-- View the models
SELECT id, name, role, is_active, is_featured
FROM ai_models_system
ORDER BY sort_order;
```

### Step 5: Test the Superadmin Portal

1. Navigate to `/superadmin`
2. Should see dashboard with stats
3. Click "System Models" in nav
4. Should see 6 system models listed

---

## RLS Policy Behavior

Once migrations are complete, these security policies will be active:

### For Superadmin (You):
```sql
CREATE POLICY "Superadmin full access to system models"
ON ai_models_system
FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());
```

**Result:** You can SELECT, INSERT, UPDATE, DELETE all system models ✅

### For Regular Admins:
```sql
CREATE POLICY "Admin read filtered system models"
ON ai_models_system
FOR SELECT
TO authenticated
USING (
  is_admin()
  AND is_active = true
  AND (
    organization_types = '{}'  -- Available to all org types
    OR EXISTS (
      SELECT 1 FROM organizations
      WHERE id = get_user_organization_id()
      AND type = ANY(ai_models_system.organization_types)
    )
  )
);
```

**Result:** Regular admins can only READ models that:
- Are active
- Match their organization type
- Or are available to all types (empty array)

### For Regular Users:
```sql
CREATE POLICY "User read enabled system models"
ON ai_models_system
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'user'
  AND is_active = true
  AND (organization_types match)
  AND EXISTS (
    -- Model must be enabled by admin in org_system_model_config
  )
);
```

**Result:** Users can only READ models that their admin has enabled for them.

---

## Expected Behavior After Fix

### ✅ Translation Error
- **Before:** Console error about missing 'admin' translation namespace
- **After:** No translation errors, UI shows plain English text

### ✅ System Models Fetching
- **Before:** No models returned, empty list
- **After:** 6 system models displayed with all details:
  1. Blog Content Writer Pro (Featured, Pro plan)
  2. Legal Document Analyst (Featured, Enterprise plan)
  3. Healthcare Information Assistant (Pro plan)
  4. Property Listing Writer (Starter plan)
  5. Basic Assistant (Free, available to all)
  6. Education Tutor (Trial - 30 days, Featured)

### ✅ Superadmin Portal Access
- Dashboard shows accurate stats:
  - Total Organizations count
  - Total System Models count (6)
  - Active Models count
  - Total Usage records
- System Models page shows full list with ability to:
  - Toggle active/inactive status
  - View all details (tasks, roles, tokens, etc.)
  - Add new models (when CRUD modals are built)
  - Edit existing models (when CRUD modals are built)
  - Delete models (when CRUD modals are built)

---

## Troubleshooting

### Still no models after running migrations?

1. **Check RLS policies:**
```sql
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'ai_models_system';
```

2. **Bypass RLS temporarily to test:**
```sql
-- As superadmin in Supabase SQL Editor:
SELECT * FROM ai_models_system;
-- This bypasses RLS and shows all rows
```

3. **Check your role:**
```sql
SELECT u.email, p.role
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE u.id = auth.uid();  -- Your current user
```

4. **Test the helper functions:**
```sql
SELECT 
  is_superadmin() as am_i_superadmin,
  is_admin() as am_i_admin,
  get_user_role() as my_role,
  get_user_organization_id() as my_org_id;
```

---

## Next Steps After Resolution

Once both issues are resolved:

### Phase 1: Test Current Functionality ✅
- [ ] Access `/superadmin` dashboard
- [ ] View system models list
- [ ] Toggle model active/inactive
- [ ] Verify stats on dashboard

### Phase 2: Build CRUD Modals 🚧
- [ ] Add System Model modal
- [ ] Edit System Model modal
- [ ] Delete confirmation modal
- [ ] Task management modal
- [ ] Bulk operations

### Phase 3: Organizations Management 📋
- [ ] Create `/superadmin/organizations` page
- [ ] List all organizations
- [ ] Organization switcher
- [ ] Edit organization settings

### Phase 4: Usage Analytics 📊
- [ ] Create `/superadmin/usage` page
- [ ] System-wide usage dashboard
- [ ] Per-organization breakdown
- [ ] Token consumption graphs

---

## Summary

**Issue 1: Translation Error**
- Status: ✅ FIXED
- Action Taken: Removed translation dependency
- Files Modified: `superadmin/system-models/page.tsx`

**Issue 2: No Models Fetched**
- Status: ⚠️ REQUIRES ACTION
- Root Cause: Missing database table
- Action Required: Run system models migrations
- Documentation: See `RUN_SYSTEM_MODELS_MIGRATIONS.md`

**Next Immediate Step:**
Run the migrations in your Supabase dashboard, then test `/superadmin/system-models` page.

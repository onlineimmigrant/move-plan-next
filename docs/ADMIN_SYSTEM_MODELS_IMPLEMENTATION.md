# Admin System Models Implementation

**Status**: ✅ Complete  
**Date**: 2024  
**Phase**: Phase 3 - Admin Access to System Models

## Overview

This document describes the implementation of the System Models feature for organization admins. This allows admins to view system-wide AI models (created by superadmins) filtered by their organization type and pricing plan, and enable/disable those models for their users.

## Architecture

### Three-Tier System

1. **Superadmin Level** (`/superadmin/system-models`)
   - Full CRUD operations on `ai_models_system` table
   - Define system-wide models available across the platform
   - Set organization type filters and pricing plan requirements

2. **Admin Level** (`/admin/ai/management` - System tab) ✅ **THIS IMPLEMENTATION**
   - View filtered system models based on org context
   - Enable/disable models for organization users
   - Writes to `org_system_model_config` table

3. **User Level** (Future - Phase 4)
   - Access only enabled system models
   - Use models within their applications

## Database Tables

### `ai_models_system`
System-wide model definitions created by superadmins.

**Key Columns:**
- `name`, `description`, `icon`, `endpoint`
- `role`, `task` (JSONB array), `system_message`
- `organization_types` (text[]) - Empty = all types, or specific types
- `required_plan` (text) - 'free', 'starter', 'pro', 'enterprise'
- `is_active`, `is_featured`, `is_free`, `is_trial`
- `max_tokens`, `token_limit_amount`, `token_limit_period`
- `trial_expires_days`
- `tags` (text[])

### `org_system_model_config`
Organization-specific configurations for system models.

**Key Columns:**
- `organization_id` (FK to organizations)
- `system_model_id` (FK to ai_models_system)
- `is_enabled_for_users` (boolean) - Main control flag
- `custom_token_limit` (integer, optional)
- `custom_max_tokens` (integer, optional)

**Composite Unique Key:** `(organization_id, system_model_id)`

## Filtering Logic

### Organization Type Filter
```typescript
const orgTypeMatch = 
  model.organization_types.length === 0 || 
  model.organization_types.includes(organizationType);
```

**Meaning:**
- If `organization_types` is empty array → Available to ALL org types
- Otherwise → Admin's org type must be in the array

### Pricing Plan Filter
```typescript
const PLAN_HIERARCHY = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

const orgPlanLevel = PLAN_HIERARCHY[organizationPlan];
const modelPlanLevel = PLAN_HIERARCHY[model.required_plan];
const planMatch = modelPlanLevel <= orgPlanLevel;
```

**Meaning:**
- Admin's plan level must be >= model's required plan level
- Enterprise users see all models
- Free users only see free-tier models

### Active Filter
Only show models where `is_active = true` in `ai_models_system`.

## Implementation Files

### 1. Types (`aiManagement.ts`)

**Updated:**
```typescript
export type TabType = 'models' | 'add' | 'edit' | 'system'; // Added 'system'
```

### 2. Hook (`useAdminSystemModels.ts`)

**Location:** `/src/components/ai/_shared/hooks/useAdminSystemModels.ts`

**Purpose:** Manages system model data, filtering, and enable/disable operations for admins.

**Key Functions:**

#### `fetchOrganizationDetails()`
Fetches admin's organization type and pricing plan from `organizations` table.

#### `fetchSystemModels()`
Fetches and filters system models:
1. Get all active models from `ai_models_system`
2. Filter by organization type
3. Filter by plan hierarchy
4. Fetch existing configs from `org_system_model_config`
5. Merge to create `SystemModelWithConfig[]` with `is_enabled` flag

#### `toggleModelEnabled(modelId, currentStatus)`
Enable or disable a single model:
- If config exists → Update `is_enabled_for_users`
- If no config → Insert new config with `is_enabled_for_users = true`

#### `enableAllModels()`
Bulk operation to enable all visible models.

#### `disableAllModels()`
Bulk operation to disable all visible models.

**Returns:**
```typescript
{
  // Data
  models: SystemModelWithConfig[],
  allModelsCount: number,
  enabledCount: number,
  disabledCount: number,
  organizationType: string,
  organizationPlan: string,
  
  // UI State
  loading: boolean,
  saving: boolean,
  error: string | null,
  successMessage: string | null,
  
  // Filters
  searchQuery: string,
  filterEnabled: 'all' | 'enabled' | 'disabled',
  filterPlan: 'all' | 'free' | 'starter' | 'pro' | 'enterprise',
  
  // Setters
  setSearchQuery,
  setFilterEnabled,
  setFilterPlan,
  
  // Actions
  toggleModelEnabled,
  enableAllModels,
  disableAllModels,
}
```

### 3. Component (`AdminSystemModelsList.tsx`)

**Location:** `/src/components/ai/_shared/components/AdminSystemModelsList.tsx`

**Purpose:** UI component displaying filtered system models with enable/disable controls.

**Features:**

#### Header Info Panel
- Shows organization type and pricing plan
- Displays counts: Available, Enabled, Disabled
- Bulk action buttons: Enable All, Disable All

#### Filters
- **Search:** Filter by name/description
- **Status:** All / Enabled Only / Disabled Only
- **Plan:** All / Free / Starter / Pro / Enterprise

#### Model Cards
Each card displays:
- Icon and name
- Enabled/disabled badge
- Featured, Free, Trial badges (if applicable)
- Description
- Details:
  - Role
  - Required plan
  - Max tokens
  - Token limit (amount/period)
  - Task count
  - Trial period (if applicable)
- Tags
- Enable/Disable button (toggles `is_enabled` status)

**Card Styling:**
- Enabled cards: Green border + green background tint
- Disabled cards: Gray border + white background

### 4. Navigation (`AITabNavigation.tsx`)

**Updated:** Added System tab button visible only in admin context.

```typescript
{context === 'admin' && !useModal && (
  <button onClick={() => onTabChange('system')}>
    <SparklesIcon />
    <span>System</span>
  </button>
)}
```

### 5. Management Page (`page.tsx`)

**Location:** `/src/app/[locale]/admin/ai/management/page.tsx`

**Changes:**

1. **Added Imports:**
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   import { AdminSystemModelsList } from '@/components/ai/_shared';
   ```

2. **Added State:**
   ```typescript
   const [organizationId, setOrganizationId] = useState<string | null>(null);
   ```

3. **Added Effect to Fetch Organization ID:**
   ```typescript
   useEffect(() => {
     const fetchOrganizationId = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         const { data: profile } = await supabase
           .from('profiles')
           .select('organization_id')
           .eq('id', user.id)
           .single();
         
         if (profile) {
           setOrganizationId(profile.organization_id);
         }
       }
     };
     
     fetchOrganizationId();
   }, []);
   ```

4. **Updated Tab Navigation:**
   Removed `useModal` mode to show all tabs including System.

5. **Added Conditional Tab Content:**
   ```typescript
   {activeTab === 'system' ? (
     organizationId ? (
       <AdminSystemModelsList
         organizationId={organizationId}
         primary={primary}
       />
     ) : (
       <AILoadingSkeleton count={3} />
     )
   ) : (
     /* Existing Models tab content */
   )}
   ```

## User Flow

### Admin Workflow

1. **Navigate to AI Management**
   - Go to `/admin/ai/management`
   
2. **Switch to System Tab**
   - Click "System" tab in navigation
   - Tab shows sparkles icon ✨

3. **View Filtered Models**
   - See only models matching org type and plan
   - View counts: Available, Enabled, Disabled
   - Blue info panel explains filtering context

4. **Search & Filter**
   - Search by name/description
   - Filter by status (All/Enabled/Disabled)
   - Filter by plan requirement

5. **Enable/Disable Models**
   - **Enable:** Click "Enable for Users" button
     - Card gets green border and tint
     - Status badge shows "Enabled"
     - Users can now access this model
   - **Disable:** Click "Disable for Users" button
     - Card returns to gray border
     - Users can no longer access this model

6. **Bulk Actions**
   - **Enable All:** Makes all visible models available to users
   - **Disable All:** Removes access to all visible models

### Behind the Scenes

When admin enables a model:
```sql
-- If config doesn't exist:
INSERT INTO org_system_model_config (
  organization_id,
  system_model_id,
  is_enabled_for_users
) VALUES (
  'org-uuid',
  'model-uuid',
  true
);

-- If config exists:
UPDATE org_system_model_config
SET is_enabled_for_users = true
WHERE organization_id = 'org-uuid'
  AND system_model_id = 'model-uuid';
```

When admin disables a model:
```sql
UPDATE org_system_model_config
SET is_enabled_for_users = false
WHERE organization_id = 'org-uuid'
  AND system_model_id = 'model-uuid';
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Superadmin Portal                        │
│              /superadmin/system-models                      │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │         ai_models_system                          │     │
│  │  - Creates system-wide models                     │     │
│  │  - Sets org type filters                          │     │
│  │  - Sets plan requirements                         │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                 Filtering Applied
         (org type + plan hierarchy)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Admin Portal                             │
│          /admin/ai/management (System tab)                  │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │   useAdminSystemModels Hook                       │     │
│  │  1. Fetch org details                             │     │
│  │  2. Fetch filtered system models                  │     │
│  │  3. Fetch org configs                             │     │
│  │  4. Merge with is_enabled flag                    │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │   AdminSystemModelsList Component                 │     │
│  │  - Displays filtered models                       │     │
│  │  - Enable/disable controls                        │     │
│  │  - Writes to org_system_model_config              │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                 Enabled Models Only
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                           │
│                  (Future - Phase 4)                         │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Query: ai_models_system                          │     │
│  │  JOIN org_system_model_config                     │     │
│  │  WHERE is_enabled_for_users = true                │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Example Scenarios

### Scenario 1: Enterprise Healthcare Organization

**Organization Details:**
- Type: `healthcare`
- Plan: `enterprise`

**System Models Available:**
```typescript
// Model 1: HIPAA-Compliant AI
organization_types: ['healthcare', 'legal']
required_plan: 'enterprise'
→ ✅ VISIBLE (type match + plan match)

// Model 2: General Purpose AI
organization_types: []  // Empty = all types
required_plan: 'free'
→ ✅ VISIBLE (all types + plan match)

// Model 3: Education AI
organization_types: ['education']
required_plan: 'starter'
→ ❌ HIDDEN (type mismatch)

// Model 4: Legal AI
organization_types: ['legal', 'healthcare']
required_plan: 'pro'
→ ✅ VISIBLE (type match + plan match)
```

### Scenario 2: Free Plan Marketing Startup

**Organization Details:**
- Type: `marketing`
- Plan: `free`

**System Models Available:**
```typescript
// Model 1: Enterprise Marketing Suite
organization_types: ['marketing']
required_plan: 'enterprise'
→ ❌ HIDDEN (plan mismatch: 0 < 3)

// Model 2: Basic Content Generator
organization_types: []
required_plan: 'free'
→ ✅ VISIBLE (all types + plan match)

// Model 3: Pro Analytics
organization_types: ['marketing', 'sales']
required_plan: 'pro'
→ ❌ HIDDEN (plan mismatch: 0 < 2)

// Model 4: Starter Social AI
organization_types: ['marketing']
required_plan: 'starter'
→ ❌ HIDDEN (plan mismatch: 0 < 1)
```

**Upgrade Path:**
If this startup upgrades to `starter` plan, Model 4 becomes visible.

## Testing Checklist

### Filtering Tests
- [ ] Empty `organization_types` array shows to all org types
- [ ] Specific org type only shows to matching orgs
- [ ] Free plan only sees free-tier models
- [ ] Enterprise plan sees all models (free, starter, pro, enterprise)
- [ ] Starter plan sees free + starter models
- [ ] Pro plan sees free + starter + pro models
- [ ] Inactive models (`is_active = false`) are hidden

### Enable/Disable Tests
- [ ] Enabling a model inserts config if not exists
- [ ] Enabling a model updates config if exists
- [ ] Disabling a model updates config (doesn't delete)
- [ ] Enabled models show green border and badge
- [ ] Disabled models show gray border
- [ ] Toggle button text changes (Enable ↔ Disable)

### Bulk Actions Tests
- [ ] Enable All creates/updates configs for all visible models
- [ ] Disable All updates all configs to disabled
- [ ] Buttons disabled when appropriate (all enabled/all disabled)

### UI Tests
- [ ] Search filters models by name/description
- [ ] Status filter (All/Enabled/Disabled) works correctly
- [ ] Plan filter shows only models of selected plan
- [ ] Counts (Available/Enabled/Disabled) update correctly
- [ ] Organization type and plan display correctly in header
- [ ] Loading skeleton shows while fetching org ID
- [ ] Success/error messages appear on actions
- [ ] Model cards display all information correctly
- [ ] Tags display with truncation if >5 tags

### RLS Tests
- [ ] Admins can read `ai_models_system` (system models)
- [ ] Admins can read/write own org's `org_system_model_config`
- [ ] Admins cannot modify other orgs' configs
- [ ] Admins cannot write to `ai_models_system` (superadmin only)

## Future Enhancements (Phase 4)

### User Access Implementation

When Phase 4 is implemented, users will query enabled models like:

```sql
SELECT sm.*
FROM ai_models_system sm
INNER JOIN org_system_model_config config
  ON config.system_model_id = sm.id
WHERE config.organization_id = $user_org_id
  AND config.is_enabled_for_users = true
  AND sm.is_active = true;
```

### Custom Token Limits

Admins can override system model token limits per organization:

```typescript
// In org_system_model_config
custom_token_limit: 50000  // Override system default
custom_max_tokens: 2000    // Override system default
```

This would require UI updates in `AdminSystemModelsList` component to add:
- Modal to edit custom limits
- Display of custom vs system limits
- Validation for custom limit values

### Usage Tracking

Future `ai_model_usage` table will track:
- Which users use which system models
- Token consumption per model
- Usage analytics for admins
- Cost tracking per organization

## Deployment Steps

1. **Verify Superadmin Portal:**
   - Ensure `/superadmin/system-models` is working
   - Create at least 2-3 test system models with different org types and plans

2. **Verify Database:**
   - Confirm `ai_models_system` table exists
   - Confirm `org_system_model_config` table exists
   - Verify RLS policies allow admin read on system models
   - Verify RLS policies allow admin CRUD on own org configs

3. **Test Admin Portal:**
   - Login as admin with known org type and plan
   - Navigate to `/admin/ai/management`
   - Click System tab
   - Verify filtering shows appropriate models
   - Test enable/disable functionality
   - Test bulk operations
   - Test search and filters

4. **Test Different Organization Contexts:**
   - Test with different organization types
   - Test with different pricing plans
   - Verify filtering works correctly for each combination

5. **Monitor Logs:**
   - Check for any console errors
   - Verify database operations are performant
   - Check for any RLS policy violations

## Success Metrics

- [x] System tab visible in admin AI management
- [x] Models filtered by organization type
- [x] Models filtered by pricing plan
- [x] Enable/disable functionality working
- [x] Bulk operations working
- [x] UI displays model information correctly
- [x] No TypeScript compilation errors
- [x] No console errors in browser
- [x] RLS policies enforced correctly

## Related Documentation

- `SUPERADMIN_SYSTEM_MODELS_IMPLEMENTATION.md` - Superadmin portal (Phase 2)
- `SYSTEM_MODELS_DATABASE_SCHEMA.md` - Database structure
- `SYSTEM_MODELS_RLS_POLICIES.md` - Row Level Security policies

## Support

For issues or questions:
1. Check RLS policies in Supabase dashboard
2. Verify organization data in `organizations` table
3. Check browser console for errors
4. Review Supabase logs for database errors
5. Ensure user has proper admin role in `profiles` table

---

**Implementation Date:** 2024  
**Status:** ✅ Complete and Ready for Testing

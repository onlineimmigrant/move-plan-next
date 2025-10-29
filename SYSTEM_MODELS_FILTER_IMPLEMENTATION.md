# System Models Filter Implementation

## Overview
This document describes the implementation of displaying system models in the admin AI management interface with a dedicated 'System' filter tab.

## Implementation Date
October 29, 2025

## What Was Implemented

### 1. Type System Updates

#### `aiManagement.ts` - FilterRoleType
```typescript
// BEFORE
export type FilterRoleType = 'all' | 'user' | 'admin';

// AFTER
export type FilterRoleType = 'all' | 'user' | 'admin' | 'system';
```

#### `model.types.ts` - AIModelType
```typescript
// BEFORE
export type AIModelType = 'default' | 'user';

// AFTER
export type AIModelType = 'default' | 'user' | 'system';
```

#### Modal Interface Updates
- `AITaskManagementModel` - Added `'system'` to type union
- `AIRoleEditModel` - Added `'system'` to type union

### 2. Data Fetching - Admin Context

#### `useModelManagement.ts` - fetchDefaultModels()
Updated the admin context to fetch TWO types of models:

1. **Organization default models** from `ai_models_default`
2. **Enabled system models** from `ai_models_system` (with JOIN)

```typescript
// Admin context now fetches system models
const { data: systemModels } = await supabase
  .from('ai_models_system')
  .select(`
    id, name, api_key, endpoint, max_tokens,
    is_active, system_message, icon, role, task,
    org_system_model_config!inner (
      is_enabled_for_users,
      organization_id
    )
  `)
  .eq('is_active', true)
  .eq('org_system_model_config.organization_id', profile.organization_id)
  .eq('org_system_model_config.is_enabled_for_users', true);

// System models marked with type: 'system'
const systemModelsWithType = systemModelsFormatted.map(m => 
  ({ ...m, type: 'system' as const })
);

// Combined with default models
const allModels = [...defaultModelsWithType, ...systemModelsWithType];
```

### 3. Filter Counts

#### `useModelManagement.ts` - Count Calculations
```typescript
// Added systemCount
const systemCount = defaultModels.filter(m => m.type === 'system').length;

// Updated adminCount to exclude system models (now separate)
const adminCount = context === 'account'
  ? defaultModels.filter(m => m.type === 'default' || m.type === 'system').length
  : defaultModels.filter(m => m.user_role_to_access === 'admin' && m.type !== 'system').length;

// Hook now returns systemCount
return {
  // ...
  systemCount, // NEW
  // ...
};
```

### 4. Filter Logic

#### `useModelManagement.ts` - filteredDefaultModels
```typescript
// For admin context
if (filterRole === 'system') {
  matchesRoleFilter = model.type === 'system';
} else {
  matchesRoleFilter = filterRole === 'all' || model.user_role_to_access === filterRole;
}

// For account context (also handles 'system' filter)
if (filterRole === 'system') {
  matchesRoleFilter = model.type === 'system';
}
```

### 5. UI Components

#### `AIFilterBar.tsx` - Added System Filter Button
```typescript
// Admin context filters now include 'System'
const filters = [
  { id: 'all' as const, label: 'All', type: 'role', count: totalCount },
  { id: 'user' as const, label: 'User', type: 'role', count: userCount },
  { id: 'admin' as const, label: 'Admin', type: 'role', count: adminCount },
  { id: 'system' as const, label: 'System', type: 'role', count: systemCount }, // NEW
  { id: 'active' as const, label: 'Active', type: 'status', count: activeCount },
  { id: 'inactive' as const, label: 'Inactive', type: 'status', count: inactiveCount },
];

// Props interface updated
interface AIFilterBarProps {
  // ...
  systemCount: number; // NEW
  // ...
}
```

#### Admin Page - `/admin/ai/management/page.tsx`
```typescript
// Extract systemCount from hook
const {
  // ...
  systemCount, // NEW
  // ...
} = useModelManagement();

// Pass to AIFilterBar
<AIFilterBar
  context="admin"
  // ...
  systemCount={systemCount} // NEW
  // ...
/>
```

#### Account Page - `/account/ai/page.tsx`
```typescript
// Also updated to pass systemCount (for type consistency)
<AIFilterBar
  context="account"
  systemCount={systemCount}
  // ...
/>
```

## Architecture Flow

### Three-Level System Model Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ SUPERADMIN PORTAL (/superadmin/system-models)              │
│ ─────────────────────────────────────────────────────────  │
│ - Creates system models in ai_models_system                │
│ - Defines organization types & pricing plans               │
│ - Full CRUD operations                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ADMIN PORTAL (/admin/ai/management)                        │
│ ─────────────────────────────────────────────────────────  │
│ Tab 1: "Models" - Organization default models              │
│        - Fetch from: ai_models_default                      │
│        - Filter: "Admin" tab                                │
│                                                             │
│ Tab 2: "System" - Enable/disable system models             │
│        - Manage via: org_system_model_config                │
│        - Toggle: is_enabled_for_users                       │
│                                                             │
│ Tab 3: NEW "System" Filter - View enabled system models    │ ✨
│        - Fetch from: ai_models_system (JOIN)               │ ✨
│        - Shows: Only enabled system models                  │ ✨
│        - Badge: "System" type indicator                     │ ✨
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ USER PORTAL (/account/ai)                                   │
│ ─────────────────────────────────────────────────────────  │
│ - Views THREE types of models:                             │
│   1. Custom models (type: 'user')                          │
│   2. Org default models (type: 'default')                  │
│   3. Enabled system models (type: 'system')                │
│                                                             │
│ - Filter: "Default" shows both 'default' AND 'system'      │
│ - Read-only access to 'default' and 'system' models        │
└─────────────────────────────────────────────────────────────┘
```

## Query Pattern

### Admin Fetches System Models
```sql
SELECT 
  sm.id,
  sm.name,
  sm.api_key,
  sm.endpoint,
  sm.max_tokens,
  sm.is_active,
  sm.system_message,
  sm.icon,
  sm.role,
  sm.task,
  config.is_enabled_for_users,
  config.organization_id
FROM ai_models_system AS sm
INNER JOIN org_system_model_config AS config
  ON sm.id = config.system_model_id
WHERE sm.is_active = true
  AND config.organization_id = :organization_id
  AND config.is_enabled_for_users = true
ORDER BY sm.name ASC;
```

## Filter Behavior

### Admin Context - Filter Tabs

| Filter  | Shows                                    | Type Values           |
|---------|------------------------------------------|-----------------------|
| All     | All models (default + system)            | 'default', 'system'   |
| User    | User-role models                         | user_role_to_access='user' |
| Admin   | Admin-role models (excluding system)     | user_role_to_access='admin' |
| **System** | **System models only** ✨             | **type='system'** ✨  |
| Active  | Active models (all types)                | is_active=true        |
| Inactive| Inactive models (all types)              | is_active=false       |

### Account Context - Filter Tabs

| Filter  | Shows                                    | Type Values           |
|---------|------------------------------------------|-----------------------|
| All     | All models (user + default + system)     | All types             |
| Custom  | User's custom models                     | type='user'           |
| Default | Org default + system models              | type='default' OR 'system' |
| Active  | Active models (all types)                | is_active=true        |
| Inactive| Inactive models (all types)              | is_active=false       |

**Note:** Account context does NOT show separate 'System' filter - system models appear in 'Default' category.

## Key Features

### 1. Separate System Filter (Admin Only)
- Admin sees dedicated "System" filter button
- Shows count of enabled system models
- Clicking filters to show ONLY system models
- System models also appear in "All" filter

### 2. Model Type Indicators
- System models marked with `type: 'system'`
- Can be visually distinguished (future: add badge)
- Separate from organization default models

### 3. Consistent Read-Only Behavior
- System models are read-only (like default models)
- Permission checks prevent edit/delete/toggle
- Users can view and use system models
- Admins can enable/disable via "System" tab

### 4. Accurate Counts
- Each filter shows accurate model count
- System count separate from admin count
- Counts update dynamically with filters

## Testing Checklist

### Admin Testing
- [ ] Navigate to `/admin/ai/management`
- [ ] Verify "System" filter appears in filter bar
- [ ] Enable system models in "System" tab
- [ ] Click "System" filter button
- [ ] **Verify**: Only system models appear
- [ ] **Verify**: System count badge is correct
- [ ] Click "All" filter
- [ ] **Verify**: System models appear alongside default models
- [ ] Click "Admin" filter
- [ ] **Verify**: System models NOT shown (only admin-role defaults)
- [ ] Try to edit system model from list
- [ ] **Verify**: Shows read-only error message

### User Testing
- [ ] Navigate to `/account/ai`
- [ ] **Verify**: System models appear in model list
- [ ] Click "Default" filter
- [ ] **Verify**: Both default and system models shown
- [ ] Click "Custom" filter
- [ ] **Verify**: Only user's custom models shown
- [ ] Try to edit system model
- [ ] **Verify**: Shows read-only error message

### Cross-Context Testing
- [ ] Admin enables new system model in System tab
- [ ] User refreshes account page
- [ ] **Verify**: New system model appears
- [ ] Admin disables system model
- [ ] User refreshes account page
- [ ] **Verify**: System model disappears

## Files Modified

### Types
- ✅ `src/components/ai/_shared/types/aiManagement.ts`
- ✅ `src/components/ai/_shared/types/model.types.ts`
- ✅ `src/components/ai/_shared/components/AITaskManagementModal.tsx`
- ✅ `src/components/ai/_shared/components/AIRoleEditModal.tsx`

### Hooks
- ✅ `src/components/ai/_shared/hooks/useModelManagement.ts`
  - Updated `fetchDefaultModels()` for admin context
  - Added `systemCount` calculation
  - Updated filter logic
  - Added `systemCount` to return values

### Components
- ✅ `src/components/ai/_shared/components/AIFilterBar.tsx`
  - Added `systemCount` prop
  - Added "System" filter button (admin only)
  - Updated filter array logic

### Pages
- ✅ `src/app/[locale]/admin/ai/management/page.tsx`
  - Extract `systemCount` from hook
  - Pass `systemCount` to AIFilterBar

- ✅ `src/app/[locale]/account/ai/page.tsx`
  - Extract `systemCount` from hook
  - Pass `systemCount` to AIFilterBar (for consistency)

## Future Enhancements

### Visual Differentiation (Priority: Medium)
1. Add badge component to AIModelCard
2. Display "System" badge on system models
3. Use distinct color (e.g., purple) for system models
4. Add icon indicator for system models

### Enhanced Filtering (Priority: Low)
1. Multi-select filters (show User + System together)
2. Quick filter presets ("My Models", "Organization", "System")
3. Save filter preferences per user

### Analytics (Priority: Low)
1. Track system model usage
2. Show popularity metrics
3. Display token consumption per model
4. Usage comparison charts

## Summary

✅ **Completed:**
- System models now visible in admin model list
- Dedicated "System" filter tab added
- Accurate filter counts including systemCount
- Type system fully supports 'system' type
- Filter logic handles 'system' role correctly
- Both admin and account contexts updated
- All TypeScript errors resolved

🎯 **Result:**
- Admins can view enabled system models alongside default models
- System filter allows quick filtering to ONLY system models
- System models maintain read-only status
- Proper separation between Admin-role defaults and System models
- Consistent behavior across admin and account contexts

📝 **Documentation:**
- Complete architecture documented
- Query patterns explained
- Filter behavior mapped
- Testing checklist provided

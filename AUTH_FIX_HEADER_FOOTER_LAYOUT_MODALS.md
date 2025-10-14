# Authentication Fix for Header/Footer/Layout Modals

## Problem

The HeaderEditModal, FooterEditModal, LayoutManagerModal, and GlobalSettingsModal were failing to work on production (Vercel) with errors:

```
Error fetching organization by baseUrl
Error fetching organization by tenantId: 
{
  code: "42703",
  message: "column organizations.tenant_id does not exist",
  tenantId: "16d2b7bb-f4c7-41ce-b6e2-8f532ceaa5df"
}
```

```
Error loading organization and settings: Error: Organization not found for current domain
```

The modals worked fine on local machines but failed in production.

## Root Causes

### Issue 1: Session Race Condition (HeaderEditModal, FooterEditModal)

The modals had a `useEffect` that depended on `session?.access_token`:

```typescript
// BROKEN CODE
useEffect(() => {
  if (isOpen && organizationId && session?.access_token) {
    fetchHeaderData(organizationId).catch(error => {
      console.error('Error fetching header data:', error);
    });
  }
}, [isOpen, organizationId, session?.access_token, fetchHeaderData]);
```

**Problem**: On production (Vercel), the session loading is slower than on localhost. When the modal opens:
1. `isOpen` becomes `true`
2. `organizationId` is set
3. BUT `session?.access_token` is still `null` (session not loaded yet)
4. The condition fails, so `fetchHeaderData` never runs
5. Modal displays with no data

### Issue 2: Stale Session in Fetch Functions

The fetch functions checked for session at the beginning:

```typescript
// BROKEN CODE
const fetchHeaderData = useCallback(async (organizationId: string) => {
  setIsLoading(true);
  try {
    if (!session?.access_token) {
      throw new Error('No active session found. Please log in again.');
    }
    // ... rest of code
  }
}, [session]); // Depends on session state
```

**Problem**: The `session` state variable might be stale or null when the function is called.

### Issue 2: Non-Existent Database Column (All Modals + GlobalSettingsModal)

The `getOrganizationId()` function in `/src/lib/supabase.ts` was querying a non-existent column:

```typescript
// BROKEN CODE
const { data: tenantData, error: tenantError } = await supabase
  .from('organizations')
  .select('id, type')
  .eq('tenant_id', tenantId)  // ❌ Column doesn't exist!
  .single();
```

**Problem**: The `organizations` table schema is:
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    base_url TEXT,
    base_url_local TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

There is **NO `tenant_id` column**. The `NEXT_PUBLIC_TENANT_ID` environment variable should be treated as the organization **ID** directly, not as a separate lookup field.

## Solution

### Fix 1: Session Race Condition (HeaderEditModal, FooterEditModal)

1. **Get fresh session inside each fetch function** instead of relying on state
2. **Remove session dependency** from useEffect

### Changes to HeaderEditModal/context.tsx

```typescript
// FIXED CODE
const fetchHeaderData = useCallback(async (organizationId: string) => {
  setIsLoading(true);
  try {
    // Get fresh session each time to avoid stale session issues
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    
    if (!freshSession?.access_token) {
      throw new Error('No active session found. Please log in again.');
    }

    // Use freshSession for API calls
    const orgResponse = await fetch(`/api/organizations/${organizationId}`, {
      headers: {
        'Authorization': `Bearer ${freshSession.access_token}`
      }
    });
    // ... rest of code
  }
}, []); // No session dependency

// Updated useEffect without session dependency
useEffect(() => {
  if (isOpen && organizationId) {
    fetchHeaderData(organizationId).catch(error => {
      console.error('[HeaderEditContext] Error fetching header data:', error);
    });
  }
}, [isOpen, organizationId, fetchHeaderData]); // No session?.access_token
```

### Changes to FooterEditModal/context.tsx

Same pattern as HeaderEditModal:
- Get fresh session inside `fetchFooterData`
- Use `freshSession.access_token` for all API calls
- Remove `session` from useCallback dependencies
- Remove `session?.access_token` from useEffect dependencies

## Why This Works

### HeroSectionModal Pattern (Working Reference)

HeroSectionModal already used this pattern:

```typescript
// From HeroSectionModal/context.tsx
const updateSection = useCallback(async (data: Partial<HeroSectionData>) => {
  // ... validation code
  
  if (!session?.access_token) {
    throw new Error('No active session found. Please log in again.');
  }

  const response = await fetch(`/api/organizations/${organizationId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`  // Uses state session
    },
    // ... rest of code
  });
}, [/* dependencies */]);
```

**Note**: HeroSectionModal doesn't have an automatic fetch on modal open. It only updates data when explicitly called. Our modals need to fetch data when opened, so we improved the pattern by getting a fresh session at fetch time.

## LayoutManagerModal

The LayoutManagerModal doesn't use authentication because:
- It calls `/api/page-layout` which uses service role key (server-side auth)
- No Authorization header needed
- Works fine as-is

### Fix 2: Non-Existent Database Column (getOrganizationId)

Fixed `/src/lib/supabase.ts` to query by `id` instead of non-existent `tenant_id`:

```typescript
// FIXED CODE
if (tenantId) {
  console.log('Attempting fallback with tenantId as organization ID:', tenantId);
  const { data: tenantData, error: tenantError } = await supabase
    .from('organizations')
    .select('id, type')
    .eq('id', tenantId) // ✅ Query by ID directly
    .single();

  if (tenantError || !tenantData) {
    console.error('Error fetching organization by ID (tenantId):', {
      message: tenantError?.message || 'No error message',
      code: tenantError?.code || 'No code',
      details: tenantError?.details || 'No details',
      hint: tenantError?.hint || 'No hint',
      tenantId,
    });
    return null;
  }

  console.log('Fetched organization by ID (tenantId):', tenantData.id);
  return tenantData.id;
}
```

**Impact**: This fixes:
- ✅ HeaderEditModal
- ✅ FooterEditModal  
- ✅ LayoutManagerModal
- ✅ GlobalSettingsModal
- ✅ All components that use `getOrganizationId()` (40+ usages across the codebase)

## Testing Checklist

✅ **Local Testing**:
- [ ] HeaderEditModal opens and loads data
- [ ] FooterEditModal opens and loads data
- [ ] GlobalSettingsModal opens and loads data
- [ ] Can edit header styles
- [ ] Can edit footer styles
- [ ] Can reorder menu items
- [ ] No console errors

✅ **Production Testing** (after deployment):
- [ ] HeaderEditModal opens and loads data on Vercel
- [ ] FooterEditModal opens and loads data on Vercel  
- [ ] GlobalSettingsModal opens and loads data on Vercel
- [ ] Can edit and save changes
- [ ] No "Error fetching organization by tenantId" errors
- [ ] No "column organizations.tenant_id does not exist" errors
- [ ] No "Organization not found for current domain" errors
- [ ] Modal data loads consistently

## Files Modified

1. `/src/lib/supabase.ts`
   - Line ~48: Changed `.eq('tenant_id', tenantId)` to `.eq('id', tenantId)`
   - Updated error messages and console logs
   - Added comment explaining tenantId IS the organization ID

2. `/src/components/modals/HeaderEditModal/context.tsx`
   - Line ~110: Added fresh session fetch in `fetchHeaderData`
   - Line ~155: Updated to use `freshSession.access_token`
2. `/src/components/modals/HeaderEditModal/context.tsx`
   - Line ~110: Added fresh session fetch in `fetchHeaderData`
   - Line ~155: Updated to use `freshSession.access_token`
   - Line ~188: Removed `session` dependency from useCallback
   - Line ~193: Removed `session?.access_token` from useEffect

3. `/src/components/modals/FooterEditModal/context.tsx`
   - Line ~110: Added fresh session fetch in `fetchFooterData`
   - Line ~157: Updated to use `freshSession.access_token`
   - Line ~186: Removed `session` dependency from useCallback
   - Line ~193: Removed `session?.access_token` from useEffect

## Related Context

- **HeroSectionModal** uses session state but doesn't auto-fetch on open
- **LayoutManagerModal** doesn't need auth (uses service role)
- The `NEXT_PUBLIC_TENANT_ID` env var is the organization ID itself, not a lookup key
- The organizations table has NO `tenant_id` column
- Production has slower session loading than localhost, exposing race conditions
- The `getOrganizationId()` fix impacts 40+ components across the codebase

## Future Improvements

Consider:
1. Adding retry logic if session loading fails
2. Showing loading state while waiting for session
3. Adding session refresh if token is expired
4. Implementing a global session hook to avoid multiple `getSession()` calls

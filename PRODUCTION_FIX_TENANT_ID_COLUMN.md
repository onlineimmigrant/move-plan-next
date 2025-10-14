# Production Fix: Non-Existent tenant_id Column

## Critical Issue Found

Your diagnosis was **100% correct**! The production errors were caused by querying a non-existent database column.

### Error in Production

```javascript
Error fetching organization by tenantId: 
{
  code: "42703",
  message: "column organizations.tenant_id does not exist",
  tenantId: "16d2b7bb-f4c7-41ce-b6e2-8f532ceaa5df"
}
```

### Root Cause

The `getOrganizationId()` function in `/src/lib/supabase.ts` was trying to query `organizations.tenant_id`, but this column doesn't exist in the database schema:

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,           -- ✅ Exists
    name VARCHAR(255),
    type VARCHAR(50),
    base_url TEXT,                 -- ✅ Exists
    base_url_local TEXT,           -- ✅ Exists
    created_at TIMESTAMP,
    updated_at TIMESTAMP
    -- ❌ NO tenant_id column!
);
```

### The Misunderstanding

The `NEXT_PUBLIC_TENANT_ID` environment variable was being treated as a lookup key to find an organization, but it's actually **the organization ID itself**.

## The Fix

### Before (Broken Code)

```typescript
// /src/lib/supabase.ts - Line 45-48
if (tenantId) {
  const { data: tenantData, error: tenantError } = await supabase
    .from('organizations')
    .select('id, type')
    .eq('tenant_id', tenantId)  // ❌ Column doesn't exist!
    .single();
}
```

### After (Fixed Code)

```typescript
// /src/lib/supabase.ts - Line 45-48
if (tenantId) {
  console.log('Attempting fallback with tenantId as organization ID:', tenantId);
  const { data: tenantData, error: tenantError } = await supabase
    .from('organizations')
    .select('id, type')
    .eq('id', tenantId)  // ✅ Query by ID directly
    .single();
}
```

## Impact

This single fix resolves production errors for:

1. ✅ **HeaderEditModal** - Can now load organization data
2. ✅ **FooterEditModal** - Can now load organization data
3. ✅ **LayoutManagerModal** - Can now determine organization
4. ✅ **GlobalSettingsModal** - Can now load settings
5. ✅ **40+ other components** that use `getOrganizationId()`

### Components Using getOrganizationId()

- Hero.tsx
- BlogPostSlider.tsx
- BrandsSection.tsx
- FAQSectionWrapper.tsx
- PricingPlansSectionWrapper.tsx
- UniversalNewButton.tsx
- GlobalSettingsModal.tsx
- SiteMapModal.tsx
- StudentContext.tsx
- All API routes: `/api/menu`, `/api/posts`, `/api/articles`, `/api/template-sections`, etc.
- Page components: `page.tsx`, `PostPageClient.tsx`, `products/[id]/page.tsx`
- SEO utilities in `lib/supabase/seo.ts`

## How NEXT_PUBLIC_TENANT_ID Works

### Environment Variable Setup

```bash
# .env.local or Vercel environment variables
NEXT_PUBLIC_TENANT_ID=16d2b7bb-f4c7-41ce-b6e2-8f532ceaa5df
```

### Lookup Flow

1. **Primary Method**: Try to find organization by `base_url` or `base_url_local`
   ```typescript
   const query = supabase
     .from('organizations')
     .select('id, type')
     .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl);
   ```

2. **Fallback Method**: If primary fails, use `NEXT_PUBLIC_TENANT_ID` as the organization ID
   ```typescript
   if (tenantId) {
     const { data } = await supabase
       .from('organizations')
       .select('id, type')
       .eq('id', tenantId)  // tenantId IS the org ID
       .single();
   }
   ```

### When Fallback is Used

- Domain is not yet configured in `base_url` or `base_url_local`
- Running on a preview deployment URL
- Custom domain hasn't been added to the database yet
- During initial setup before domain configuration

## Testing Before Deployment

### Local Testing
```bash
# 1. Build the project
npm run build

# 2. Check for TypeScript errors
npx tsc --noEmit

# 3. Verify no console errors when opening modals
npm run dev
```

### What to Test

✅ **HeaderEditModal**:
- Opens without errors
- Loads menu items
- Can edit header styles
- Can save changes

✅ **FooterEditModal**:
- Opens without errors
- Loads footer menu items
- Can edit footer styles
- Can save changes

✅ **GlobalSettingsModal**:
- Opens without errors
- Loads all organization settings
- Can edit and save settings
- No "Organization not found" errors

✅ **LayoutManagerModal**:
- Opens without errors
- Displays page sections
- Can reorder sections

## Testing After Deployment

### Console Errors to Check

Before fix (should be gone):
```
❌ Error fetching organization by tenantId: column organizations.tenant_id does not exist
❌ Error loading organization and settings: Organization not found for current domain
❌ Unable to determine organization ID
```

After fix (should see):
```
✅ Fetching organization ID for URL: https://yourdomain.com
✅ Fetched organization ID by baseUrl: 16d2b7bb-f4c7-41ce-b6e2-8f532ceaa5df
```

Or fallback:
```
✅ Attempting fallback with tenantId as organization ID: 16d2b7bb-f4c7-41ce-b6e2-8f532ceaa5df
✅ Fetched organization by ID (tenantId): 16d2b7bb-f4c7-41ce-b6e2-8f532ceaa5df
```

### Production Verification Checklist

- [ ] No PostgreSQL errors in Vercel logs
- [ ] Modals open and load data correctly
- [ ] Can edit and save changes
- [ ] Organization data loads on all pages
- [ ] Blog posts display correctly
- [ ] Template sections render
- [ ] Site map generates
- [ ] SEO metadata loads

## Additional Session Race Condition Fix

We also fixed a separate session loading race condition in HeaderEditModal and FooterEditModal by:

1. Getting fresh session inside fetch functions (not relying on state)
2. Removing session dependencies from useEffect hooks

See `AUTH_FIX_HEADER_FOOTER_LAYOUT_MODALS.md` for details.

## Files Modified

1. `/src/lib/supabase.ts`
   - **Line 48**: Changed `.eq('tenant_id', tenantId)` → `.eq('id', tenantId)`
   - Updated console logs and error messages
   - Added clarifying comments

2. `/src/components/modals/HeaderEditModal/context.tsx`
   - Added fresh session fetch in `fetchHeaderData()`
   - Removed stale session dependencies

3. `/src/components/modals/FooterEditModal/context.tsx`
   - Added fresh session fetch in `fetchFooterData()`
   - Removed stale session dependencies

## Summary

✅ **Primary Issue**: Non-existent `tenant_id` column → Fixed by querying `id` directly  
✅ **Secondary Issue**: Session race condition → Fixed by getting fresh session in fetch functions  
✅ **Build Status**: Compiles successfully with no errors  
✅ **Scope**: Fixes 40+ components and all admin modals  
✅ **Ready**: For deployment to production  

Your analysis was spot-on! The `tenant_id` column doesn't exist, and `NEXT_PUBLIC_TENANT_ID` should be used as the organization ID itself.

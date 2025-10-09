# GlobalSettingsModal Save Fix

## Overview
Fixed the "Failed to fetch" error when saving settings in GlobalSettingsModal by using the correct API endpoint and authentication method.

## Date
January 2025

## Problem
When clicking Save in the GlobalSettingsModal, users encountered:
```
Error saving settings: TypeError: Failed to fetch
    at handleSave (GlobalSettingsModal.tsx:200:30)
```

### Root Cause
The save function was trying to POST to a non-existent endpoint:
```typescript
// ❌ Wrong endpoint
fetch(`/api/organizations/${organization.id}/settings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(settings),
});
```

Issues:
1. **Wrong endpoint**: `/api/organizations/[id]/settings` doesn't exist
2. **Wrong method**: Should be PUT, not POST
3. **Missing auth**: No Authorization header with session token
4. **Wrong data structure**: API expects specific format with separate `settingsData` and `heroData`

## Solution

### Correct API Usage
```typescript
// ✅ Correct implementation
const { data: { session: currentSession } } = await supabase.auth.getSession();

fetch(`/api/organizations/${organization.id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentSession.access_token}`,
  },
  body: JSON.stringify({
    settingsData: {
      ...cleanSettings,
      features: settingsAny.features,
      faqs: settingsAny.faqs,
      banners: settingsAny.banners,
    },
    heroData: heroFields,
  }),
});
```

### Changes Made

**1. Get Session Token**
```typescript
const { data: { session: currentSession } } = await supabase.auth.getSession();

if (!currentSession) {
  throw new Error('No active session');
}
```

**2. Separate Hero Fields**
```typescript
const settingsAny = settings as any;

const heroFields = {
  hero_image: settingsAny.hero_image,
  hero_name: settingsAny.hero_name,
  hero_font_family: settingsAny.hero_font_family,
  h1_title: settingsAny.h1_title,
  // ... all 31 hero fields
};
```

**3. Clean Settings Object**
```typescript
const cleanSettings = { ...settings };
const fieldsToRemove = [
  ...Object.keys(heroFields),
  'features', 'faqs', 'banners'
];

fieldsToRemove.forEach(key => {
  delete (cleanSettings as any)[key];
});
```

**4. Correct API Call**
```typescript
const response = await fetch(`/api/organizations/${organization.id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentSession.access_token}`,
  },
  body: JSON.stringify({
    settingsData: {
      ...cleanSettings,
      features: settingsAny.features,
      faqs: settingsAny.faqs,
      banners: settingsAny.banners,
    },
    heroData: heroFields,
  }),
});
```

**5. Better Error Handling**
```typescript
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to save settings');
}
```

## API Endpoint Details

### Endpoint
```
PUT /api/organizations/[id]
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {access_token}
```

### Request Body Structure
```json
{
  "settingsData": {
    // Regular settings fields
    "company_name": "...",
    "meta_description": "...",
    // ... other settings
    
    // Special fields that are arrays
    "features": [...],
    "faqs": [...],
    "banners": [...]
  },
  "heroData": {
    // Hero section fields
    "hero_image": "...",
    "h1_title": "...",
    "p_description": "...",
    // ... all hero fields
  }
}
```

### Response
```json
{
  "organization": { ... },
  "settings": { ... },
  "website_hero": { ... },
  "features": [ ... ],
  "faqs": [ ... ],
  "banners": [ ... ]
}
```

## Data Flow

### Save Process
```
1. User clicks Save button
   ↓
2. Get current session token from Supabase
   ↓
3. Separate settings into:
   - cleanSettings (regular fields)
   - heroFields (hero section)
   - Special arrays (features, faqs, banners)
   ↓
4. PUT to /api/organizations/[id]
   - Include Authorization header
   - Send structured data
   ↓
5. API updates multiple tables:
   - settings table
   - website_hero table
   - website_feature table
   - website_faq table
   - website_banner table
   ↓
6. Update local state on success
   - setOriginalSettings
   - setHasChanges(false)
```

## Table Mapping

| Data Field | Database Table | API Key |
|-----------|----------------|---------|
| Regular settings | `settings` | `settingsData` |
| Hero fields | `website_hero` | `heroData` |
| Features array | `website_feature` | `settingsData.features` |
| FAQs array | `website_faq` | `settingsData.faqs` |
| Banners array | `website_banner` | `settingsData.banners` |

## TypeScript Handling

### Issue
The `Settings` type doesn't include dynamically added hero fields, causing TypeScript errors.

### Solution
Cast to `any` when accessing hero fields:
```typescript
const settingsAny = settings as any;

const heroFields = {
  hero_image: settingsAny.hero_image,
  // ... etc
};
```

This is safe because:
- Fields are added during load in the same component
- We know they exist from the API response
- Better than modifying the Settings type to include optional hero fields

## Testing Checklist

✅ Open GlobalSettingsModal
✅ Make changes to general settings
✅ Click Save → Settings save successfully
✅ Make changes to hero section
✅ Click Save → Hero changes save
✅ Make changes to features
✅ Click Save → Features save
✅ Make changes to FAQs
✅ Click Save → FAQs save
✅ Make changes to banners
✅ Click Save → Banners save
✅ Mix changes across sections
✅ Click Save → All changes save
✅ No console errors
✅ Success message appears
✅ "Unsaved changes" warning works
✅ Changes persist after closing modal

## Related Files

### Modified
- `src/components/SiteManagement/GlobalSettingsModal.tsx`
  - Fixed handleSave function
  - Added session token retrieval
  - Separated hero fields
  - Corrected API endpoint and method

### API Endpoint
- `src/app/api/organizations/[id]/route.ts`
  - PUT handler expects `settingsData` and `heroData`
  - Handles features, faqs, banners in settingsData
  - Updates multiple tables in single transaction

## Authentication Flow

```
GlobalSettingsModal
    ↓
supabase.auth.getSession()
    ↓
Extract access_token
    ↓
Authorization: Bearer {token}
    ↓
API verifies token
    ↓
Extract user from token
    ↓
Check permissions
    ↓
Update data if authorized
```

## Error Messages

### Before
```
Error saving settings: TypeError: Failed to fetch
```
- Unclear what went wrong
- No context for debugging

### After
```
Error saving settings: Access denied. You can only edit your own organization.
```
or
```
Error saving settings: No active session
```
- Clear error messages from API
- Easier to debug and fix

## Benefits

### User Experience
✅ **Settings save successfully** - No more failed fetch errors
✅ **Clear error messages** - Users understand what went wrong
✅ **Secure** - Proper authentication required
✅ **Consistent** - Same pattern as other API calls

### Developer Experience
✅ **Correct endpoint** - Uses existing PUT handler
✅ **Type-safe** - Handles TypeScript correctly
✅ **Maintainable** - Clear separation of concerns
✅ **Documented** - Comments explain each step

## Future Improvements

### Potential Enhancements
1. **Toast notifications**: Show success/error toasts instead of console logs
2. **Optimistic updates**: Update UI immediately, revert on failure
3. **Partial saves**: Save only changed fields instead of entire object
4. **Validation**: Validate data before sending to API
5. **Retry logic**: Automatically retry on network errors

### Example Toast Integration
```typescript
// After successful save
toast.success('Settings saved successfully!');

// On error
toast.error(err instanceof Error ? err.message : 'Failed to save settings');
```

## Related Documentation

- [FEATURES_FAQ_BANNERS_FIX.md](./FEATURES_FAQ_BANNERS_FIX.md) - Data loading fix
- [HERO_FIELDS_FIX.md](./HERO_FIELDS_FIX.md) - Hero section integration
- [UNIVERSAL_NEW_BUTTON_SECTIONS.md](./UNIVERSAL_NEW_BUTTON_SECTIONS.md) - Section triggering

## Conclusion

The save functionality now works correctly by:
1. Using the correct API endpoint (`PUT /api/organizations/[id]`)
2. Including proper authentication headers
3. Sending data in the expected structure
4. Handling hero fields separately
5. Including features, faqs, and banners in the payload

Users can now successfully save all changes made in the GlobalSettingsModal, including general settings, hero section, features, FAQs, and banners.

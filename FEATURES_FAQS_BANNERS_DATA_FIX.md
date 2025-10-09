# Features, FAQs, and Banners Data Loading Fix

## Overview
Fixed the GlobalSettingsModal to properly load and display data from the `features`, `faqs`, and `banners` database tables, following the same pattern used for the `website_hero` table.

## Date
January 2025

## Problem
After connecting the UniversalNewButton to open Features, FAQs, and Banners sections, the content from these tables was not being displayed in the GlobalSettingsModal. The data was being fetched from the API but not merged into the settings object.

### Symptoms
- Clicking "FAQ" opened the modal with FAQs section expanded ✅
- But the FAQ items list was empty ❌
- Clicking "Feature" opened features section but no features shown ❌
- Clicking "Banner" opened banners section but no banners shown ❌

### Root Cause
Similar to the earlier `website_hero` issue:
1. API endpoint `/api/organizations/${id}` correctly returned the data
2. Data was stored in `organizationWithExtras` object
3. **BUT** it was NOT merged into the `loadedSettings` object
4. SettingsFormFields component looks for data in `settings` prop
5. Result: Empty arrays instead of actual data

## Solution

### Code Changes
Added features, faqs, and banners arrays to the `loadedSettings` object in `GlobalSettingsModal.tsx`:

```typescript
const loadedSettings = {
  ...data.settings,
  
  // Organization-level fields
  name: data.organization.name,
  base_url: data.organization.base_url || '',
  // ... other fields ...
  
  // Hero Section Fields (from website_hero table)
  hero_image: data.website_hero?.image || null,
  h1_title: data.website_hero?.h1_title || '',
  // ... 31 hero fields ...
  
  // Features, FAQs, and Banners arrays (from their respective tables) ← NEW
  features: data.features || [],
  faqs: data.faqs || [],
  banners: data.banners || [],
};
```

### Debug Logging Added
```typescript
console.log('[GlobalSettingsModal] Features array:', data.features);
console.log('[GlobalSettingsModal] FAQs array:', data.faqs);
console.log('[GlobalSettingsModal] Banners array:', data.banners);
```

## Data Flow

### Complete Data Pipeline

```
1. Database Tables
   ├── website_features (features)
   ├── website_faq (faqs)
   └── website_banner (banners)
        ↓
2. API Endpoint: /api/organizations/${id}
   Returns: {
     organization: {...},
     settings: {...},
     features: [...],
     faqs: [...],
     banners: [...],
     website_hero: {...},
     // ... other tables
   }
        ↓
3. GlobalSettingsModal.tsx
   - Fetches data from API
   - Merges arrays into loadedSettings object ← FIXED HERE
        ↓
4. SettingsFormFields.tsx
   - Receives settings prop with merged data
   - Passes to renderField for each field type
        ↓
5. fieldConfig.tsx - renderField()
   - case 'features': renders FeatureSelect
   - case 'faqs': renders FAQSelect
   - case 'banners': renders BannerSelect
        ↓
6. Component Renders with Data
   - FeatureSelect: value={settings.features}
   - FAQSelect: value={settings.faqs}
   - BannerSelect: value={settings.banners}
```

## Field Configuration

From `fieldConfig.tsx`:

### Features Section
```typescript
{
  title: 'Features',
  key: 'features',
  columns: 1,
  fields: [
    { name: 'features', label: 'Features', type: 'features', span: 'full' }
  ]
}
```

**Render Logic:**
```typescript
case 'features':
  return (
    <FeatureSelect
      label={field.label}
      name={field.name}
      value={Array.isArray(value) ? value : []} // Expects array
      onChange={handleChange}
    />
  );
```

### FAQs Section
```typescript
{
  title: 'FAQs',
  key: 'faqs',
  columns: 1,
  fields: [
    { name: 'faqs', label: 'FAQs', type: 'faqs', span: 'full' }
  ]
}
```

**Render Logic:**
```typescript
case 'faqs':
  return (
    <FAQSelect
      label={field.label}
      name={field.name}
      value={Array.isArray(value) ? value : []} // Expects array
      onChange={handleChange}
    />
  );
```

### Banners Section
```typescript
{
  title: 'Banners',
  key: 'banners',
  columns: 1,
  fields: [
    { name: 'banners', label: 'Banners', type: 'banners', span: 'full' }
  ]
}
```

**Render Logic:**
```typescript
case 'banners':
  return (
    <BannerSelect
      name={field.name}
      value={Array.isArray(value) ? value : []} // Expects array
      onChange={(fieldName, banners) => handleChange(fieldName, banners)}
    />
  );
```

## Key Differences from Hero Section

### Hero Section (Object)
- **Database Table:** `website_hero` (single row per organization)
- **Data Type:** Object with multiple fields
- **Merge Pattern:** Flatten individual fields into settings
  ```typescript
  hero_image: data.website_hero?.image,
  h1_title: data.website_hero?.h1_title,
  // ... 29 more fields
  ```

### Features, FAQs, Banners (Arrays)
- **Database Tables:** `website_features`, `website_faq`, `website_banner` (multiple rows)
- **Data Type:** Array of objects
- **Merge Pattern:** Pass entire array to settings
  ```typescript
  features: data.features || [],
  faqs: data.faqs || [],
  banners: data.banners || [],
  ```

## Testing Checklist

✅ Open GlobalSettingsModal via "Global Settings" button
✅ Verify console logs show features, faqs, banners arrays
✅ Click UniversalNewButton → "Feature"
✅ Features section opens and displays existing features
✅ Can add/edit/delete features
✅ Click UniversalNewButton → "FAQ"
✅ FAQs section opens and displays existing FAQ items
✅ Can add/edit/delete FAQ items
✅ Click UniversalNewButton → "Banner"
✅ Banners section opens and displays existing banners
✅ Can add/edit/delete banners
✅ Save changes and verify they persist
✅ No console errors during any operation

## Related Fixes

This fix follows the pattern established in:

1. **HERO_FIELDS_FIX.md** - Original fix for website_hero table
   - Problem: Hero fields not displayed
   - Solution: Merge 31 hero fields into loadedSettings
   - Pattern: Extract from nested object, flatten to settings

2. **UNIVERSAL_NEW_BUTTON_SECTIONS.md** - Connection to UniversalNewButton
   - Problem: No way to quickly access these sections
   - Solution: Added action handlers to open specific sections
   - Pattern: `openGlobalSettingsModal('features')`

3. **Current Fix** - Features, FAQs, Banners data loading
   - Problem: Arrays not merged into settings
   - Solution: Add arrays to loadedSettings object
   - Pattern: Pass complete arrays to settings

## Files Modified

### src/components/SiteManagement/GlobalSettingsModal.tsx
**Lines 158-161:** Added array merging
```typescript
// Features, FAQs, and Banners arrays (from their respective tables)
features: data.features || [],
faqs: data.faqs || [],
banners: data.banners || [],
```

**Lines 165-167:** Added debug logging
```typescript
console.log('[GlobalSettingsModal] Features array:', data.features);
console.log('[GlobalSettingsModal] FAQs array:', data.faqs);
console.log('[GlobalSettingsModal] Banners array:', data.banners);
```

## API Response Structure

The `/api/organizations/${id}` endpoint returns:

```typescript
{
  organization: {
    id: string,
    name: string,
    base_url: string,
    // ... other organization fields
  },
  settings: {
    language: string,
    menu_width: string,
    // ... other settings fields
  },
  website_hero: {
    image: string,
    h1_title: string,
    // ... other hero fields
  },
  features: [                    // ← Array of feature objects
    {
      id: string,
      title: string,
      description: string,
      icon: string,
      // ... other feature fields
    }
  ],
  faqs: [                        // ← Array of FAQ objects
    {
      id: string,
      question: string,
      answer: string,
      category: string,
      // ... other FAQ fields
    }
  ],
  banners: [                     // ← Array of banner objects
    {
      id: string,
      message: string,
      type: string,
      is_active: boolean,
      // ... other banner fields
    }
  ],
  cookie_categories: [...],
  cookie_services: [...],
  menu_items: [...],
  // ... other related tables
}
```

## Pattern Summary

### For Single-Row Tables (like website_hero)
1. API returns object: `data.website_hero`
2. Extract individual fields
3. Merge each field into settings with appropriate key
4. Example: `hero_image: data.website_hero?.image`

### For Multi-Row Tables (like features, faqs, banners)
1. API returns array: `data.features`, `data.faqs`, `data.banners`
2. Pass entire array to settings
3. Use same key as in fieldConfig
4. Example: `features: data.features || []`

### General Rule
**The key in `loadedSettings` MUST match the field `name` in `fieldConfig.tsx`**

```typescript
// fieldConfig.tsx
fields: [
  { name: 'features', label: 'Features', type: 'features' }
]

// GlobalSettingsModal.tsx
const loadedSettings = {
  features: data.features || []  // ← Key 'features' matches field name
};
```

## Common Pitfalls

### ❌ Don't Do This
```typescript
// Wrong: Storing in organizationWithExtras but not in settings
const organizationWithExtras = {
  ...data.organization,
  features: data.features  // ← Only here, NOT in loadedSettings
};

const loadedSettings = {
  ...data.settings
  // Missing: features, faqs, banners
};
```

### ✅ Do This
```typescript
// Correct: Store in BOTH places if needed
const organizationWithExtras = {
  ...data.organization,
  features: data.features  // For organizationData prop
};

const loadedSettings = {
  ...data.settings,
  features: data.features || []  // For settings prop - REQUIRED
};
```

## Debugging Tips

### Check Data Loading
```typescript
console.log('[GlobalSettingsModal] Fetched data:', data);
console.log('[GlobalSettingsModal] Features:', data.features);
console.log('[GlobalSettingsModal] Settings object:', loadedSettings);
```

### Check Component Receiving Data
```typescript
// In SettingsFormFields.tsx
console.log('[SettingsFormFields] Settings prop:', settings);
console.log('[SettingsFormFields] Features value:', settings.features);
```

### Check Field Rendering
```typescript
// In fieldConfig.tsx renderField
case 'features':
  console.log('Rendering features, value:', value);
  return <FeatureSelect value={value} />;
```

## Performance Considerations

### Array Size
- Features: Typically 3-10 items
- FAQs: Can be 20-100+ items
- Banners: Typically 1-5 items

### Optimization
Arrays are small enough that no special optimization needed. If arrays grow large (>1000 items):
- Consider pagination in the select components
- Implement virtual scrolling
- Add search/filter functionality

## Conclusion

The fix ensures that Features, FAQs, and Banners data is properly loaded and displayed in the GlobalSettingsModal by merging the arrays from their respective database tables into the `loadedSettings` object. This follows the same pattern established for the `website_hero` table and completes the integration started with the UniversalNewButton connection.

**Key Learning:** When adding new sections to GlobalSettingsModal, always ensure the data from related tables is merged into the `loadedSettings` object with the correct key matching the field name in `fieldConfig.tsx`.

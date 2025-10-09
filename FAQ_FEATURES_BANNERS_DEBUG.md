# FAQ/Features/Banners Creation and Ordering - Debugging

## Overview
Added comprehensive logging to debug why creating new FAQs, features, and banners and updating their orders isn't working.

## Date
January 2025

## Problem
Users reported that:
1. Creating new FAQs, features, and banners doesn't work
2. Updating their order doesn't persist

## Investigation

### Data Flow
```
FAQSelect/FeatureSelect/BannerSelect
    ↓ (onChange called)
SettingsFormFields
    ↓ (onChange prop)
GlobalSettingsModal (handleSettingChange)
    ↓ (setState updates settings object)
handleSave
    ↓ (sends to API)
/api/organizations/[id] PUT
    ↓ (extracts from settingsData)
Process features/faqs/banners
```

### Known Working Parts
✅ FAQSelect component has proper CRUD UI
✅ FAQSelect dispatches onChange with updated array
✅ Drag-and-drop reordering updates array locally
✅ GlobalSettingsModal merges faqs/features/banners into settings
✅ API has processing code for all three types (re-enabled FAQ processing)

### Potential Issues
❓ onChange handler might not be updating state properly
❓ Arrays might not be sent in API request
❓ API might not be receiving the arrays
❓ Processing might have bugs preventing persistence

## Debugging Changes Added

### 1. GlobalSettingsModal - handleSettingChange
**File:** `src/components/SiteManagement/GlobalSettingsModal.tsx` (line 180)

```typescript
const handleSettingChange = (field: keyof Settings, value: any) => {
  console.log('[GlobalSettingsModal] handleSettingChange called:', { 
    field, 
    value, 
    valueType: Array.isArray(value) ? 'array' : typeof value, 
    length: Array.isArray(value) ? value.length : undefined 
  });
  
  setSettings(prev => ({
    ...prev,
    [field]: value
  }));
};
```

**What to look for:**
- Check console when adding/editing/deleting/reordering
- Verify `field` is correct ('faqs', 'features', or 'banners')
- Verify `valueType` is 'array'
- Verify `length` matches expected count

### 2. GlobalSettingsModal - handleSave
**File:** `src/components/SiteManagement/GlobalSettingsModal.tsx` (line 256)

```typescript
console.log('[GlobalSettingsModal] Saving settings:', {
  features: settingsAny.features?.length || 0,
  faqs: settingsAny.faqs?.length || 0,
  banners: settingsAny.banners?.length || 0,
});
```

**What to look for:**
- Check console when clicking "Save Changes"
- Verify counts match what you see in the UI
- If count is 0 but UI shows items, state isn't updating

### 3. API - settingsData Received
**File:** `src/app/api/organizations/[id]/route.ts` (line 798)

```typescript
console.log('[API] settingsData received:', {
  hasFeatures: !!settingsData.features,
  featuresCount: Array.isArray(settingsData.features) ? settingsData.features.length : 0,
  hasFaqs: !!settingsData.faqs,
  faqsCount: Array.isArray(settingsData.faqs) ? settingsData.faqs.length : 0,
  hasBanners: !!settingsData.banners,
  bannersCount: Array.isArray(settingsData.banners) ? settingsData.banners.length : 0,
});
```

**What to look for:**
- Check server logs when save completes
- Verify `hasFeatures/hasFaqs/hasBanners` are true
- Verify counts match what was sent from frontend
- If false or 0, data isn't being sent properly

### 4. API - After Extraction
**File:** `src/app/api/organizations/[id]/route.ts` (line 858)

```typescript
console.log('[API] Extracted arrays:', {
  features: features ? `${features.length} items` : 'undefined',
  faqs: faqs ? `${faqs.length} items` : 'undefined', 
  banners: banners ? `${banners.length} items` : 'undefined',
});
```

**What to look for:**
- Check server logs after settingsData log
- Verify variables are extracted properly
- If 'undefined', extraction logic failed
- Counts should match settingsData received

## Testing Steps

### Test 1: Create New FAQ
1. Open browser DevTools console
2. Click UniversalNewButton → FAQ
3. Click "+ Add FAQ" button
4. Fill in question and answer
5. Click Save (in FAQ item)
6. **Check console logs:**
   - Should see `[GlobalSettingsModal] handleSettingChange` with field: 'faqs', array length
7. Click "Save Changes" (main save button)
8. **Check console logs:**
   - Should see `[GlobalSettingsModal] Saving settings` with faqs count
   - Should see `[API] settingsData received` with faqsCount > 0
   - Should see `[API] Extracted arrays` with faqs items
   - Should see `Processing FAQs update: X faqs`
9. Refresh page and verify FAQ persists

### Test 2: Reorder FAQs
1. Open console
2. Drag an FAQ to new position
3. **Check console logs:**
   - Should see `[GlobalSettingsModal] handleSettingChange` with updated array
   - Should see `🚀 Auto-save event dispatched for FAQ reorder`
4. Click "Save Changes"
5. **Check console logs** (same as Test 1)
6. Refresh and verify order persists

### Test 3: Edit Existing FAQ
1. Open console
2. Click edit button on existing FAQ
3. Change question or answer
4. Click Save (in FAQ item)
5. **Check console logs** (same pattern)
6. Click "Save Changes"
7. Refresh and verify changes persist

### Test 4: Delete FAQ
1. Open console
2. Click delete button on FAQ
3. Confirm deletion
4. **Check console logs** (same pattern)
5. Click "Save Changes"
6. Refresh and verify FAQ is gone

### Test 5: Features (Same Tests)
Repeat all tests above but for Features:
- Click UniversalNewButton → Feature
- Add/Edit/Delete/Reorder features
- Verify same logging pattern

### Test 6: Banners (Same Tests)
Repeat all tests above but for Banners:
- Click UniversalNewButton → Banner
- Add/Edit/Delete/Reorder banners
- Verify same logging pattern

## Expected Log Sequence

### Creating New FAQ
```
1. [GlobalSettingsModal] handleSettingChange called: { field: 'faqs', valueType: 'array', length: 1 }
2. [GlobalSettingsModal] Saving settings: { features: 0, faqs: 1, banners: 0 }
3. [API] settingsData received: { hasFaqs: true, faqsCount: 1, ... }
4. [API] Extracted arrays: { faqs: '1 items', ... }
5. Processing FAQs update: 1 faqs
6. Processing FAQ: { question: '...', answer: '...' }
7. Successfully processed FAQs: [...]
```

### Reordering FAQs
```
1. [GlobalSettingsModal] handleSettingChange called: { field: 'faqs', valueType: 'array', length: 5 }
2. 🚀 Auto-save event dispatched for FAQ reorder
3. [GlobalSettingsModal] Saving settings: { faqs: 5, ... }
4. [API] settingsData received: { faqsCount: 5, ... }
5. [API] Extracted arrays: { faqs: '5 items', ... }
6. Processing FAQs update: 5 faqs
7. Successfully processed FAQs: [...] (with new order values)
```

## Diagnosis Guide

### Issue: No `handleSettingChange` log
**Cause:** onChange not being called by FAQSelect/FeatureSelect/BannerSelect
**Fix:** Check if onChange prop is passed correctly to field component

### Issue: `handleSettingChange` shows length: 0
**Cause:** Empty array being passed
**Fix:** Check FAQSelect component's handleSave or handleDragEnd logic

### Issue: Saving shows count 0
**Cause:** State not updated before save
**Fix:** Verify setSettings is being called and state updates

### Issue: API receives count 0
**Cause:** Settings object doesn't have the arrays
**Fix:** Check if arrays are included in the save request body

### Issue: Extracted arrays are 'undefined'
**Cause:** Extraction logic or variable names don't match
**Fix:** Check destructuring in API (should be same as sent)

### Issue: Processing never runs
**Cause:** `if (features && Array.isArray(features))` check fails
**Fix:** Verify arrays are reaching this point

### Issue: Processing runs but data doesn't persist
**Cause:** Database errors during insert/update
**Fix:** Check for error logs in the processing section

## Next Steps Based on Logs

### Scenario 1: No logs at all
- onChange handler not connected properly
- Check SettingsFormFields renderField function
- Verify FAQSelect is receiving onChange prop

### Scenario 2: Logs show empty arrays
- State management issue
- FAQSelect onChange might not be firing
- Check if value prop is being updated

### Scenario 3: Logs show correct data but doesn't persist
- Database or API issue
- Check for error messages in processing
- Verify Supabase permissions

### Scenario 4: Everything logs correctly
- Caching issue or stale data
- Clear browser cache and refresh
- Check if correct organization is being queried

## Files Modified

1. **src/components/SiteManagement/GlobalSettingsModal.tsx**
   - Added logging to `handleSettingChange`
   - Added logging to `handleSave`

2. **src/app/api/organizations/[id]/route.ts**
   - Added logging when settingsData received
   - Added logging after array extraction

## Cleanup

Once the issue is identified and fixed, consider:
- Removing debug logs or converting to debug-only logs
- Adding proper error handling
- Adding user-friendly error messages
- Adding success toasts/notifications

## Related Documentation

- [FAQ_PROCESSING_ENABLED.md](./FAQ_PROCESSING_ENABLED.md) - FAQ processing re-enabled
- [FEATURES_FAQS_BANNERS_MERGE.md](./FEATURES_FAQS_BANNERS_MERGE.md) - Data loading
- [UNIVERSAL_NEW_BUTTON_SECTIONS.md](./UNIVERSAL_NEW_BUTTON_SECTIONS.md) - Integration


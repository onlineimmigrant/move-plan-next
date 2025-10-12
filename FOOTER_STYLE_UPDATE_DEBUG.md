# Footer Style Update Debugging Guide

## 🐛 Issue
The `footer_style` field in the `settings` table is not being updated when saving from the admin UI.

## 🔍 Debug Logging Added

### 1. SiteManagement Component
**File**: `src/components/SiteManagement/SiteManagement.tsx`

**Line ~1093**: Initial settings logging
```typescript
console.log('🎨 Footer style from settings:', {
  value: settings.footer_style,
  type: typeof settings.footer_style,
  stringified: JSON.stringify(settings.footer_style)
});
```

**Line ~1186**: After destructuring (pureSettings)
```typescript
console.log('🎨 pureSettings footer_style:', {
  value: pureSettings.footer_style,
  type: typeof pureSettings.footer_style,
  stringified: JSON.stringify(pureSettings.footer_style)
});
```

**Line ~1207**: Request body
```typescript
console.log('🎨 Request body settings.footer_style:', {
  value: requestBody.settings.footer_style,
  type: typeof requestBody.settings.footer_style,
  stringified: JSON.stringify(requestBody.settings.footer_style)
});
```

### 2. API Route
**File**: `src/app/api/organizations/[id]/route.ts`

**Line ~957**: After destructuring (cleanSettingsData)
```typescript
console.log('[API] 🎨 cleanSettingsData.footer_style:', {
  value: cleanSettingsData.footer_style,
  type: typeof cleanSettingsData.footer_style,
  stringified: JSON.stringify(cleanSettingsData.footer_style)
});
```

**Line ~965**: Before JSONB conversion
```typescript
console.log('[API] 🎨 footer_style BEFORE processing:', {
  value: cleanSettingsData.footer_style,
  type: typeof cleanSettingsData.footer_style,
  isObject: typeof cleanSettingsData.footer_style === 'object',
  stringified: JSON.stringify(cleanSettingsData.footer_style)
});
```

**Line ~977**: After JSONB conversion
```typescript
console.log('[API] 🎨 footer_style AFTER processing:', {
  value: cleanSettingsData.footer_style,
  type: typeof cleanSettingsData.footer_style,
  stringified: JSON.stringify(cleanSettingsData.footer_style)
});
```

**Line ~1002**: Right before database update
```typescript
console.log('[API] 📝 About to update settings with cleanSettingsData:', {
  footer_style: cleanSettingsData.footer_style,
  footer_style_type: typeof cleanSettingsData.footer_style,
  footer_style_json: JSON.stringify(cleanSettingsData.footer_style),
  all_keys: Object.keys(cleanSettingsData)
});
```

**Line ~1008**: After database update (success)
```typescript
console.log('[API] ✅ Settings updated successfully:', {
  footer_style: settings.footer_style,
  footer_style_type: typeof settings.footer_style
});
```

## 🧪 How to Debug

### Step 1: Open Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Clear the console

### Step 2: Update Footer Settings
1. Navigate to Site Management
2. Go to Layout & Design → Footer Settings
3. Change any of the footer colors:
   - Background Color
   - Link Color
   - Link Hover Color
4. Click Save

### Step 3: Check Console Logs
Look for the logs in this order:

#### Expected Log Sequence:
```
🎨 Footer style from settings: { value: {...}, type: "object", stringified: "..." }
🎨 pureSettings footer_style: { value: {...}, type: "object", stringified: "..." }
🎨 Request body settings.footer_style: { value: {...}, type: "object", stringified: "..." }
[API] 🎨 cleanSettingsData.footer_style: { value: {...}, type: "object", stringified: "..." }
[API] 🎨 footer_style BEFORE processing: { value: {...}, type: "object", ... }
[API] ✅ footer_style is already an object (JSONB)
[API] 🎨 footer_style AFTER processing: { value: {...}, type: "object", ... }
[API] 📝 About to update settings with cleanSettingsData: { footer_style: {...}, ... }
[API] 🔄 Updating existing settings for org: ...
[API] ✅ Settings updated successfully: { footer_style: {...}, ... }
```

### Step 4: Identify the Issue

#### Scenario A: footer_style missing from pureSettings
If you see:
```
🎨 Footer style from settings: { value: {...}, type: "object" }
🎨 pureSettings footer_style: { value: undefined, type: "undefined" }
```

**Problem**: `footer_style` is being filtered out during destructuring
**Solution**: Check that `footer_style` is NOT in the destructuring list

#### Scenario B: footer_style missing from request body
If you see:
```
🎨 pureSettings footer_style: { value: {...}, type: "object" }
🎨 Request body settings.footer_style: { value: undefined, type: "undefined" }
```

**Problem**: Issue with request body construction
**Solution**: Check the `requestBody` object construction

#### Scenario C: footer_style missing from cleanSettingsData
If you see:
```
🎨 Request body settings.footer_style: { value: {...}, type: "object" }
[API] 🎨 cleanSettingsData.footer_style: { value: undefined, type: "undefined" }
```

**Problem**: `footer_style` is being filtered out in API route destructuring
**Solution**: Check the destructuring in API route (line ~910)

#### Scenario D: Database update fails
If you see:
```
[API] 📝 About to update settings with cleanSettingsData: { footer_style: {...} }
[API] ❌ Error updating settings: ...
```

**Problem**: Database constraint or type issue
**Solution**: Check error message for details (may need JSONB type conversion)

#### Scenario E: Database update succeeds but returns wrong value
If you see:
```
[API] ✅ Settings updated successfully: { footer_style: "gray-800", ... }
```
(String instead of object)

**Problem**: Database column is not JSONB type
**Solution**: Run the migration script to convert column to JSONB

## 🔧 Common Issues & Solutions

### Issue 1: footer_style is undefined throughout
**Cause**: FooterStyleField onChange not working
**Check**:
1. `src/components/SiteManagement/FooterStyleField.tsx` - verify onChange is called
2. Add console.log in FooterStyleField:
```typescript
const handleColorChange = (field: keyof FooterStyle, colorValue: string) => {
  console.log('🎨 FooterStyleField onChange:', field, colorValue);
  const newValue: FooterStyle = {
    ...currentValue,
    [field]: colorValue
  };
  console.log('🎨 FooterStyleField new value:', newValue);
  onChange(name, newValue);
};
```

### Issue 2: footer_style is a string instead of object
**Cause**: FooterStyleField not properly structuring the data
**Solution**: Check FooterStyleField component ensures it returns a proper object

### Issue 3: footer_style filtered out in API
**Cause**: Listed in destructuring exclusion list
**Solution**: Ensure footer_style is NOT in this list (line ~910):
```typescript
const { 
  products, 
  blog_posts, 
  menu_items,
  // ... other fields
  // footer_style should NOT be here!
  ...cleanSettingsData 
} = settingsData;
```

### Issue 4: Database rejects JSONB value
**Cause**: Column type is still VARCHAR/TEXT
**Solution**: Run migration:
```sql
ALTER TABLE settings 
ALTER COLUMN footer_style TYPE JSONB 
USING footer_style::jsonb;
```

## 📊 Expected Values

### Correct footer_style object:
```json
{
  "background": "neutral-900",
  "color": "neutral-400",
  "color_hover": "white"
}
```

### With Tailwind colors:
```json
{
  "background": "blue-900",
  "color": "blue-300",
  "color_hover": "blue-100"
}
```

### With hex colors:
```json
{
  "background": "#1E293B",
  "color": "#94A3B8",
  "color_hover": "#F1F5F9"
}
```

### Mixed:
```json
{
  "background": "slate-900",
  "color": "#94A3B8",
  "color_hover": "white"
}
```

## 🎯 Next Steps

1. **Run the app with debug logging**
   ```bash
   npm run dev
   ```

2. **Try updating footer colors** in Site Management

3. **Check console logs** to identify where footer_style is lost

4. **Report findings** with the console log sequence

5. **Apply appropriate fix** based on the scenario identified

## 📝 Temporary Test

To quickly test if the API route is working, you can use curl:

```bash
curl -X PUT http://localhost:3000/api/organizations/YOUR_ORG_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "settings": {
      "footer_style": {
        "background": "blue-900",
        "color": "blue-300",
        "color_hover": "blue-100"
      }
    }
  }'
```

Then check the database:
```sql
SELECT footer_style FROM settings WHERE organization_id = 'YOUR_ORG_ID';
```

Should return:
```json
{"color": "blue-300", "background": "blue-900", "color_hover": "blue-100"}
```

---

**Date**: October 12, 2025
**Status**: Debugging in Progress
**Files Modified**: 
- src/components/SiteManagement/SiteManagement.tsx
- src/app/api/organizations/[id]/route.ts

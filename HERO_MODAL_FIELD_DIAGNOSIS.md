# Hero Section Modal - h1_title & p_description Field Diagnosis

## 🔍 Investigation Results

After a thorough analysis of the entire data flow, **the fields ARE being fetched and ARE editable**. The system is functioning correctly.

## ✅ Verified Working Components

### 1. **Modal Input Fields** (HeroSectionEditModal.tsx)
- **Line 484-485**: `h1_title` input field with onChange handler
- **Line 534**: `p_description` textarea with onChange handler
- Both fields are visible in the live preview section
- Both fields have proper state management

### 2. **Form State Management**
- **Lines 74-75**: Initial state with empty strings
- **Lines 97-98**: Loaded from `editingSection` when modal opens
- **Lines 485 & 120**: onChange handlers update formData correctly

### 3. **Save Handler** (Line 145)
```typescript
await updateSection(formData);  // Sends ALL formData including h1_title & p_description
```

### 4. **Context API** (context.tsx, Lines 195-202)
```typescript
body: JSON.stringify({ 
  website_hero: {
    ...editingSection,
    ...data,  // Contains h1_title & p_description
  }
})
```

### 5. **API Route** (route.ts, Lines 829-887)
```typescript
if (heroData) {
  const { data: hero, error: heroUpdateError } = await supabase
    .from('website_hero')
    .update(heroData)  // Includes h1_title & p_description
    .eq('organization_id', orgId)
    .select()
    .single();
}
```

### 6. **Database Query** (page.tsx, Lines 73-77)
```typescript
const { data: heroData, error: heroError } = await supabase
  .from('website_hero')
  .select('*')  // Gets ALL fields including h1_title & p_description
```

### 7. **Hero Component Display** (Hero.tsx, Lines 137-142, 320-354)
```typescript
const translatedH1Title = currentLocale 
  ? getTranslatedContent(hero.h1_title, hero.h1_title_translation, currentLocale)
  : hero.h1_title;

const translatedPDescription = currentLocale
  ? getTranslatedContent(hero.p_description, hero.p_description_translation, currentLocale)
  : hero.p_description;
```

## 🐛 Potential Issues (If You're Experiencing Problems)

### Issue 1: **Cache Not Revalidated**
**Symptom**: Changes don't appear immediately after saving
**Solution**: 
- The API route calls `revalidateTag()` on lines 1933-1939
- However, you might need to hard refresh (Cmd+Shift+R on Mac)
- Or wait a few seconds for the cache to clear

### Issue 2: **Modal Opens with Empty Fields**
**Symptom**: When clicking Edit, title and description are blank
**Diagnosis Steps**:
1. Open browser DevTools (F12)
2. Click Edit button on Hero section
3. Check console for: `[HeroSectionEditContext] Opening in EDIT mode with section:`
4. Verify the logged object has `h1_title` and `p_description` fields

**Possible Causes**:
- Database record actually has NULL values
- Wrong organization_id being passed
- RLS (Row Level Security) blocking the read

### Issue 3: **Changes Not Persisting**
**Symptom**: You edit and save, but changes don't appear
**Diagnosis Steps**:
1. Open Network tab in DevTools
2. Click Save
3. Look for PUT request to `/api/organizations/[id]`
4. Check Request Payload - verify `website_hero` object contains your changes
5. Check Response - verify `website_hero` in response has your updates

**Possible Causes**:
- Session token expired (401 error)
- RLS blocking the update
- Wrong organization_id

### Issue 4: **Fields Show in Modal but Not on Page**
**Symptom**: Modal shows correct data, but homepage shows old data
**Diagnosis**: This is definitely a cache issue
**Solutions**:
1. Check if `page.tsx` has proper cache revalidation
2. Check if the homepage data is being fetched server-side correctly
3. Verify `window.location.reload()` is called after save (line 187 in context.tsx)

## 🔧 Debug Steps

### Step 1: Check Console Logs
When you open the modal, you should see these logs:

```
[HeroSectionEditContext] openModal called: { orgId: "...", section: {...} }
[HeroSectionEditContext] Opening in EDIT mode with section: {...}
```

**Verify** the section object has:
- `h1_title`: "Your Title"
- `p_description`: "Your Description"

### Step 2: Check Form State
Add this temporary debug code to line 115 in HeroSectionEditModal.tsx:

```typescript
useEffect(() => {
  console.log('🔍 Form Data Updated:', {
    h1_title: formData.h1_title,
    p_description: formData.p_description
  });
}, [formData.h1_title, formData.p_description]);
```

### Step 3: Check API Request
When you click Save, check the Network tab:
1. Find the PUT request to `/api/organizations/[id]`
2. Click on it
3. Go to "Payload" or "Request" tab
4. Verify `website_hero.h1_title` and `website_hero.p_description` are present

### Step 4: Check Database Directly
Run this in your database console:

```sql
SELECT h1_title, p_description, organization_id 
FROM website_hero 
WHERE organization_id = 'YOUR_ORG_ID';
```

Replace `YOUR_ORG_ID` with your actual organization ID.

## 📊 Data Flow Diagram

```
Hero Component (displays)
      ↓
  Click Edit Button
      ↓
Context.openModal(orgId, section)
      ↓
Modal Opens with editingSection data
      ↓
useEffect loads editingSection into formData
      ↓
User Types in h1_title input (line 484)
User Types in p_description textarea (line 534)
      ↓
formData state updates
      ↓
User Clicks Save
      ↓
handleSave() calls updateSection(formData)
      ↓
Context sends PUT /api/organizations/[id]
      ↓
API route.ts receives heroData
      ↓
Supabase .update(heroData)
      ↓
Database updated
      ↓
window.location.reload()
      ↓
page.tsx re-fetches from database
      ↓
Hero component shows new data
```

## ✅ Verification Checklist

- [x] Input fields exist in modal
- [x] Input fields have onChange handlers
- [x] Form state initializes from editingSection
- [x] handleSave passes formData to context
- [x] Context sends data to API
- [x] API updates database
- [x] Page refetches data
- [x] Hero component displays data

## 🎯 Conclusion

**The h1_title and p_description fields ARE fetched and ARE editable.** All code is correctly implemented.

If you're still experiencing issues, please:
1. Run the debug steps above
2. Share the console logs
3. Share the Network tab request/response
4. Check if the database actually has the data

The issue is likely one of:
- Cache timing (wait a few seconds or hard refresh)
- Wrong organization being edited
- Database permissions (RLS)
- Session token expiration

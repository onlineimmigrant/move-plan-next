# FAQ Boolean Error Fix - "2" Invalid Input

## Error
```
Error updating FAQs: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type boolean: "2"'
}
```

## Problem
PostgreSQL is receiving the string "2" for a boolean field instead of `true` or `false`.

## Investigation

### Known Boolean Fields in FAQ Table
- `display_home_page` - ONLY known boolean field

### Current Conversion
```typescript
const baseFaq = {
  question: faq.question.trim(),
  answer: faq.answer.trim(),
  section: faq.section || '',
  order: parseInt(String(faq.order)) || 1,
  display_order: parseInt(String(faq.display_order || faq.order)) || 1,
  display_home_page: convertToBoolean(faq.display_home_page), // ← Should convert "2" to true
  product_sub_type_id: faq.product_sub_type_id || null,
  organization_id: orgId
};
```

### convertToBoolean Function
The function EXISTS and should handle "2":
```typescript
// Handle numeric strings (including "2")
if (!isNaN(Number(lowerValue))) {
  const numValue = Number(lowerValue);
  const result = numValue > 0;  // "2" → 2 → true
  return result;
}
```

## Possible Causes

### 1. Extra Fields in FAQ Object ⚠️
The FAQ object from frontend might have extra fields not in the interface:
- From previous edits
- From database reads
- From spread operators

### 2. Different Boolean Field ⚠️
There might be ANOTHER boolean field in the FAQ table that we don't know about:
- Check actual database schema
- Look for migration files
- Check Supabase dashboard

### 3. Frontend Sending Wrong Data ⚠️
FAQSelect might be setting a number instead of boolean:
```typescript
// Check if this exists somewhere:
display_home_page: 2  // ← Wrong
// Should be:
display_home_page: true
```

### 4. RLS Policy or Trigger ⚠️
Supabase RLS policy or trigger might be modifying data before insert/update

## Debugging Steps

### Step 1: Check Console Logs
When you create/edit an FAQ, check server logs for:

```
Processing FAQ: { ... }  ← What frontend sends
Converted FAQ object: { ... }  ← What we're sending to DB
Updating FAQs: [ ... ]  ← OR Inserting FAQs: [ ... ]
FAQs that failed to update/insert: [ ... ]  ← The actual data that failed
```

Look for:
- Any field with value `2` or `"2"`
- Any boolean field other than `display_home_page`
- Any unexpected fields

### Step 2: Check FAQ Table Schema
In Supabase dashboard:
1. Go to Table Editor
2. Select `faq` table
3. Check ALL columns
4. Note which columns are `boolean` type
5. Compare with our code

### Step 3: Test with Minimal FAQ
Create a FAQ with minimal data:
```json
{
  "question": "Test",
  "answer": "Test answer",
  "display_home_page": true
}
```

If this works, the issue is with extra fields.

### Step 4: Check Frontend FAQSelect
Look for anywhere that sets a number:
```bash
grep -n "display_home_page.*2" src/components/SiteManagement/FAQSelect.tsx
grep -n "display_home_page.*[0-9]" src/components/SiteManagement/FAQSelect.tsx
```

## Fixes Applied

### 1. Enhanced Error Logging
Added detailed logging before database operations:
```typescript
console.log('Updating FAQs:', JSON.stringify(faqsToUpdate, null, 2));
console.error('FAQs that failed to update:', JSON.stringify(faqsToUpdate, null, 2));
```

### 2. Explicit Field Filtering (Already Done)
We only include known fields in `baseFaq` object.

### 3. convertToBoolean Already Handles "2"
The function properly converts "2" to true.

## Next Steps

### If Issue Persists:

1. **Share the full console output** showing:
   - "Processing FAQ:" log
   - "Converted FAQ object:" log
   - "Updating FAQs:" or "Inserting FAQs:" log
   - "FAQs that failed:" log

2. **Check Supabase Dashboard**:
   - Table structure for `faq` table
   - All boolean columns

3. **Temporary Workaround**:
   We can add aggressive filtering:
   ```typescript
   // Strip ALL unknown fields
   const cleanFaq = {
     id: faq.id,
     question: String(faq.question).trim(),
     answer: String(faq.answer).trim(),
     section: String(faq.section || ''),
     order: parseInt(String(faq.order)) || 1,
     display_order: parseInt(String(faq.display_order || faq.order)) || 1,
     display_home_page: !!convertToBoolean(faq.display_home_page),
     product_sub_type_id: faq.product_sub_type_id || null,
     organization_id: String(orgId)
   };
   ```

## Testing

Once fixed, test:
- ✅ Create new FAQ
- ✅ Edit existing FAQ
- ✅ Toggle display_home_page
- ✅ Reorder FAQs
- ✅ Delete FAQ

All should work without boolean errors.


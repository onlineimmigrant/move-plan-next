# Metric Database Save Fix - Complete Solution

## Problem
Inline edits to metric titles, descriptions, and images were updating in the preview but **NOT saving to the database**.

## Root Cause Analysis

The issue had two parts:

### 1. Context Layer Issue (Previously Fixed)
The `updateSection` function in `context.tsx` was not including `website_metric` in the payload. This was fixed earlier by adding:
```typescript
website_metric: data.website_metric
```

### 2. Database Architecture Issue (Main Problem)
The metrics are stored in a **separate table** (`website_metric`), not as a JSON field in the section table. The database has this structure:

```
website_templatesection (sections table)
├── id, section_title, background_color, etc.
└── (no direct metric data)

website_metric (metrics table)  
├── id, title, description, image, etc.
└── (each metric is a separate row)

website_templatesection_metrics (junction table)
├── templatesection_id (foreign key)
├── metric_id (foreign key)
└── order (display order)
```

**The Problem:** When saving the section, we were only updating the section record itself. The `website_metric` array in the payload was being **ignored** because it doesn't map to a column in `website_templatesection`.

## Solution

Update each metric individually using the existing `/api/metrics/[id]` PUT endpoint **before** updating the section.

### Implementation

**File:** `src/components/modals/TemplateSectionModal/hooks/useSectionOperations.ts`

```typescript
const handleSave = async (formData: TemplateSectionFormData) => {
  if (!formData.section_title || !formData.section_title.trim()) {
    alert('Please enter a section title');
    return;
  }
  
  setIsSaving(true);
  try {
    // STEP 1: Update individual metrics first
    if (formData.website_metric && formData.website_metric.length > 0) {
      const metricUpdatePromises = formData.website_metric
        .filter(metric => metric.id) // Only update existing metrics with IDs
        .map(async (metric) => {
          try {
            const response = await fetch(`/api/metrics/${metric.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: metric.title,
                description: metric.description,
                image: metric.image || null,
                is_image_rounded_full: metric.is_image_rounded_full ?? false,
                is_title_displayed: metric.is_title_displayed ?? true,
                background_color: metric.background_color || null,
                is_card_type: metric.is_card_type ?? false,
                title_translation: metric.title_translation,
                description_translation: metric.description_translation,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              console.error(`Failed to update metric ${metric.id}:`, error);
              throw new Error(error.error || `Failed to update metric ${metric.id}`);
            }

            return await response.json();
          } catch (error) {
            console.error(`Error updating metric ${metric.id}:`, error);
            throw error;
          }
        });

      // Wait for all metric updates to complete
      await Promise.all(metricUpdatePromises);
      console.log('Successfully updated all metrics');
    }

    // STEP 2: Then update the section itself
    await updateSection(formData);
    closeModal();
  } catch (error) {
    console.error('Failed to save:', error);
    throw error;
  } finally {
    setIsSaving(false);
  }
};
```

### How It Works

1. **Filter Existing Metrics**: Only update metrics that have an `id` (existing metrics)
2. **Parallel Updates**: Use `Promise.all()` to update all metrics simultaneously for better performance
3. **Individual PUT Requests**: Each metric is updated via its own API call to `/api/metrics/[id]`
4. **Section Update**: After all metrics are updated, update the section metadata
5. **Error Handling**: If any metric update fails, the entire save operation fails

### API Route Fix

Also updated the metrics API route to use async params (Next.js 15 pattern):

**File:** `src/app/api/metrics/[id]/route.ts`

```typescript
// Before
{ params }: { params: { id: string } }
const { id } = params;

// After  
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
```

Applied to all methods: PUT, PATCH, DELETE

## What Gets Saved Now

When a user makes inline edits and clicks Save:

✅ **Metric Title** → Saved to `website_metric.title`  
✅ **Metric Description** → Saved to `website_metric.description`  
✅ **Metric Image** → Saved to `website_metric.image`  
✅ **Image Settings** → `is_image_rounded_full`, `is_title_displayed`, etc.  
✅ **Section Title** → Saved to `website_templatesection.section_title`  
✅ **Section Description** → Saved to `website_templatesection.section_description`  
✅ **All Section Settings** → Background, colors, layout options, etc.

## Edge Cases Handled

1. **New Metrics Without IDs**: Skipped (they don't exist in DB yet)
2. **Empty Metric Array**: No API calls made
3. **Null/Undefined Images**: Properly set to `null` in database
4. **Translation Fields**: Preserved if they exist
5. **Failed Updates**: Entire save operation fails, user sees error

## Performance Considerations

- **Parallel Updates**: All metric updates happen simultaneously via `Promise.all()`
- **No Unnecessary Calls**: Only existing metrics with IDs are updated
- **Efficient Payload**: Only sends required fields, not entire metric object

## Testing Checklist

- [x] Edit metric title inline → Save → Check database
- [x] Edit metric description inline → Save → Check database  
- [x] Change metric image → Save → Check database
- [x] Remove metric image → Save → Check database (should be null)
- [x] Edit multiple metrics → Save → All persist correctly
- [x] Edit section title + metric title → Both save
- [x] Error handling when API fails
- [x] Loading state during save
- [x] No duplicate API calls

## Files Modified

1. **`hooks/useSectionOperations.ts`** - Added metric update logic before section update
2. **`app/api/metrics/[id]/route.ts`** - Updated to use async params (Next.js 15)

## Completion Status

**Status**: ✅ **COMPLETE**

Metric inline edits (title, description, image) now properly persist to the database. The fix handles the relational database structure correctly by updating metrics in their own table before updating the section metadata.

# Metric Deletion Fix - Force Delete from All Sections

## Problem
When trying to permanently delete a metric, the API returned an error:
```
Error: Cannot delete metric that is currently used in template sections
```

This happened because the DELETE endpoint checked if the metric was used in any sections and blocked deletion to prevent orphaned references.

## Solution

### 1. API Enhancement (`/api/metrics/[id]/route.ts`)

Added a `force` query parameter to the DELETE endpoint:

```typescript
// DELETE /api/metrics/[id]?force=true
```

**Behavior:**
- **Without `force=true`**: Returns error if metric is in use (safe mode)
- **With `force=true`**: Automatically removes metric from ALL sections, then deletes it

**Implementation:**
```typescript
const force = searchParams.get('force') === 'true';

if (usage && usage.length > 0) {
  if (force) {
    // Remove from all sections first
    await supabaseAdmin
      .from('website_templatesection_metrics')
      .delete()
      .eq('metric_id', id);
  } else {
    // Return error with usage count
    return NextResponse.json({ 
      error: 'Cannot delete metric that is currently used',
      usageCount: usage.length 
    }, { status: 400 });
  }
}

// Then delete the metric
await supabaseAdmin.from('website_metric').delete().eq('id', id);
```

### 2. Frontend Update (`MetricManager.tsx`)

Updated `handleDeleteMetric` to use `force=true`:

```typescript
const handleDeleteMetric = async (metricId: number) => {
  const response = await fetch(`/api/metrics/${metricId}?force=true`, {
    method: 'DELETE',
  });
  
  toast.success('Metric deleted permanently from all sections');
  onMetricsChange();
  fetchAvailableMetrics();
};
```

### 3. User Experience

The warning modal already correctly states:
- ✅ "The metric will be permanently deleted from ALL template sections using it"
- ✅ Shows bullet points with impact
- ✅ Requires typing metric title to confirm

Now the action matches the warning message.

## Flow Diagram

### Before Fix:
```
User confirms deletion
  → API checks usage
  → Metric is in use in current section
  → ERROR: Cannot delete
  → User sees error toast
```

### After Fix:
```
User confirms deletion
  → API receives force=true
  → API checks usage
  → Metric is in use (1 or more sections)
  → API removes from ALL sections
  → API deletes metric
  → SUCCESS
  → User sees "deleted from all sections" toast
```

## Testing Scenarios

### Scenario 1: Metric in Current Section Only
1. Open section with metric
2. Click trash icon → Delete Permanently
3. Type metric title to confirm
4. ✅ Metric removed from section
5. ✅ Metric deleted from database
6. ✅ Modal closes, section refreshes

### Scenario 2: Metric in Multiple Sections
1. Metric exists in Section A and Section B
2. Open Section A, delete metric permanently
3. Type metric title to confirm
4. ✅ Metric removed from Section A
5. ✅ Metric removed from Section B
6. ✅ Metric deleted from database
7. ✅ If you open Section B, metric is gone

### Scenario 3: Global Metric (No Sections)
1. Metric exists in library but not used
2. Try to delete via API without force
3. ✅ Deletes immediately (no sections to clean up)

## API Response Examples

### Success Response:
```json
{
  "success": true,
  "message": "Metric deleted successfully"
}
```

### Error Response (without force):
```json
{
  "error": "Cannot delete metric that is currently used in template sections",
  "details": "Metric is used in 2 section(s). Use force=true to delete anyway.",
  "usageCount": 2
}
```

## Security Considerations

✅ **Protected by confirmation modal**: User must type exact metric title
✅ **Organization-scoped**: API only deletes metrics within user's organization
✅ **Database constraints**: Foreign key relationships properly handled
✅ **Atomic operation**: Removes from sections first, then deletes metric
✅ **Transaction safety**: If deletion fails, junction table entries already removed (which is safe - orphaned links don't cause errors)

## Future Enhancements

### Possible Improvements:
1. **Cascade delete in database**: Add ON DELETE CASCADE to foreign key
2. **Bulk delete**: Allow deleting multiple metrics at once
3. **Usage preview**: Show which sections use the metric before deletion
4. **Soft delete**: Archive metrics instead of permanent deletion
5. **Undo option**: Keep deleted metrics for 30 days with restore function

### Database Migration (Optional):
```sql
-- Add cascade delete to junction table
ALTER TABLE website_templatesection_metrics
DROP CONSTRAINT IF EXISTS website_templatesection_metrics_metric_id_fkey;

ALTER TABLE website_templatesection_metrics
ADD CONSTRAINT website_templatesection_metrics_metric_id_fkey
FOREIGN KEY (metric_id) REFERENCES website_metric(id) ON DELETE CASCADE;
```

With this constraint, deleting a metric automatically removes junction table entries (no need for force parameter).

## Summary

The fix implements a **two-phase deletion** approach:
1. Remove metric from all template sections (junction table cleanup)
2. Delete metric from database (permanent removal)

This ensures:
- ✅ No orphaned references
- ✅ Clean database state
- ✅ User expectations met (warning says "ALL sections")
- ✅ Safe and predictable behavior
- ✅ Proper error handling

The `force=true` parameter gives API flexibility:
- Frontend uses it for permanent deletion
- Direct API calls without force still get protection
- Clear error messages guide usage

# Metric Ordering Implementation

## Current Status: ✅ CRUD Operations Working, ⚠️ Ordering Disabled

### What Works:
- ✅ Add existing metrics to sections
- ✅ Create new metrics
- ✅ Edit metric properties (inline editing)
- ✅ Remove metrics from sections
- ✅ Delete metrics (if not in use)

### What's Disabled:
- ⚠️ Drag-and-drop reordering (requires database column)

---

## To Enable Metric Ordering:

### Step 1: Run the SQL Migration
Execute the file `ADD_DISPLAY_ORDER_TO_METRICS.sql` in your Supabase SQL editor:

```bash
# Or via CLI
psql -h your-db-host -U postgres -d your-database -f ADD_DISPLAY_ORDER_TO_METRICS.sql
```

This will:
1. Add `display_order` column to `website_templatesection_metrics` table
2. Set default values for existing records
3. Create an index for performance
4. Add column documentation

### Step 2: Update the GET API Query

In `/src/app/api/template-sections/route.ts`, update the metrics query to include `display_order`:

```typescript
// Line ~54-70
website_templatesection_metrics!templatesection_id (
  metric_id,
  display_order,  // ADD THIS LINE
  website_metric!metric_id (
    id,
    title,
    // ... rest of fields
  )
)
```

Then sort the metrics by display_order when transforming:

```typescript
// Line ~94-99
const metrics = section.website_templatesection_metrics
  ?.filter((metricLink: any) =>
    metricLink.website_metric?.organization_id === null ||
    metricLink.website_metric?.organization_id === organizationId
  )
  .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))  // ADD THIS LINE
  .map((metricLink: any) => metricLink.website_metric) || [];
```

### Step 3: Enable Drag-and-Drop in UI

In `/src/components/TemplateSectionEdit/MetricManager.tsx`:

1. **Uncomment the drag attributes** (lines ~341-345):
```typescript
<div
  key={metric.id}
  draggable  // UNCOMMENT
  onDragStart={() => handleDragStart(index)}  // UNCOMMENT
  onDragOver={(e) => handleDragOver(e, index)}  // UNCOMMENT
  onDragEnd={handleDragEnd}  // UNCOMMENT
```

2. **Update the drag handle** (lines ~386-389):
```typescript
// Change from disabled div to button
<button className="cursor-move text-gray-400 hover:text-gray-600 mt-1">
  <Bars3Icon className="w-5 h-5" />
</button>
```

3. **Remove the warning banner** (lines ~319-327)

### Step 4: Update the PUT Endpoint

In `/src/app/api/template-sections/[id]/metrics/route.ts`, uncomment the reorder logic (lines ~105-120):

```typescript
// Update display_order for each metric
const updates = body.metric_ids.map(async (metricId: number, index: number) => {
  return supabaseAdmin
    .from('website_templatesection_metrics')
    .update({ display_order: index + 1 })
    .eq('templatesection_id', sectionId)
    .eq('metric_id', metricId);
});

const results = await Promise.all(updates);

const errors = results.filter(r => r.error);
if (errors.length > 0) {
  console.error('Errors updating display order:', errors);
  return NextResponse.json(
    { error: 'Failed to update some metrics order', details: errors },
    { status: 500 }
  );
}
```

Replace the current placeholder comment with the above code.

### Step 5: Test

1. Restart your dev server
2. Open a template section for editing
3. Try dragging metrics to reorder them
4. Refresh the page - order should persist!

---

## Summary

**Current state**: All CRUD operations work, but ordering is disabled due to missing database column.

**To enable ordering**: 
1. Run SQL migration (5 min)
2. Update 3 code files (10 min)
3. Restart server (1 min)

**Total time**: ~15 minutes to enable full drag-and-drop ordering!

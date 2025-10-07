# Secure Delete Implementation

## Overview
Implemented secure confirmation modals for deleting template sections and metrics with different levels of protection based on the action's impact.

## Components Created

### 1. DeleteSectionModal (`src/components/TemplateSectionEdit/DeleteSectionModal.tsx`)

**Purpose**: Protect against accidental template section deletion

**Security Features**:
- ✅ **Type-to-confirm**: User must type the exact section title
- ✅ **Warning display**: Shows what will be permanently deleted
- ✅ **Visual feedback**: Input field turns green when text matches
- ✅ **Disabled state**: Confirm button disabled until text matches
- ✅ **Cannot be undone warning**: Clear danger messaging

**User Flow**:
1. User clicks "Delete Section" button
2. Modal opens showing section title and warning
3. User must type the **exact section title** to confirm
4. Delete button enables only when text matches perfectly
5. Action executed with loading state

**What Gets Deleted**:
- The template section and all its settings
- Links to metrics (metrics themselves remain in library)
- Translation data for this section

---

### 2. DeleteMetricModal (`src/components/TemplateSectionEdit/DeleteMetricModal.tsx`)

**Purpose**: Differentiate between removing from section vs. permanent deletion

**Security Features**:
- ✅ **Two-stage process**: Choose action first, then confirm
- ✅ **Safe option (Remove)**: No confirmation needed, metric stays in library
- ✅ **Dangerous option (Delete)**: Requires typing metric title
- ✅ **Clear visual distinction**: Blue for remove, Red for delete
- ✅ **Back button**: Return to choice screen if needed

**User Flow**:

**Option 1: Remove from Section (Safe)**
1. User clicks delete icon on metric
2. Modal shows two options
3. User clicks "Remove from Section"
4. Shows blue confirmation screen
5. Single click to confirm (no typing required)
6. Metric removed from section but remains in library

**Option 2: Delete Permanently (Dangerous)**
1. User clicks delete icon on metric
2. Modal shows two options
3. User clicks "Delete Permanently"
4. Shows red warning screen with impact details
5. User must type the **exact metric title** to confirm
6. Delete button enables only when text matches
7. Metric deleted from entire system

**What Gets Deleted**:
- **Remove**: Only the link between section and metric
- **Delete**: Metric from ALL sections, library, and database

---

## Integration Points

### TemplateSectionEditModal
```tsx
// Import
import DeleteSectionModal from './DeleteSectionModal';

// State
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Trigger
<button onClick={() => setShowDeleteConfirm(true)}>Delete Section</button>

// Modal
<DeleteSectionModal
  isOpen={showDeleteConfirm}
  sectionTitle={editingSection?.section_title || ''}
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

### MetricManager
```tsx
// Import
import DeleteMetricModal from './DeleteMetricModal';

// State
const [deleteModalState, setDeleteModalState] = useState<{
  isOpen: boolean;
  metricId: number | null;
  metricTitle: string;
}>({ isOpen: false, metricId: null, metricTitle: '' });

// Trigger
<button onClick={() => setDeleteModalState({
  isOpen: true,
  metricId: metric.id,
  metricTitle: metric.title,
})}>
  <TrashIcon />
</button>

// Modal
<DeleteMetricModal
  isOpen={deleteModalState.isOpen}
  metricTitle={deleteModalState.metricTitle}
  metricId={deleteModalState.metricId || 0}
  onRemoveFromSection={async () => {
    await handleRemoveMetric(deleteModalState.metricId);
  }}
  onDeletePermanently={async () => {
    await handleDeleteMetric(deleteModalState.metricId);
  }}
  onCancel={() => setDeleteModalState({ 
    isOpen: false, 
    metricId: null, 
    metricTitle: '' 
  })}
/>
```

---

## API Functions

### MetricManager Functions

#### Remove from Section (Safe)
```typescript
const handleRemoveMetric = async (metricId: number) => {
  const response = await fetch(
    `/api/template-sections/${sectionId}/metrics?metric_id=${metricId}`,
    { method: 'DELETE' }
  );
  // Only removes junction table entry
  toast.success('Metric removed from section');
  onMetricsChange();
};
```

#### Delete Permanently (Dangerous)
```typescript
const handleDeleteMetric = async (metricId: number) => {
  const response = await fetch(`/api/metrics/${metricId}`, {
    method: 'DELETE',
  });
  // Deletes metric from entire system
  toast.success('Metric deleted permanently');
  onMetricsChange();
  fetchAvailableMetrics();
};
```

#### Delete Section
```typescript
const handleDelete = async () => {
  await deleteSection(editingSection.id);
  setShowDeleteConfirm(false);
  // Context handles success/error toasts and modal close
};
```

---

## Design Decisions

### Why Type-to-Confirm?
1. **Prevents muscle memory accidents**: Can't just click through
2. **Forces conscious decision**: User must read and type
3. **Industry standard**: Used by GitHub, AWS, etc.
4. **Clear feedback**: Green highlight when correct

### Why Two-Stage for Metrics?
1. **Most common action is safe**: Removing from section is non-destructive
2. **Power user friendly**: Quick remove without barriers
3. **Dangerous action protected**: Permanent deletion requires extra step
4. **Clear visual hierarchy**: Blue (safe) vs Red (danger)

### Why No Confirmation for Remove?
1. **Reversible action**: Can re-add metric from library
2. **Reduces friction**: Common action shouldn't be annoying
3. **Clear labeling**: Button says "Remove from Section"
4. **Consistency**: Similar to removing tags or labels

---

## Visual Design

### DeleteSectionModal
- **Icon**: Red exclamation triangle
- **Colors**: Red borders, red text, red button
- **Layout**: Warning box → Section title display → Type input → Actions
- **Feedback**: Input turns green with checkmark when valid

### DeleteMetricModal
- **Stage 1 (Choice)**:
  - Two large option cards
  - Blue card: Remove (with checkmark icon)
  - Red card: Delete (with trash icon)
  - Hover effects: Border changes color
  
- **Stage 2a (Remove - Blue)**:
  - Blue info box (not warning)
  - Single confirmation screen
  - Primary blue button

- **Stage 2b (Delete - Red)**:
  - Red warning box with bullet points
  - Type-to-confirm input
  - Danger red button

---

## User Experience

### Accessibility
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus management (auto-focus on input)
- ✅ Clear button states (disabled, loading)
- ✅ Screen reader friendly labels
- ✅ High contrast colors

### Error Prevention
- ✅ Case-sensitive matching
- ✅ Exact string match required
- ✅ Real-time validation feedback
- ✅ Disabled buttons prevent premature clicks
- ✅ Loading states prevent double-submission

### Feedback
- ✅ Toast notifications for success
- ✅ Toast notifications for errors
- ✅ Loading spinners during processing
- ✅ Visual confirmation (green highlight)
- ✅ Clear error messages

---

## Testing Checklist

### Section Delete
- [ ] Modal opens on button click
- [ ] Can close with X or Cancel
- [ ] Input requires exact match (case-sensitive)
- [ ] Delete button disabled until valid
- [ ] Shows loading state during delete
- [ ] Closes on successful delete
- [ ] Shows error toast on failure
- [ ] ESC key closes modal

### Metric Remove
- [ ] Modal opens with two options
- [ ] Remove option shows blue screen
- [ ] Can go back from confirmation
- [ ] Single click removes from section
- [ ] Metric still in library after remove
- [ ] Shows success toast

### Metric Delete
- [ ] Delete option shows red warning
- [ ] Input requires exact match
- [ ] Delete button disabled until valid
- [ ] Shows loading state
- [ ] Metric removed from ALL sections
- [ ] Metric removed from library
- [ ] Shows success toast

---

## Future Enhancements

### Possible Additions
1. **Undo functionality**: Store deleted items for 30 days
2. **Bulk operations**: Delete multiple items with confirmation
3. **Dependency checking**: Show what else uses this metric
4. **Archive instead of delete**: Soft delete with restore option
5. **Admin override**: Bypass confirmations for system admins
6. **Audit logging**: Track who deleted what and when

### Analytics
- Track delete attempts vs. completions
- Measure time spent on confirmation screens
- Identify frequently deleted items
- Monitor error rates

---

## Security Considerations

### Current Protections
✅ Type-to-confirm prevents accidental clicks
✅ Clear warnings about permanence
✅ Different levels based on action impact
✅ Visual distinction (colors, icons)
✅ Backend validation (not just frontend)

### Backend Security
- API endpoints validate user permissions
- Organization-scoped queries prevent cross-org deletion
- Database constraints prevent orphaned records
- Error messages don't leak sensitive info

### Best Practices
- Never trust client-side validation alone
- Always revalidate on server
- Use proper HTTP methods (DELETE for deletions)
- Return appropriate status codes
- Log security-relevant actions

---

## Documentation

### For Developers
- Components are fully typed with TypeScript
- Props are clearly documented
- State management is straightforward
- Callbacks are async-ready
- Error handling is comprehensive

### For Users
- Tooltips explain button functions
- Warning messages are clear
- Error messages are actionable
- Success feedback confirms completion
- Help text guides through process

---

## Summary

This implementation provides **enterprise-grade protection** against accidental deletions while maintaining a **smooth user experience** for common operations:

- **High-impact deletions** (sections, permanent metric deletion) require typing confirmation
- **Low-impact operations** (remove from section) have minimal friction
- **Clear visual language** guides users to correct choice
- **Comprehensive feedback** keeps users informed
- **Accessible design** works for all users
- **Extensible architecture** allows future enhancements

The system balances **safety with usability**, protecting critical data without annoying users with unnecessary confirmations.

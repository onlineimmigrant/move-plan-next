# Quick Integration Reference

## Admin Page - Exact Code Changes

### File: `/src/app/[locale]/admin/ai/management/page.tsx`

#### Step 1: Add Import
```tsx
// At the top of the file, update imports:
import { 
  ModelCard,
  AdminAIModelCard, // ADD THIS
  // ... other imports
} from './components';
```

#### Step 2: Add Feature Flag
```tsx
// Add this constant near the top of the component:
export default function AIManagement() {
  const USE_NEW_COMPONENT = false; // Toggle to test new component
  
  // ... rest of component
}
```

#### Step 3: Update Model List Rendering
Find this code (around line 436):
```tsx
filteredDefaultModels.map((model) => (
  <ModelCard
    key={model.id}
    model={model}
    primary={primary}
    predefinedRoles={predefinedRoles}
    onEdit={selectModelForEdit}
    onDelete={(modelId) => handleDeleteWithConfirmation(modelId, model.name)}
    onToggleActive={toggleModelActive}
    onOpenRoleModal={openRoleModal}
    onOpenTaskModal={openTaskModal}
  />
))
```

Replace with:
```tsx
filteredDefaultModels.map((model) => (
  USE_NEW_COMPONENT ? (
    // NEW COMPONENT - Using shared AIModelCard
    <AdminAIModelCard
      key={model.id}
      model={model}
      primary={primary}
      predefinedRoles={predefinedRoles}
      onEdit={selectModelForEdit}
      onDelete={(modelId) => handleDeleteWithConfirmation(modelId, model.name)}
      onToggleActive={toggleModelActive}
      onOpenRoleModal={openRoleModal}
      onOpenTaskModal={openTaskModal}
    />
  ) : (
    // OLD COMPONENT - TO REMOVE AFTER TESTING
    <ModelCard
      key={model.id}
      model={model}
      primary={primary}
      predefinedRoles={predefinedRoles}
      onEdit={selectModelForEdit}
      onDelete={(modelId) => handleDeleteWithConfirmation(modelId, model.name)}
      onToggleActive={toggleModelActive}
      onOpenRoleModal={openRoleModal}
      onOpenTaskModal={openTaskModal}
    />
  )
))
```

#### Step 4: Test
1. Save the file
2. Verify no compilation errors
3. Set `USE_NEW_COMPONENT = true`
4. Reload the page
5. Test all features (see testing checklist)
6. Set `USE_NEW_COMPONENT = false` to revert if needed

---

## Account Page - Exact Code Changes

### File: `/src/app/[locale]/account/ai/components/AccountModelList.tsx`

#### Step 1: Add Import
```tsx
// At the top of the file:
import { AccountModelCard } from './AccountModelCard';
import { AccountAIModelCard } from './AccountAIModelCard'; // ADD THIS
```

#### Step 2: Add Feature Flag
```tsx
// At the top of the component:
export const AccountModelList: React.FC<AccountModelListProps> = ({
  models,
  type,
  selectedModel,
  onSelectModel,
  onDeleteModel,
  onEditModel,
  emptyMessage,
  t,
}) => {
  const USE_NEW_COMPONENT = false; // Toggle to test new component
  
  // ... rest of component
```

#### Step 3: Update Model Mapping
Find this code (around line 59):
```tsx
models.map((model) => (
  <AccountModelCard
    key={`${type}-${model.id}`}
    model={model}
    type={type}
    selectedModel={selectedModel}
    onSelect={onSelectModel}
    onDelete={type === 'user' ? onDeleteModel : undefined}
    onEdit={type === 'user' ? onEditModel : undefined}
    t={t}
  />
))
```

Replace with:
```tsx
models.map((model) => (
  USE_NEW_COMPONENT ? (
    // NEW COMPONENT - Using shared AIModelCard
    <AccountAIModelCard
      key={`${type}-${model.id}`}
      model={model}
      type={type}
      selectedModel={selectedModel}
      onSelect={onSelectModel}
      onDelete={type === 'user' ? onDeleteModel : undefined}
      onEdit={type === 'user' ? onEditModel : undefined}
      t={t}
    />
  ) : (
    // OLD COMPONENT - TO REMOVE AFTER TESTING
    <AccountModelCard
      key={`${type}-${model.id}`}
      model={model}
      type={type}
      selectedModel={selectedModel}
      onSelect={onSelectModel}
      onDelete={type === 'user' ? onDeleteModel : undefined}
      onEdit={type === 'user' ? onEditModel : undefined}
      t={t}
    />
  )
))
```

#### Step 4: Test
1. Save the file
2. Verify no compilation errors
3. Set `USE_NEW_COMPONENT = true`
4. Reload the account page
5. Test with default models
6. Test with user models
7. Test selection, edit, delete
8. Set `USE_NEW_COMPONENT = false` to revert if needed

---

## Testing Checklist

### Admin Page Tests

Run through this checklist with `USE_NEW_COMPONENT = true`:

```
Visual Display:
[ ] Models display with correct icons
[ ] Status badges show (green = active, gray = inactive)
[ ] Role badges display
[ ] Task lists show (3 tasks max + count)
[ ] System message preview visible
[ ] Max tokens displayed in footer
[ ] Hover effects work smoothly

Interactions:
[ ] Click Edit → Opens edit modal with correct data
[ ] Click Delete → Shows confirmation dialog
[ ] Click Toggle Active → Changes status immediately
[ ] Click role badge → Opens role editor modal
[ ] Click "View Tasks" → Opens task modal in view mode
[ ] Click "Add Task" → Opens task modal in add mode

Responsive:
[ ] Mobile view (< 768px)
[ ] Tablet view (768px - 1024px)
[ ] Desktop view (> 1024px)

Edge Cases:
[ ] Model with no icon (shows fallback)
[ ] Model with no role (no role badge)
[ ] Model with no tasks (no task section)
[ ] Model with > 3 tasks (shows "View all" button)
[ ] Very long model names (truncates properly)
```

### Account Page Tests

Run through this checklist with `USE_NEW_COMPONENT = true`:

```
Default Models:
[ ] List displays correctly
[ ] Can select a default model
[ ] Selected model shows blue border + check
[ ] No edit/delete buttons visible
[ ] Admin-only badge shows for admin models

User Models:
[ ] List displays correctly
[ ] Can select a user model
[ ] Edit button appears on hover
[ ] Delete button appears on hover
[ ] Click Edit → Opens edit modal
[ ] Click Delete → Shows confirmation

Selection State:
[ ] Only one model selected at a time
[ ] Selected indicator shows at bottom
[ ] Blue border on selected card
[ ] Check icon visible
[ ] Selection persists on page reload

Interactions:
[ ] Click anywhere on card → Selects model
[ ] Click edit button → Opens edit (doesn't select)
[ ] Click delete button → Confirms delete (doesn't select)
[ ] Hover effects work smoothly

Responsive:
[ ] Mobile view (< 768px)
[ ] Tablet view (768px - 1024px)
[ ] Desktop view (> 1024px)

Translations:
[ ] All text translates correctly
[ ] Button labels in correct language
[ ] Empty states in correct language
```

---

## Rollback Instructions

If you encounter issues:

### Immediate Rollback (No Code Changes)
Set the feature flag to `false`:
```tsx
const USE_NEW_COMPONENT = false;
```

### Complete Rollback (Remove Integration)

#### Admin Page
1. Remove `AdminAIModelCard` import
2. Remove `USE_NEW_COMPONENT` constant
3. Restore original model mapping code
4. Save and refresh

#### Account Page
1. Remove `AccountAIModelCard` import
2. Remove `USE_NEW_COMPONENT` constant
3. Restore original model mapping code
4. Save and refresh

---

## Final Migration (After Successful Testing)

### Admin Page
1. Set `USE_NEW_COMPONENT = true`
2. Remove the old `ModelCard` branch from the ternary
3. Remove `USE_NEW_COMPONENT` constant
4. Remove old `ModelCard` import
5. (Optional) Delete `ModelCard.tsx` file

```tsx
// Final clean code:
import { AdminAIModelCard } from './components';

filteredDefaultModels.map((model) => (
  <AdminAIModelCard
    key={model.id}
    model={model}
    primary={primary}
    predefinedRoles={predefinedRoles}
    onEdit={selectModelForEdit}
    onDelete={(modelId) => handleDeleteWithConfirmation(modelId, model.name)}
    onToggleActive={toggleModelActive}
    onOpenRoleModal={openRoleModal}
    onOpenTaskModal={openTaskModal}
  />
))
```

### Account Page
1. Set `USE_NEW_COMPONENT = true`
2. Remove the old `AccountModelCard` branch
3. Remove `USE_NEW_COMPONENT` constant
4. Remove old `AccountModelCard` import
5. (Optional) Delete `AccountModelCard.tsx` file

```tsx
// Final clean code:
import { AccountAIModelCard } from './AccountAIModelCard';

models.map((model) => (
  <AccountAIModelCard
    key={`${type}-${model.id}`}
    model={model}
    type={type}
    selectedModel={selectedModel}
    onSelect={onSelectModel}
    onDelete={type === 'user' ? onDeleteModel : undefined}
    onEdit={type === 'user' ? onEditModel : undefined}
    t={t}
  />
))
```

---

## Common Issues & Solutions

### Issue: TypeScript errors about missing properties
**Solution**: Make sure wrapper component is imported correctly:
```tsx
import { AdminAIModelCard } from './components'; // Admin
import { AccountAIModelCard } from './AccountAIModelCard'; // Account
```

### Issue: Models not displaying icons
**Solution**: The new component handles missing icons gracefully with a fallback. Check browser console for image load errors.

### Issue: Actions not working (edit/delete/etc)
**Solution**: Verify all callback props are passed correctly. The wrapper components expect the same signatures as the old components.

### Issue: Styles look different
**Solution**: This is expected! The new component has improved styling. If specific styles need adjustment, they can be customized via the `primary` prop.

### Issue: Selected state not showing (account page)
**Solution**: Make sure `selectedModel` prop is passed with both `id` and `type`:
```tsx
selectedModel={{ id: 5, type: 'user' }}
```

---

## Performance Notes

The new components are optimized for performance:
- ✅ Memoized rendering
- ✅ CSS animations (hardware accelerated)
- ✅ Lazy icon loading
- ✅ Efficient re-renders

You should see **no performance degradation** and possibly slight improvements.

---

## Need Help?

1. Check `/docs/PHASE_6_INTEGRATION_GUIDE.md` for detailed guide
2. Review component documentation in `/src/components/ai/_shared/README.md`
3. Check wrapper implementations:
   - `/src/app/[locale]/admin/ai/management/components/AdminAIModelCard.tsx`
   - `/src/app/[locale]/account/ai/components/AccountAIModelCard.tsx`
4. Look at the shared component source:
   - `/src/components/ai/_shared/components/AIModelCard.tsx`

---

**Remember**: The old components remain functional! You can toggle back at any time with the feature flag.

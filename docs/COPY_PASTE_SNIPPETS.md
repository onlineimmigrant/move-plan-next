# Copy-Paste Code Snippets

Ready-to-use code snippets for Phase 6 integration.

---

## Admin Page Integration

### 1. Import Statement (Line ~12)
Copy and paste this to add the new component import:

```typescript
import { 
  RoleEditModal, 
  TaskManagementModal, 
  ModelCard, 
  AdminAIModelCard, // 👈 ADD THIS LINE
  ModelForm, 
  FilterBar, 
  SearchInput, 
  LoadingSkeleton, 
  InfoIcon, 
  CloseIcon, 
  ErrorIcon, 
  SuccessIcon, 
  ServerIcon, 
  PlusIcon, 
  EditIcon, 
  WarningIcon 
} from './components';
```

### 2. Feature Flag (Line ~19, inside component)
Add this constant right after the hook declarations:

```typescript
export default function AIManagement() {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  // Feature flag for testing new component
  const USE_NEW_COMPONENT = false; // 👈 ADD THIS LINE
  
  // Dialog modal state (for InfoCards and DialogModals components)
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  
  // ... rest of code
```

### 3. Model Rendering (Line ~436, in "Models Tab" section)
Find and replace the existing model mapping with this:

```typescript
{loading ? (
  <LoadingSkeleton />
) : (
  <ul className="space-y-2 sm:space-y-3">
      {filteredDefaultModels.length === 0 ? (
        <li className="py-12 text-center bg-white rounded-2xl border border-gray-100">
          {/* ... empty state code ... */}
        </li>
      ) : (
        filteredDefaultModels.map((model) => (
          USE_NEW_COMPONENT ? (
            // 👇 NEW COMPONENT - Using shared AIModelCard
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
            // 👇 OLD COMPONENT - TO REMOVE AFTER TESTING
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
      )}
    </ul>
)}
```

---

## Account Page Integration

### 1. Import Statement (Line ~3)
Replace the existing import with this:

```typescript
'use client';
import React from 'react';
import { AccountModelCard } from './AccountModelCard';
import { AccountAIModelCard } from './AccountAIModelCard'; // 👈 ADD THIS LINE
```

### 2. Feature Flag (Line ~30, inside component)
Add this right after the function declaration:

```typescript
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
  // Feature flag for testing new component
  const USE_NEW_COMPONENT = false; // 👈 ADD THIS LINE
  
  if (models.length === 0) {
    return (
      // ... empty state code ...
    );
  }
  
  // ... rest of code
```

### 3. Model Rendering (Line ~59, in the return statement)
Replace the existing model mapping with this:

```typescript
return (
  <ul className="space-y-3">
    {models.map((model) => (
      USE_NEW_COMPONENT ? (
        // 👇 NEW COMPONENT - Using shared AIModelCard
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
        // 👇 OLD COMPONENT - TO REMOVE AFTER TESTING
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
    ))}
  </ul>
);
```

---

## Testing Commands

### Enable New Component
Change the feature flag to `true`:

```typescript
// Admin page
const USE_NEW_COMPONENT = true; // Test new component

// Account page
const USE_NEW_COMPONENT = true; // Test new component
```

### Disable New Component (Rollback)
Change the feature flag back to `false`:

```typescript
// Admin page
const USE_NEW_COMPONENT = false; // Use old component

// Account page
const USE_NEW_COMPONENT = false; // Use old component
```

---

## Final Cleanup (After Testing)

### Admin Page - Clean Version

Once testing is successful, replace the entire model mapping section with this clean version:

```typescript
{loading ? (
  <LoadingSkeleton />
) : (
  <ul className="space-y-2 sm:space-y-3">
      {filteredDefaultModels.length === 0 ? (
        <li className="py-12 text-center bg-white rounded-2xl border border-gray-100">
          {/* ... empty state ... */}
        </li>
      ) : (
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
      )}
    </ul>
)}
```

And update the import:
```typescript
import { 
  RoleEditModal, 
  TaskManagementModal, 
  AdminAIModelCard, // 👈 Rename or keep as is
  ModelForm, 
  FilterBar, 
  SearchInput, 
  LoadingSkeleton, 
  InfoIcon, 
  CloseIcon, 
  ErrorIcon, 
  SuccessIcon, 
  ServerIcon, 
  PlusIcon, 
  EditIcon, 
  WarningIcon 
} from './components';
```

### Account Page - Clean Version

```typescript
import React from 'react';
import { AccountAIModelCard } from './AccountAIModelCard';

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
  if (models.length === 0) {
    return (
      <div className="py-12 text-center">
        {/* ... empty state ... */}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {models.map((model) => (
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
      ))}
    </ul>
  );
};
```

---

## Verification Steps

After pasting the code:

1. **Check for Syntax Errors**
   ```bash
   npm run build
   # or
   pnpm build
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Open Browser DevTools**
   - Check console for errors
   - Check network tab for failed requests
   - Check React DevTools for component tree

4. **Test Features**
   - See testing checklist in QUICK_INTEGRATION_REFERENCE.md

---

## Git Workflow

### Before Testing
```bash
# Create a feature branch
git checkout -b feature/phase-6-integration

# Make the changes
# (paste code snippets)

# Commit with descriptive message
git add .
git commit -m "feat: integrate shared AI components (Phase 6)

- Add AdminAIModelCard wrapper for admin page
- Add AccountAIModelCard wrapper for account page
- Add feature flags for safe testing
- Keep old components for rollback"
```

### After Successful Testing
```bash
# Enable new components permanently
# (set USE_NEW_COMPONENT = true)

git add .
git commit -m "feat: enable new shared components

Tested features:
- ✅ Admin model cards
- ✅ Account model cards
- ✅ All CRUD operations
- ✅ Selection state
- ✅ Responsive design"

# Merge to main
git checkout main
git merge feature/phase-6-integration
```

### Cleanup Old Components
```bash
# After 1-2 weeks of successful production use
# Remove old components and feature flags

git checkout -b chore/cleanup-old-components

# Delete old files:
# - /admin/ai/management/components/ModelCard.tsx
# - /account/ai/components/AccountModelCard.tsx

# Remove feature flags and conditional rendering

git add .
git commit -m "chore: remove old AI components

Removed legacy components after successful migration:
- ModelCard.tsx (admin)
- AccountModelCard.tsx (account)
- Feature flags
- Conditional rendering"

git checkout main
git merge chore/cleanup-old-components
```

---

## Troubleshooting

### Error: "Cannot find module './AdminAIModelCard'"
**Solution**: Make sure the file was created correctly:
```bash
ls -la src/app/[locale]/admin/ai/management/components/AdminAIModelCard.tsx
```

### Error: "Cannot find module './AccountAIModelCard'"
**Solution**: Make sure the file was created correctly:
```bash
ls -la src/app/[locale]/account/ai/components/AccountAIModelCard.tsx
```

### Error: Type mismatch
**Solution**: Clear TypeScript cache and rebuild:
```bash
rm -rf .next
pnpm build
```

### No visual changes after toggling flag
**Solution**: 
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Check that `USE_NEW_COMPONENT` is actually set to `true`

---

**Files to Modify**:
1. `/src/app/[locale]/admin/ai/management/page.tsx`
2. `/src/app/[locale]/account/ai/components/AccountModelList.tsx`

**New Files Created** (already done):
1. `/src/app/[locale]/admin/ai/management/components/AdminAIModelCard.tsx` ✅
2. `/src/app/[locale]/account/ai/components/AccountAIModelCard.tsx` ✅
3. `/docs/PHASE_6_INTEGRATION_GUIDE.md` ✅
4. `/docs/QUICK_INTEGRATION_REFERENCE.md` ✅
5. `/docs/COPY_PASTE_SNIPPETS.md` ✅ (this file)

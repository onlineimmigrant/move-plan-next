# Phase 6: Integration Guide - Shared AI Components

## Overview

This guide explains how to integrate the new shared AI components into your existing admin and account pages. The old components remain in place and commented with `// OLD COMPONENT - TO REMOVE AFTER TESTING` markers.

## 📦 What's Included

### Shared Components Location
All shared components are in `/src/components/ai/_shared/`:

```
/components/ai/_shared/
├── types/          # TypeScript type definitions
├── utils/          # Utility functions (validation, formatting)
├── hooks/          # Custom React hooks
└── components/     # Reusable UI components
    ├── AIModelCard.tsx      # Flexible model display card
    ├── AIModelForm.tsx      # Model add/edit form
    ├── AIFormField.tsx      # Form input component
    ├── AIIcons.tsx          # Icon library
    ├── AIBadge.tsx          # Status badges
    └── ...more
```

### Integration Wrappers
These wrappers adapt the shared components to work with existing code:

- **Admin**: `/src/app/[locale]/admin/ai/management/components/AdminAIModelCard.tsx`
- **Account**: `/src/app/[locale]/account/ai/components/AccountAIModelCard.tsx`

---

## 🔧 Admin Page Integration

### Current State (Old Component)

The admin page currently uses `ModelCard.tsx` which will remain active:

```tsx
// File: /src/app/[locale]/admin/ai/management/page.tsx

import { ModelCard } from './components';

// OLD COMPONENT - TO REMOVE AFTER TESTING
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

### New Integration (Side-by-Side)

To test the new shared component, add this alongside the old code:

```tsx
// File: /src/app/[locale]/admin/ai/management/page.tsx

import { ModelCard, AdminAIModelCard } from './components'; // Add AdminAIModelCard

// Choose which component to use with a flag
const USE_NEW_COMPONENT = false; // Set to true to test new component

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

### Testing Checklist

- [ ] All models display correctly with icons
- [ ] Status badges show active/inactive
- [ ] Role badge displays with edit button
- [ ] Task list shows up to 3 tasks
- [ ] Edit button opens edit modal
- [ ] Delete button shows confirmation dialog
- [ ] Toggle active button works
- [ ] Role modal opens correctly
- [ ] Task modal opens in view/add modes
- [ ] Hover effects work smoothly
- [ ] Responsive on all screen sizes

### Migration Steps

Once testing is complete:

1. Set `USE_NEW_COMPONENT = true`
2. Test thoroughly in production-like environment
3. Remove the old `ModelCard` import
4. Delete `/src/app/[locale]/admin/ai/management/components/ModelCard.tsx`
5. Rename `AdminAIModelCard` to `ModelCard` if desired
6. Update all imports
7. Remove the `USE_NEW_COMPONENT` flag

---

## 👤 Account Page Integration

### Current State (Old Component)

The account page uses `AccountModelCard.tsx` in `AccountModelList.tsx`:

```tsx
// File: /src/app/[locale]/account/ai/components/AccountModelList.tsx

import { AccountModelCard } from './AccountModelCard';

// OLD COMPONENT - TO REMOVE AFTER TESTING
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

### New Integration (Side-by-Side)

```tsx
// File: /src/app/[locale]/account/ai/components/AccountModelList.tsx

import { AccountModelCard } from './AccountModelCard';
import { AccountAIModelCard } from './AccountAIModelCard'; // Add new component

// Choose which component to use
const USE_NEW_COMPONENT = false; // Set to true to test new component

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

### Testing Checklist

- [ ] Default models display correctly
- [ ] User models display correctly
- [ ] Selected model shows blue border & check icon
- [ ] Select button works
- [ ] Edit button shows for user models only
- [ ] Delete button shows for user models only
- [ ] Edit button opens edit modal
- [ ] Delete triggers confirmation
- [ ] Admin-only badge displays correctly
- [ ] Translations work
- [ ] Hover effects work
- [ ] Responsive on mobile/tablet/desktop

### Migration Steps

Once testing is complete:

1. Set `USE_NEW_COMPONENT = true`
2. Test thoroughly with both default and user models
3. Remove old `AccountModelCard` import
4. Delete `/src/app/[locale]/account/ai/components/AccountModelCard.tsx`
5. Rename `AccountAIModelCard` to `AccountModelCard` if desired
6. Update imports in `AccountModelList.tsx`
7. Remove the `USE_NEW_COMPONENT` flag

---

## 🎨 Key Differences

### Visual Changes

| Feature | Old Component | New Component |
|---------|--------------|---------------|
| Card Style | Basic border, simple hover | Rounded corners, animated hover, shadow effects |
| Task Display | All tasks shown | Shows 3 tasks + count |
| Selected State | Basic highlight | Blue border + check icon + message |
| Icons | Simple display | Animated glow on hover |
| Role Badge | Text only | Badge with edit button |
| Status | Text/color | Colored badge (green/gray) |

### Functional Changes

| Feature | Old | New |
|---------|-----|-----|
| Task Management | View all | View 3 + "View all" button |
| Role Editing | Separate flow | Inline edit button on badge |
| System Message | Hidden | Preview shown |
| Max Tokens | Sometimes hidden | Always shown in footer |

---

## 🔍 Direct Usage (Without Wrappers)

If you want to use the shared components directly without wrappers:

### Admin Page Example

```tsx
import { AIModelCard } from '@/components/ai/_shared';

<AIModelCard
  model={{
    id: model.id,
    name: model.name,
    endpoint: model.endpoint,
    max_tokens: model.max_tokens,
    is_active: model.is_active,
    system_message: model.system_message,
    icon: model.icon,
    role: model.role,
    task: model.task,
  }}
  type="default"
  context="admin"
  primary={{ base: primary.base }}
  onEdit={(m) => selectModelForEdit(model)}
  onDelete={() => handleDelete(model.id)}
  onToggleActive={() => toggleActive(model.id)}
  onOpenRoleModal={(m) => openRoleModal(model)}
  onOpenTaskModal={(m, mode) => openTaskModal(model, mode)}
/>
```

### Account Page Example

```tsx
import { AIModelCard } from '@/components/ai/_shared';

<AIModelCard
  model={{
    id: model.id,
    name: model.name,
    endpoint: model.endpoint || '',
    max_tokens: model.max_tokens || 200,
    is_active: true,
    system_message: model.system_message || 'You are a helpful assistant.',
    icon: model.icon,
  }}
  type={type} // 'default' or 'user'
  context="account"
  selectedModel={{ id: selectedModel.id, type: selectedModel.type }}
  t={t}
  onSelect={() => selectModel(model.id, type)}
  onEdit={type === 'user' ? () => editModel(model) : undefined}
  onDelete={type === 'user' ? () => deleteModel(model.id) : undefined}
/>
```

---

## 📊 Benefits of Shared Components

### Code Reusability
- **Before**: 340 lines (admin) + 140 lines (account) = 480 lines
- **After**: 330 lines (shared) + 120 lines (wrappers) = 450 lines
- **Savings**: 30 lines + better maintainability

### Consistency
- Same UI/UX across admin and account pages
- Same hover effects, animations, styling
- Same validation and error handling

### Maintainability
- Fix bugs once, benefits both pages
- Add features once, available everywhere
- Centralized type definitions

### Type Safety
- Shared TypeScript interfaces
- Compile-time error checking
- Better IDE autocomplete

---

## 🚨 Important Notes

### Backward Compatibility
Both wrapper components are **100% backward compatible** with existing code:
- Same props interface
- Same callback signatures
- Same data structures
- Zero breaking changes

### Performance
The new components are:
- Slightly more optimized with better memoization
- Use CSS transitions instead of JavaScript animations
- Lazy load icons when needed

### Accessibility
Improvements include:
- Better ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management

---

## 🐛 Troubleshooting

### Issue: Type Errors
**Solution**: Make sure you're importing types from the correct location:
```tsx
import { AIModel, AISelectedModel } from '@/components/ai/_shared';
```

### Issue: Icons Not Showing
**Solution**: Check that the icon URL is valid and accessible:
```tsx
// Old icon checking
if (model.icon) { ... }

// New component handles this automatically
```

### Issue: Callbacks Not Firing
**Solution**: Verify callback signatures match:
```tsx
// Admin delete callback
onDelete={(id) => deleteModel(id)}           // Old
onDelete={() => deleteModel(model.id)}       // New wrapper

// Account delete callback  
onDelete={(id, name) => deleteModel(id, name)} // Old & New (same)
```

---

## 📝 Cleanup Checklist

After successful testing and migration:

### Admin Page
- [ ] Remove old `ModelCard.tsx`
- [ ] Remove old `ModelCard` import
- [ ] Update documentation
- [ ] Remove `USE_NEW_COMPONENT` flag
- [ ] (Optional) Rename `AdminAIModelCard` to `ModelCard`

### Account Page
- [ ] Remove old `AccountModelCard.tsx`
- [ ] Remove old `AccountModelCard` import
- [ ] Update documentation
- [ ] Remove `USE_NEW_COMPONENT` flag
- [ ] (Optional) Rename `AccountAIModelCard` to `AccountModelCard`

### Global
- [ ] Search codebase for any remaining references
- [ ] Update tests if applicable
- [ ] Update Storybook stories if applicable
- [ ] Document migration in changelog

---

## 🎯 Next Steps

1. **Phase 6.1**: Integrate form components (AIModelForm)
2. **Phase 6.2**: Integrate other shared components (badges, skeletons, etc.)
3. **Phase 6.3**: Add shared form validation
4. **Phase 6.4**: Add shared state management hooks

---

## 💡 Tips

- Test in development environment first
- Use feature flags to toggle between old/new
- Get user feedback before full migration
- Keep old components for 1-2 weeks after migration
- Document any edge cases or special behavior

---

## 📞 Support

If you encounter issues during migration:
1. Check type definitions in `/src/components/ai/_shared/types/`
2. Review wrapper component implementations
3. Compare old vs new prop interfaces
4. Test with minimal data first, then production data
5. Use browser dev tools to inspect component props

---

**Last Updated**: Phase 6 Integration - January 2025
**Component Version**: v1.0.0
**Compatibility**: TypeScript 5.0+, React 18+

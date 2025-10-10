# Shared Modal Utilities

A collection of reusable components, hooks, and helpers for building consistent modals throughout the application.

## Overview

The shared utilities provide:
- **BaseModal**: Pre-configured modal component with common patterns
- **useModalState**: Generic hook for modal state management
- **useModalForm**: Hook for form handling in modals with validation
- **createModalContext**: Factory for creating modal contexts
- **modalHelpers**: Common validation and utility functions

---

## Components

### `<BaseModal>`

A pre-configured modal that wraps the primitive Modal components with sensible defaults and a convenient API.

**Features:**
- Automatic footer with action buttons
- Draggable/resizable support
- Form submission handling
- Loading states
- Customizable styling

**Props:**
```tsx
interface BaseModalProps {
  // Required
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  
  // Optional
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  draggable?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
  
  // Actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'danger';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  
  // Custom footer
  footer?: ReactNode;
  showFooter?: boolean;
  footerAlign?: 'left' | 'center' | 'right' | 'between';
}
```

**Example:**
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Delete Item"
  subtitle="This action cannot be undone"
  size="md"
  primaryAction={{
    label: "Delete",
    onClick: handleDelete,
    variant: "danger",
    loading: isDeleting
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: handleClose
  }}
>
  <p>Are you sure you want to delete this item?</p>
</BaseModal>
```

---

## Hooks

### `useModalState<TData>()`

Generic hook for managing modal open/close state with optional data.

**Features:**
- Simple open/close state management
- Pass data when opening modal
- Callbacks for open/close events
- Auto-clear data after close

**Example:**
```tsx
// Simple modal
const modal = useModalState();
modal.openModal();
modal.closeModal();

// Modal with data
const userModal = useModalState<{ userId: string }>();
userModal.openModal({ userId: '123' });
console.log(userModal.data?.userId); // '123'

// With callbacks
const modal = useModalState({
  onOpen: () => console.log('opened'),
  onClose: () => console.log('closed'),
  defaultOpen: false
});
```

**Returns:**
```tsx
{
  isOpen: boolean;
  data: TData | undefined;
  openModal: (data?: TData) => void;
  closeModal: () => void;
  setData: (data: TData | undefined) => void;
}
```

---

### `useModalForm<T>(options)`

Hook for managing form state in modals with validation, submission, and error handling.

**Features:**
- Form state management
- Built-in validation
- Error tracking per field
- Touch tracking (show errors after blur)
- Change detection
- Async submission handling
- Loading states

**Example:**
```tsx
const form = useModalForm({
  initialValues: { 
    title: '', 
    slug: '',
    description: '' 
  },
  validators: {
    title: validators.required('Title'),
    slug: validators.slug,
  },
  onSubmit: async (values) => {
    await createPage(values);
  },
  onSuccess: () => {
    closeModal();
    toast.success('Page created!');
  },
  onError: (error) => {
    toast.error(error.message);
  },
  validateOnChange: true,
  resetOnSubmit: false,
});

// In JSX
<input
  value={form.values.title}
  onChange={form.handleChange('title')}
  onBlur={form.handleBlur('title')}
/>
{form.touched.title && form.errors.title && (
  <span className="error">{form.errors.title}</span>
)}

<button 
  onClick={form.handleSubmit} 
  disabled={form.isSubmitting || !form.hasChanges}
>
  {form.isSubmitting ? 'Saving...' : 'Save'}
</button>
```

**Returns:**
```tsx
{
  // State
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  hasChanges: boolean;
  touched: Record<string, boolean>;
  
  // Setters
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  
  // Handlers
  handleChange: (field: keyof T) => (e) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: FormEvent) => Promise<void>;
  
  // Utilities
  reset: () => void;
  validate: () => ValidationResult;
}
```

---

### `createModalContext<TData>(options)`

Factory function to create a modal context with provider and hook. Reduces boilerplate for creating new modal contexts.

**Example:**
```tsx
// Create context
const { 
  Provider: UserModalProvider, 
  useModal: useUserModal 
} = createModalContext<{ userId: string }>({
  contextName: 'UserModal'
});

// Wrap app
<UserModalProvider>
  <App />
</UserModalProvider>

// Use in component
function UserProfile() {
  const { isOpen, openModal, closeModal, data } = useUserModal();
  
  return (
    <>
      <button onClick={() => openModal({ userId: '123' })}>
        Edit User
      </button>
      
      <BaseModal isOpen={isOpen} onClose={closeModal} title="Edit User">
        <p>Editing user: {data?.userId}</p>
      </BaseModal>
    </>
  );
}
```

---

## Helpers

### Validators

Built-in validation functions:

```tsx
import { validators } from '@/components/modals/_shared';

// Available validators
validators.required('Field name')     // Required field
validators.email                      // Valid email
validators.minLength(min, 'Field')    // Min length
validators.maxLength(max, 'Field')    // Max length
validators.pattern(regex, 'Message')  // Regex pattern
validators.slug                       // URL slug format
validators.url                        // Valid URL
validators.number                     // Valid number
validators.min(min, 'Field')          // Min value
validators.max(max, 'Field')          // Max value

// Usage
const form = useModalForm({
  initialValues: { email: '', age: 0 },
  validators: {
    email: validators.email,
    age: validators.min(18, 'Age')
  }
});
```

### Utility Functions

```tsx
import { 
  generateSlug, 
  debounce, 
  handleCloseWithWarning,
  handleAsync,
  hasChanges 
} from '@/components/modals/_shared';

// Generate URL slug
const slug = generateSlug('Hello World!'); // 'hello-world'

// Debounce function
const debouncedSearch = debounce(searchFunction, 300);

// Close with unsaved changes warning
handleCloseWithWarning(hasUnsavedChanges, closeModal);

// Async handler with loading/error states
await handleAsync(
  () => saveData(),
  {
    onStart: () => setLoading(true),
    onSuccess: () => toast.success('Saved!'),
    onError: (err) => toast.error(err.message),
    onFinally: () => setLoading(false)
  }
);

// Detect changes
const changed = hasChanges(originalData, currentData);
```

---

## Complete Example: Create Page Modal

```tsx
'use client';

import React from 'react';
import { 
  BaseModal, 
  useModalState, 
  useModalForm, 
  validators,
  generateSlug 
} from '@/components/modals/_shared';

export function CreatePageModal() {
  const modal = useModalState();
  
  const form = useModalForm({
    initialValues: {
      title: '',
      slug: '',
      description: '',
    },
    validators: {
      title: validators.required('Title'),
      slug: validators.slug,
    },
    onSubmit: async (values) => {
      await createPage(values);
    },
    onSuccess: () => {
      modal.closeModal();
      form.reset();
    },
  });

  // Auto-generate slug from title
  React.useEffect(() => {
    if (form.values.title && !form.touched.slug) {
      form.setValue('slug', generateSlug(form.values.title));
    }
  }, [form.values.title]);

  return (
    <>
      <button onClick={modal.openModal}>Create Page</button>

      <BaseModal
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        title="Create New Page"
        subtitle="Enter page details"
        size="lg"
        primaryAction={{
          label: "Create",
          onClick: form.handleSubmit,
          loading: form.isSubmitting,
          disabled: !form.hasChanges
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: modal.closeModal
        }}
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.values.title}
              onChange={form.handleChange('title')}
              onBlur={form.handleBlur('title')}
              className="w-full px-3 py-2 border rounded-lg"
            />
            {form.touched.title && form.errors.title && (
              <p className="text-sm text-red-600 mt-1">{form.errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={form.values.slug}
              onChange={form.handleChange('slug')}
              onBlur={form.handleBlur('slug')}
              className="w-full px-3 py-2 border rounded-lg"
            />
            {form.touched.slug && form.errors.slug && (
              <p className="text-sm text-red-600 mt-1">{form.errors.slug}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={form.values.description}
              onChange={form.handleChange('description')}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </form>
      </BaseModal>
    </>
  );
}
```

---

## File Structure

```
src/components/modals/_shared/
├── BaseModal.tsx              # Pre-configured modal component
├── useModalState.tsx          # Modal state hook
├── useModalForm.tsx           # Form management hook
├── createModalContext.tsx     # Context factory
├── modalHelpers.ts            # Utility functions & validators
├── index.ts                   # Clean exports
└── README.md                  # This file
```

---

## Benefits

1. **Consistency**: All modals use the same patterns and behavior
2. **DRY**: Shared logic extracted into reusable utilities
3. **Type Safety**: Full TypeScript support with generics
4. **Developer Experience**: Clear APIs with examples
5. **Maintainability**: Single source of truth for modal logic
6. **Flexibility**: Composable and customizable

---

## Next Steps

Use these utilities when refactoring existing modals (Step 4) to reduce code duplication and improve consistency.

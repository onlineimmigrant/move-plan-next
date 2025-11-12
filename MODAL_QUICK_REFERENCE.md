# Standardized Modal System - Quick Reference

## Import Everything You Need

```tsx
import {
  // Container
  StandardModalContainer,
  
  // Layout
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  
  // Hooks
  useModalState,
  useModalFocus,
  useModalKeyboard,
  
  // Types
  type ModalAction,
  type ModalTab,
  type ModalBadge,
  type ModalSize,
  
  // Constants (if needed)
  MODAL_Z_INDEX,
  MODAL_SIZE_PRESETS,
} from '@/components/modals/_shared';
```

## Basic Modal Template

```tsx
'use client';

import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  useModalState,
  type ModalAction,
} from '@/components/modals/_shared';

export const MyModal: React.FC = () => {
  const { isOpen, open, close } = useModalState();

  const primaryAction: ModalAction = {
    label: 'Save',
    onClick: async () => {
      // Your save logic here
      close();
    },
    variant: 'primary',
  };

  const secondaryAction: ModalAction = {
    label: 'Cancel',
    onClick: close,
    variant: 'secondary',
  };

  return (
    <>
      <button onClick={open}>Open Modal</button>

      <StandardModalContainer
        isOpen={isOpen}
        onClose={close}
        size="medium"
        enableDrag={true}
        enableResize={true}
      >
        <StandardModalHeader
          title="Modal Title"
          subtitle="Optional subtitle"
          icon={DocumentTextIcon}
          iconColor="text-blue-500"
          onClose={close}
        />

        <StandardModalBody>
          {/* Your content here */}
        </StandardModalBody>

        <StandardModalFooter
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          align="right"
        />
      </StandardModalContainer>
    </>
  );
};
```

## Tabbed Modal Template

```tsx
const [currentTab, setCurrentTab] = useState('tab1');

const tabs: ModalTab[] = [
  {
    id: 'tab1',
    label: 'Tab One',
    icon: DocumentTextIcon,
    badge: 5,
  },
  {
    id: 'tab2',
    label: 'Tab Two',
    icon: Cog6ToothIcon,
  },
];

const badges: ModalBadge[] = [
  {
    id: 'tab1',
    count: 5,
    color: 'bg-red-500',
    animate: true,
  },
];

<StandardModalHeader
  title="Tabbed Modal"
  tabs={tabs}
  currentTab={currentTab}
  onTabChange={setCurrentTab}
  badges={badges}
  onClose={close}
/>

<StandardModalBody>
  {currentTab === 'tab1' && <div>Tab 1 content</div>}
  {currentTab === 'tab2' && <div>Tab 2 content</div>}
</StandardModalBody>
```

## Modal Sizes

```tsx
// Small: 480x600 (min: 320x400)
<StandardModalContainer size="small" ... />

// Medium: 768x700 (min: 480x500)
<StandardModalContainer size="medium" ... />

// Large: 1120x900 (min: 640x600) - DEFAULT
<StandardModalContainer size="large" ... />

// XLarge: 1400x1000 (min: 800x700)
<StandardModalContainer size="xlarge" ... />

// Custom size
<StandardModalContainer 
  defaultSize={{ width: 1000, height: 800 }}
  minSize={{ width: 600, height: 500 }}
  ...
/>
```

## Action Variants

```tsx
const primaryAction: ModalAction = {
  label: 'Save',
  onClick: handleSave,
  variant: 'primary',    // Blue
  icon: CheckIcon,       // Optional icon
  loading: isLoading,    // Show spinner
  disabled: !canSave,    // Disable button
};

const dangerAction: ModalAction = {
  label: 'Delete',
  onClick: handleDelete,
  variant: 'danger',     // Red
};

const successAction: ModalAction = {
  label: 'Confirm',
  onClick: handleConfirm,
  variant: 'success',    // Green
};

const secondaryAction: ModalAction = {
  label: 'Cancel',
  onClick: close,
  variant: 'secondary',  // Gray
};
```

## Footer Alignment

```tsx
// Right aligned (default)
<StandardModalFooter
  primaryAction={primaryAction}
  align="right"
/>

// Left aligned
<StandardModalFooter
  primaryAction={primaryAction}
  align="left"
/>

// Centered
<StandardModalFooter
  primaryAction={primaryAction}
  align="center"
/>

// Space between (tertiary on left, primary/secondary on right)
<StandardModalFooter
  primaryAction={primaryAction}
  secondaryAction={secondaryAction}
  tertiaryActions={[deleteAction]}
  align="between"
/>
```

## Loading/Error/Empty States

```tsx
<StandardModalBody
  loading={isLoading}
  loadingComponent={<CustomSpinner />}  // Optional custom
>
  {/* Content shown when not loading */}
</StandardModalBody>

<StandardModalBody
  error={errorMessage}
  errorComponent={<CustomError />}  // Optional custom
>
  {/* Content shown when no error */}
</StandardModalBody>

<StandardModalBody
  isEmpty={data.length === 0}
  emptyComponent={<CustomEmpty />}  // Optional custom
>
  {/* Content shown when not empty */}
</StandardModalBody>
```

## Body Padding Control

```tsx
// Default padding (1.5rem)
<StandardModalBody>
  {/* ... */}
</StandardModalBody>

// No padding (useful for full-width content)
<StandardModalBody noPadding={true}>
  {/* ... */}
</StandardModalBody>

// Disable scrolling
<StandardModalBody scrollable={false}>
  {/* ... */}
</StandardModalBody>
```

## Custom Footer Content

```tsx
<StandardModalFooter>
  <div className="flex justify-between w-full">
    <button>Custom Left</button>
    <button>Custom Right</button>
  </div>
</StandardModalFooter>
```

## Close Behavior

```tsx
<StandardModalContainer
  isOpen={isOpen}
  onClose={close}
  closeOnBackdropClick={true}  // Click outside to close (default)
  closeOnEscape={true}          // Press Escape to close (default)
>
```

## Accessibility

```tsx
<StandardModalContainer
  isOpen={isOpen}
  onClose={close}
  ariaLabel="My Modal"           // For screen readers
  ariaLabelledBy="modal-title"   // Or reference heading ID
>
```

## Badge Configuration

```tsx
const badges: ModalBadge[] = [
  {
    id: 'tab-id',
    count: 5,                    // Number or string
    color: 'bg-red-500',         // Tailwind color class
    variant: 'primary',          // Or 'secondary', 'success', 'warning', 'danger'
    position: 'tab',             // Where to display
    animate: true,               // Pulse animation
  },
];
```

## Common Patterns

### Confirm Dialog

```tsx
<StandardModalContainer size="small" ...>
  <StandardModalHeader title="Confirm Action" onClose={close} />
  <StandardModalBody>
    <p>Are you sure you want to proceed?</p>
  </StandardModalBody>
  <StandardModalFooter
    primaryAction={{
      label: 'Confirm',
      onClick: handleConfirm,
      variant: 'danger',
    }}
    secondaryAction={{
      label: 'Cancel',
      onClick: close,
      variant: 'secondary',
    }}
  />
</StandardModalContainer>
```

### Form Modal

```tsx
const [formData, setFormData] = useState({});

const handleSubmit = async () => {
  // Validate
  // Submit
  close();
};

<StandardModalBody>
  <form className="space-y-4">
    <input ... />
    <textarea ... />
  </form>
</StandardModalBody>

<StandardModalFooter
  primaryAction={{
    label: 'Submit',
    onClick: handleSubmit,
    loading: isSubmitting,
    disabled: !isValid,
  }}
/>
```

### Loading Modal

```tsx
<StandardModalContainer>
  <StandardModalHeader title="Processing" onClose={close} />
  <StandardModalBody loading={true} />
</StandardModalContainer>
```

## Migration Checklist

When converting an existing modal:

- [ ] Replace `BaseModal` with `StandardModalContainer`
- [ ] Extract title/icon to `StandardModalHeader`
- [ ] Move content to `StandardModalBody`
- [ ] Convert buttons to `ModalAction` objects in `StandardModalFooter`
- [ ] Replace state management with `useModalState`
- [ ] Add tabs if needed (define `ModalTab[]`)
- [ ] Add badges if needed (define `ModalBadge[]`)
- [ ] Choose appropriate `size` prop
- [ ] Add loading/error/empty states as needed
- [ ] Test keyboard shortcuts (Escape, Tab)
- [ ] Test mobile responsive behavior
- [ ] Verify dark mode support

## Tips

- Always use `'use client'` directive
- System fonts are automatically applied
- Glass morphism is built-in
- Mobile gets fullscreen, desktop gets draggable
- All animations are handled automatically
- Z-index conflicts are managed
- Focus trap works out of the box
- Body scroll is locked when modal is open

---

**For more examples**, see:
- `/src/components/modals/_shared/examples/ExampleSimpleModal.tsx`
- `/src/components/modals/_shared/examples/ExampleTabbedModal.tsx`

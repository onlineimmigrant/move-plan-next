# Phase 2 Complete: UI Components ✅

## Overview

Phase 2 of the modal standardization project has been successfully implemented. This phase adds reusable UI components that provide consistent visual elements across all modals.

## What's Included

### 1. Badge Components (`components/badges/`)

Professional badge components for counts and status indicators:

#### **CountBadge**
- **Purpose**: Display numerical counts with adaptive sizing
- **Features**:
  - Automatic size adjustment (single digit vs multi-digit)
  - Variants: primary, secondary, success, warning, danger, info
  - Sizes: sm, md, lg
  - Max value with "+" suffix (e.g., "99+")
  - Pulse animation option
  - Dot mode for simple indicators
- **Usage**:
  ```tsx
  <CountBadge count={5} variant="danger" animate={true} />
  <CountBadge count={150} max={99} /> // Shows "99+"
  <CountBadge count={0} dot={true} /> // Just a dot
  ```

#### **StatusBadge**
- **Purpose**: Display status with text and optional icon/dot
- **Features**:
  - Variants: success, warning, danger, info, default
  - Sizes: sm, md, lg
  - Optional icon or dot indicator
  - Colored background with dark mode support
- **Usage**:
  ```tsx
  <StatusBadge text="Active" variant="success" dot={true} />
  <StatusBadge text="Error" variant="danger" icon={AlertIcon} />
  ```

### 2. Button Components (`components/buttons/`)

Standardized buttons with consistent styling and behavior:

#### **ModalButton**
- **Purpose**: Primary button component for modal actions
- **Features**:
  - Variants: primary, secondary, danger, success, ghost, link
  - Sizes: sm, md, lg
  - Loading state with spinner
  - Disabled state
  - Full width option
  - Left and right icon support
  - Async onClick handler support
- **Usage**:
  ```tsx
  <ModalButton variant="primary" icon={SaveIcon} loading={isSaving}>
    Save Changes
  </ModalButton>
  <ModalButton variant="danger" onClick={handleDelete}>
    Delete
  </ModalButton>
  ```

#### **IconButton**
- **Purpose**: Compact icon-only button for toolbar actions
- **Features**:
  - Variants: default, primary, danger, ghost
  - Sizes: sm, md, lg
  - Required ARIA label for accessibility
  - Optional tooltip
  - Hover states
- **Usage**:
  ```tsx
  <IconButton 
    icon={BellIcon} 
    ariaLabel="Notifications" 
    tooltip="View notifications"
    variant="primary"
  />
  ```

### 3. State Components (`components/states/`)

Consistent feedback components for different states:

#### **LoadingState**
- **Purpose**: Loading indicator with spinner and message
- **Features**:
  - Sizes: sm, md, lg
  - Customizable message
  - Inline or vertical layout
  - Animated spinner
- **Usage**:
  ```tsx
  <LoadingState message="Loading data..." size="md" />
  <LoadingState message="Processing..." inline={true} />
  ```

#### **ErrorState**
- **Purpose**: Error display with icon and retry option
- **Features**:
  - Sizes: sm, md, lg
  - Customizable title and message
  - Optional retry button
  - Custom icon support
  - Centered layout
- **Usage**:
  ```tsx
  <ErrorState
    title="Failed to Load"
    message="Unable to fetch data. Please try again."
    onRetry={handleRetry}
  />
  ```

#### **EmptyState**
- **Purpose**: Empty state display with optional action
- **Features**:
  - Sizes: sm, md, lg
  - Customizable title and message
  - Optional action button
  - Custom icon support
  - Centered layout
- **Usage**:
  ```tsx
  <EmptyState
    title="No Items"
    message="Get started by creating your first item."
    actionText="Create Item"
    onAction={handleCreate}
  />
  ```

## Component Integration

All components integrate seamlessly with the Phase 1 foundation:

```tsx
import {
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  CountBadge,
  StatusBadge,
  ModalButton,
  IconButton,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/modals/_shared';

// Use in modal header tabs
const tabs = [
  { 
    id: 'items', 
    label: 'Items', 
    badge: 5 // Rendered as CountBadge
  },
];

// Use in modal body
<StandardModalBody loading={isLoading}>
  {error ? (
    <ErrorState message={error} onRetry={refetch} />
  ) : data.length === 0 ? (
    <EmptyState 
      message="No items found" 
      onAction={createItem}
    />
  ) : (
    // Your content
  )}
</StandardModalBody>

// Use in modal footer
<StandardModalFooter
  primaryAction={{
    label: 'Save',
    onClick: handleSave,
    variant: 'primary',
  }}
/>
```

## Design System

### Color Variants

All components follow a consistent color system:

- **Primary**: Blue (`bg-blue-500`)
- **Secondary**: Gray (`bg-gray-500`)
- **Success**: Green (`bg-green-500`)
- **Warning**: Yellow (`bg-yellow-500`)
- **Danger**: Red (`bg-red-500`)
- **Info**: Cyan (`bg-cyan-500`)

### Size System

Consistent sizing across all components:

- **Small (sm)**: Compact for dense layouts
- **Medium (md)**: Default, balanced size
- **Large (lg)**: Prominent, high visibility

### Typography

All text uses the system font stack:
```
'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
```

### Dark Mode

Full dark mode support with:
- Automatic color adjustments
- Proper contrast ratios
- Consistent visual hierarchy

## File Structure

```
src/components/modals/_shared/components/
├── badges/
│   ├── CountBadge.tsx        # Numerical count badges
│   ├── StatusBadge.tsx       # Status text badges
│   └── index.ts              # Badge exports
├── buttons/
│   ├── ModalButton.tsx       # Primary action buttons
│   ├── IconButton.tsx        # Icon-only buttons
│   └── index.ts              # Button exports
├── states/
│   ├── LoadingState.tsx      # Loading spinner
│   ├── ErrorState.tsx        # Error display
│   ├── EmptyState.tsx        # Empty state
│   └── index.ts              # State exports
└── index.ts                  # Main component exports
```

## Examples

A comprehensive showcase modal demonstrates all components:

**`examples/ExampleUIComponentsModal.tsx`**
- All badge variants and sizes
- All button variants and states
- All state components
- Live interactive examples

## Updated StandardModalBody

The `StandardModalBody` now uses the new state components internally:

```tsx
<StandardModalBody 
  loading={isLoading}        // Uses LoadingState
  error={errorMessage}       // Uses ErrorState  
  isEmpty={data.length === 0} // Uses EmptyState
>
  {/* Your content */}
</StandardModalBody>
```

You can also provide custom state components:

```tsx
<StandardModalBody
  loading={isLoading}
  loadingComponent={<CustomSpinner />}
  errorComponent={<CustomError />}
  emptyComponent={<CustomEmpty />}
>
```

## Accessibility

All components follow accessibility best practices:

### Badges
- Semantic color coding
- Clear visual indicators
- Screen reader friendly

### Buttons
- Proper ARIA labels
- Keyboard navigation
- Focus indicators
- Loading states announced

### States
- Proper role attributes
- Status announcements
- Retry actions keyboard accessible

## Usage Patterns

### Tab Badges

```tsx
const tabs: ModalTab[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: InboxIcon,
    badge: unreadCount,  // Automatically rendered as CountBadge
  },
];

const badges: ModalBadge[] = [
  {
    id: 'inbox',
    count: unreadCount,
    color: 'bg-red-500',
    animate: true,
  },
];
```

### Action Buttons

```tsx
const primaryAction: ModalAction = {
  label: 'Save',
  onClick: handleSave,
  loading: isSaving,
  disabled: !isValid,
  icon: CheckIcon,
  variant: 'primary',
};
```

### Conditional States

```tsx
<StandardModalBody>
  {isLoading ? (
    <LoadingState message="Loading items..." />
  ) : error ? (
    <ErrorState message={error} onRetry={refetch} />
  ) : items.length === 0 ? (
    <EmptyState 
      message="No items yet"
      actionText="Create First Item"
      onAction={createItem}
    />
  ) : (
    <ItemList items={items} />
  )}
</StandardModalBody>
```

## Testing

All components are ready for:

- **Unit Tests**: Jest + React Testing Library
- **Visual Tests**: Storybook/Chromatic
- **Accessibility Tests**: axe-core, WAVE
- **Integration Tests**: Cypress

## Next Steps (Phase 3)

With UI components complete, Phase 3 will add:

1. **Search Components**: Search bars with filtering
2. **Filter Components**: Multi-select filters, date ranges
3. **Form Components**: Standardized form inputs
4. **List Components**: Sortable, paginated lists
5. **Card Components**: Content cards for modal items

## Migration Impact

Existing modals can now use:

```tsx
// Before
<div className="flex items-center gap-2">
  <span className="w-5 h-5 bg-red-500 text-white rounded-full">5</span>
  <span>Notifications</span>
</div>

// After
<CountBadge count={5} variant="danger" />
```

This provides:
- Consistent styling
- Automatic responsive sizing
- Dark mode support
- Accessibility features
- Less code duplication

---

**Status**: ✅ Phase 2 Complete  
**Date**: November 12, 2025  
**Components Added**: 8 new components (3 badges, 2 buttons, 3 states)  
**Next**: Proceed to Phase 3 - Specialized Components

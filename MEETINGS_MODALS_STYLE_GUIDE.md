# Meetings Modals Premium Style Guide
**Version 1.0 - November 6, 2025**

## 🎨 Design System Standards

This guide defines the exact styling patterns for all MeetingsModals to ensure 100% consistency and premium quality across the entire meetings system.

---

## 📐 Core Structure

### Modal Container
```tsx
{/* Backdrop */}
<div 
  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10002] p-4 animate-in fade-in duration-200"
  onClick={onClose}
  role="presentation"
>
  {/* Modal */}
  <div 
    ref={modalRef}
    className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
    role="dialog"
    aria-labelledby="modal-title-id"
    aria-modal="true"
    onClick={(e) => e.stopPropagation()}
    onKeyDown={(e) => {
      if (e.key === 'Escape') onClose();
    }}
  >
    {/* Content here */}
  </div>
</div>
```

### Key CSS Classes:
- **Backdrop**: `fixed inset-0 bg-black/50 backdrop-blur-sm`
- **Z-Index**: `z-[10002]` (higher than parent modals)
- **Modal Container**: `backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50`
- **Border**: `border border-white/20`
- **Animations**: `animate-in fade-in duration-200` (backdrop), `zoom-in-95 duration-200` (modal)

---

## 📋 Header Section

### Standard Header Pattern
```tsx
{/* Header */}
<div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30">
  <div>
    <div className="flex items-center gap-2">
      <IconComponent className="w-5 h-5" style={{ color: primary.base }} />
      <h2 
        id="modal-title-id"
        className="text-xl font-semibold text-gray-900 dark:text-white"
      >
        Modal Title
      </h2>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
      Modal subtitle or description
    </p>
  </div>
  <button
    ref={firstFocusableRef}
    onClick={onClose}
    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    aria-label="Close modal (Esc)"
    title="Close (Esc)"
  >
    <XMarkIcon className="w-6 h-6" />
  </button>
</div>
```

### Header Rules:
- ✅ **Icon**: `w-5 h-5`, colored with `primary.base`, NO background
- ✅ **Title**: `text-xl font-semibold`, NOT bold
- ✅ **Subtitle**: `text-sm`, positioned with `mt-1`
- ✅ **Close Button**: Plain text color, NO background, NO padding/rounded styles
- ❌ **NO Admin Badges** (redundant for child modals)
- ❌ **NO Icon Backgrounds** (keep it clean)
- ❌ **NO Gradients** (simple solid color with transparency)

---

## 📄 Content Section

### Content Pattern
```tsx
{/* Content */}
<div className="p-6 bg-white/20 dark:bg-gray-900/20 overflow-y-auto flex-1">
  {/* Your content here */}
</div>
```

### Content Rules:
- ✅ **Background**: `bg-white/20 dark:bg-gray-900/20`
- ✅ **Padding**: `p-6`
- ✅ **Scrollable**: `overflow-y-auto flex-1`

---

## 🎯 Form Inputs (for forms-based modals)

### Input Fields
```tsx
<input
  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white"
  style={focused ? {
    borderColor: primary.base,
    boxShadow: `0 0 0 3px ${primary.base}20`
  } : {}}
/>
```

### Input Rules:
- ✅ **Glassmorphism**: `bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm`
- ✅ **Focus Style**: Border color changes to `primary.base` with shadow
- ✅ **Dark Mode**: `dark:bg-gray-800/60 dark:text-white dark:border-gray-600`

### Buttons
```tsx
{/* Primary Button */}
<button
  className="px-6 py-2.5 text-sm font-medium text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] backdrop-blur-sm"
  style={{ backgroundColor: primary.base }}
>
  Button Text
</button>

{/* Secondary Button */}
<button
  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-md border-2 border-gray-300 dark:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all min-h-[44px]"
>
  Cancel
</button>
```

### Button Rules:
- ✅ **Min Height**: `min-h-[44px]` (touch-friendly)
- ✅ **Glassmorphism**: `backdrop-blur-sm`
- ✅ **Primary**: Uses `primary.base` background
- ✅ **Secondary**: Uses glassmorphism with border

---

## ♿ Accessibility Requirements

### Focus Trap Implementation
```tsx
const modalRef = useRef<HTMLDivElement>(null);
const firstFocusableRef = useRef<HTMLButtonElement>(null);
const lastFocusableRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (!isOpen) return;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const firstFocusable = firstFocusableRef.current;
    const lastFocusable = lastFocusableRef.current;

    if (!firstFocusable || !lastFocusable) return;

    if (e.shiftKey) {
      // Shift+Tab: moving backwards
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  document.addEventListener('keydown', handleTabKey);

  // Auto-focus first element when modal opens
  const timer = setTimeout(() => {
    firstFocusableRef.current?.focus();
  }, 100);

  return () => {
    document.removeEventListener('keydown', handleTabKey);
    clearTimeout(timer);
  };
}, [isOpen]);
```

### Accessibility Checklist:
- ✅ `role="dialog"` on modal container
- ✅ `aria-modal="true"` on modal container
- ✅ `aria-labelledby` pointing to title ID
- ✅ `role="presentation"` on backdrop
- ✅ Focus trap with Tab/Shift+Tab cycling
- ✅ Auto-focus on first interactive element (100ms delay)
- ✅ Escape key handler
- ✅ Click-outside-to-close
- ✅ All buttons have `aria-label` or visible text
- ✅ Form inputs have proper labels with `aria-required` where needed

---

## 🌙 Dark Mode

### Dark Mode Classes (Required on ALL elements):
- Text: `dark:text-white`, `dark:text-gray-400`
- Backgrounds: `dark:bg-gray-900/50`, `dark:bg-gray-800/60`
- Borders: `dark:border-gray-700`, `dark:border-gray-600`
- Hover states: `dark:hover:bg-gray-700/60`

### Dark Mode Testing:
Test EVERY modal in both light and dark mode before marking as complete.

---

## 📱 Responsive Design

### Mobile Considerations:
- ✅ Modal uses `max-w-4xl` (or appropriate size for content)
- ✅ Padding: `p-4` on outer container for mobile spacing
- ✅ Max height: `max-h-[90vh]` to prevent overflow
- ✅ Buttons: minimum `min-h-[44px]` for touch targets
- ✅ Text sizing adjusts for mobile (consider `text-base sm:text-lg`)

---

## 🎭 Animation Standards

### Entry/Exit Animations:
```tsx
// Backdrop
animate-in fade-in duration-200

// Modal
animate-in zoom-in-95 duration-200
```

### Hover/Focus States:
- Buttons: `transition-all` or `transition-colors`
- Inputs: `transition-all` with focus shadow
- Duration: 200ms (default)

---

## 📦 Imports Required

### Standard Imports:
```tsx
import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline'; // or 24/solid
import { useThemeColors } from '@/hooks/useThemeColors';
import { toast } from 'react-hot-toast'; // if using notifications
```

### Import Rules:
- ❌ NO `BaseModal` import
- ✅ YES `useRef` for focus management
- ✅ YES `XMarkIcon` for close button
- ✅ YES `toast` for success/error notifications (NOT inline alerts)

---

## ✅ Quality Checklist (Before Marking Complete)

### Visual:
- [ ] Glassmorphism applied (`backdrop-blur-2xl`, `bg-white/50`)
- [ ] Dark mode classes on ALL elements
- [ ] Proper z-index (`z-[10002]`)
- [ ] Animations present (fade-in, zoom-in-95)
- [ ] Icon colored with `primary.base`, NO background
- [ ] Close button plain text color, NO background
- [ ] NO admin badges
- [ ] Consistent spacing (p-6 for sections)

### Functionality:
- [ ] Click outside to close works
- [ ] Escape key closes modal
- [ ] Close button works
- [ ] Focus trap implemented correctly
- [ ] Auto-focus on first element (100ms delay)
- [ ] Tab/Shift+Tab cycles focus
- [ ] All form validations work
- [ ] Success uses toast notifications (NOT inline)

### Accessibility:
- [ ] `role="dialog"` present
- [ ] `aria-modal="true"` present
- [ ] `aria-labelledby` points to title
- [ ] All interactive elements have labels
- [ ] Keyboard navigation works perfectly
- [ ] Screen reader tested (optional but recommended)

### Testing:
- [ ] Light mode tested ✅
- [ ] Dark mode tested ✅
- [ ] Mobile responsive ✅
- [ ] Tablet responsive ✅
- [ ] Desktop tested ✅
- [ ] All user flows work ✅
- [ ] No console errors ✅

---

## 🚀 Implementation Order

### Phase 1: Quick Wins (Today)
1. ✅ **MeetingTypesModal** - COMPLETE
2. ⏳ **EventDetailsModal** - NEXT
3. ⏳ **AddEditMeetingTypeModal**

### Phase 2: Core Modals (Tomorrow)
4. ⏳ **MeetingsBookingModal**
5. ⏳ **MeetingsAdminModal**

---

## 🔄 Pattern Reference (Copy-Paste Template)

See existing perfect modals:
- `InstantMeetingModal.tsx` (100/100) ✅
- `MeetingsSettingsModal.tsx` (100/100) ✅
- `MeetingTypesModal.tsx` (100/100) ✅

Use these as the source of truth for all styling patterns.

---

## 📊 Success Metrics

Each modal transformation should achieve:
- **Visual Consistency**: 100% match with reference modals
- **Dark Mode**: Full support with no visual bugs
- **Accessibility**: WCAG AAA compliance
- **Performance**: Fast, smooth animations
- **Code Quality**: Clean, maintainable, no BaseModal dependency

**Target Score: 100/100 for ALL modals** 🎯

---

**Last Updated**: November 6, 2025  
**Maintainer**: AI Development Team  
**Status**: Living Document (update as patterns evolve)

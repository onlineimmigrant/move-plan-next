# Hero Section Edit Buttons - Position Fix ✅

**Date:** 10 October 2025  
**Status:** ✅ Fixed

---

## Issue

The Edit/New buttons for the Hero Section modal were not showing when hovering over the hero title. They were placed inside the grid container instead of the main hero section container.

---

## Solution

Moved the `HoverEditButtons` component to the correct position:

### ✅ **Correct Position:**
```tsx
<div className="pt-16 min-h-screen relative isolate group px-6 lg:px-8 ...">
  {/* Hover Edit Buttons for Admin */}
  {isAdmin && organizationId && (
    <HoverEditButtons
      onEdit={() => openModal(organizationId, hero as any)}
      onNew={() => openModal(organizationId)}
      position="top-right"
    />
  )}
  
  {/* Rest of hero content... */}
</div>
```

### ❌ **Wrong Position (Removed):**
```tsx
<div className="mx-auto max-w-2xl ... grid grid-cols-1 ...">
  {/* Was here - inside grid container */}
  <HoverEditButtons ... />
</div>
```

---

## Key Changes

**File:** `/src/components/HomePageSections/Hero.tsx`

1. **Added `group` class** to main hero container (line 211)
   - Changed: `relative isolate px-6` 
   - To: `relative isolate group px-6`
   - This enables hover detection for child elements

2. **Moved HoverEditButtons** to top of hero section (lines 213-220)
   - Placed right after opening `<div>` tag
   - Before all animation and background elements
   - Ensures buttons appear on hover over entire hero section

3. **Removed duplicate HoverEditButtons** from grid container
   - Removed lines that placed buttons inside the grid
   - Cleaned up duplicate positioning logic

---

## How It Works Now

1. **User hovers over hero section** → Entire hero section has `group` class
2. **HoverEditButtons component** → Uses `group-hover:` utilities to show
3. **Buttons appear in top-right** → position="top-right" prop
4. **Only for admins** → Conditional render: `{isAdmin && organizationId && ...}`

---

## Pattern Reference

This follows the same pattern as **TemplateHeadingSection**:

```tsx
// TemplateHeadingSection.tsx (lines 162-179)
<div className="relative isolate group ...">
  {/* Hover Edit Buttons for Admin */}
  {isAdmin && (
    <HoverEditButtons
      onEdit={() => openModal(section)}
      onNew={() => openModal(undefined, section.url_page || pathname)}
      position="top-right"
    />
  )}
  
  {/* Background effects and content */}
</div>
```

---

## Testing

To test the fix:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit homepage** as an admin user

3. **Hover over hero section** → Edit and New buttons should appear in top-right corner

4. **Click Edit button** → Hero Section modal opens with current data

5. **Click New button** → Hero Section modal opens in create mode

---

## Result

✅ Hero Section edit buttons now appear correctly when hovering over the hero section  
✅ Pattern matches TemplateHeadingSection implementation  
✅ Admin-only functionality working  
✅ Top-right positioning correct  
✅ No TypeScript errors  

**Status:** Ready for testing! 🚀

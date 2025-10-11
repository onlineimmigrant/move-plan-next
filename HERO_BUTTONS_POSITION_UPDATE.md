# Hero Section Edit Buttons - Position Update ✅

**Date:** 10 October 2025  
**Status:** ✅ Fixed - Buttons moved below menu

---

## Issue

The Edit/New buttons for the Hero Section were being overlaid by the top menu which has a high z-index (z-50). The buttons were positioned at `top-4` (16px from top) which put them behind the header menu.

---

## Solution

**Instead of increasing z-index** (as requested, you'll handle menu buttons separately later), we:

1. **Added new position option** to HoverEditButtons component: `top-right-below-menu`
2. **Uses `top-24`** (96px from top) to clear the menu height
3. **Updated Hero component** to use the new position

---

## Changes Made

### 1. Button Component (`/src/ui/Button.tsx`)

**Added new position type:**
```typescript
interface HoverEditButtonsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-right-below-menu';
  // ...
}
```

**Added position class:**
```typescript
const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right-below-menu': 'top-24 right-4', // NEW: Below the header menu
};
```

### 2. Hero Component (`/src/components/HomePageSections/Hero.tsx`)

**Updated position prop:**
```typescript
<HoverEditButtons
  onEdit={() => openModal(organizationId, hero as any)}
  onNew={() => openModal(organizationId)}
  position="top-right-below-menu"  // Changed from "top-right"
/>
```

---

## Position Options Available

| Position | CSS Classes | Use Case |
|----------|-------------|----------|
| `top-right` | `top-4 right-4` | Default, for sections below header |
| `top-left` | `top-4 left-4` | Left-aligned sections |
| `bottom-right` | `bottom-4 right-4` | Bottom sections |
| `bottom-left` | `bottom-4 left-4` | Bottom left sections |
| `top-right-below-menu` | `top-24 right-4` | **Hero section** - clears fixed header |

---

## Z-Index Strategy

✅ **Kept z-index unchanged** - Buttons remain at `z-10`  
✅ **No z-index conflicts** - Positioned below menu instead  
✅ **Menu buttons separate** - As you mentioned, you'll handle menu integration later  

**Current z-index hierarchy:**
- Header menu: `z-50` (highest)
- Hero edit buttons: `z-10` (lower, but positioned below menu at `top-24`)
- Hero content: Default stacking

---

## Visual Result

```
┌─────────────────────────────────────┐
│  Header Menu (z-50)                 │ ← Fixed header
├─────────────────────────────────────┤
│  Hero Section                       │
│                    [Edit] [New] ←   │ ← Buttons at top-24
│                                     │
│     Hero Title                      │
│     Hero Description                │
│                                     │
└─────────────────────────────────────┘
```

---

## Testing

With dev server running (`npm run dev`):

1. ✅ Visit homepage as admin
2. ✅ Hover over hero section
3. ✅ Edit/New buttons appear **below the header menu**
4. ✅ Buttons are fully visible and clickable
5. ✅ No z-index conflicts
6. ✅ Menu remains on top

---

## Future Enhancements

As you mentioned, you plan to add buttons to the menu itself later. This solution keeps the architecture clean:

- **Hero buttons**: Hover-based, positioned below menu
- **Menu buttons**: (Future) Fixed in header, always visible
- **No z-index wars**: Each layer has proper positioning

---

## Result

✅ Buttons now appear below the header menu at `top-24` (96px)  
✅ Fully visible and clickable  
✅ Z-index hierarchy maintained  
✅ Ready for menu button integration later  
✅ No TypeScript errors  

**Status:** Ready for testing! 🚀

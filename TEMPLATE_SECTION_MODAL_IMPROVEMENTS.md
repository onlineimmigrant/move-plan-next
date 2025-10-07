# Template Section Edit Modal - Style Improvements

## Overview
Enhanced the template section edit modal to provide a WYSIWYG (What You See Is What You Get) editing experience, making the modal appearance match the actual section display.

## Changes Made

### 1. **WYSIWYG Title and Description Fields**

**Before:**
- Used generic `EditableTextField` and `EditableTextArea` components
- Fixed styling regardless of text style variant
- Small, form-like appearance
- Didn't reflect actual section appearance

**After:**
- Direct `<input>` and `<textarea>` elements with dynamic styling
- Matches the exact text styles from `TEXT_VARIANTS`
- Font sizes, weights, and styles mirror the actual section
- Real-time preview of how text will appear

#### Text Style Variants Applied:

**Default:**
- Title: `text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-800`
- Description: `text-lg font-light text-gray-700`

**Apple:**
- Title: `text-4xl font-light text-gray-900`
- Description: `text-lg font-light text-gray-600`

**Coded Harmony:**
- Title: `text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none`
- Description: `text-lg sm:text-xl text-gray-500 font-light leading-relaxed`

### 2. **Elegant Alignment Controls**

**Before:**
- Radio buttons in the Style tab
- Text labels (Left, Center, Right)
- Separated from the content being aligned
- Required switching tabs to see effect

**After:**
- Icon buttons using Heroicons
- Positioned directly above title/description
- Icons: `Bars3BottomLeftIcon`, `Bars3Icon`, `Bars3BottomRightIcon`
- Active state: Sky blue background (`bg-sky-100 text-sky-700`)
- Hover state: Gray background on inactive buttons
- Immediate visual feedback
- Stay in Content tab to see alignment changes

### 3. **Improved User Experience**

**Layout Changes:**
- Moved alignment controls from Style tab to Content tab
- Positioned alignment buttons at top-right of content area
- Max-width increased to `max-w-4xl` for better text preview
- Center alignment with `mx-auto` for balanced appearance
- Border-top separator before metrics section with `mt-8` spacing

**Styling Consistency:**
- Text alignment applies to both title and description
- Classes: `text-center` and `text-right` conditionally applied
- Background color preview hint added to Style tab helper text
- Style variant helper text updated: "preview in Content tab"

## Component Structure

```tsx
{activeTab === 'content' && (
  <div className="space-y-6 max-w-4xl mx-auto">
    {/* Alignment Controls */}
    <div className="flex justify-end gap-2">
      <button onClick={...} className={...}>
        <Bars3BottomLeftIcon />  {/* Left align */}
      </button>
      <button onClick={...} className={...}>
        <Bars3Icon />  {/* Center align */}
      </button>
      <button onClick={...} className={...}>
        <Bars3BottomRightIcon />  {/* Right align */}
      </button>
    </div>

    {/* Section Title - WYSIWYG */}
    <div className={cn(alignment classes)}>
      <input 
        className={cn(TEXT_VARIANTS[variant].sectionTitle)}
        ...
      />
    </div>

    {/* Section Description - WYSIWYG */}
    <div className={cn(alignment classes)}>
      <textarea 
        className={cn(TEXT_VARIANTS[variant].sectionDescription)}
        ...
      />
    </div>

    {/* Metrics Manager */}
    <div className="border-t border-gray-200 pt-6 mt-8">
      <MetricManager ... />
    </div>
  </div>
)}
```

## Visual Design

### Alignment Icons
- **Left Align**: Lines flush to left (Bars3BottomLeftIcon)
- **Center Align**: Lines centered (Bars3Icon)
- **Right Align**: Lines flush to right (Bars3BottomRightIcon)

### Button States
```css
/* Active */
bg-sky-100 text-sky-700

/* Inactive */
text-gray-400 hover:text-gray-600 hover:bg-gray-100

/* All buttons */
p-2 rounded-lg transition-colors
```

### Input Styling
```css
/* Base for both inputs */
w-full px-0 py-2 border-0 
focus:outline-none focus:ring-0 
placeholder:text-gray-300 bg-transparent

/* Plus dynamic TEXT_VARIANTS classes */
```

## User Workflow

### Old Workflow:
1. Click on section to edit
2. Enter title in small text field
3. Enter description in small text area
4. Switch to Style tab
5. Select alignment with radio buttons
6. Switch back to Content tab
7. Can't see alignment effect
8. Save and check actual section

### New Workflow:
1. Click on section to edit
2. See title/description in actual size and style
3. Click alignment icon (left/center/right)
4. See immediate alignment change
5. Type naturally with WYSIWYG preview
6. Change text style variant in Style tab
7. Switch back to Content tab to see effect
8. Everything looks exactly as it will on page
9. Save with confidence

## Benefits

### For Users:
✅ **Visual Confidence**: See exactly what you're creating
✅ **Faster Editing**: No need to save and check
✅ **Intuitive Controls**: Icons are self-explanatory
✅ **One-Click Alignment**: No form interactions needed
✅ **Real-Time Preview**: Text style changes visible immediately

### For Developers:
✅ **Code Reuse**: TEXT_VARIANTS imported from TemplateSection.tsx
✅ **Consistency**: Same styles used in display and editing
✅ **Maintainability**: Single source of truth for text styles
✅ **Accessibility**: Icon buttons with title tooltips
✅ **Responsive**: Text scales with viewport (sm:, lg: breakpoints)

## Technical Details

### State Management:
```typescript
// Alignment is stored in formData
formData.is_section_title_aligned_center  // boolean
formData.is_section_title_aligned_right   // boolean

// Left align = both false
// Center align = center true, right false
// Right align = center false, right true
```

### Conditional Classes:
```typescript
cn(
  formData.is_section_title_aligned_center && 'text-center',
  formData.is_section_title_aligned_right && 'text-right'
)
```

### Icon Imports:
```typescript
import {
  Bars3BottomLeftIcon,  // Left align
  Bars3Icon,             // Center align
  Bars3BottomRightIcon   // Right align
} from '@heroicons/react/24/outline';
```

## Comparison with Post Editor

The template section editor now follows the same principles as the post editor:

### Post Editor:
- Title: `text-4xl font-bold`
- Description: `text-lg text-gray-600` (3 rows)
- No labels, just styled inputs
- Direct text entry with visual feedback

### Template Section Editor:
- Title: Dynamic based on variant (3xl to 6xl)
- Description: Dynamic based on variant (lg to xl)
- No labels, just styled inputs
- Alignment controls above fields
- Real-time style preview

## Future Enhancements

### Possible Additions:
1. **Live Preview Pane**: Side-by-side preview of actual section
2. **Background Color Preview**: Apply background to editing area
3. **Metric Preview**: Show metrics with actual styling in modal
4. **Font Size Adjuster**: Quick +/- buttons to adjust text size
5. **Style Presets**: Save and load custom text style combinations
6. **Mobile Preview**: Toggle between desktop/mobile text sizes
7. **Undo/Redo**: Text editing history
8. **Auto-Save**: Draft saving while typing

### Accessibility:
- Add ARIA labels to icon buttons
- Keyboard shortcuts for alignment (Cmd+L, Cmd+E, Cmd+R)
- Focus management on tab switch
- Screen reader announcements for alignment changes

## Summary

The template section edit modal now provides a true WYSIWYG editing experience with:
- **Styled inputs** matching actual section appearance
- **Elegant icon buttons** for alignment control
- **Immediate visual feedback** for all changes
- **Single-tab workflow** for content editing
- **Consistent design** with the post editor

This dramatically improves the user experience by removing the guesswork and making editing more intuitive and efficient.

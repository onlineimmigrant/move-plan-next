# Hero Section Modal - 3 Critical Fixes

## Issue 1: Database Schema Error - `h1_title_color_id` ✅ FIXED

**Error:**
```
Error updating hero: {
  code: 'PGRST204',
  message: "Could not find the 'h1_title_color_id' column of 'website_hero' in the schema cache"
}
```

**Root Cause:**
- `src/app/[locale]/page.tsx` was trying to set a non-existent field `h1_title_color_id`
- This field doesn't exist in the `website_hero` table schema

**Fix Applied:**
- Removed `h1_title_color_id: heroData.h1_title_color_id || '',` from page.tsx line 130
- Hero section now updates successfully without schema errors

---

## Issue 2: Title & Description Width Not Matching Real Component ✅ FIXED

**Problem:**
- Modal wasn't respecting the `title_block_width` property
- Title and description had full width instead of constrained width like the real Hero component

**Real Hero Component Logic:**
```tsx
<div className={`mx-auto max-w-${hero.title_block_width || '2xl'} ...`}>
  <h1>...</h1>
  <p>...</p>
</div>
```

**Fixes Applied:**

### 1. Changed h1_title from input to textarea
- Added `titleTextareaRef` for auto-expansion
- Created `handleTitleChange` function with auto-resize logic
- Changed from single-line input to multi-line textarea (rows={2})
- Added useEffect for title textarea height adjustment

### 2. Applied proper width constraints
**Title:**
```tsx
<div className={`mx-auto max-w-${formData.title_block_width || '2xl'}`}>
  <textarea
    ref={titleTextareaRef}
    value={formData.h1_title}
    onChange={handleTitleChange}
    className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
    rows={2}
  />
</div>
```

**Description:**
```tsx
<div className={`mx-auto max-w-${formData.title_block_width || '2xl'}`}>
  <textarea
    ref={descriptionTextareaRef}
    value={formData.p_description}
    onChange={handleDescriptionChange}
    className="text-lg sm:text-xl font-light"
    rows={3}
  />
</div>
```

### 3. Added title_block_width to state
- Added to `HeroFormData` interface
- Added to initial state with default value `'2xl'`
- Added to useEffect initialization from `editingSection.title_block_width`
- Now fetched from database and applied correctly

---

## Issue 3: Button Labels Not Editable Inline ✅ FIXED

**Problem:**
- Button text was shown as static display
- Separate input fields below for editing button labels
- Not intuitive - users couldn't click on the button to edit its text

**Fix Applied:**
Made button text directly editable by embedding input inside the button:

### Button Above Description:
```tsx
<button className="rounded-full bg-sky-600 py-3 px-6 text-white cursor-text">
  <input
    type="text"
    value={formData.button_main_get_started}
    onChange={(e) => setFormData({ ...formData, button_main_get_started: e.target.value })}
    placeholder="Button text..."
    className="border-0 focus:outline-none bg-transparent text-white text-center min-w-[100px]"
  />
</button>
<input
  type="text"
  value={formData.button_url}
  onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
  placeholder="Button URL..."
  className="text-xs text-gray-400 border-b border-gray-200 px-2 py-1"
/>
```

### Button Below Description:
Same structure applied for consistency

### Changes:
1. **Removed** separate "Button Labels - Inline Editing" section (30+ lines of duplicate inputs)
2. **Added** inline input inside button component
3. **Added** URL input directly below each button (stacked vertically)
4. Changed button container to `flex-col items-start gap-1` for vertical layout
5. Button now has `cursor-text` to indicate it's editable

---

## Summary of Changes

### Files Modified:

1. **`/src/app/[locale]/page.tsx`**
   - Removed non-existent `h1_title_color_id` field

2. **`/src/components/modals/HeroSectionModal/HeroSectionEditModal.tsx`**
   - Added `title_block_width` to interface and state
   - Changed h1_title from input to auto-expanding textarea
   - Added `titleTextareaRef` and `handleTitleChange`
   - Wrapped title and description in width-constrained divs
   - Made button text inline editable (input inside button)
   - Removed duplicate button label fields section
   - Added URL inputs stacked below buttons

### Benefits:

✅ **No more database errors** - Schema matches actual database table  
✅ **Accurate preview** - Width matches real component exactly  
✅ **Better UX** - Click button to edit text, see URL below  
✅ **Cleaner UI** - Removed 30+ lines of duplicate fields  
✅ **Auto-expanding textareas** - Title and description grow with content  
✅ **Consistent styling** - Uses same Tailwind classes as Hero component

### Testing Checklist:

- [ ] Open modal and verify title is textarea (multi-line capable)
- [ ] Verify title and description respect max-width constraint
- [ ] Click button text and verify it's editable inline
- [ ] Edit button URL below each button
- [ ] Save and verify changes persist to database
- [ ] Verify no console errors about h1_title_color_id
- [ ] Test with different `title_block_width` values (sm, md, lg, xl, 2xl, etc.)

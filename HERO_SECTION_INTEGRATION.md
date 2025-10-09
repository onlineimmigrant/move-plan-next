# Hero Section Integration via UniversalNewButton

## Date: October 9, 2025

## Problem

User reported: "hero section is not fetched via universalnewbutton"

When clicking "Hero Section" in UniversalNewButton, it showed a "Coming soon" alert instead of opening the hero section editor.

## Analysis

The Hero Section is **not a separate entity** but rather a **section within Global Settings**. The hero data (`website_hero` table) is managed through the SettingsFormFields component under the "Hero Section" disclosure.

**Key Finding**: 
- Hero fields are already in `fieldConfig.tsx` under section key `'hero'`
- Data is loaded via `/api/organizations/${id}` as `website_hero`
- The Global Settings modal already has access to this data
- We just need to open the modal with the Hero section expanded

## Solution Implemented

### Architecture:
```
UniversalNewButton
    ↓
"Hero Section" clicked
    ↓
openGlobalSettingsModal('hero')
    ↓
GlobalSettingsModal opens
    ↓
initialSection='hero' passed to SettingsFormFields
    ↓
Hero Section auto-expands
    ↓
User can edit hero settings
```

---

## Changes Made

### 1. ✅ GlobalSettingsModalContext (Enhanced)

**File**: `src/context/GlobalSettingsModalContext.tsx`

**Added**:
```typescript
interface GlobalSettingsModalState {
  isOpen: boolean;
  initialSection?: string; // NEW: Section to open/expand initially
}

interface GlobalSettingsModalActions {
  openModal: (initialSection?: string) => void; // NEW: Accept section parameter
  closeModal: () => void;
}

// State management:
const [initialSection, setInitialSection] = useState<string | undefined>(undefined);

const openModal = useCallback((section?: string) => {
  setInitialSection(section);
  setIsOpen(true);
}, []);

const closeModal = useCallback(() => {
  setIsOpen(false);
  setInitialSection(undefined); // Clear on close
}, []);
```

**Impact**: Modal can now be opened with a specific section to expand

---

### 2. ✅ GlobalSettingsModal (Updated)

**File**: `src/components/SiteManagement/GlobalSettingsModal.tsx`

**Changes**:
```typescript
// Extract initialSection from context
const { isOpen, initialSection, closeModal } = useGlobalSettingsModal();

// Pass to SettingsFormFields
<SettingsFormFields
  settings={settings}
  onChange={handleSettingChange}
  // ... other props
  initialSection={initialSection} // NEW: Pass section to expand
/>
```

**Impact**: Modal receives and forwards the section to expand

---

### 3. ✅ SettingsFormFields (Enhanced)

**File**: `src/components/SiteManagement/SettingsFormFields.tsx`

**Added to Props**:
```typescript
interface SettingsFormFieldsProps {
  // ... existing props
  initialSection?: string; // Section key to open initially (e.g., 'hero', 'branding')
}
```

**New Effect**:
```typescript
// Open initial section if specified
useEffect(() => {
  if (initialSection && Object.keys(sectionStates).length > 0) {
    console.log('[SettingsFormFields] Opening initial section:', initialSection);
    setSectionStates(prev => ({
      ...prev,
      [initialSection]: true // Expand the specified section
    }));
  }
}, [initialSection, sectionStates]);
```

**Impact**: Automatically expands the requested section when modal opens

---

### 4. ✅ UniversalNewButton (Connected)

**File**: `src/components/AdminQuickActions/UniversalNewButton.tsx`

**Handler Updated**:
```typescript
case 'hero':
  // Open global settings modal with hero section expanded
  openGlobalSettingsModal('hero'); // NEW: Pass 'hero' section key
  break;
```

**Description Updated**:
```typescript
{
  label: 'Hero Section',
  action: 'hero',
  description: 'Edit hero section settings', // Changed from "Coming soon"
}
```

**Impact**: Clicking "Hero Section" now opens Global Settings with Hero expanded

---

## Hero Section Fields Available

Based on `fieldConfig.tsx`, the Hero Section includes:

### Basic Settings:
- **Hero Title** (`h1_title`) - Main headline with translations
- **Description** (`p_description`) - Hero description text with translations
- **Hero Image** (`hero_image`) - Background/featured image
- **Hero Name** (`hero_name`) - Alternative name field
- **Font Family** (`hero_font_family`) - Custom hero font

### Advanced Styling:
- **Text Color** (`h1_text_color`) - Solid text color
- **Gradient Colors**:
  - `h1_text_color_gradient_from` - Gradient start
  - `h1_text_color_gradient_to` - Gradient end
  - `h1_text_color_gradient_via` - Gradient middle
  - `is_h1_gradient_text` - Enable gradient
- **Text Size**:
  - `h1_text_size` - Desktop text size
  - `h1_text_size_mobile` - Mobile text size
- **Alignment** (`title_alighnement`) - Text alignment
- **Block Width** (`title_block_width`) - Content width
- **SEO Title** (`is_seo_title`) - Use as SEO title

### Background Options:
- **Gradient Background** (`is_bg_gradient`) - Enable BG gradient
- **Full Page Image** (`is_image_full_page`) - Image covers full page

---

## User Flow

### Before:
```
1. Click "Hero Section" in UniversalNewButton
2. See alert: "Creating hero - Coming soon!"
3. ❌ Cannot edit hero
```

### After:
```
1. Click "Hero Section" in UniversalNewButton
2. ✅ Global Settings modal opens
3. ✅ Hero Section automatically expanded
4. ✅ All hero fields visible and editable
5. ✅ Make changes and save
6. ✅ Changes persist via API
```

---

## Data Flow

### Loading Hero Data:
```
1. UniversalNewButton triggers: openGlobalSettingsModal('hero')
2. GlobalSettingsModal opens with initialSection='hero'
3. Modal fetches: /api/organizations/${id}
4. API returns: { organization, settings, website_hero, ... }
5. organizationWithExtras includes: website_hero data
6. SettingsFormFields receives:
   - settings (with hero fields merged)
   - initialSection='hero'
7. Hero section auto-expands
8. Fields populated from website_hero data
```

### Saving Hero Data:
```
1. User edits hero fields
2. onChange updates settings state
3. hasChanges flag set to true
4. User clicks "Save Changes"
5. POST /api/organizations/${id}/settings
6. API updates website_hero table
7. Changes persist
8. Modal shows "All changes saved"
```

---

## Section Keys Reference

For future development, these are the available section keys:

| Section Key | Description |
|-------------|-------------|
| `branding` | Logo, colors, fonts |
| `hero` | Hero section settings ✅ |
| `seo` | SEO & meta tags |
| `social` | Social media links |
| `contact` | Contact information |
| `cookie-categories` | Cookie categories |
| `cookie-services` | Cookie services |
| `advanced` | Advanced settings |

**Usage**: `openGlobalSettingsModal('section-key')` to jump to any section

---

## Testing Checklist

- [ ] Click UniversalNewButton (+ icon)
- [ ] Select "Hero Section" from menu
- [ ] Verify Global Settings modal opens
- [ ] Verify Hero Section is automatically expanded
- [ ] Verify all hero fields are visible
- [ ] Verify hero data is loaded (check console logs)
- [ ] Edit hero title
- [ ] Verify "Unsaved changes" badge appears
- [ ] Click Save
- [ ] Verify changes persist
- [ ] Close and reopen - verify saved data loads

---

## Debug Logging

Added detailed console logs in GlobalSettingsModal:
```javascript
console.log('[GlobalSettingsModal] Fetched complete organization data:', data);
console.log('[GlobalSettingsModal] Cookie categories:', data.cookie_categories);
console.log('[GlobalSettingsModal] organizationWithExtras:', organizationWithExtras);
```

Check browser console when opening the modal to verify:
1. API returns complete data
2. website_hero is populated
3. organizationWithExtras has all fields

---

## Benefits

### ✅ User Experience:
- Quick access to hero settings
- No need to navigate through all settings
- Auto-expands to relevant section
- Familiar interface (same as Global Settings)

### ✅ Code Reusability:
- No duplicate hero editing code
- Reuses existing SettingsFormFields
- Leverages existing API endpoints
- Consistent with other modals

### ✅ Maintainability:
- Single source of truth for hero fields
- Changes to hero fields auto-apply everywhere
- No separate hero modal to maintain
- Follows established patterns

---

## Future Enhancements

### Similar Pattern for Other Sections:
```typescript
// Menu Items
case 'menu':
  openGlobalSettingsModal('menu-items');
  break;

// Cookie Settings
case 'cookies':
  openGlobalSettingsModal('cookie-services');
  break;

// SEO Settings  
case 'seo':
  openGlobalSettingsModal('seo');
  break;
```

### Scrolling to Section:
Could enhance SettingsFormFields to also scroll to the expanded section:
```typescript
useEffect(() => {
  if (initialSection) {
    const element = document.getElementById(`section-${initialSection}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, [initialSection]);
```

---

## Summary

### 🎯 Problem Solved:
"Hero Section" in UniversalNewButton now works

### ✅ Solution:
Opens Global Settings modal with Hero section auto-expanded

### 📦 Components Modified:
1. GlobalSettingsModalContext - Added section parameter
2. GlobalSettingsModal - Pass section to fields
3. SettingsFormFields - Auto-expand section
4. UniversalNewButton - Call with 'hero' parameter

### 🔧 Pattern Established:
Reusable pattern for opening any settings section directly from UniversalNewButton

---

**Status**: ✅ Complete and ready for testing  
**Version**: 1.1.0  
**Next**: Test hero section opening and editing

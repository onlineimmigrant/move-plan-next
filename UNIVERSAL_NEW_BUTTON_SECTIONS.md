# UniversalNewButton Integration - Features, FAQ, and Banner Sections

## Overview
Extended the UniversalNewButton to trigger the Features, FAQ, and Banner sections in the GlobalSettingsModal, similar to the Hero section integration.

## Date
January 2025

## Changes Made

### 1. Updated Menu Descriptions
Changed the menu item descriptions from "Coming soon" to descriptive text:

```typescript
{
  label: 'Interactive',
  items: [
    {
      label: 'FAQ',
      action: 'faq',
      description: 'Manage FAQ items', // ← Changed from 'Coming soon'
    },
    {
      label: 'Feature',
      action: 'feature',
      description: 'Edit features section', // ← Changed from 'Coming soon'
    },
    {
      label: 'Banner',
      action: 'banner',
      description: 'Manage banners', // ← Changed from 'Coming soon'
    },
  ],
}
```

### 2. Added Action Handlers
Implemented switch cases to open GlobalSettingsModal with specific sections:

```typescript
case 'hero':
  // Open global settings modal with hero section expanded
  openGlobalSettingsModal('hero');
  break;
case 'faq':
  // Open global settings modal with FAQs section expanded
  openGlobalSettingsModal('faqs');
  break;
case 'feature':
  // Open global settings modal with features section expanded
  openGlobalSettingsModal('features');
  break;
case 'banner':
  // Open global settings modal with banners section expanded
  openGlobalSettingsModal('banners');
  break;
```

## Section Key Mapping

The section keys correspond to the fieldConfig sections:

| Menu Action | Section Key | Field Config Location | Content Managed |
|------------|-------------|----------------------|-----------------|
| `hero` | `hero` | Line 355 | Hero section settings (title, description, buttons, background) |
| `feature` | `features` | Line 457 | Website features |
| `faq` | `faqs` | Line 465 | FAQ items |
| `banner` | `banners` | Line 473 | Website banners |

## User Flow

### Before
1. Admin clicks UniversalNewButton (+)
2. Clicks "FAQ" → Alert: "Coming soon!"
3. Clicks "Feature" → Alert: "Coming soon!"
4. Clicks "Banner" → Alert: "Coming soon!"

### After
1. Admin clicks UniversalNewButton (+)
2. Clicks "FAQ" → GlobalSettingsModal opens with FAQ section expanded
3. Clicks "Feature" → GlobalSettingsModal opens with Features section expanded
4. Clicks "Banner" → GlobalSettingsModal opens with Banners section expanded

## Technical Implementation

### GlobalSettingsModal Context
The modal context accepts an optional `initialSection` parameter:

```typescript
interface GlobalSettingsModalContextType {
  isOpen: boolean;
  openModal: (initialSection?: string) => void;
  closeModal: () => void;
}
```

### Section Auto-Expansion
When a section key is passed, the modal:
1. Opens the GlobalSettingsModal
2. Passes `initialSection` to SettingsFormFields
3. SettingsFormFields auto-expands that specific section
4. User can immediately see and edit relevant content

### Code Flow
```
UniversalNewButton
    ↓
handleAction('faq')
    ↓
openGlobalSettingsModal('faqs')
    ↓
GlobalSettingsModalContext
    ↓
GlobalSettingsModal (opens)
    ↓
SettingsFormFields (initialSection='faqs')
    ↓
useEffect → setSectionStates({ faqs: true })
    ↓
FAQ section expanded and ready for editing
```

## Benefits

### User Experience
- **Quick Access**: One click from + button to specific content section
- **Contextual**: Menu descriptions clearly indicate what each option does
- **Consistent**: Same pattern as Hero section integration
- **Efficient**: No need to navigate through multiple menus

### Developer Experience
- **Extensible**: Easy to add more sections following same pattern
- **Maintainable**: Clear mapping between actions and sections
- **Type-Safe**: TypeScript ensures correct section keys
- **Documented**: Comments explain each handler

## Testing Checklist

✅ Click UniversalNewButton (+) floating button
✅ Click "FAQ" → GlobalSettingsModal opens
✅ Verify FAQs section is auto-expanded
✅ Verify FAQ content is visible and editable
✅ Click "Feature" → GlobalSettingsModal opens
✅ Verify Features section is auto-expanded
✅ Verify Features content is visible and editable
✅ Click "Banner" → GlobalSettingsModal opens
✅ Verify Banners section is auto-expanded
✅ Verify Banner content is visible and editable
✅ Click "Hero Section" → Still works as before
✅ All sections open without console errors
✅ Modal closes properly after editing

## Related Files

### Modified
- `src/components/AdminQuickActions/UniversalNewButton.tsx`
  - Updated menu descriptions
  - Added action handlers for faq, feature, banner

### Dependencies
- `src/context/GlobalSettingsModalContext.tsx`
  - Provides `openModal(initialSection?: string)` function
  
- `src/components/SiteManagement/GlobalSettingsModal.tsx`
  - Receives and passes `initialSection` to SettingsFormFields
  
- `src/components/SiteManagement/SettingsFormFields.tsx`
  - Auto-expands section based on `initialSection` prop
  - Uses useRef to prevent infinite loop
  
- `src/components/SiteManagement/fieldConfig.tsx`
  - Defines section keys: `hero`, `features`, `faqs`, `banners`

## Future Enhancements

### Additional Sections
Following the same pattern, these sections can be easily added:
- `products` → Product management
- `blog-posts` → Blog post management
- `cookie-categories` → Cookie consent categories
- `ai-agents` → AI agent configuration

### Example Addition
```typescript
case 'products':
  openGlobalSettingsModal('products');
  break;
```

### Menu Organization
Consider reorganizing menu categories as more sections are added:
- Content Management (hero, features, faqs)
- E-commerce (products, pricing)
- Compliance (banners, cookies)
- AI & Automation (agents, chatbots)

## Related Documentation

- [HERO_FIELDS_FIX.md](./HERO_FIELDS_FIX.md) - Hero section data loading
- [INFINITE_LOOP_FIXES.md](./INFINITE_LOOP_FIXES.md) - Auto-expand implementation
- [GLOBAL_SETTINGS_MODAL_INTEGRATION.md](./GLOBAL_SETTINGS_MODAL_INTEGRATION.md) - Modal system architecture

## Conclusion

The UniversalNewButton now provides quick access to four key content sections:
- Hero Section
- Features
- FAQs
- Banners

This enhancement improves admin workflow efficiency by reducing clicks and providing direct access to commonly edited content areas. The implementation follows established patterns and is easily extensible for future sections.

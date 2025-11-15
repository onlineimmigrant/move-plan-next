# Menu Translation Implementation Plan

## Overview
Add AI-powered translation functionality to Header and Footer edit modals for menu items and submenu items. Implementation will follow the successful pattern from Hero Section modal.

---

## Database Schema Analysis

### Tables & Translation Fields

**`website_menuitem`** (Header & Footer menus)
- Translation fields:
  - `display_name_translation` (JSONB) - translates `display_name`
  - `description_translation` (JSONB) - translates `description`

**`website_submenuitem`** (Submenu items)
- Translation fields:
  - `name_translation` (JSONB) - translates `name`
  - `description_translation` (JSONB) - translates `description`

---

## Implementation Strategy

### Two-Stage Approach

#### **Stage 1: Header Edit Modal** (Polish the pattern)
- Implement complete translation functionality for menu items
- Test with both menu and submenu items
- Refine UI/UX patterns
- Document any edge cases or improvements

#### **Stage 2: Footer Edit Modal** (Replicate the pattern)
- Apply the polished pattern from Stage 1
- Ensure consistency across both modals
- Minimal changes expected due to shared structure

---

## Stage 1: Header Edit Modal Implementation

### Step 1.1: Update Translator Agent Configuration

**Action**: Add menu translation tasks to the translator agent

```sql
-- Add website_menuitem and website_submenuitem to translator agent
UPDATE public.ai_models_system
SET task = jsonb_insert(
  task,
  '{999}',
  '{
    "table": "website_menuitem",
    "fields": ["display_name", "description"],
    "name": "Translate Menu Items",
    "system_message": "Translate the provided menu item text from {source_lang} to {target_lang}. Preserve formatting, maintain brevity for menu labels, and return only the translation."
  }'::jsonb
)
WHERE role = 'translator';

UPDATE public.ai_models_system
SET task = jsonb_insert(
  task,
  '{999}',
  '{
    "table": "website_submenuitem",
    "fields": ["name", "description"],
    "name": "Translate Submenu Items",
    "system_message": "Translate the provided submenu item text from {source_lang} to {target_lang}. Preserve formatting, maintain conciseness for navigation labels, and return only the translation."
  }'::jsonb
)
WHERE role = 'translator';
```

### Step 1.2: Create TranslationsSection Component

**File**: `/src/components/modals/HeaderEditModal/sections/TranslationsSection.tsx`

**Features**:
- Table-based layout with scrollable columns
- Separate sections for Menu Items and Submenu Items
- JSONB bulk edit modals ({} buttons in column headers)
- AI Translate All button with progress indicator
- Add/Remove language functionality
- Original language row (highlighted)
- Translation rows (editable textareas)

**Props Interface**:
```tsx
interface TranslationsSectionProps {
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  primaryColor: string;
}
```

**Key Functionality**:
1. **Menu Items Table**:
   - Columns: Code | Language | Display Name | Description
   - Row per language with editable textareas
   - {} buttons for JSONB bulk editing
   - Remove language button (on hover)

2. **Submenu Items Accordion**:
   - Collapsible sections per menu item
   - Same column structure as menu items
   - Nested within menu item context

3. **AI Translation**:
   - Translate all menu items at once
   - Translate all submenu items at once
   - Batch processing with progress indicator
   - Error handling with partial success support

4. **Language Management**:
   - Add missing languages from `supported_locales`
   - Remove individual languages
   - Sync with organization settings

### Step 1.3: Create Custom Hook for Menu Translation

**File**: `/src/components/modals/HeaderEditModal/hooks/useMenuTranslation.ts`

**Purpose**: Specialized hook for translating menu items with batch support

```tsx
export interface UseMenuTranslationReturn {
  translateAllMenuItems: (menuItems: MenuItem[]) => Promise<TranslationResult>;
  translateAllSubmenuItems: (submenuItems: SubmenuItem[]) => Promise<TranslationResult>;
  isTranslating: boolean;
  progress: { total: number; completed: number; current: string } | null;
  error: string | null;
}
```

**Features**:
- Batch translate multiple menu items
- Batch translate multiple submenu items
- Real-time progress tracking
- Error handling with partial success
- Uses existing `/api/ai/translate` endpoint

### Step 1.4: Update HeaderEditModal

**File**: `/src/components/modals/HeaderEditModal/HeaderEditModal.tsx`

**Changes**:
1. Add "Translations" button to mega menu panel:
   ```tsx
   { id: 'translations', label: 'Translations', icon: GlobeAltIcon }
   ```

2. Import TranslationsSection component

3. Add translations section in mega menu dropdown:
   ```tsx
   {openMenu === 'translations' && (
     <TranslationsSection
       menuItems={localMenuItems}
       setMenuItems={setLocalMenuItems}
       primaryColor={primary.base}
     />
   )}
   ```

4. Adjust container padding for translations (same as Hero):
   ```tsx
   className={`max-w-7xl mx-auto py-6 h-full ${openMenu === 'translations' ? 'px-2' : 'px-6'}`}
   ```

### Step 1.5: Update MenuItem Type Definitions

**File**: `/src/components/modals/HeaderEditModal/types/index.ts`

**Changes**: Ensure type definitions include translation fields

```tsx
export interface MenuItem {
  id: string;
  display_name: string;
  url_name: string;
  description?: string;
  is_displayed: boolean;
  order: number;
  is_displayed_on_footer: boolean;
  react_icon_id?: number;
  organization_id: string;
  
  // Translation fields
  display_name_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
  
  menu_items_are_text?: boolean;
  updated_at?: string;
  submenu_items?: SubmenuItem[];
}

export interface SubmenuItem {
  id: string;
  order: number;
  name: string;
  description?: string;
  is_displayed: boolean;
  url_name: string;
  menu_item_id: number;
  image?: string;
  organization_id: string;
  
  // Translation fields
  name_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
  
  updated_at?: string;
}
```

### Step 1.6: Update Context API Calls

**File**: `/src/components/modals/HeaderEditModal/context.tsx`

**Changes**: Ensure `updateMenuItems` saves translation fields to database

```tsx
const updateMenuItems = async (items: MenuItem[]) => {
  // Update menu items with translation fields
  const { error: menuError } = await supabase
    .from('website_menuitem')
    .upsert(items.map(item => ({
      id: item.id,
      display_name: item.display_name,
      description: item.description,
      display_name_translation: item.display_name_translation || {},
      description_translation: item.description_translation || {},
      // ... other fields
    })));

  // Update submenu items with translation fields
  for (const item of items) {
    if (item.submenu_items && item.submenu_items.length > 0) {
      await supabase
        .from('website_submenuitem')
        .upsert(item.submenu_items.map(sub => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
          name_translation: sub.name_translation || {},
          description_translation: sub.description_translation || {},
          // ... other fields
        })));
    }
  }
};
```

### Step 1.7: Export TranslationsSection

**File**: `/src/components/modals/HeaderEditModal/sections/index.ts`

```tsx
export { MenuSection } from './MenuSection';
export { StyleSection } from './StyleSection';
export { LogoSection } from './LogoSection';
export { TranslationsSection } from './TranslationsSection'; // Add this
```

### Step 1.8: Testing & Refinement

**Test Cases**:
1. ✅ Add missing languages from supported_locales
2. ✅ Manually edit translations in textareas
3. ✅ Bulk edit using JSONB modal
4. ✅ AI translate all menu items
5. ✅ AI translate all submenu items
6. ✅ Remove languages
7. ✅ Save and persist translations
8. ✅ Load existing translations on modal open
9. ✅ Handle partial translation errors
10. ✅ Progress indicator during AI translation

**Refinements to Document**:
- UI/UX improvements
- Performance optimizations
- Error handling patterns
- Edge cases discovered

---

## Stage 2: Footer Edit Modal Implementation

### Step 2.1: Create TranslationsSection Component

**File**: `/src/components/modals/FooterEditModal/sections/TranslationsSection.tsx`

**Action**: Copy and adapt from HeaderEditModal with minimal changes:
- Same table structure
- Same JSONB modals
- Same AI translation logic
- Adjust prop names if needed (e.g., `footerMenuItems` vs `menuItems`)

### Step 2.2: Create Custom Hook

**File**: `/src/components/modals/FooterEditModal/hooks/useMenuTranslation.ts`

**Action**: Copy from HeaderEditModal (can potentially share the hook)

### Step 2.3: Update FooterEditModal

**File**: `/src/components/modals/FooterEditModal/FooterEditModal.tsx`

**Changes**:
1. Add "Translations" button to mega menu
2. Import and render TranslationsSection
3. Adjust padding for translations tab
4. Same pattern as Header modal

### Step 2.4: Update Type Definitions

**File**: `/src/components/modals/FooterEditModal/types/index.ts`

**Action**: Ensure translation fields are included (likely already done if using shared types)

### Step 2.5: Update Context & API Calls

**File**: `/src/components/modals/FooterEditModal/context.tsx`

**Action**: Mirror HeaderEditModal context updates for saving translations

### Step 2.6: Export TranslationsSection

**File**: `/src/components/modals/FooterEditModal/sections/index.ts`

**Action**: Add TranslationsSection export

### Step 2.7: Testing

**Test Cases**: Same as Stage 1
- Ensure consistency with Header modal
- Verify no regressions
- Confirm shared translation logic works

---

## Shared Utilities & Hooks

### Option 1: Reuse Generic Hook
Use existing `useTranslation` hook from `/src/hooks/useTranslation.ts`

**Pros**: 
- Already built and tested
- Generic and reusable
- Consistent API

**Cons**:
- May need wrapper for batch menu item operations

### Option 2: Create Specialized Hook
Create `useMenuTranslation` specific to menu items

**Pros**:
- Optimized for menu item structure
- Batch operations built-in
- Better type safety for MenuItem/SubmenuItem

**Cons**:
- Code duplication
- Additional maintenance

**Recommendation**: Start with generic `useTranslation` hook, create specialized hook only if needed for batch operations

---

## UI/UX Considerations

### Layout
- **Table Structure**: Same as Hero Section (horizontal scroll, sticky first column)
- **Sections**: Menu Items table + Submenu Items accordion
- **Mega Menu**: Same glassmorphic design with "Translations" tab

### Responsive Design
- Desktop: Full table view
- Tablet: Horizontal scroll with sticky column
- Mobile: 
  - Reduce padding (`px-2`)
  - Stack language code + name vertically
  - Maintain sticky first column

### Visual Hierarchy
1. **Original Language Row**: Blue highlight (`bg-blue-50/50`)
2. **Translation Rows**: Hover effect (`hover:bg-gray-50`)
3. **Submenu Items**: Nested accordion with indentation

### Accessibility
- Keyboard shortcuts (Esc to close mega menu)
- ARIA labels for buttons
- Focus management in modals
- Sufficient color contrast

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ HeaderEditModal / FooterEditModal                           │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │ Mega Menu: [Style] [Menu Items] [Translations]    │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │ TranslationsSection                                │      │
│  │                                                     │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │ Menu Items Table                             │  │      │
│  │  │ - display_name_translation                   │  │      │
│  │  │ - description_translation                    │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  │                                                     │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │ Submenu Items Accordion                      │  │      │
│  │  │ - name_translation                           │  │      │
│  │  │ - description_translation                    │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  │                                                     │      │
│  │  [Add Missing Languages] [AI Translate All]       │      │
│  │                                                     │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                                            │
         │ useTranslation()                          │
         │ or useMenuTranslation()                   │
         │                                            │
         ▼                                            ▼
┌──────────────────────┐                  ┌──────────────────────┐
│ /api/ai/translate    │                  │ translation-utils    │
│                      │                  │                      │
│ - Authenticates      │                  │ - mergeTranslations  │
│ - Validates table    │                  │ - prepareFields      │
│ - Calls AI provider  │                  │ - getMissingLangs    │
│ - Returns JSONB      │                  │ - validateData       │
└──────────────────────┘                  └──────────────────────┘
```

---

## File Structure

```
src/components/modals/
├── HeaderEditModal/
│   ├── HeaderEditModal.tsx               (✏️ Update)
│   ├── context.tsx                       (✏️ Update)
│   ├── types/
│   │   └── index.ts                      (✏️ Update - add translation fields)
│   ├── hooks/
│   │   ├── useMenuOperations.ts          (No changes)
│   │   ├── useDragDropHandlers.ts        (No changes)
│   │   └── useMenuTranslation.ts         (📄 NEW - Optional)
│   └── sections/
│       ├── index.ts                      (✏️ Update - export TranslationsSection)
│       ├── MenuSection.tsx               (No changes)
│       ├── StyleSection.tsx              (No changes)
│       ├── LogoSection.tsx               (No changes)
│       └── TranslationsSection.tsx       (📄 NEW)
│
├── FooterEditModal/
│   ├── FooterEditModal.tsx               (✏️ Update)
│   ├── context.tsx                       (✏️ Update)
│   ├── types/
│   │   └── index.ts                      (✏️ Update - add translation fields)
│   ├── hooks/
│   │   ├── useMenuOperations.ts          (No changes)
│   │   ├── useDragDropHandlers.ts        (No changes)
│   │   └── useMenuTranslation.ts         (📄 NEW - Optional, may share)
│   └── sections/
│       ├── index.ts                      (✏️ Update - export TranslationsSection)
│       ├── MenuSection.tsx               (No changes)
│       ├── StyleSection.tsx              (No changes)
│       └── TranslationsSection.tsx       (📄 NEW)
│
└── HeroSectionModal/
    └── sections/
        └── TranslationsSection.tsx       (✓ Reference implementation)
```

---

## Dependencies

### Existing (Already Available)
- ✅ `/api/ai/translate` endpoint
- ✅ `useTranslation` hook (`/src/hooks/useTranslation.ts`)
- ✅ `translation-utils` (`/src/lib/services/translation-utils.ts`)
- ✅ Organization settings context (language, supported_locales)
- ✅ Translator agent with role='translator'

### New (To Be Created)
- 📄 TranslationsSection components (Header & Footer)
- 📄 useMenuTranslation hooks (Optional - may use generic hook)
- 📄 Type updates for MenuItem/SubmenuItem
- 📄 Context updates for saving translations

---

## Implementation Checklist

### Stage 1: Header Edit Modal
- [x] **1.1** Update translator agent with menu item tasks (SQL) - DONE BY USER
- [x] **1.2** Create TranslationsSection component
  - [x] Menu Items table with translation columns
  - [x] Submenu Items accordion
  - [x] JSONB bulk edit modals
  - [x] AI Translate All button
  - [x] Add/Remove language functionality
- [x] **1.3** Create/adapt useMenuTranslation hook (using generic useTranslation)
- [x] **1.4** Update HeaderEditModal.tsx
  - [x] Add Translations tab to mega menu
  - [x] Import and render TranslationsSection
  - [x] Adjust padding for translations
- [x] **1.5** Update MenuItem type definitions (description_translation added)
- [x] **1.6** Update context to save translation fields
  - [x] Updated updateMenuItems to save all menu item fields + translations
  - [x] Added submenu item translation saving
  - [x] Updated API route to handle display_name_translation
- [x] **1.7** Export TranslationsSection in sections/index.ts
- [x] **1.8** Ready for testing
  - [ ] Manual translation editing
  - [ ] JSONB bulk editing
  - [ ] AI translation
  - [ ] Language management
  - [ ] Save/load persistence

**Stage 1 Status**: ✅ **IMPLEMENTATION COMPLETE** - Ready for User Testing

### Stage 2: Footer Edit Modal
- [x] **2.1** Create TranslationsSection component (copy from Header)
- [x] **2.2** Create/adapt useMenuTranslation hook (using generic useTranslation)
- [x] **2.3** Update FooterEditModal.tsx
  - [x] Add Translations tab to mega menu
  - [x] Import and render TranslationsSection
  - [x] Adjust padding for translations
- [x] **2.4** Update type definitions
  - [x] Added translation fields to MenuItem interface
  - [x] Added translation fields to SubMenuItem interface
- [x] **2.5** Update context for saving translations
  - [x] Updated updateMenuItems to save all fields + translations
  - [x] Added submenu item translation saving
- [x] **2.6** Export TranslationsSection in sections/index.ts
- [x] **2.7** TypeScript compilation verified (no errors)

**Stage 2 Status**: ✅ **IMPLEMENTATION COMPLETE** - Ready for User Testing

### Documentation
- [ ] Update TRANSLATION_SERVICE_GUIDE.md with menu item examples
- [ ] Create MENU_TRANSLATION_USAGE.md for end users
- [ ] Update README if needed

---

## Considerations & Edge Cases

### 1. Batch Translation Performance
- **Issue**: Translating 10+ menu items with 10+ languages = 100+ API calls
- **Solution**: 
  - Batch requests in groups
  - Show progress indicator
  - Allow cancellation
  - Cache translations to avoid re-translation

### 2. Submenu Item Context
- **Issue**: Submenu items belong to parent menu items
- **Solution**: 
  - Display in accordion grouped by parent
  - Show parent menu item name in context
  - Allow batch translation per parent or all at once

### 3. Empty Menu Items
- **Issue**: Users may not have all fields filled
- **Solution**: 
  - Skip empty fields in AI translation
  - Show warning if no content to translate
  - Filter out empty submissions

### 4. JSONB Validation
- **Issue**: Users may paste invalid JSON
- **Solution**: 
  - Use try-catch in applyJsonbData
  - Show specific error messages
  - Provide example format in placeholder

### 5. Language Code Normalization
- **Issue**: Different language code formats (en-US vs en)
- **Solution**: 
  - Normalize to lowercase 2-letter codes
  - Document supported format
  - Validate against supported_locales

### 6. Real-time Updates
- **Issue**: Multiple users editing same menu
- **Solution**: 
  - Use optimistic updates
  - Show warning on save conflicts
  - Consider last-write-wins strategy

### 7. Migration of Existing Data
- **Issue**: Existing menu items may not have translation fields
- **Solution**: 
  - Fields are nullable in database
  - Initialize as empty objects `{}` if null
  - No migration needed (handled in code)

---

## Success Criteria

### Functional Requirements
- ✅ Menu items can be translated into all supported languages
- ✅ Submenu items can be translated into all supported languages
- ✅ AI translation works for both display_name and description
- ✅ JSONB bulk editing works for all translation fields
- ✅ Translations persist to database correctly
- ✅ Translations load correctly on modal open

### User Experience
- ✅ UI is consistent with Hero Section modal
- ✅ Table is responsive and scrollable
- ✅ Progress indicator shows during AI translation
- ✅ Error messages are clear and actionable
- ✅ Keyboard shortcuts work (Esc to close)

### Code Quality
- ✅ TypeScript types are complete and accurate
- ✅ Components are reusable between Header/Footer
- ✅ Code follows existing patterns and conventions
- ✅ No console errors or warnings
- ✅ Proper error handling throughout

---

## Timeline Estimate

### Stage 1: Header Edit Modal
- **Setup** (1.1): 15 minutes
- **TranslationsSection Component** (1.2): 3-4 hours
- **Hook** (1.3): 1 hour
- **Modal Integration** (1.4): 30 minutes
- **Types** (1.5): 30 minutes
- **Context Updates** (1.6): 1 hour
- **Exports** (1.7): 5 minutes
- **Testing & Refinement** (1.8): 2-3 hours

**Total Stage 1**: 8-10 hours

### Stage 2: Footer Edit Modal
- **Copy & Adapt** (2.1-2.6): 2-3 hours (most is copying)
- **Testing** (2.7): 1-2 hours

**Total Stage 2**: 3-5 hours

### Documentation
- 1 hour

**Grand Total**: 12-16 hours

---

## Next Steps

1. ✅ Review and approve this implementation plan
2. ✅ Execute Stage 1 (Header Edit Modal)
3. ✅ Execute Stage 2 (Footer Edit Modal)
4. ⏳ Test both modals (Header & Footer)
5. ⏳ User acceptance testing
6. ⏳ Update documentation

---

## Questions for Clarification

1. **Shared Hook**: Should we create a specialized `useMenuTranslation` hook or use the generic `useTranslation` hook?
   - **Recommendation**: Start with generic, create specialized if needed

2. **Batch Strategy**: Should AI translation process menu items sequentially or in parallel batches?
   - **Recommendation**: Parallel batches of 3-5 items to balance speed and API limits

3. **Submenu Display**: Should submenu translations be in accordion or separate table?
   - **Recommendation**: Accordion grouped by parent menu item for context

4. **Language Addition**: Should "Add Missing Languages" add to all menu items or just selected ones?
   - **Recommendation**: Add to all menu items at once (consistent with Hero Section)

5. **Footer Reuse**: Can Footer reuse Header's TranslationsSection or should it be separate?
   - **Recommendation**: Separate files but shared logic/utilities for maintainability

---

**Status**: ✅ Ready for Review
**Next Action**: Await approval to begin Stage 1 implementation

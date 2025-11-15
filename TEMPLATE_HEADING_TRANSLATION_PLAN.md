# Template Heading Section Translation Implementation Plan

## ✅ Implementation Complete

Translation functionality has been successfully added to the TemplateHeadingSectionEditModal. The implementation follows the proven pattern from Header/Footer menu modals with adaptations for single-item editing.

### What Was Implemented

1. **✅ TranslationsSection Component** (`/src/components/modals/TemplateHeadingSectionModal/sections/TranslationsSection.tsx`)
   - Table-based layout for single-item editing (unlike accordion for menus)
   - Three translation fields: name, description_text, button_text
   - JSONB bulk editing modals per field
   - AI Translate All with granular checking (skips existing translations)
   - Add/Remove language functionality
   - Fixed bottom panel with Save button (inactive when no changes)

2. **✅ Type Definitions Updated** (`types/index.ts`)
   - Added `name_translation?: Record<string, string>`
   - Added `description_text_translation?: Record<string, string>`
   - Added `button_text_translation?: Record<string, string>`

3. **✅ Modal Integration** (`TemplateHeadingSectionEditModal.tsx`)
   - Added Translations tab to mega menu with GlobeAltIcon
   - Conditional rendering for translations section
   - Proper props passing (formData, setFormData, primaryColor)

4. **✅ Context & API Verified**
   - Context already includes translation fields in TemplateHeadingSectionData interface
   - API routes (GET, POST, PUT) handle translation fields correctly
   - No changes needed - already production-ready

5. **✅ TypeScript Compilation**
   - All compile errors resolved
   - Proper type safety for setFormData (direct object updates, not function callbacks)
   - Export added to sections/index.ts

### Translation Agent Configuration

The translator agent needs to be configured with template heading section tasks:

```sql
-- Add website_templatesectionheading to translator agent
UPDATE public.ai_models_system
SET task = jsonb_insert(
  task,
  '{999}',
  '{
    "table": "website_templatesectionheading",
    "fields": ["name", "description_text", "button_text"],
    "name": "Translate Template Heading Sections",
    "system_message": "Translate the provided template heading section text from {source_lang} to {target_lang}. Preserve formatting, maintain impact for headings, clarity for descriptions, and action-orientation for buttons. Return only the translation."
  }'::jsonb
)
WHERE role = 'translator';
```

---

## Original Plan (For Reference)

## Overview
Add AI-powered translation functionality to the TemplateHeadingSectionEditModal for translating heading names, descriptions, and button text. Implementation will follow the successful pattern from Header/Footer menu modals.

---

## Database Schema Analysis

### Table & Translation Fields

**`website_templatesectionheading`**
- **Translatable Fields**:
  - `name` → `name_translation` (JSONB)
  - `description_text` → `description_text_translation` (JSONB)
  - `button_text` → `button_text_translation` (JSONB)

- **Non-translatable Fields**:
  - `name_part_2` (Optional - typically used for styling splits, not separate translations)
  - `name_part_3` (Optional - typically used for styling splits, not separate translations)
  - `image`, `url_page`, `button_text`, `url`, `style_variant`, `background_color`, etc.

**Note**: `name_part_2` and `name_part_3` are visual variants of the same title (e.g., different words with gradient effects), not separate content requiring translation. They can be included in the same `name_translation` JSONB or handled separately based on UX requirements.

---

## Implementation Strategy

### Single-Modal Approach
Unlike menu modals with multiple menu items, Template Heading Sections are edited one at a time. The translation UI will be:
- **Simpler**: Single item editing (not accordion-based)
- **Focused**: Three translation fields in a table layout
- **Integrated**: Translations tab in the existing mega menu design

---

## Implementation Steps

### Step 1: Update Translator Agent Configuration

**Action**: Add template heading section translation tasks to the translator agent

```sql
-- Add website_templatesectionheading to translator agent
UPDATE public.ai_models_system
SET task = jsonb_insert(
  task,
  '{999}',
  '{
    "table": "website_templatesectionheading",
    "fields": ["name", "description_text", "button_text"],
    "name": "Translate Template Heading Sections",
    "system_message": "Translate the provided template heading section text from {source_lang} to {target_lang}. Preserve formatting, maintain impact for headings, clarity for descriptions, and action-orientation for buttons. Return only the translation."
  }'::jsonb
)
WHERE role = 'translator';
```

---

### Step 2: Create TranslationsSection Component

**File**: `/src/components/modals/TemplateHeadingSectionModal/sections/TranslationsSection.tsx`

**Layout**: Simple table-based design (not accordion, since editing single item)

**Features**:
- Table columns: Code | Language | Name | Description | Button Text
- Original language row (highlighted)
- Translation rows (editable textareas)
- JSONB bulk edit buttons ({} in column headers)
- Add/Remove language functionality
- AI Translate All button
- Fixed bottom panel with Save button
- Inactive save state when no changes

**Props Interface**:
```tsx
interface TranslationsSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  primaryColor: string;
}
```

**Key Functionality**:
1. **Translation Table**:
   - Row per language
   - Three editable textarea columns: Name, Description, Button Text
   - {} buttons for JSONB bulk editing per field
   - Inline remove language button (hover-to-show)

2. **AI Translation**:
   - Translate all three fields at once
   - Granular checking (skip existing translations)
   - Progress indicator
   - Error handling

3. **Language Management**:
   - Add missing languages from `supported_locales`
   - Remove individual languages
   - Sync with organization settings

4. **Save Behavior**:
   - Track unsaved changes
   - Save button in fixed bottom panel
   - Disabled when no changes or saving

---

### Step 3: Update Type Definitions

**File**: `/src/components/modals/TemplateHeadingSectionModal/types/index.ts`

**Changes**: Add translation fields to `HeadingFormData`

```tsx
export interface HeadingFormData {
  name: string;
  name_part_2?: string;
  name_part_3?: string;
  description_text: string;
  button_text?: string;
  url_page?: string;
  url?: string;
  image?: string;
  image_first?: boolean;
  is_included_templatesection?: boolean;
  background_color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  } | null;
  text_style_variant?: 'default' | 'apple' | 'codedharmony';
  is_text_link?: boolean;
  
  // Translation fields
  name_translation?: Record<string, string>;
  description_text_translation?: Record<string, string>;
  button_text_translation?: Record<string, string>;
  
  // ... other fields
}
```

---

### Step 4: Update TemplateHeadingSectionEditModal

**File**: `/src/components/modals/TemplateHeadingSectionModal/TemplateHeadingSectionEditModal.tsx`

**Changes**:

1. Add `GlobeAltIcon` import
2. Import `TranslationsSection` component
3. Add "Translations" tab to mega menu buttons
4. Add conditional rendering for translations section
5. Adjust padding for translations tab

```tsx
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { TranslationsSection } from './sections';

// In mega menu buttons array:
{ id: 'translations', label: 'Translations', icon: GlobeAltIcon }

// In mega menu dropdown (adjust padding):
<div className={`max-w-7xl mx-auto py-6 h-full ${openMenu === 'translations' ? 'px-4 md:px-6' : 'px-6'}`}>
  {/* ... */}
  {openMenu === 'translations' && (
    <TranslationsSection
      formData={formData}
      setFormData={setFormData}
      primaryColor={primary.base}
    />
  )}
</div>
```

---

### Step 5: Update Context for Saving Translations

**File**: `/src/components/modals/TemplateHeadingSectionModal/context.tsx`

**Changes**: Ensure `updateSection` saves translation fields to database

```tsx
const updateSection = useCallback(async (data: Partial<TemplateHeadingSectionData>) => {
  try {
    const response = await fetch(`/api/template-heading-sections/${editingSection?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        name_translation: data.name_translation || {},
        description_text: data.description_text,
        description_text_translation: data.description_text_translation || {},
        button_text: data.button_text,
        button_text_translation: data.button_text_translation || {},
        // ... other fields
      })
    });
    
    // ... rest of implementation
  }
}, [editingSection]);
```

**Note**: Ensure the context interface `TemplateHeadingSectionData` already includes translation fields (already present based on grep search).

---

### Step 6: Verify/Update API Route

**File**: `/src/app/api/template-heading-sections/[id]/route.ts` (or similar)

**Action**: Ensure PUT endpoint accepts and saves translation fields:
- `name_translation`
- `description_text_translation`
- `button_text_translation`

---

### Step 7: Export TranslationsSection

**File**: `/src/components/modals/TemplateHeadingSectionModal/sections/index.ts`

```tsx
export { TitleSection } from './TitleSection';
export { DescriptionSection } from './DescriptionSection';
export { ButtonSection } from './ButtonSection';
export { ImageSection } from './ImageSection';
export { BackgroundSection } from './BackgroundSection';
export { TranslationsSection } from './TranslationsSection'; // Add this
```

---

### Step 8: Testing

**Test Cases**:
1. ✅ Add missing languages from supported_locales
2. ✅ Manually edit translations in textareas
3. ✅ Bulk edit using JSONB modal
4. ✅ AI translate all fields (name, description, button)
5. ✅ Remove languages
6. ✅ Save and persist translations
7. ✅ Load existing translations on modal open
8. ✅ Handle partial translation errors
9. ✅ Progress indicator during AI translation
10. ✅ Inactive save button when no changes

---

## UI/UX Design

### Table Layout (Single Item)

```
┌────────────────────────────────────────────────────────────────────┐
│ Translations                                                        │
│ Original: English • Supported: 5 languages                         │
├────────────────────────────────────────────────────────────────────┤
│ Code │ Language  │ Name              │ Description │ Button Text   │
├──────┼───────────┼───────────────────┼─────────────┼───────────────┤
│ EN   │ English   │ [textarea]        │ [textarea]  │ [textarea]    │
│      │ (Original)│                   │             │               │
├──────┼───────────┼───────────────────┼─────────────┼───────────────┤
│ ES   │ Spanish X │ [textarea] {}     │ [textarea]{}│ [textarea] {} │
│ FR   │ French  X │ [textarea] {}     │ [textarea]{}│ [textarea] {} │
│ DE   │ German  X │ [textarea] {}     │ [textarea]{}│ [textarea] {} │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│ [Add Missing Languages]           [AI Translate All] [Save]        │
└────────────────────────────────────────────────────────────────────┘
```

### Visual Design
- **Original Row**: Blue highlight (`bg-blue-50/50`)
- **Translation Rows**: Hover effect (`hover:bg-gray-50`)
- **Remove Button**: Inline X button (opacity-0 group-hover:opacity-100)
- **JSONB Buttons**: {} in each cell for bulk editing
- **Bottom Panel**: Fixed, rounded corners (`rounded-b-2xl`)
- **Save Button**: Disabled when `!hasUnsavedChanges || isSaving`

### Responsive Design
- **Desktop**: Full table view with three content columns
- **Tablet**: Horizontal scroll
- **Mobile**: Reduce padding (`px-2`), maintain scrollability

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ TemplateHeadingSectionEditModal                             │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Mega Menu: [Title] [Description] [Button]        │       │
│  │            [Image] [Background] [Translations]   │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ TranslationsSection                               │       │
│  │                                                   │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │ Translation Table                           │  │       │
│  │  │ - name_translation                          │  │       │
│  │  │ - description_text_translation              │  │       │
│  │  │ - button_text_translation                   │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  │                                                   │       │
│  │  [Add Missing Languages] [AI Translate] [Save]  │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                                            │
         │ useTranslation()                          │
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
src/components/modals/TemplateHeadingSectionModal/
├── TemplateHeadingSectionEditModal.tsx  (✏️ Update - add Translations tab)
├── context.tsx                          (✏️ Update - save translations)
├── types/
│   └── index.ts                         (✏️ Update - add translation fields)
├── sections/
│   ├── index.ts                         (✏️ Update - export TranslationsSection)
│   ├── TitleSection.tsx                 (No changes)
│   ├── DescriptionSection.tsx           (No changes)
│   ├── ButtonSection.tsx                (No changes)
│   ├── ImageSection.tsx                 (No changes)
│   ├── BackgroundSection.tsx            (No changes)
│   └── TranslationsSection.tsx          (📄 NEW)
└── hooks/
    └── (No changes to existing hooks)
```

---

## Implementation Checklist

- [ ] **1.1** Update translator agent with template heading section tasks (SQL)
- [ ] **1.2** Create TranslationsSection component
  - [ ] Translation table with three fields
  - [ ] JSONB bulk edit modals
  - [ ] AI Translate All button
  - [ ] Add/Remove language functionality
  - [ ] Fixed bottom panel with Save button
- [ ] **1.3** Update HeadingFormData type definitions
  - [ ] Add name_translation field
  - [ ] Add description_text_translation field
  - [ ] Add button_text_translation field
- [ ] **1.4** Update TemplateHeadingSectionEditModal.tsx
  - [ ] Add Translations tab to mega menu
  - [ ] Import and render TranslationsSection
  - [ ] Adjust padding for translations
- [ ] **1.5** Update context to save translation fields
  - [ ] Ensure updateSection saves all translation fields
- [ ] **1.6** Verify/update API route for translation field support
- [ ] **1.7** Export TranslationsSection in sections/index.ts
- [ ] **1.8** Testing
  - [ ] Manual translation editing
  - [ ] JSONB bulk editing
  - [ ] AI translation
  - [ ] Language management
  - [ ] Save/load persistence

---

## Considerations & Edge Cases

### 1. Empty Fields
- **Issue**: Not all sections have button_text (optional field)
- **Solution**: Skip empty fields in AI translation, show placeholder in UI

### 2. Name Parts 2 & 3
- **Decision Required**: Should `name_part_2` and `name_part_3` be translated separately?
- **Option A**: Treat as visual variants of `name`, include in `name_translation`
- **Option B**: Create separate `name_part_2_translation` and `name_part_3_translation` fields
- **Recommendation**: **Option A** (simpler, parts are styling variations, not distinct content)

### 3. Single Item Editing
- **Benefit**: Simpler UI than menu accordions
- **Implementation**: Direct table without accordion complexity

### 4. JSONB Validation
- Same as menu modals: try-catch, error messages, example format

### 5. Progress Indicator
- Show during AI translation for all three fields
- Display count: "Translating... (1/3 fields)"

---

## Success Criteria

### Functional Requirements
- ✅ Heading name can be translated into all supported languages
- ✅ Description text can be translated into all supported languages
- ✅ Button text can be translated into all supported languages
- ✅ AI translation works for all three fields
- ✅ JSONB bulk editing works for all translation fields
- ✅ Translations persist to database correctly
- ✅ Translations load correctly on modal open

### User Experience
- ✅ UI is consistent with Header/Footer modals
- ✅ Table is responsive and scrollable
- ✅ Progress indicator shows during AI translation
- ✅ Error messages are clear and actionable
- ✅ Keyboard shortcuts work (Esc to close)
- ✅ Save button inactive when no changes

### Code Quality
- ✅ TypeScript types are complete and accurate
- ✅ Code follows existing patterns and conventions
- ✅ No console errors or warnings
- ✅ Proper error handling throughout

---

## Timeline Estimate

- **Translator Agent Setup** (1.1): 10 minutes
- **TranslationsSection Component** (1.2): 2-3 hours (simpler than menu version)
- **Type Updates** (1.3): 15 minutes
- **Modal Integration** (1.4): 30 minutes
- **Context Updates** (1.5): 30 minutes
- **API Verification** (1.6): 15 minutes
- **Exports** (1.7): 5 minutes
- **Testing** (1.8): 1-2 hours

**Total**: 5-7 hours

---

## Differences from Menu Modal Implementation

1. **No Accordion**: Single item editing, direct table view
2. **Fewer Fields**: Only 3 translatable fields vs menu items with submenu items
3. **Simpler State**: No expandedItems tracking
4. **Same Patterns**: Bottom panel, inline removal, JSONB editing, AI translation

---

## Next Steps

1. ✅ Review and approve this implementation plan
2. ⏳ Execute implementation
3. ⏳ Test translation features
4. ⏳ User acceptance testing

---

**Status**: 📋 Awaiting Approval
**Next Action**: Get user approval to begin implementation

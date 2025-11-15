# Template Section Translation Implementation Plan

## Overview
Add AI-powered translation functionality to the TemplateSectionEditModal for translating section titles, descriptions, and nested metric cards (title/description). This follows the proven two-level accordion pattern from Header/Footer menu modals.

---

## Database Schema Analysis

### Tables & Translation Fields

**`website_templatesection`** (Parent Level)
- **Translatable Fields**:
  - `section_title` → `section_title_translation` (JSONB) ✓ Already exists
  - `section_description` → `section_description_translation` (JSONB) ✓ Already exists

**`website_metric`** (Child Level - Cards/Metrics)
- **Translatable Fields**:
  - `title` → `title_translation` (JSONB) ✓ Already exists
  - `description` → `description_translation` (JSONB) ✓ Already exists

**Relationship**: One-to-Many
- Each `website_templatesection` can have multiple `website_metric` records (cards)
- Metrics are linked via `template_section_id` foreign key (implied from context)

---

## Implementation Strategy

### Two-Level Accordion Pattern (Like Header/Footer Modals)

**Level 1: Section (Parent)**
- Section Title translation
- Section Description translation
- Accordion header: "Section: {section_title}"

**Level 2: Metrics (Children)**
- Each metric has its own accordion item
- Metric Title translation
- Metric Description translation
- Accordion header: "Card: {metric.title}"

**UI Structure**:
```
┌─────────────────────────────────────────────────────┐
│ Translations Tab                                    │
├─────────────────────────────────────────────────────┤
│ > Section: "Our Services" [Translate Section]      │
│   Code│Language│Section Title│Section Description  │
│   EN  │English │...          │...                  │
│   ES  │Spanish │...          │...                  │
├─────────────────────────────────────────────────────┤
│ > Card 1: "Quality Service" [Translate Card]       │
│   Code│Language│Title        │Description          │
│   EN  │English │...          │...                  │
│   ES  │Spanish │...          │...                  │
├─────────────────────────────────────────────────────┤
│ > Card 2: "Fast Delivery" [Translate Card]         │
│   ...                                               │
├─────────────────────────────────────────────────────┤
│ [Add Missing Languages]  [AI Translate All] [Save] │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update Translator Agent Configuration

**Action**: Add template section and metric translation tasks to the translator agent

```sql
-- Add website_templatesection to translator agent
UPDATE public.ai_models_system
SET task = jsonb_insert(
  task,
  '{100}',
  '{
    "table": "website_templatesection",
    "fields": ["section_title", "section_description"],
    "name": "Translate Template Sections",
    "system_message": "Translate the provided template section text from {source_lang} to {target_lang}. Preserve formatting, maintain impact for section titles, and clarity for descriptions. Return only the translation."
  }'::jsonb
)
WHERE role = 'translator';

-- Add website_metric to translator agent
UPDATE public.ai_models_system
SET task = jsonb_insert(
  task,
  '{101}',
  '{
    "table": "website_metric",
    "fields": ["title", "description"],
    "name": "Translate Metric Cards",
    "system_message": "Translate the provided metric card text from {source_lang} to {target_lang}. Preserve formatting, maintain impact for titles, and clarity for descriptions. Return only the translation."
  }'::jsonb
)
WHERE role = 'translator';
```

---

### Step 2: Create TranslationsSection Component

**File**: `/src/components/modals/TemplateSectionModal/components/TranslationsSection.tsx`

**Layout**: Two-level accordion matching Header/Footer modal pattern

**Features**:
- **Level 1: Section Accordion**
  - Section title translation (all languages)
  - Section description translation (all languages)
  - "Translate Section" button (AI translate section fields only)
  
- **Level 2: Metric Accordions** (one per card)
  - Metric title translation (all languages)
  - Metric description translation (all languages)
  - "Translate Card" button (AI translate that card only)

- **Global Actions**:
  - Add missing languages (applies to section + all metrics)
  - AI Translate All (translates section + all metrics)
  - Save button in fixed bottom panel

**Props Interface**:
```tsx
interface TranslationsSectionProps {
  formData: TemplateSectionFormData;
  setFormData: (data: TemplateSectionFormData) => void;
  metrics: Metric[];
  setMetrics: (metrics: Metric[]) => void;
  primaryColor: string;
}
```

**Key Functionality**:
1. **Section Translations**:
   - Table with columns: Code | Language | Section Title | Section Description
   - {} buttons for JSONB bulk editing per field
   - Inline language removal
   - AI translate section only

2. **Metric Translations** (per metric):
   - Table with columns: Code | Language | Title | Description
   - {} buttons for JSONB bulk editing per field
   - Inline language removal
   - AI translate metric only

3. **AI Translation**:
   - Section-level: Translates section_title + section_description
   - Metric-level: Translates specific metric's title + description
   - Global: Translates section + all metrics sequentially
   - Granular checking (skip existing translations)
   - Real-time display updates

4. **Save Behavior**:
   - Track unsaved changes
   - Save section translations (via API)
   - Save all metric translations (via API - batch or individual)
   - Disabled when no changes or saving

---

### Step 3: Update Type Definitions

**File**: `/src/components/modals/TemplateSectionModal/hooks/index.ts` (or types file)

**Changes**: Ensure `TemplateSectionFormData` and `Metric` types include translation fields

```tsx
interface TemplateSectionFormData {
  section_title: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  // ... other fields
}

interface Metric {
  id: number;
  title: string;
  title_translation?: Record<string, string>;
  description: string;
  description_translation?: Record<string, string>;
  // ... other fields
}
```

---

### Step 4: Update TemplateSectionEditModal

**File**: `/src/components/modals/TemplateSectionModal/TemplateSectionEditModal.tsx`

**Changes**:

1. Add `GlobeAltIcon` import
2. Import `TranslationsSection` component
3. Add "Translations" button to mega menu (alongside Style, Layout, Content)
4. Add conditional rendering for translations mega menu dropdown
5. Pass metrics state to TranslationsSection

```tsx
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { TranslationsSection } from './components';

// In mega menu buttons array:
{ id: 'translations', label: 'Translations', icon: GlobeAltIcon }

// In mega menu dropdown:
{openMenu === 'translations' && (
  <div className="absolute left-0 right-0 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto rounded-b-2xl">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <TranslationsSection
        formData={formData}
        setFormData={setFormData}
        metrics={metrics} // Pass metrics state
        setMetrics={setMetrics}
        primaryColor={primary.base}
      />
    </div>
  </div>
)}
```

---

### Step 5: Update Context for Saving Translations

**File**: `/src/components/modals/TemplateSectionModal/context.tsx`

**Status**: ✅ Already includes translation fields in `TemplateSectionData` interface
- `section_title_translation` ✓
- `section_description_translation` ✓
- Metrics include `title_translation` and `description_translation` ✓

**Action**: Ensure `updateSection` API call saves translation fields

---

### Step 6: Verify/Update API Routes

**Files to Check**:
- `/api/template-sections/[id]/route.ts` (section translations)
- `/api/metrics/[id]/route.ts` or similar (metric translations)

**Actions**:
1. Ensure PUT endpoint for sections accepts:
   - `section_title_translation`
   - `section_description_translation`

2. Ensure PUT endpoint for metrics accepts:
   - `title_translation`
   - `description_translation`

3. Verify batch update support for multiple metrics (or loop individual updates)

---

### Step 7: Export TranslationsSection

**File**: `/src/components/modals/TemplateSectionModal/components/index.ts`

```tsx
export { SettingsTab } from './SettingsTab';
export { LayoutTab } from './LayoutTab';
export { LayoutOptionsTab } from './LayoutOptionsTab';
export { StyleTab } from './StyleTab';
export { ContentTab } from './ContentTab';
export { TranslationsSection } from './TranslationsSection'; // Add this
```

---

### Step 8: Metrics State Management

**Current Situation**: Metrics are managed in `MetricManager.tsx` and stored in section's `website_metric` array

**Approach**:
1. **Option A**: Pass metrics state from TemplateSectionEditModal to TranslationsSection
   - Pros: Direct access, simpler
   - Cons: Need to expose metrics state management

2. **Option B**: Fetch metrics within TranslationsSection from context
   - Pros: Self-contained
   - Cons: More complex, potential duplication

**Recommendation**: **Option A** - Pass metrics as props for simpler implementation

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ TemplateSectionEditModal                                    │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Mega Menu: [Style] [Layout] [Content]            │       │
│  │            [Translations] ← NEW                  │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ TranslationsSection                               │       │
│  │                                                   │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │ Accordion: Section                          │  │       │
│  │  │ - section_title_translation                 │  │       │
│  │  │ - section_description_translation           │  │       │
│  │  │ [Translate Section]                         │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  │                                                   │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │ Accordion: Card 1 (Metric)                  │  │       │
│  │  │ - title_translation                         │  │       │
│  │  │ - description_translation                   │  │       │
│  │  │ [Translate Card]                            │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  │                                                   │       │
│  │  [Accordion: Card 2...]                          │       │
│  │  [Accordion: Card 3...]                          │       │
│  │                                                   │       │
│  │  [Add Languages] [AI Translate All] [Save]      │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                                            │
         │ useTranslation()                          │
         │                                            │
         ▼                                            ▼
┌──────────────────────┐                  ┌──────────────────────┐
│ /api/ai/translate    │                  │ API Routes           │
│                      │                  │                      │
│ - Section fields     │                  │ PUT /template-       │
│ - Metric fields      │                  │   sections/[id]      │
│ - Batch translate    │                  │ PUT /metrics/[id]    │
└──────────────────────┘                  └──────────────────────┘
```

---

## UI/UX Design

### Accordion Layout (Two Levels)

```
┌────────────────────────────────────────────────────────────────┐
│ Translations                                                    │
│ Original: English • Supported: 10 languages                    │
├────────────────────────────────────────────────────────────────┤
│ ▼ Section: "Our Services"          [AI Translate Section]     │
│   ┌────────────────────────────────────────────────────────┐  │
│   │ Code │ Language  │ Section Title │ Section Desc       │  │
│   ├──────┼───────────┼───────────────┼────────────────────┤  │
│   │ EN   │ English   │ Our Services  │ We provide...      │  │
│   │      │ (Original)│               │                    │  │
│   ├──────┼───────────┼───────────────┼────────────────────┤  │
│   │ ES X │ Spanish   │ [textarea] {} │ [textarea] {}      │  │
│   │ FR X │ French    │ [textarea] {} │ [textarea] {}      │  │
│   └────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│ ▼ Card 1: "Quality Service"        [AI Translate Card]        │
│   ┌────────────────────────────────────────────────────────┐  │
│   │ Code │ Language  │ Title          │ Description        │  │
│   ├──────┼───────────┼────────────────┼────────────────────┤  │
│   │ EN   │ English   │ Quality Service│ High quality...    │  │
│   ├──────┼───────────┼────────────────┼────────────────────┤  │
│   │ ES X │ Spanish   │ [textarea] {}  │ [textarea] {}      │  │
│   └────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│ > Card 2: "Fast Delivery"          [AI Translate Card]        │
├────────────────────────────────────────────────────────────────┤
│ > Card 3: "24/7 Support"            [AI Translate Card]        │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│ [Add Missing Languages]  [AI Translate All] [Save]            │
└────────────────────────────────────────────────────────────────┘
```

### Visual Design
- **Section Accordion**: Primary color header, always visible
- **Metric Accordions**: Secondary color header, collapsible
- **Original Row**: Blue highlight (`bg-blue-50/50`)
- **Translation Rows**: Hover effect (`hover:bg-gray-50`)
- **Remove Button**: Inline X button (opacity-0 group-hover:opacity-100)
- **JSONB Buttons**: {} in each cell for bulk editing
- **Bottom Panel**: Fixed, rounded corners (`rounded-b-2xl`)
- **Save Button**: Disabled when `!hasUnsavedChanges || isSaving`

### Responsive Design
- **Desktop**: Full accordion view
- **Tablet**: Horizontal scroll per table
- **Mobile**: Stacked layout with scroll

---

## AI Translation Strategy

### Granular Translation Approach

**Section Level** (AI Translate Section button):
```typescript
async function translateSection() {
  const fields = [
    { name: 'section_title', content: formData.section_title },
    { name: 'section_description', content: formData.section_description }
  ];
  
  // Only translate missing languages
  const result = await translateAll({
    tableName: 'website_templatesection',
    fields,
    sourceLanguage: 'en',
    targetLanguages: missingLanguages,
  });
  
  // Update section translations immediately
  setFormData({ ...formData, ...result.translations });
}
```

**Metric Level** (AI Translate Card button):
```typescript
async function translateMetric(metricId: number) {
  const metric = metrics.find(m => m.id === metricId);
  const fields = [
    { name: 'title', content: metric.title },
    { name: 'description', content: metric.description }
  ];
  
  const result = await translateAll({
    tableName: 'website_metric',
    fields,
    sourceLanguage: 'en',
    targetLanguages: missingLanguages,
  });
  
  // Update specific metric immediately
  setMetrics(metrics.map(m => 
    m.id === metricId 
      ? { ...m, ...result.translations }
      : m
  ));
}
```

**Global Level** (AI Translate All button):
```typescript
async function translateAll() {
  // 1. Translate section
  await translateSection();
  
  // 2. Translate each metric sequentially (with real-time updates)
  for (const metric of metrics) {
    await translateMetric(metric.id);
  }
}
```

---

## File Structure

```
src/components/modals/TemplateSectionModal/
├── TemplateSectionEditModal.tsx         (✏️ Update - add Translations button)
├── context.tsx                          (✅ Already has translation fields)
├── MetricManager.tsx                    (✅ Already has translation fields)
├── components/
│   ├── index.ts                         (✏️ Update - export TranslationsSection)
│   ├── SettingsTab.tsx                  (No changes)
│   ├── LayoutTab.tsx                    (No changes)
│   ├── LayoutOptionsTab.tsx             (No changes)
│   ├── StyleTab.tsx                     (No changes)
│   ├── ContentTab.tsx                   (No changes)
│   └── TranslationsSection.tsx          (📄 NEW - ~1200 lines)
└── hooks/
    └── (Verify translation field types)
```

---

## Implementation Checklist

- [ ] **1.1** Update translator agent with section and metric tasks (SQL)
- [ ] **1.2** Create TranslationsSection component
  - [ ] Two-level accordion structure
  - [ ] Section translation table
  - [ ] Metric translation tables (one per metric)
  - [ ] JSONB bulk edit modals
  - [ ] AI Translate Section button
  - [ ] AI Translate Card buttons (per metric)
  - [ ] AI Translate All button
  - [ ] Add/Remove language functionality
  - [ ] Fixed bottom panel with Save button
- [ ] **1.3** Verify type definitions include translation fields
  - [ ] TemplateSectionFormData
  - [ ] Metric interface
- [ ] **1.4** Update TemplateSectionEditModal.tsx
  - [ ] Add Translations button to mega menu
  - [ ] Import and render TranslationsSection
  - [ ] Pass metrics state as props
- [ ] **1.5** Update context to save translation fields
  - [ ] Verify updateSection saves section translations
  - [ ] Implement metric translation saving (batch or individual)
- [ ] **1.6** Verify/update API routes
  - [ ] PUT /api/template-sections/[id] handles translations
  - [ ] PUT /api/metrics/[id] handles translations
- [ ] **1.7** Export TranslationsSection in components/index.ts
- [ ] **1.8** Testing
  - [ ] Section translation (manual editing)
  - [ ] Metric translation (manual editing)
  - [ ] JSONB bulk editing (section + metrics)
  - [ ] AI translate section only
  - [ ] AI translate individual metrics
  - [ ] AI translate all (section + all metrics)
  - [ ] Add/Remove languages
  - [ ] Save and persist translations
  - [ ] Load existing translations on modal open
  - [ ] Handle errors gracefully
  - [ ] Real-time display updates

---

## Considerations & Edge Cases

### 1. Multiple Metrics
- **Issue**: Section can have many metrics (cards)
- **Solution**: Each metric gets its own accordion, collapsible to reduce visual clutter
- **Performance**: Load all at once, but only render expanded accordions' content

### 2. Empty Metrics
- **Issue**: Section might have no metrics
- **Solution**: Show "No cards to translate" message, only display section accordion

### 3. Metric Creation During Translation
- **Issue**: User might add new metrics while translations panel is open
- **Solution**: React to metrics array changes, dynamically add new accordions

### 4. Save Strategy
- **Option A**: Save all translations (section + metrics) in one batch API call
- **Option B**: Save section separately, then each metric individually
- **Recommendation**: **Option B** for simpler error handling and partial success support

### 5. Translation Persistence
- **Section**: Saved via existing section update API
- **Metrics**: Need to verify if metric API supports translation fields or needs update

### 6. Real-Time Updates
- **Implementation**: Update state immediately after each field translation completes
- **UX**: User sees translations appear sequentially (Section → Card 1 → Card 2 → etc.)

### 7. Accordion State
- **Default**: All accordions closed except section (always visible)
- **After Translation**: Keep accordion state as-is, don't auto-expand
- **Memory**: Track expanded state in component state

---

## Success Criteria

### Functional Requirements
- ✅ Section title can be translated into all supported languages
- ✅ Section description can be translated into all supported languages
- ✅ Each metric title can be translated into all supported languages
- ✅ Each metric description can be translated into all supported languages
- ✅ AI translation works at section level
- ✅ AI translation works at individual metric level
- ✅ AI translation works globally (section + all metrics)
- ✅ JSONB bulk editing works for all translation fields
- ✅ Translations persist to database correctly
- ✅ Translations load correctly on modal open

### User Experience
- ✅ UI is consistent with Header/Footer modal patterns
- ✅ Accordions are collapsible and expand smoothly
- ✅ Real-time translation display (no waiting for all to complete)
- ✅ Progress indication during AI translation
- ✅ Error messages are clear and actionable
- ✅ Save button inactive when no changes
- ✅ Toast notifications for success/error (no blocking alerts)

### Code Quality
- ✅ TypeScript types are complete and accurate
- ✅ Code follows existing patterns and conventions
- ✅ No console errors or warnings
- ✅ Proper error handling throughout
- ✅ Component is reusable and maintainable

---

## Timeline Estimate

- **Translator Agent Setup** (1.1): 15 minutes
- **TranslationsSection Component** (1.2): 4-6 hours (complex two-level accordion)
- **Type Verification** (1.3): 15 minutes
- **Modal Integration** (1.4): 45 minutes
- **Context/API Updates** (1.5-1.6): 1-2 hours (metric API verification)
- **Exports** (1.7): 5 minutes
- **Testing** (1.8): 2-3 hours

**Total**: 9-13 hours

---

## Differences from Menu Modal Implementation

**Similarities**:
- Two-level accordion structure
- JSONB bulk editing
- AI translation with granular checking
- Real-time display updates
- Fixed bottom panel with Save button

**Differences**:
1. **Data Structure**: Section + Metrics vs Menu Items + Submenu Items
2. **Number of Items**: Potentially more metrics per section than submenu items per menu
3. **Field Count**: 2 fields per level (title/description) vs varied fields in menus
4. **API Complexity**: Need to save metrics separately vs nested save
5. **Visual Hierarchy**: Section is parent (always visible) vs menu items can all be collapsed

---

## Next Steps

1. ✅ **Review and approve this implementation plan**
2. ⏳ Execute implementation
3. ⏳ Test translation features
4. ⏳ User acceptance testing
5. ⏳ Deploy to production

---

**Status**: 📋 Awaiting Approval  
**Next Action**: Get user approval to begin implementation  
**Estimated Completion**: 2-3 days (with testing)

---

## Questions for Clarification

1. **Metrics API**: Does `/api/metrics/[id]` route exist and support translation fields? Or do we need to create it?
2. **Batch Updates**: Should we save all metric translations in one API call or individually?
3. **Default Accordion State**: Should section accordion start expanded or collapsed?
4. **Empty Section**: What should we show if section has no metrics to translate?
5. **Priority**: Which should we translate first when using "AI Translate All" - section or metrics?

**Recommended Answers**:
1. Verify API route existence, update if needed
2. Individual saves for better error handling
3. Section expanded, metrics collapsed
4. Show "No cards to translate" message
5. Section first, then metrics sequentially

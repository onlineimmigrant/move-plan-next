# Deprecated Boolean Fields Removal Plan

## Overview
The following boolean fields in `website_templatesection` table are deprecated and should be removed:

- `is_help_center_section`
- `is_real_estate_modal`
- `is_slider`
- `is_brand`
- `is_article_slider`
- `is_contact_section`
- `is_faq_section`
- `is_pricingplans_section`

These fields have been replaced by the `section_type` field which uses a more scalable enum approach.

---

## Current Usage Analysis

### 1. **TypeScript Type Definitions** (Still Referenced)

**Files with type definitions:**
- `src/components/TemplateSection.tsx` (lines 208-221)
- `src/components/TemplateSections.tsx` (lines 40, 47-53)
- `src/components/TemplateSections/HelpCenterSection.tsx` (line 40)
- `src/components/modals/TemplateSectionModal/context.tsx` (lines 40, 43-49)
- `src/components/modals/TemplateSectionModal/hooks/useSectionOperations.ts` (lines 21, 25-31)

**Impact:** TypeScript interfaces include these as optional fields for backward compatibility.

---

### 2. **Component Logic - Backward Compatibility Layer**

#### `src/components/modals/TemplateSectionModal/TemplateSectionEditModal.tsx` (Lines 74-83)
```typescript
// Migration logic: Convert old boolean flags to section_type
if (!(editingSection as any).section_type) {
  if (editingSection.is_reviews_section) sectionType = 'reviews';
  else if (editingSection.is_help_center_section) sectionType = 'help_center';
  else if (editingSection.is_real_estate_modal) sectionType = 'real_estate';
  else if (editingSection.is_brand) sectionType = 'brand';
  else if (editingSection.is_article_slider) sectionType = 'article_slider';
  else if (editingSection.is_contact_section) sectionType = 'contact';
  else if (editingSection.is_faq_section) sectionType = 'faq';
  else if (editingSection.is_pricingplans_section) sectionType = 'pricing_plans';
}
```

**Purpose:** This code reads old boolean fields and converts them to the new `section_type` field.

---

### 3. **Component Rendering Logic - Active Usage**

#### `src/components/TemplateSection.tsx`

**Line 370, 381, 385, 391:** `is_slider` field is actively used for slider functionality
```typescript
if (section.is_slider && isAutoPlaying && totalDots > 1 && !isMobile) {
  autoPlayInterval.current = setInterval(() => {
    nextSlide();
  }, 5000);
}
```

**Line 409:** Boolean fields used for padding/styling decisions
```typescript
section.is_brand || section.is_article_slider || section.is_contact_section || 
section.is_faq_section || section.is_pricingplans_section || section.section_type === 'reviews'
```

**Line 411, 431, 503:** `is_slider` used for layout styling

**⚠️ CRITICAL:** These are **ACTIVE** usages, not just backward compatibility.

---

### 4. **HelpCenterSection Component** 

#### `src/components/TemplateSections/HelpCenterSection.tsx` (Line 75)
```typescript
if (!section || !section.is_help_center_section) {
  return null;
}
```

**⚠️ CRITICAL:** This is an **ACTIVE** usage that prevents rendering if the flag is not set.

---

### 5. **API Routes**

#### `src/app/api/template-sections/[id]/route.ts` (Lines 61-69)
```typescript
is_slider: body.is_slider ?? false,
is_help_center_section: body.is_help_center_section ?? false,
is_real_estate_modal: body.is_real_estate_modal ?? false,
is_brand: body.is_brand ?? false,
is_article_slider: body.is_article_slider ?? false,
is_contact_section: body.is_contact_section ?? false,
is_faq_section: body.is_faq_section ?? false,
is_pricingplans_section: body.is_pricingplans_section ?? false,
```

**Impact:** API still accepts and saves these fields.

#### `src/app/api/template-sections/route.ts` (Lines 91-97+)
API fetches these fields from the database.

---

### 6. **Preview Components**

#### `src/components/modals/TemplateSectionModal/preview/TemplateSectionPreview.tsx`
- Lines 260, 271, 274, 280: `is_slider` actively used
- Line 306: `is_help_center_section: true` set in preview data
- Lines 459, 471, 525: `is_slider` used for styling

---

### 7. **Layout Options Tab**

#### `src/components/modals/TemplateSectionModal/components/LayoutOptionsTab.tsx` (Lines 106-116)
```typescript
onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
```

**⚠️ CRITICAL:** UI toggle for `is_slider` field.

---

## Database Analysis

### Current Table Schema
```sql
is_slider boolean null default false,
is_brand boolean null default false,
is_article_slider boolean null default false,
is_contact_section boolean null default false,
is_faq_section boolean null default false,
is_pricingplans_section boolean null default false,
is_help_center_section boolean null default false,
is_real_estate_modal boolean null default false,
section_type character varying(50) null default 'general'::character varying,
```

**Constraint on `section_type`:**
```sql
check ((section_type)::text = any (
  array[
    'general', 'brand', 'article_slider', 'contact', 'faq', 'reviews',
    'help_center', 'real_estate', 'pricing_plans', 'team', 
    'testimonials', 'appointment'
  ]::text[]
))
```

---

## ⚠️ CRITICAL FINDINGS

### Fields NOT Safe to Remove Yet:

1. **`is_slider`** - **ACTIVELY USED**
   - Controls slider functionality and auto-play
   - Used in multiple rendering conditions
   - Has UI toggle in LayoutOptionsTab
   - **ACTION:** This needs special handling - potentially a new section_type or separate field

2. **`is_help_center_section`** - **PARTIALLY ACTIVE**
   - Used as validation check in HelpCenterSection component
   - **ACTION:** Replace with `section_type === 'help_center'` check

3. **Other boolean fields** (is_brand, is_article_slider, etc.) - **PARTIALLY ACTIVE**
   - Used in conditional rendering for styling
   - **ACTION:** Can be replaced with `section_type` checks

---

## Safe Removal Plan

### Phase 1: Code Migration (Backend-Compatible)

#### Step 1: Update Components to Use `section_type`

**1.1. Replace HelpCenterSection check:**
```typescript
// Before:
if (!section || !section.is_help_center_section) {
  return null;
}

// After:
if (!section || section.section_type !== 'help_center') {
  return null;
}
```

**1.2. Replace TemplateSection styling conditions:**
```typescript
// Before:
section.is_brand || section.is_article_slider || section.is_contact_section || 
section.is_faq_section || section.is_pricingplans_section

// After:
['brand', 'article_slider', 'contact', 'faq', 'pricing_plans'].includes(section.section_type || '')
```

**1.3. Handle `is_slider` - Special Case:**

Option A: Keep `is_slider` as a layout option (it's orthogonal to section_type)
Option B: Create new section types like 'general_slider', 'brand_slider', etc.

**Recommendation:** Keep `is_slider` as it's a layout modifier, not a content type.

#### Step 2: Update API Routes

**2.1. Deprecate fields in API responses (but still support input):**
```typescript
// In PUT route, remove from updateData
// But keep backward compatibility for reading old data
```

**2.2. Update GET route to populate section_type from boolean fields if missing:**
```typescript
// Add data migration logic
if (!section.section_type) {
  if (section.is_help_center_section) section.section_type = 'help_center';
  else if (section.is_real_estate_modal) section.section_type = 'real_estate';
  // ... etc
}
```

#### Step 3: Update Type Definitions

**3.1. Mark as deprecated in TypeScript:**
```typescript
/** @deprecated Use section_type instead */
is_help_center_section?: boolean;
/** @deprecated Use section_type instead */
is_real_estate_modal?: boolean;
// etc.
```

---

### Phase 2: Database Migration

#### Step 1: Data Migration Script

```sql
-- Migrate existing data to section_type
UPDATE website_templatesection
SET section_type = 
  CASE 
    WHEN is_help_center_section = true THEN 'help_center'
    WHEN is_real_estate_modal = true THEN 'real_estate'
    WHEN is_brand = true THEN 'brand'
    WHEN is_article_slider = true THEN 'article_slider'
    WHEN is_contact_section = true THEN 'contact'
    WHEN is_faq_section = true THEN 'faq'
    WHEN is_pricingplans_section = true THEN 'pricing_plans'
    ELSE COALESCE(section_type, 'general')
  END
WHERE section_type IS NULL OR section_type = 'general';

-- Verify migration
SELECT 
  section_type,
  COUNT(*) as count,
  SUM(CASE WHEN is_help_center_section THEN 1 ELSE 0 END) as help_center_flag,
  SUM(CASE WHEN is_brand THEN 1 ELSE 0 END) as brand_flag
  -- etc.
FROM website_templatesection
GROUP BY section_type;
```

#### Step 2: Remove Columns (After Code Deploy)

```sql
-- ONLY AFTER code changes are deployed and verified
ALTER TABLE website_templatesection
DROP COLUMN IF EXISTS is_help_center_section,
DROP COLUMN IF EXISTS is_real_estate_modal,
DROP COLUMN IF EXISTS is_brand,
DROP COLUMN IF EXISTS is_article_slider,
DROP COLUMN IF EXISTS is_contact_section,
DROP COLUMN IF EXISTS is_faq_section,
DROP COLUMN IF EXISTS is_pricingplans_section;

-- NOTE: Keep is_slider as it's a layout modifier
```

---

### Phase 3: Cleanup

#### Step 1: Remove TypeScript Types
- Remove deprecated fields from interfaces
- Update all type definitions

#### Step 2: Remove API Field Handling
- Remove from API routes
- Remove from form data

#### Step 3: Remove Backward Compatibility Code
- Remove boolean-to-section_type conversion logic
- Remove form data mappings

---

## Special Handling for `is_slider`

### Recommendation: **DO NOT REMOVE** `is_slider`

**Rationale:**
- `is_slider` is a **layout modifier**, not a content type
- It can be combined with any section_type (general slider, brand slider, etc.)
- It controls specific functionality (auto-play, navigation, etc.)
- Removing it would require creating many new section_types

**Keep as:**
```sql
is_slider boolean null default false,
```

---

## Execution Checklist

### Before Starting:
- [ ] Backup database
- [ ] Create feature branch
- [ ] Review all usages in this document

### Phase 1: Code Changes (Can be done safely)
- [ ] Update HelpCenterSection component
- [ ] Update TemplateSection styling conditions
- [ ] Update TemplateSectionEditModal backward compatibility
- [ ] Remove deprecated fields from form initialization
- [ ] Update TypeScript types with @deprecated tags
- [ ] Test all section types render correctly
- [ ] Test editing existing sections

### Phase 2: Database Migration (After code deploy)
- [ ] Run data migration script
- [ ] Verify all records have correct section_type
- [ ] Check for any NULL or 'general' that should be specific types

### Phase 3: Column Removal (After verification period)
- [ ] Remove columns from database (except is_slider)
- [ ] Remove deprecated TypeScript types
- [ ] Remove API field handling
- [ ] Remove backward compatibility code

---

## Testing Strategy

### 1. Test Each Section Type:
- [ ] general
- [ ] brand
- [ ] article_slider
- [ ] contact
- [ ] faq
- [ ] reviews
- [ ] help_center
- [ ] real_estate
- [ ] pricing_plans
- [ ] team
- [ ] testimonials
- [ ] appointment

### 2. Test Slider Functionality:
- [ ] Slider with general section
- [ ] Slider with brand section
- [ ] Auto-play works
- [ ] Navigation works

### 3. Test Editing:
- [ ] Edit existing section (migrated data)
- [ ] Create new section
- [ ] Change section_type
- [ ] Toggle slider option

### 4. Test API:
- [ ] GET sections
- [ ] PUT update section
- [ ] Verify section_type is saved
- [ ] Verify old data is migrated on read

---

## Rollback Plan

If issues arise:

1. **Before DB column removal:** Simply revert code changes
2. **After DB column removal:** 
   - Re-add columns with migration script
   - Restore from backup if needed
   - Re-deploy previous code version

---

## Estimated Timeline

- **Phase 1 (Code Changes):** 2-3 hours
- **Testing Phase 1:** 1-2 hours
- **Phase 2 (Data Migration):** 30 minutes
- **Verification Period:** 1-2 days
- **Phase 3 (Cleanup):** 1 hour

**Total:** ~1 week with safety buffer

---

## Files to Modify

### TypeScript/Component Files:
1. `src/components/TemplateSection.tsx`
2. `src/components/TemplateSections.tsx`
3. `src/components/TemplateSections/HelpCenterSection.tsx`
4. `src/components/modals/TemplateSectionModal/TemplateSectionEditModal.tsx`
5. `src/components/modals/TemplateSectionModal/context.tsx`
6. `src/components/modals/TemplateSectionModal/hooks/useSectionOperations.ts`
7. `src/components/modals/TemplateSectionModal/preview/TemplateSectionPreview.tsx`
8. `src/app/api/template-sections/[id]/route.ts`
9. `src/app/api/template-sections/route.ts`

### SQL Files:
1. Create: `migrations/remove_deprecated_boolean_fields.sql`

---

## Notes

- **`is_slider` should be kept** - it's a layout option, not a type
- **`is_reviews_section` was not in your list** - but it's also deprecated (replaced by section_type='reviews')
- The codebase already has migration logic in place (TemplateSectionEditModal.tsx lines 74-83)
- Most usage is for backward compatibility, but there are critical active usages
- The `section_type` field is already properly constrained and widely used

---

## Next Steps

Would you like me to:
1. Create the migration scripts?
2. Start implementing Phase 1 code changes?
3. Create a data verification query?

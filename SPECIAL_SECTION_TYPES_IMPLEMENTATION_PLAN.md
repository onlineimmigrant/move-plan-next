# Template Section Special Types Implementation Plan

**Date**: October 13, 2025  
**Status**: 🟡 Awaiting Approval

---

## 🎯 Objective

Add support for 4 new special section types (`is_brand`, `is_article_slider`, `is_contact_section`, `is_faq_section`) following the same pattern as existing special sections (`is_help_center_section`, `is_real_estate_modal`, `is_slider`), with the goal of consolidating all into a single `special_type` field in a future migration.

---

## 📋 Current State Analysis

### Existing Special Section Types (3)

| Field | Component | Data Source | Location |
|-------|-----------|-------------|----------|
| `is_help_center_section` | `HelpCenterSection.tsx` | Fetches `blog_post` with `is_help_center=true` | Conditional render in `TemplateSection.tsx` |
| `is_real_estate_modal` | `RealEstateModal.tsx` | Self-contained component | Conditional render in `TemplateSection.tsx` |
| `is_slider` | Slider UI in metrics | Uses section's own metrics | Layout modifier in `TemplateSection.tsx` |

### New Special Section Types (4)

| Field | Component | Data Source | Current Location |
|-------|-----------|-------------|------------------|
| `is_brand` | `Brands.tsx` | Fetches from `brand` table | Currently only in Homepage |
| `is_article_slider` | `BlogPostSlider.tsx` | Fetches from `blog_post` with `is_displayed_first_page=true` | Currently only in Homepage |
| `is_contact_section` | `ContactForm.tsx` | Self-contained form | Currently in contact page |
| `is_faq_section` | `FAQSection.tsx` | Fetches from `faq` table | Currently in Homepage & Product pages |

---

## 🏗️ Implementation Strategy

### Phase 1: Add Database Fields ✅ (Already Done)
You've already added these boolean fields to `website_templatesection` table:
- `is_brand`
- `is_article_slider`
- `is_contact_section`
- `is_faq_section`

---

### Phase 2: Backend Integration (API Routes)

#### 2.1. Update API Types & Interfaces

**Files to modify**:
- `/src/app/api/template-sections/route.ts`
- `/src/app/api/template-sections/[id]/route.ts`
- `/src/types/template_section.ts`

**Changes**:
```typescript
// Add to type definition
interface TemplateSection {
  // ... existing fields
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
}
```

#### 2.2. Update GET Handler (Fetch)

**Location**: `/src/app/api/template-sections/route.ts`

**Add to SELECT query**:
```typescript
.select(`
  id, ..., 
  is_slider,
  is_help_center_section,
  is_real_estate_modal,
  is_brand,                    // NEW
  is_article_slider,           // NEW
  is_contact_section,          // NEW
  is_faq_section               // NEW
`)
```

#### 2.3. Update POST Handler (Create)

**Location**: `/src/app/api/template-sections/route.ts`

**Add to insert data**:
```typescript
const insertData = {
  // ... existing fields
  is_slider: body.is_slider ?? false,
  is_help_center_section: body.is_help_center_section ?? false,
  is_real_estate_modal: body.is_real_estate_modal ?? false,
  is_brand: body.is_brand ?? false,                          // NEW
  is_article_slider: body.is_article_slider ?? false,        // NEW
  is_contact_section: body.is_contact_section ?? false,      // NEW
  is_faq_section: body.is_faq_section ?? false,              // NEW
};
```

#### 2.4. Update PUT Handler (Update)

**Location**: `/src/app/api/template-sections/[id]/route.ts`

**Add to update data**:
```typescript
const updateData = {
  // ... existing fields
  is_slider: body.is_slider ?? false,
  is_help_center_section: body.is_help_center_section ?? false,
  is_real_estate_modal: body.is_real_estate_modal ?? false,
  is_brand: body.is_brand ?? false,                          // NEW
  is_article_slider: body.is_article_slider ?? false,        // NEW
  is_contact_section: body.is_contact_section ?? false,      // NEW
  is_faq_section: body.is_faq_section ?? false,              // NEW
};
```

---

### Phase 3: Frontend Integration (Components)

#### 3.1. Update Type Definitions

**File**: `/src/types/template_section.ts`

```typescript
export interface TemplateSection {
  // ... existing fields
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
}
```

#### 3.2. Update Modal Context

**File**: `/src/components/modals/TemplateSectionModal/context.tsx`

**Add to interface**:
```typescript
interface TemplateSectionData {
  // ... existing fields
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
}
```

**Add to initial state**:
```typescript
const initialSection = {
  // ... existing fields
  is_brand: false,
  is_article_slider: false,
  is_contact_section: false,
  is_faq_section: false,
};
```

**Add to data loading**:
```typescript
setEditingSection({
  // ... existing fields
  is_brand: data.is_brand,
  is_article_slider: data.is_article_slider,
  is_contact_section: data.is_contact_section,
  is_faq_section: data.is_faq_section,
});
```

#### 3.3. Update Edit Modal

**File**: `/src/components/modals/TemplateSectionModal/TemplateSectionEditModal.tsx`

**Add to FormData interface**:
```typescript
interface FormData {
  // ... existing fields
  is_brand: boolean;
  is_article_slider: boolean;
  is_contact_section: boolean;
  is_faq_section: boolean;
}
```

**Add to initial state**:
```typescript
const [formData, setFormData] = useState<FormData>({
  // ... existing fields
  is_brand: false,
  is_article_slider: false,
  is_contact_section: false,
  is_faq_section: false,
});
```

**Add to form initialization**:
```typescript
useEffect(() => {
  if (editingSection) {
    setFormData({
      // ... existing fields
      is_brand: editingSection.is_brand || false,
      is_article_slider: editingSection.is_article_slider || false,
      is_contact_section: editingSection.is_contact_section || false,
      is_faq_section: editingSection.is_faq_section || false,
    });
  }
}, [editingSection]);
```

**Add toggle buttons** (after existing special section toggles, around line 320):
```tsx
{/* Special Section Types - NEW */}
<div className="space-y-3">
  <h3 className="text-sm font-medium text-gray-700">Special Section Types (NEW)</h3>
  
  <button
    type="button"
    onClick={() => setFormData({ ...formData, is_brand: !formData.is_brand })}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      formData.is_brand
        ? 'bg-purple-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {formData.is_brand ? '✓' : ''} Brand Section
  </button>

  <button
    type="button"
    onClick={() => setFormData({ ...formData, is_article_slider: !formData.is_article_slider })}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      formData.is_article_slider
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {formData.is_article_slider ? '✓' : ''} Article Slider
  </button>

  <button
    type="button"
    onClick={() => setFormData({ ...formData, is_contact_section: !formData.is_contact_section })}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      formData.is_contact_section
        ? 'bg-green-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {formData.is_contact_section ? '✓' : ''} Contact Form
  </button>

  <button
    type="button"
    onClick={() => setFormData({ ...formData, is_faq_section: !formData.is_faq_section })}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      formData.is_faq_section
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {formData.is_faq_section ? '✓' : ''} FAQ Section
  </button>
</div>
```

#### 3.4. Update TemplateSections Component

**File**: `/src/components/TemplateSections.tsx`

**Add to interface**:
```typescript
interface TemplateSectionData {
  // ... existing fields
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
}
```

#### 3.5. Update TemplateSection Component (CRITICAL)

**File**: `/src/components/TemplateSection.tsx`

**Add to interface** (around line 148-153):
```typescript
interface TemplateSectionProps {
  // ... existing fields
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
}
```

**Update conditional rendering** (around line 343-349):

**BEFORE**:
```tsx
{section.is_reviews_section ? (
  <FeedbackAccordion type="all_products" />
) : section.is_help_center_section ? (
  <HelpCenterSection section={section} />
) : section.is_real_estate_modal ? (
  <RealEstateModal />
) : (
  <>
    {/* Regular section content */}
  </>
)}
```

**AFTER**:
```tsx
{section.is_reviews_section ? (
  <FeedbackAccordion type="all_products" />
) : section.is_help_center_section ? (
  <HelpCenterSection section={section} />
) : section.is_real_estate_modal ? (
  <RealEstateModal />
) : section.is_brand ? (
  <BrandsSection section={section} />
) : section.is_article_slider ? (
  <BlogPostSlider />
) : section.is_contact_section ? (
  <ContactForm />
) : section.is_faq_section ? (
  <FAQSectionWrapper section={section} />
) : (
  <>
    {/* Regular section content */}
  </>
)}
```

**Add imports** (top of file):
```tsx
import Brands from '@/components/HomePageSections/Brands';
import BlogPostSlider from '@/components/HomePageSections/BlogPostSlider';
import ContactForm from '@/components/contact/ContactForm';
import FAQSection from '@/components/HomePageSections/FAQSection';
```

---

### Phase 4: Create Wrapper Components

Since the existing components expect specific props but we're using them in a generic template section context, we need wrapper components.

#### 4.1. Create BrandsSection Wrapper

**New file**: `/src/components/TemplateSections/BrandsSection.tsx`

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import Brands from '@/components/HomePageSections/Brands';
import { getOrganizationId } from '@/lib/supabase';

interface Brand {
  id: string;
  web_storage_address: string;
  name: string;
  organization_id: string | null;
}

interface BrandsSectionProps {
  section: any; // Template section data (unused but consistent with pattern)
}

const BrandsSection: React.FC<BrandsSectionProps> = ({ section }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/brands?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setBrands(data);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <Brands 
      brands={brands} 
      textContent={{ brands_heading: 'Our Trusted Partners' }} 
    />
  );
};

export default BrandsSection;
```

#### 4.2. Create FAQSectionWrapper

**New file**: `/src/components/TemplateSections/FAQSectionWrapper.tsx`

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import FAQSection from '@/components/HomePageSections/FAQSection';
import { getOrganizationId } from '@/lib/supabase';
import { FAQ } from '@/types/faq';

interface FAQSectionWrapperProps {
  section: any; // Template section data (unused but consistent with pattern)
}

const FAQSectionWrapper: React.FC<FAQSectionWrapperProps> = ({ section }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/faqs?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setFaqs(data);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return <FAQSection faqs={faqs} showTitle={true} />;
};

export default FAQSectionWrapper;
```

#### 4.3. Update TemplateSection Imports

```tsx
// Replace individual imports with wrapper imports
import BrandsSection from '@/components/TemplateSections/BrandsSection';
import BlogPostSlider from '@/components/HomePageSections/BlogPostSlider'; // Already a standalone component
import ContactForm from '@/components/contact/ContactForm'; // Already a standalone component
import FAQSectionWrapper from '@/components/TemplateSections/FAQSectionWrapper';
```

---

### Phase 5: Testing & Verification

#### 5.1. Database Verification
```sql
-- Verify new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'website_templatesection'
  AND column_name IN ('is_brand', 'is_article_slider', 'is_contact_section', 'is_faq_section');

-- Test data
UPDATE website_templatesection 
SET is_brand = true 
WHERE id = [test_section_id];
```

#### 5.2. API Testing
- Create new template section with `is_brand: true`
- Verify GET returns new fields
- Verify PUT updates new fields

#### 5.3. UI Testing
- Open Template Section Edit Modal
- Verify new toggle buttons appear
- Toggle each new special section type
- Save and verify database update

#### 5.4. Render Testing
- Create page with each special section type enabled
- Verify correct component renders (Brands, BlogPostSlider, ContactForm, FAQSection)
- Verify data fetches correctly
- Test on multiple pages (not just homepage)

---

### Phase 6: Future Migration (Post-Implementation)

Once all 7 boolean fields are implemented and tested, consolidate into single `special_type` field:

#### 6.1. Add New Column
```sql
ALTER TABLE website_templatesection
ADD COLUMN special_type VARCHAR(50) DEFAULT NULL;

-- Create enum constraint
ALTER TABLE website_templatesection
ADD CONSTRAINT check_special_type 
CHECK (special_type IN (
  'slider',
  'help_center',
  'real_estate',
  'brands',
  'article_slider',
  'contact_form',
  'faq'
));
```

#### 6.2. Migrate Data
```sql
-- Migrate existing boolean values to special_type
UPDATE website_templatesection
SET special_type = CASE
  WHEN is_slider THEN 'slider'
  WHEN is_help_center_section THEN 'help_center'
  WHEN is_real_estate_modal THEN 'real_estate'
  WHEN is_brand THEN 'brands'
  WHEN is_article_slider THEN 'article_slider'
  WHEN is_contact_section THEN 'contact_form'
  WHEN is_faq_section THEN 'faq'
  ELSE NULL
END;
```

#### 6.3. Update Code
Replace all boolean checks with:
```tsx
{section.special_type === 'brands' ? (
  <BrandsSection section={section} />
) : section.special_type === 'article_slider' ? (
  <BlogPostSlider />
) : // ... etc
}
```

#### 6.4. Drop Old Columns
```sql
ALTER TABLE website_templatesection
DROP COLUMN is_slider,
DROP COLUMN is_help_center_section,
DROP COLUMN is_real_estate_modal,
DROP COLUMN is_brand,
DROP COLUMN is_article_slider,
DROP COLUMN is_contact_section,
DROP COLUMN is_faq_section;
```

---

## 📊 Implementation Checklist

### Backend (API)
- [ ] Update `/src/types/template_section.ts` with 4 new boolean fields
- [ ] Update `/src/app/api/template-sections/route.ts` GET handler (SELECT)
- [ ] Update `/src/app/api/template-sections/route.ts` POST handler (INSERT)
- [ ] Update `/src/app/api/template-sections/[id]/route.ts` PUT handler (UPDATE)

### Frontend (Components)
- [ ] Update `/src/components/modals/TemplateSectionModal/context.tsx` interface & state
- [ ] Update `/src/components/modals/TemplateSectionModal/TemplateSectionEditModal.tsx` FormData
- [ ] Add 4 toggle buttons to edit modal
- [ ] Update `/src/components/TemplateSections.tsx` interface
- [ ] Update `/src/components/TemplateSection.tsx` interface
- [ ] Add conditional rendering for 4 new section types in `TemplateSection.tsx`

### Wrapper Components
- [ ] Create `/src/components/TemplateSections/BrandsSection.tsx`
- [ ] Create `/src/components/TemplateSections/FAQSectionWrapper.tsx`
- [ ] Update imports in `TemplateSection.tsx`

### Testing
- [ ] Verify database columns exist
- [ ] Test API GET/POST/PUT with new fields
- [ ] Test modal toggles
- [ ] Test rendering on multiple pages
- [ ] Verify data fetching for each component type

---

## ⚠️ Important Notes

1. **Mutual Exclusivity**: Only ONE special section type should be active at a time per section
2. **Data Fetching**: Each wrapper component fetches its own data (brands, faqs) independently
3. **Organization Scoping**: All data fetches are scoped to current organization
4. **Loading States**: Each wrapper includes loading spinner for better UX
5. **Empty States**: Components gracefully handle no data (return null)
6. **Future-Proof**: This temporary boolean approach makes the `special_type` migration easier

---

## 🎯 Benefits

✅ **Consistency**: Follows exact same pattern as existing special sections  
✅ **Flexibility**: Sections can be placed on ANY page, not just homepage  
✅ **Maintainability**: Wrapper components keep logic organized  
✅ **Migration-Ready**: Clean path to consolidate into single `special_type` field  
✅ **No Breaking Changes**: Existing sections continue to work  

---

## 🚀 Estimated Effort

- **Backend changes**: 30 minutes
- **Frontend modal changes**: 45 minutes
- **Wrapper components**: 45 minutes  
- **TemplateSection integration**: 30 minutes
- **Testing**: 60 minutes

**Total**: ~3-4 hours

---

## ✅ Approval Required

Please review and approve this plan. Once approved, I'll implement:
1. All backend API changes
2. All frontend component updates
3. Wrapper components
4. Initial testing

Ready to proceed? 🚀

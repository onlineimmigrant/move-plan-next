# Pricing Plans Section Implementation Plan

**Date**: October 13, 2025  
**Status**: 📋 **PLANNING**

---

## 🎯 Objective

Add a new `is_pricingplans_section` boolean field to the `website_templatesection` table and implement it as a universal template section, allowing pricing plans to be displayed on any page through the template section system.

---

## 📋 Overview

Following the established pattern used for Brands, FAQ, Reviews, Real Estate, and other template sections, we will:
1. Add database field `is_pricingplans_section` to `website_templatesection` table
2. Update TypeScript types
3. Update API routes (GET, POST, PUT)
4. Create a wrapper component to fetch pricing plans data
5. Update TemplateSection conditional rendering
6. Add toggle button in the modal UI
7. Handle spacing/layout for the section

---

## 🔄 Implementation Steps

### Phase 1: Database Schema ✅ (User Completed)
```sql
-- User has already added this field
ALTER TABLE website_templatesection 
ADD COLUMN is_pricingplans_section BOOLEAN DEFAULT FALSE;
```

---

### Phase 2: Backend Updates

#### 2.1 Update TypeScript Types

**File**: `/src/types/template_section.ts`

Add the new field to the interface:
```typescript
export interface TemplateSection {
  // ... existing fields ...
  is_reviews_section: boolean;
  is_help_center_section?: boolean;
  is_real_estate_modal?: boolean;
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean; // NEW
  // ... other fields ...
}
```

---

#### 2.2 Update GET API Route

**File**: `/src/app/api/template-sections/route.ts`

**Location**: Around line 89-96 (SELECT query)

**Change**:
```typescript
// BEFORE:
const { data, error } = await supabase
  .from('website_templatesection')
  .select(`
    *,
    is_reviews_section,
    is_help_center_section,
    is_real_estate_modal,
    is_brand,
    is_article_slider,
    is_contact_section,
    is_faq_section
  `)

// AFTER:
const { data, error } = await supabase
  .from('website_templatesection')
  .select(`
    *,
    is_reviews_section,
    is_help_center_section,
    is_real_estate_modal,
    is_brand,
    is_article_slider,
    is_contact_section,
    is_faq_section,
    is_pricingplans_section
  `)
```

---

#### 2.3 Update POST API Route

**File**: `/src/app/api/template-sections/route.ts`

**Location**: Around line 247-254 (INSERT data)

**Change**:
```typescript
// BEFORE:
const insertData = {
  // ... existing fields ...
  is_reviews_section: false,
  is_help_center_section: false,
  is_real_estate_modal: false,
  is_brand: false,
  is_article_slider: false,
  is_contact_section: false,
  is_faq_section: false,
};

// AFTER:
const insertData = {
  // ... existing fields ...
  is_reviews_section: false,
  is_help_center_section: false,
  is_real_estate_modal: false,
  is_brand: false,
  is_article_slider: false,
  is_contact_section: false,
  is_faq_section: false,
  is_pricingplans_section: false, // NEW
};
```

---

#### 2.4 Update PUT API Route

**File**: `/src/app/api/template-sections/[id]/route.ts`

**Location**: Around line 59-66 (updateData)

**Change**:
```typescript
// BEFORE:
const updateData = {
  // ... existing fields ...
  is_brand: is_brand ?? false,
  is_article_slider: is_article_slider ?? false,
  is_contact_section: is_contact_section ?? false,
  is_faq_section: is_faq_section ?? false,
};

// AFTER:
const updateData = {
  // ... existing fields ...
  is_brand: is_brand ?? false,
  is_article_slider: is_article_slider ?? false,
  is_contact_section: is_contact_section ?? false,
  is_faq_section: is_faq_section ?? false,
  is_pricingplans_section: is_pricingplans_section ?? false, // NEW
};
```

---

### Phase 3: Frontend Components

#### 3.1 Create Wrapper Component

**File**: `/src/components/TemplateSections/PricingPlansSectionWrapper.tsx` (NEW)

**Purpose**: 
- Fetch pricing plans from API
- Filter by `is_help_center = true` (or all plans based on configuration)
- Handle loading and error states
- Pass data to PricingPlansSlider

**Implementation**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/supabase';
import PricingPlansSlider from './PricingPlansSlider';
import type { PricingPlan } from './PricingPlansSlider';

interface TemplateSectionData {
  id: number;
  section_title?: string;
  section_title_translation?: Record<string, string>;
  section_description?: string;
  section_description_translation?: Record<string, string>;
  organization_id?: string | null;
}

interface PricingPlansSectionWrapperProps {
  section: TemplateSectionData;
}

export default function PricingPlansSectionWrapper({ section }: PricingPlansSectionWrapperProps) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        // Fetch pricing plans marked for help center (featured/hot offerings)
        const response = await fetch(`/api/pricingplans?organization_id=${organizationId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pricing plans: ${response.status}`);
        }

        const data = await response.json();
        const allPlans = Array.isArray(data) ? data : [];
        
        // Filter for help center plans (featured offerings)
        const featuredPlans = allPlans.filter(plan => plan.is_help_center === true);
        
        setPricingPlans(featuredPlans);
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPricingPlans();
  }, [baseUrl, section.organization_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail, don't show error to users
  }

  if (pricingPlans.length === 0) {
    return null; // Don't render if no plans available
  }

  return (
    <PricingPlansSlider
      plans={pricingPlans}
      title={section.section_title || 'Hot Offerings'}
      description={section.section_description || 'Special pricing plans just for you'}
    />
  );
}
```

**Key Features**:
- ✅ Fetches pricing plans from API
- ✅ Filters by `is_help_center = true`
- ✅ Uses section title and description (with defaults)
- ✅ Handles loading state with spinner
- ✅ Handles error state silently
- ✅ Returns null if no plans (clean UI)

---

#### 3.2 Update TemplateSection Interface

**File**: `/src/components/TemplateSection.tsx`

**Location**: Around line 153-157 (interface)

**Change**:
```typescript
// BEFORE:
interface Section {
  // ... existing fields ...
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
}

// AFTER:
interface Section {
  // ... existing fields ...
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean; // NEW
}
```

---

#### 3.3 Update TemplateSection Imports

**File**: `/src/components/TemplateSection.tsx`

**Location**: Around line 11-14 (imports)

**Change**:
```typescript
// BEFORE:
import BlogPostSlider from '@/components/TemplateSections/BlogPostSlider';
import ContactForm from '@/components/contact/ContactForm';
import BrandsSection from '@/components/TemplateSections/BrandsSection';
import FAQSectionWrapper from '@/components/TemplateSections/FAQSectionWrapper';

// AFTER:
import BlogPostSlider from '@/components/TemplateSections/BlogPostSlider';
import ContactForm from '@/components/contact/ContactForm';
import BrandsSection from '@/components/TemplateSections/BrandsSection';
import FAQSectionWrapper from '@/components/TemplateSections/FAQSectionWrapper';
import PricingPlansSectionWrapper from '@/components/TemplateSections/PricingPlansSectionWrapper';
```

---

#### 3.4 Update TemplateSection Conditional Rendering

**File**: `/src/components/TemplateSection.tsx`

**Location**: Around line 365-378 (conditional rendering)

**Change**:
```typescript
// BEFORE:
{section.is_reviews_section ? (
  <FeedbackAccordion type="all_products" />
) : section.is_help_center_section ? (
  <HelpCenterSection section={section} />
) : section.is_real_estate_modal ? (
  <RealEstateModal />
) : section.is_brand ? (
  <BrandsSection section={section} />
) : section.is_article_slider ? (
  <BlogPostSlider backgroundColor={section.background_color} />
) : section.is_contact_section ? (
  <ContactForm />
) : section.is_faq_section ? (
  <FAQSectionWrapper section={section} />
) : (
  // Regular content
)}

// AFTER:
{section.is_reviews_section ? (
  <FeedbackAccordion type="all_products" />
) : section.is_help_center_section ? (
  <HelpCenterSection section={section} />
) : section.is_real_estate_modal ? (
  <RealEstateModal />
) : section.is_brand ? (
  <BrandsSection section={section} />
) : section.is_article_slider ? (
  <BlogPostSlider backgroundColor={section.background_color} />
) : section.is_contact_section ? (
  <ContactForm />
) : section.is_faq_section ? (
  <FAQSectionWrapper section={section} />
) : section.is_pricingplans_section ? (
  <PricingPlansSectionWrapper section={section} />
) : (
  // Regular content
)}
```

---

#### 3.5 Update Spacing Logic (Optional)

**File**: `/src/components/TemplateSection.tsx`

**Location**: Around line 338 and 358 (spacing conditionals)

If PricingPlansSlider needs to remove wrapper padding (like other special sections):

**Outer Section** (line ~338):
```typescript
// BEFORE:
section.is_brand || section.is_article_slider || section.is_contact_section || section.is_faq_section
  ? 'px-0 py-0 min-h-0'

// AFTER:
section.is_brand || section.is_article_slider || section.is_contact_section || section.is_faq_section || section.is_pricingplans_section
  ? 'px-0 py-0 min-h-0'
```

**Inner Div** (line ~358):
```typescript
// BEFORE:
section.is_brand || section.is_article_slider || section.is_contact_section || section.is_faq_section
  ? ''

// AFTER:
section.is_brand || section.is_article_slider || section.is_contact_section || section.is_faq_section || section.is_pricingplans_section
  ? ''
```

---

### Phase 4: Modal UI Updates

#### 4.1 Update Modal Context

**File**: `/src/components/modals/TemplateSectionModal/context.tsx`

**Location**: Around line for TemplateSectionData interface and payload

**Changes**:

**Interface**:
```typescript
export interface TemplateSectionData {
  // ... existing fields ...
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean; // NEW
}
```

**Initial State** (openModal function):
```typescript
is_brand: section?.is_brand ?? false,
is_article_slider: section?.is_article_slider ?? false,
is_contact_section: section?.is_contact_section ?? false,
is_faq_section: section?.is_faq_section ?? false,
is_pricingplans_section: section?.is_pricingplans_section ?? false, // NEW
```

**Save Payload**:
```typescript
const payload = {
  // ... existing fields ...
  is_brand: data.is_brand ?? false,
  is_article_slider: data.is_article_slider ?? false,
  is_contact_section: data.is_contact_section ?? false,
  is_faq_section: data.is_faq_section ?? false,
  is_pricingplans_section: data.is_pricingplans_section ?? false, // NEW
};
```

---

#### 4.2 Update Modal Edit UI

**File**: `/src/components/modals/TemplateSectionModal/TemplateSectionEditModal.tsx`

**Location**: Multiple places

**Changes**:

**1. Import Icon** (around line 1-18):
```typescript
import { 
  // ... existing imports ...
  CurrencyDollarIcon, // NEW - for pricing plans
} from '@heroicons/react/24/outline';
```

**2. Add FormData Field** (around line 50-60):
```typescript
const [formData, setFormData] = useState<FormData>({
  // ... existing fields ...
  is_brand: false,
  is_article_slider: false,
  is_contact_section: false,
  is_faq_section: false,
  is_pricingplans_section: false, // NEW
});
```

**3. Update useEffect** (around line 80-100):
```typescript
useEffect(() => {
  if (data) {
    setFormData({
      // ... existing fields ...
      is_brand: data.is_brand ?? false,
      is_article_slider: data.is_article_slider ?? false,
      is_contact_section: data.is_contact_section ?? false,
      is_faq_section: data.is_faq_section ?? false,
      is_pricingplans_section: data.is_pricingplans_section ?? false, // NEW
    });
  }
}, [data]);
```

**4. Add Toggle Button** (around line 420-490, in toolbar):
```tsx
{/* Pricing Plans Section Toggle */}
<Tooltip content="Pricing Plans Section">
  <button
    type="button"
    onClick={() => {
      setFormData(prev => ({
        ...prev,
        is_pricingplans_section: !prev.is_pricingplans_section,
        // Disable other special sections
        is_reviews_section: false,
        is_help_center_section: false,
        is_real_estate_modal: false,
        is_slider: false,
        is_brand: false,
        is_article_slider: false,
        is_contact_section: false,
        is_faq_section: false,
      }));
    }}
    className={`p-2 rounded transition-colors ${
      formData.is_pricingplans_section
        ? 'bg-yellow-500 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
    }`}
    aria-label="Toggle pricing plans section"
  >
    <CurrencyDollarIcon className="h-5 w-5" />
  </button>
</Tooltip>
```

**Button Characteristics**:
- **Icon**: CurrencyDollarIcon (💰)
- **Color**: Yellow/Gold (`bg-yellow-500`)
- **Position**: After FAQ button in toolbar
- **Behavior**: Disables other special section toggles when enabled

---

### Phase 5: Update TemplateSections.tsx

**File**: `/src/components/TemplateSections.tsx`

**Location**: Around line for Section interface

**Change**:
```typescript
interface Section {
  // ... existing fields ...
  is_brand?: boolean;
  is_article_slider?: boolean;
  is_contact_section?: boolean;
  is_faq_section?: boolean;
  is_pricingplans_section?: boolean; // NEW
}
```

---

## 📊 Summary of Changes

### Files to Modify

| File | Changes | Lines Changed |
|------|---------|---------------|
| `types/template_section.ts` | Add interface field | +1 |
| `api/template-sections/route.ts` (GET) | Add to SELECT | +1 |
| `api/template-sections/route.ts` (POST) | Add to INSERT | +1 |
| `api/template-sections/[id]/route.ts` (PUT) | Add to UPDATE | +1 |
| `TemplateSections/PricingPlansSectionWrapper.tsx` | **NEW FILE** | +90 |
| `TemplateSection.tsx` (interface) | Add field | +1 |
| `TemplateSection.tsx` (import) | Add import | +1 |
| `TemplateSection.tsx` (render) | Add conditional | +2 |
| `TemplateSection.tsx` (spacing - outer) | Add to condition | +1 |
| `TemplateSection.tsx` (spacing - inner) | Add to condition | +1 |
| `modals/.../context.tsx` (interface) | Add field | +1 |
| `modals/.../context.tsx` (initial) | Add default | +1 |
| `modals/.../context.tsx` (payload) | Add to payload | +1 |
| `modals/.../TemplateSectionEditModal.tsx` (import) | Add icon | +1 |
| `modals/.../TemplateSectionEditModal.tsx` (FormData) | Add field | +1 |
| `modals/.../TemplateSectionEditModal.tsx` (useEffect) | Add to sync | +1 |
| `modals/.../TemplateSectionEditModal.tsx` (button) | Add toggle | +25 |
| `TemplateSections.tsx` (interface) | Add field | +1 |

**Total**: ~132 lines of changes + 1 new file

---

## 🎨 UI Design

### Modal Toolbar Layout

```
[ Reviews ] [ Help Center ] [ Real Estate ]
[ Brands ] [ Articles ] [ Contact ] [ FAQ ] [ 💰 Pricing ] ← NEW (Yellow)
```

### Button Style
- **Active**: Yellow background (`bg-yellow-500`), white icon
- **Inactive**: Gray background (`bg-gray-100`), gray icon
- **Hover**: Yellow tint (`bg-yellow-50`, `text-yellow-600`)

---

## 🔍 How It Works

### Data Flow

```
1. Admin enables "is_pricingplans_section" toggle in modal
   ↓
2. Saved to website_templatesection table
   ↓
3. TemplateSection.tsx renders PricingPlansSectionWrapper
   ↓
4. Wrapper fetches pricing plans from /api/pricingplans
   ↓
5. Filters plans where is_help_center = true
   ↓
6. Passes plans to PricingPlansSlider component
   ↓
7. Slider displays "Hot Offerings" with section title/description
   ↓
8. Users can click cards to navigate to product pages
```

### Database Query

```typescript
// Wrapper component fetches:
GET /api/pricingplans?organization_id=${organizationId}

// Then filters client-side:
plans.filter(plan => plan.is_help_center === true)
```

---

## ✅ Benefits

### 1. Consistency
- ✅ Follows exact same pattern as Brands, FAQ, Real Estate sections
- ✅ Uses established wrapper component pattern
- ✅ Consistent modal UI with color-coded buttons

### 2. Reusability
- ✅ Can add pricing plans section to ANY page
- ✅ Not tied to Help Center anymore
- ✅ Section title and description customizable per page

### 3. Flexibility
- ✅ Different pages can have different titles
- ✅ Same data source, different presentations
- ✅ Easy to add/remove from pages via admin UI

### 4. Separation of Concerns
- ✅ WelcomeTab still uses PricingPlansSlider directly
- ✅ Template sections use PricingPlansSectionWrapper
- ✅ Clear distinction between usages

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] Database field `is_pricingplans_section` exists
- [ ] GET API returns new field
- [ ] POST API sets default false
- [ ] PUT API updates field correctly

### Component Testing
- [ ] PricingPlansSectionWrapper fetches data
- [ ] Loading spinner shows
- [ ] Error handling works (silent fail)
- [ ] Empty state handled (no plans)
- [ ] Plans display correctly

### UI Testing
- [ ] Toggle button appears in modal
- [ ] Yellow color applies when active
- [ ] Disables other special section toggles
- [ ] Saves correctly to database
- [ ] Section renders on page

### Integration Testing
- [ ] Can add section to homepage
- [ ] Can add section to product page
- [ ] Can add section to any custom page
- [ ] Section title/description customizable
- [ ] Plans link to correct product pages
- [ ] Mobile responsive
- [ ] Navigation works (arrows, dots, swipe)

---

## 📝 Implementation Order

1. ✅ **Database** (already done by user)
2. **Backend** (types, API routes) - 10 minutes
3. **Wrapper Component** - 15 minutes
4. **TemplateSection Updates** - 10 minutes
5. **Modal Context** - 5 minutes
6. **Modal UI** - 10 minutes
7. **Testing** - 20 minutes
8. **Build & Verify** - 5 minutes

**Total Estimated Time**: ~75 minutes

---

## 🎯 Next Steps

After implementation, we can:
1. Add to homepage via template sections
2. Create dedicated pricing page with this section
3. Add to product pages to show related plans
4. Use on landing pages for specific offerings
5. A/B test different titles/descriptions

---

## 🚀 Future Enhancements

### Potential Features
1. **Filter Options**: By type, price range, category
2. **Sort Options**: By price, popularity, newest
3. **All Plans Toggle**: Option to show all plans, not just `is_help_center`
4. **Custom Filtering**: Admin can select which plans to show
5. **Layout Options**: Grid view, list view, carousel
6. **Analytics**: Track which plans get clicked
7. **Personalization**: Show plans based on user behavior

---

## ✅ Ready to Implement?

This plan follows the exact same pattern used for:
- ✅ Brands Section
- ✅ FAQ Section  
- ✅ Reviews Section
- ✅ Real Estate Section
- ✅ Help Center Section
- ✅ Article Slider Section
- ✅ Contact Form Section

**Status**: 📋 **READY FOR IMPLEMENTATION**

---

Let me know when you're ready, and I'll implement this step by step! 🚀

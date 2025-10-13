# Type-Specific Section Skeletons - Implementation Plan

## Overview
Create intelligent skeleton loaders that match the actual section type being loaded, providing users with accurate visual previews during data fetching.

## Current State
- ✅ Template sections have `section_type` field
- ✅ `isLoading` state exists in TemplateSections.tsx
- ❌ No skeleton display during loading
- ❌ Generic SkeletonLoader doesn't match section structures

## Benefits

### User Experience
1. **Accurate Previews:** Users see what's actually loading
2. **Reduced Perceived Wait Time:** Specific skeletons feel faster than spinners
3. **Professional Feel:** Shows attention to detail
4. **Layout Stability:** Prevents content jumping when sections load

### Technical Benefits
1. **Better Performance Perception:** Content appears to load progressively
2. **Reusable Components:** Each skeleton can be used independently
3. **Type Safety:** TypeScript ensures correct skeleton for each type
4. **Easy Maintenance:** One skeleton per section type

## Section Types & Their Skeletons

### 1. General Section (Default)
**Structure:**
- Title (large text)
- Description (2-3 lines)
- Grid of metric cards (3 columns)
  - Image placeholder
  - Title
  - Description

**Visual Characteristics:**
- Centered or left-aligned title
- Card grid with varying columns (1-4)
- Slider navigation if carousel enabled

### 2. Reviews Section
**Structure:**
- Title
- Grid of review cards (2-3 columns)
  - Avatar placeholder
  - Star rating placeholders
  - Name line
  - Comment text (3-4 lines)

**Visual Characteristics:**
- Card-based layout
- Circular avatar placeholders
- Star rating indicators

### 3. FAQ Section
**Structure:**
- Title
- List of accordion items (4-6)
  - Question line
  - Collapse icon placeholder

**Visual Characteristics:**
- Stacked list layout
- Minimal spacing
- Chevron indicators

### 4. Contact Form Section
**Structure:**
- Title
- Form fields (3-4 input placeholders)
- Text area placeholder
- Button placeholder

**Visual Characteristics:**
- Vertical form layout
- Input field rectangles
- Large submit button

### 5. Brand Logos Section
**Structure:**
- Title (optional)
- Horizontal row of logo placeholders (5-8)

**Visual Characteristics:**
- Small rectangular placeholders
- Evenly spaced
- Grayscale theme

### 6. Blog Posts Slider
**Structure:**
- Title
- Horizontal cards (2-3 visible)
  - Image placeholder (16:9)
  - Title line
  - Description (2 lines)
  - Date placeholder

**Visual Characteristics:**
- Wide card layout
- Large image areas
- Slider navigation

### 7. Pricing Plans Section
**Structure:**
- Title
- Grid of pricing cards (3 columns)
  - Plan name
  - Price ($X/month)
  - Feature list (5-7 items)
  - CTA button

**Visual Characteristics:**
- Card grid
- Center-aligned content
- Prominent price area

### 8. Help Center Section
**Structure:**
- Title
- Grid of help topic cards (2-3 columns)
  - Icon placeholder
  - Title
  - Description (2 lines)

**Visual Characteristics:**
- Card grid
- Icon + text layout
- Minimal spacing

### 9. Real Estate Section
**Structure:**
- Title
- Grid of property cards (2-3 columns)
  - Large image (4:3)
  - Price line
  - Location line
  - Features (2 lines)

**Visual Characteristics:**
- Image-heavy cards
- Price prominence
- Location indicators

## Implementation Steps

### Step 1: Create Skeleton Component File
**File:** `src/components/skeletons/TemplateSectionSkeletons.tsx`

Components to create:
- `GeneralSectionSkeleton` (default)
- `ReviewsSectionSkeleton`
- `FAQSectionSkeleton`
- `ContactSectionSkeleton`
- `BrandsSectionSkeleton`
- `BlogPostsSectionSkeleton`
- `PricingPlansSectionSkeleton`
- `HelpCenterSectionSkeleton`
- `RealEstateSectionSkeleton`

### Step 2: Create Skeleton Selector Component
**File:** Same file, export main component

```typescript
type SectionType = 'general' | 'brand' | 'article_slider' | 'contact' | 
  'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans';

interface TemplateSectionSkeletonProps {
  sectionType?: SectionType;
  count?: number; // Number of skeleton sections to show
}

export const TemplateSectionSkeleton: React.FC<TemplateSectionSkeletonProps>
```

### Step 3: Update TemplateSections.tsx
Add skeleton display during loading:

```typescript
if (isLoading) {
  return (
    <>
      {/* Show 3 general skeletons by default */}
      <TemplateSectionSkeleton count={3} />
    </>
  );
}
```

### Step 4: Optimize Data Fetching (Optional)
Consider fetching section metadata first (just types and count) to show accurate skeletons:

```typescript
// Quick fetch: just get section types
const types = await fetch(`/api/template-sections/types?url_page=${encoded}`);
// Show type-specific skeletons
// Then fetch full data
```

## Design System

### Animation
- Shimmer effect (CSS animation)
- Gradient overlay moving left to right
- 1.5s duration, infinite loop

### Colors
- Background: `bg-gray-100` or `bg-gray-50`
- Shimmer: `bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100`
- Borders: `border-gray-200`

### Spacing
- Match actual section spacing
- Use same padding/margins as real sections
- Maintain layout consistency

### Rounded Corners
- Cards: `rounded-lg` (8px)
- Images: `rounded-md` (6px)
- Buttons: `rounded-full` or `rounded-lg`

## Code Structure

```typescript
// Base shimmer animation
const shimmerClass = "animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100";

// Reusable skeleton elements
const SkeletonLine = ({ width = 'full', height = '4' }) => (
  <div className={`h-${height} w-${width} ${shimmerClass} rounded`} />
);

const SkeletonCard = ({ children }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
    {children}
  </div>
);
```

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading:** Only render visible skeletons
2. **CSS Animations:** Use CSS instead of JS for shimmer
3. **Minimal DOM:** Keep skeleton DOM lightweight
4. **Reusable Components:** Share skeleton primitives

### Best Practices
1. Match exact dimensions of real content
2. Use same container widths
3. Maintain aspect ratios for images
4. Show realistic number of items

## Accessibility

### ARIA Attributes
```typescript
<div 
  role="status" 
  aria-live="polite" 
  aria-label="Loading content..."
>
  {/* Skeleton content */}
</div>
```

### Screen Reader Support
- Announce loading state
- Update when content loads
- Provide meaningful labels

## Testing Checklist

- [ ] Each skeleton type matches its section layout
- [ ] Shimmer animation is smooth (60 FPS)
- [ ] Loading state shows immediately
- [ ] Transition to real content is seamless
- [ ] No layout shift when content loads
- [ ] Works on all screen sizes (responsive)
- [ ] Accessible with screen readers
- [ ] Performance: < 100ms render time per skeleton

## Example Implementation Preview

```typescript
// General Section Skeleton
export const GeneralSectionSkeleton = () => (
  <section className="py-12 sm:py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="h-12 w-64 bg-gray-200 rounded animate-pulse mb-4" />
      {/* Description */}
      <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-12" />
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="h-48 bg-gray-200 rounded-md animate-pulse mb-4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        ))}
      </div>
    </div>
  </section>
);
```

## Migration Strategy

### Phase 1: Core Implementation
1. Create skeleton components
2. Add to TemplateSections.tsx
3. Test with general sections

### Phase 2: Expand Coverage
1. Add skeletons for all 9 section types
2. Test each type independently
3. Verify responsive behavior

### Phase 3: Optimization
1. Add smart skeleton count detection
2. Implement fade-in transitions
3. Performance profiling

### Phase 4: Enhancement (Optional)
1. Fetch section types first for accurate skeletons
2. Progressive loading (show sections as they load)
3. Staggered animation timing

## Metrics for Success

- **Perceived Performance:** Users report faster load times
- **No Layout Shift:** CLS (Cumulative Layout Shift) = 0
- **Smooth Transitions:** No flash of loading state
- **Accurate Previews:** Skeletons match real content structure

---

**Next Steps:**
1. Review and approve this plan
2. Implement skeleton components
3. Integrate into TemplateSections.tsx
4. Test all section types
5. Deploy and monitor user feedback

**Estimated Time:** 2-3 hours for complete implementation

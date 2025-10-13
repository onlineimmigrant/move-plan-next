# Section Type Consolidation - Modal Update Guide

## Status
✅ Step 1: Database migration complete
✅ Step 2: TypeScript types updated
✅ Step 3: API routes updated (GET, POST, PUT)
✅ Step 4: TemplateSection component updated
✅ Step 5: TemplateSections component updated
🔄 Step 6: Modal UI update (IN PROGRESS)

## Changes Needed for TemplateSectionEditModal.tsx

### 1. Add RadioGroup import
```typescript
import { RadioGroup } from '@headlessui/react';
import { StarIcon } from '@heroicons/react/24/outline'; // Add for reviews
```

### 2. Update FormData interface (line ~100)
```typescript
interface TemplateSectionFormData {
  section_title: string;
  section_description: string;
  background_color: string;
  text_style_variant: 'default' | 'apple' | 'codedharmony';
  grid_columns: number;
  image_metrics_height: string;
  is_full_width: boolean;
  is_section_title_aligned_center: boolean;
  is_section_title_aligned_right: boolean;
  is_image_bottom: boolean;
  is_slider: boolean;
  
  // New consolidated field
  section_type: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans';
  
  // DEPRECATED - Keep temporarily for backward compat
  is_reviews_section: boolean;
  is_help_center_section: boolean;
  is_real_estate_modal: boolean;
  is_brand: boolean;
  is_article_slider: boolean;
  is_contact_section: boolean;
  is_faq_section: boolean;
  is_pricingplans_section: boolean;
  url_page?: string;
  website_metric?: Metric[];
}
```

### 3. Add section type options (after HEIGHT_OPTIONS, line ~90)
```typescript
const SECTION_TYPE_OPTIONS = [
  {
    value: 'general' as const,
    label: 'General Content',
    description: 'Standard section with title, description, and metrics',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'gray',
  },
  {
    value: 'reviews' as const,
    label: 'Reviews',
    description: 'Customer reviews and testimonials',
    icon: StarIcon,
    color: 'amber',
  },
  {
    value: 'help_center' as const,
    label: 'Help Center',
    description: 'FAQ and support knowledge base',
    icon: QuestionMarkCircleIcon,
    color: 'cyan',
  },
  {
    value: 'real_estate' as const,
    label: 'Real Estate',
    description: 'Property listings and details',
    icon: HomeModernIcon,
    color: 'orange',
  },
  {
    value: 'brand' as const,
    label: 'Brands',
    description: 'Brand logos carousel',
    icon: BuildingOfficeIcon,
    color: 'purple',
  },
  {
    value: 'article_slider' as const,
    label: 'Article Slider',
    description: 'Featured blog posts carousel',
    icon: NewspaperIcon,
    color: 'indigo',
  },
  {
    value: 'contact' as const,
    label: 'Contact Form',
    description: 'Contact information and form',
    icon: EnvelopeIcon,
    color: 'green',
  },
  {
    value: 'faq' as const,
    label: 'FAQ',
    description: 'Frequently asked questions',
    icon: ChatBubbleLeftRightIcon,
    color: 'blue',
  },
  {
    value: 'pricing_plans' as const,
    label: 'Pricing Plans',
    description: 'Product pricing cards',
    icon: CurrencyDollarIcon,
    color: 'yellow',
  },
];
```

### 4. Update initial formData state (line ~145)
```typescript
const [formData, setFormData] = useState<TemplateSectionFormData>({
  section_title: '',
  section_description: '',
  background_color: 'white',
  text_style_variant: 'default',
  grid_columns: 3,
  image_metrics_height: '300px',
  is_full_width: false,
  is_section_title_aligned_center: false,
  is_section_title_aligned_right: false,
  is_image_bottom: false,
  is_slider: false,
  section_type: 'general', // NEW
  is_reviews_section: false,
  is_help_center_section: false,
  is_real_estate_modal: false,
  is_brand: false,
  is_article_slider: false,
  is_contact_section: false,
  is_faq_section: false,
  is_pricingplans_section: false,
  url_page: undefined,
  website_metric: undefined,
});
```

### 5. Update useEffect for editingSection (line ~165)
Add to the useEffect that initializes form from editingSection:
```typescript
useEffect(() => {
  if (editingSection) {
    // Determine section_type from boolean flags if not set
    let sectionType: typeof formData.section_type = editingSection.section_type || 'general';
    if (!editingSection.section_type) {
      // Fallback: derive from boolean flags
      if (editingSection.is_reviews_section) sectionType = 'reviews';
      else if (editingSection.is_help_center_section) sectionType = 'help_center';
      else if (editingSection.is_real_estate_modal) sectionType = 'real_estate';
      else if (editingSection.is_brand) sectionType = 'brand';
      else if (editingSection.is_article_slider) sectionType = 'article_slider';
      else if (editingSection.is_contact_section) sectionType = 'contact';
      else if (editingSection.is_faq_section) sectionType = 'faq';
      else if (editingSection.is_pricingplans_section) sectionType = 'pricing_plans';
    }
    
    setFormData({
      section_title: editingSection.section_title || '',
      section_description: editingSection.section_description || '',
      background_color: editingSection.background_color || 'white',
      text_style_variant: editingSection.text_style_variant || 'default',
      grid_columns: editingSection.grid_columns || 3,
      image_metrics_height: editingSection.image_metrics_height || '300px',
      is_full_width: editingSection.is_full_width || false,
      is_section_title_aligned_center: editingSection.is_section_title_aligned_center || false,
      is_section_title_aligned_right: editingSection.is_section_title_aligned_right || false,
      is_image_bottom: editingSection.is_image_bottom || false,
      is_slider: editingSection.is_slider || false,
      section_type: sectionType, // NEW
      is_reviews_section: editingSection.is_reviews_section || false,
      is_help_center_section: editingSection.is_help_center_section || false,
      is_real_estate_modal: editingSection.is_real_estate_modal || false,
      is_brand: editingSection.is_brand || false,
      is_article_slider: editingSection.is_article_slider || false,
      is_contact_section: editingSection.is_contact_section || false,
      is_faq_section: editingSection.is_faq_section || false,
      is_pricingplans_section: editingSection.is_pricingplans_section || false,
      url_page: editingSection.url_page,
      website_metric: editingSection.website_metric,
    });
  }
}, [editingSection]);
```

### 6. Replace toggle buttons section (lines ~290-540)
Replace the entire toolbar section from line 290 (where toggle buttons start) to line 540 (before the background color picker) with:

```typescript
{/* Fixed Toolbar - Horizontally Scrollable */}
<div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 sm:px-6">
  <div className="overflow-x-auto">
    <div className="flex items-center gap-1 py-3 min-w-max">
      {/* Alignment buttons */}
      <div className="relative group">
        <button
          onClick={() => setFormData({
            ...formData,
            is_section_title_aligned_center: false,
            is_section_title_aligned_right: false,
          })}
          className={cn(
            'p-2 rounded-lg transition-colors',
            !formData.is_section_title_aligned_center && !formData.is_section_title_aligned_right
              ? 'bg-sky-100 text-sky-500 border border-sky-200'
              : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
          )}
        >
          <Bars3BottomLeftIcon className="w-5 h-5" />
        </button>
        <Tooltip content="Align section title to the left" />
      </div>

      <div className="relative group">
        <button
          onClick={() => setFormData({
            ...formData,
            is_section_title_aligned_center: true,
            is_section_title_aligned_right: false,
          })}
          className={cn(
            'p-2 rounded-lg transition-colors',
            formData.is_section_title_aligned_center
              ? 'bg-sky-100 text-sky-500 border border-sky-200'
              : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
          )}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <Tooltip content="Align section title to the center" />
      </div>

      <div className="relative group">
        <button
          onClick={() => setFormData({
            ...formData,
            is_section_title_aligned_center: false,
            is_section_title_aligned_right: true,
          })}
          className={cn(
            'p-2 rounded-lg transition-colors',
            formData.is_section_title_aligned_right
              ? 'bg-sky-100 text-sky-500 border border-sky-200'
              : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
          )}
        >
          <Bars3BottomRightIcon className="w-5 h-5" />
        </button>
        <Tooltip content="Align section title to the right" />
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Full Width */}
      <div className="relative group">
        <button
          onClick={() => setFormData({ ...formData, is_full_width: !formData.is_full_width })}
          className={cn(
            'p-2 rounded-lg transition-colors',
            formData.is_full_width
              ? 'bg-sky-100 text-sky-500 border border-sky-200'
              : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
          )}
        >
          <ArrowsRightLeftIcon className="w-5 h-5" />
        </button>
        <Tooltip content="Make section full width without container constraints" />
      </div>

      {/* Enable Slider - Only for general sections */}
      {formData.section_type === 'general' && (
        <div className="relative group">
          <button
            onClick={() => setFormData({ ...formData, is_slider: !formData.is_slider })}
            className={cn(
              'p-2 rounded-lg transition-colors',
              formData.is_slider
                ? 'bg-sky-100 text-sky-500 border border-sky-200'
                : 'text-gray-400 hover:text-sky-500 hover:bg-gray-50 border border-transparent'
            )}
          >
            <RectangleStackIcon className="w-5 h-5" />
          </button>
          <Tooltip content="Enable horizontal slider/carousel for metrics" />
        </div>
      )}

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Background Color - Keep existing */}
      {/* ... rest of toolbar ... */}
```

### 7. Add RadioGroup section (after title/description inputs, before metrics)
Find where the form content renders (around line 600) and add this before the MetricManager:

```typescript
{/* Section Type Radio Group */}
<div className="space-y-3">
  <label className="block text-sm font-semibold text-gray-700">
    Section Type
  </label>
  <RadioGroup
    value={formData.section_type}
    onChange={(value) => setFormData({ ...formData, section_type: value })}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {SECTION_TYPE_OPTIONS.map((option) => {
        const Icon = option.icon;
        
        return (
          <RadioGroup.Option
            key={option.value}
            value={option.value}
            className={({ checked }) =>
              `relative flex cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md
              ${checked
                ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-500 shadow-sm`
                : 'border-gray-200 bg-white hover:border-gray-300'
              }`
            }
          >
            {({ checked }) => (
              <div className="flex w-full items-start">
                <div className="flex-shrink-0">
                  <Icon
                    className={`h-6 w-6 ${
                      checked ? `text-${option.color}-600` : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <RadioGroup.Label
                    as="p"
                    className={`text-sm font-semibold ${
                      checked ? `text-${option.color}-900` : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </RadioGroup.Label>
                  <RadioGroup.Description
                    as="p"
                    className="text-xs text-gray-500 mt-1 leading-relaxed"
                  >
                    {option.description}
                  </RadioGroup.Description>
                </div>
                {checked && (
                  <div className="flex-shrink-0 ml-2">
                    <div className={`rounded-full bg-${option.color}-500 p-1`}>
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )}
          </RadioGroup.Option>
        );
      })}
    </div>
  </RadioGroup>
  <p className="text-xs text-gray-500 mt-2">
    {formData.section_type === 'general' 
      ? 'Standard section with customizable title, description, and metrics below.'
      : 'Special section with predefined layout and functionality. Title and description are optional.'}
  </p>
</div>

{/* Title and Description - Always show but mark as optional for special sections */}
<div className="space-y-4">
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Title {formData.section_type !== 'general' && <span className="text-gray-400 font-normal">(optional)</span>}
    </label>
    <input
      type="text"
      value={formData.section_title}
      onChange={(e) => setFormData({ ...formData, section_title: e.target.value })}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      placeholder="Enter section title"
    />
  </div>

  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Description {formData.section_type !== 'general' && <span className="text-gray-400 font-normal">(optional)</span>}
    </label>
    <textarea
      ref={descriptionTextareaRef}
      value={formData.section_description}
      onChange={handleDescriptionChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
      placeholder="Enter section description"
      rows={3}
    />
  </div>
</div>

{/* Metrics - Only show for general sections */}
{formData.section_type === 'general' && (
  <MetricManager ... />
)}
```

## Summary

The key changes are:
1. ✅ Replace 9 boolean toggle buttons with a single RadioGroup
2. ✅ Add section_type field to FormData
3. ✅ Convert boolean flags to section_type on load
4. ✅ Show/hide metrics based on section_type
5. ✅ Mark title/description as optional for special sections
6. ✅ Keep only layout controls (alignment, full-width, slider) in toolbar
7. ✅ Beautiful card-based radio options with icons and descriptions

## Benefits
- ✨ Cleaner UI (9 buttons → 1 radio group)
- ✨ Impossible to select conflicting section types
- ✨ Clear visual hierarchy
- ✨ Better UX with descriptions
- ✨ Easier to add new section types

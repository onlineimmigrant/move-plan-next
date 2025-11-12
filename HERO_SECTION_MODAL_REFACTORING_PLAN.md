# HeroSectionEditModal - Separation of Concerns Plan

## Current State Analysis

**File**: `src/components/modals/HeroSectionModal/HeroSectionEditModal.tsx`  
**Lines**: 2,626 lines  
**Complexity**: EXTREME  

### Current Structure
1. **Tooltip Component** (lines ~32-107) - Reusable tooltip with fixed positioning
2. **ElementHoverMenu Component** (lines ~111-300) - Hover menu for inline editing
3. **HeroFormData Interface** (lines ~301-347) - Complex type definitions
4. **Main Modal Component** (lines ~348-2626) - Everything else!

### Problems
- ❌ Single file contains multiple concerns
- ❌ 2,626 lines is unmaintainable
- ❌ 30+ state variables in one component
- ❌ Complex preview logic mixed with form logic
- ❌ Inline editing, color pickers, dropdowns all in one place
- ❌ Difficult to test individual pieces
- ❌ Hard to understand and modify

---

## Refactoring Strategy

### Phase 1: Extract Shared Components (Priority: HIGH)

#### 1.1 Create `/components` directory
```
src/components/modals/HeroSectionModal/
├── components/
│   ├── Tooltip.tsx                    ← Extract from main file
│   ├── ElementHoverMenu.tsx           ← Extract from main file
│   ├── ColorPicker.tsx                ← New wrapper component
│   ├── StyleDropdown.tsx              ← New dropdown wrapper
│   ├── AnimationSelector.tsx          ← Extract animation selection
│   ├── ImageUploader.tsx              ← Extract image upload logic
│   └── index.ts                       ← Export all
```

**Benefits**:
- Reusable across other modals
- Easier to test
- Clearer responsibilities

---

#### 1.2 Create `/sections` directory (Form Sections)
```
src/components/modals/HeroSectionModal/
├── sections/
│   ├── TitleStyleSection.tsx          ← Title styling controls
│   ├── DescriptionStyleSection.tsx    ← Description styling controls
│   ├── ButtonStyleSection.tsx         ← Button styling controls
│   ├── ImageStyleSection.tsx          ← Image styling controls
│   ├── BackgroundStyleSection.tsx     ← Background styling controls
│   ├── LayoutSection.tsx              ← Layout controls
│   ├── AnimationSection.tsx           ← Animation element selection
│   └── index.ts                       ← Export all
```

**Each section will**:
- Accept `formData` and `onChange` props
- Handle its own dropdown state
- Use standardized FormInput/FormTextarea
- Be self-contained and testable

---

#### 1.3 Create `/preview` directory (Preview Components)
```
src/components/modals/HeroSectionModal/
├── preview/
│   ├── HeroPreview.tsx                ← Main preview component
│   ├── HeroTitle.tsx                  ← Title rendering with styles
│   ├── HeroDescription.tsx            ← Description rendering
│   ├── HeroButton.tsx                 ← Button rendering
│   ├── HeroImage.tsx                  ← Image rendering
│   ├── HeroBackground.tsx             ← Background rendering
│   ├── AnimationElements.tsx          ← Animation element rendering
│   └── index.ts                       ← Export all
```

**Benefits**:
- Separate preview logic from form logic
- Mirrors Hero.tsx structure
- Easier to keep in sync with actual Hero component
- Can be tested independently

---

#### 1.4 Create `/hooks` directory (Custom Hooks)
```
src/components/modals/HeroSectionModal/
├── hooks/
│   ├── useHeroForm.ts                 ← Form data management
│   ├── useColorPickers.ts             ← All color picker states
│   ├── useDropdowns.ts                ← All dropdown states
│   ├── useImageGallery.ts             ← Image gallery state
│   ├── useHeroSave.ts                 ← Save logic
│   ├── useHeroDelete.ts               ← Delete logic
│   └── index.ts                       ← Export all
```

**Benefits**:
- Extract complex state management
- Reusable logic
- Easier to test
- Clear separation of concerns

---

#### 1.5 Create `/types` directory
```
src/components/modals/HeroSectionModal/
├── types/
│   ├── index.ts                       ← All TypeScript interfaces
```

**Move these types**:
- `HeroFormData`
- `TitleStyle`
- `DescriptionStyle`
- `ImageStyle`
- `BackgroundStyle`
- `ButtonStyle`

---

### Phase 2: Refactor Main Modal Component (Priority: HIGH)

#### New Structure for `HeroSectionEditModal.tsx`
```tsx
'use client';

import React from 'react';
import {
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  type ModalAction
} from '@/components/modals/_shared';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import { useHeroSectionEdit } from './context';
import { useHeroForm } from './hooks/useHeroForm';
import { useHeroSave } from './hooks/useHeroSave';
import { HeroPreview } from './preview';
import {
  TitleStyleSection,
  DescriptionStyleSection,
  ButtonStyleSection,
  ImageStyleSection,
  BackgroundStyleSection,
  LayoutSection,
  AnimationSection,
} from './sections';

export default function HeroSectionEditModal() {
  const { isOpen, editingSection, closeModal } = useHeroSectionEdit();
  const { formData, updateField, resetForm } = useHeroForm(editingSection);
  const { isSaving, saveError, handleSave, handleDelete } = useHeroSave();

  const primaryAction: ModalAction = {
    label: isSaving ? 'Saving...' : 'Save Changes',
    onClick: () => handleSave(formData),
    variant: 'primary',
    loading: isSaving,
  };

  const secondaryAction: ModalAction = {
    label: 'Cancel',
    onClick: closeModal,
    variant: 'secondary',
  };

  return (
    <StandardModalContainer
      isOpen={isOpen}
      onClose={closeModal}
      size="xlarge"
      enableDrag={true}
      enableResize={true}
      ariaLabel="Edit Hero Section"
    >
      <StandardModalHeader
        title="Hero Section"
        subtitle="Customize your hero section design"
        icon={PaintBrushIcon}
        iconColor="text-purple-500"
        onClose={closeModal}
      />

      <StandardModalBody>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Form Controls */}
          <div className="space-y-4 overflow-y-auto">
            <LayoutSection formData={formData} onChange={updateField} />
            <TitleStyleSection formData={formData} onChange={updateField} />
            <DescriptionStyleSection formData={formData} onChange={updateField} />
            <ButtonStyleSection formData={formData} onChange={updateField} />
            <ImageStyleSection formData={formData} onChange={updateField} />
            <BackgroundStyleSection formData={formData} onChange={updateField} />
            <AnimationSection formData={formData} onChange={updateField} />
          </div>

          {/* Right Column: Live Preview */}
          <div className="sticky top-0">
            <HeroPreview formData={formData} />
          </div>
        </div>

        {/* Error Display */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {saveError}
          </div>
        )}
      </StandardModalBody>

      <StandardModalFooter
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        tertiaryActions={[
          {
            label: 'Delete',
            onClick: handleDelete,
            variant: 'danger',
          }
        ]}
        align="between"
      />
    </StandardModalContainer>
  );
}
```

**Result**: ~100 lines instead of 2,626!

---

### Phase 3: Implementation Order

#### Step 1: Setup Directory Structure
```bash
mkdir -p src/components/modals/HeroSectionModal/{components,sections,preview,hooks,types}
touch src/components/modals/HeroSectionModal/components/index.ts
touch src/components/modals/HeroSectionModal/sections/index.ts
touch src/components/modals/HeroSectionModal/preview/index.ts
touch src/components/modals/HeroSectionModal/hooks/index.ts
touch src/components/modals/HeroSectionModal/types/index.ts
```

#### Step 2: Extract Types (15 minutes)
1. Create `types/index.ts`
2. Move all interfaces from main file
3. Export them all

#### Step 3: Extract Tooltip Component (20 minutes)
1. Create `components/Tooltip.tsx`
2. Copy tooltip code from lines 32-107
3. Export as standalone component
4. Test in isolation

#### Step 4: Extract ElementHoverMenu (30 minutes)
1. Create `components/ElementHoverMenu.tsx`
2. Copy code from lines 111-300
3. Make it accept props instead of using internal state
4. Export and test

#### Step 5: Create Custom Hooks (2 hours)
1. `useHeroForm.ts` - Form data management
2. `useColorPickers.ts` - All color picker state (12+ states!)
3. `useDropdowns.ts` - All dropdown state (6+ states!)
4. `useImageGallery.ts` - Image gallery state
5. `useHeroSave.ts` - Save/update logic
6. `useHeroDelete.ts` - Delete logic

#### Step 6: Create Section Components (4 hours)
1. `TitleStyleSection.tsx` - Title controls
2. `DescriptionStyleSection.tsx` - Description controls
3. `ButtonStyleSection.tsx` - Button controls
4. `ImageStyleSection.tsx` - Image controls
5. `BackgroundStyleSection.tsx` - Background controls
6. `LayoutSection.tsx` - Layout controls
7. `AnimationSection.tsx` - Animation selection

Each section should:
- Accept `formData` and `onChange` props
- Use standardized FormInput/FormTextarea
- Include its own color pickers
- Be self-contained

#### Step 7: Create Preview Components (3 hours)
1. `HeroPreview.tsx` - Main preview container
2. `HeroTitle.tsx` - Title rendering
3. `HeroDescription.tsx` - Description rendering
4. `HeroButton.tsx` - Button rendering
5. `HeroImage.tsx` - Image rendering
6. `HeroBackground.tsx` - Background rendering
7. `AnimationElements.tsx` - Animation elements

#### Step 8: Refactor Main Modal (1 hour)
1. Replace `BaseModal` with `StandardModalContainer`
2. Use all extracted components
3. Clean up imports
4. Test thoroughly

#### Step 9: Testing & Cleanup (2 hours)
1. Test each section independently
2. Test preview updates
3. Test save/delete
4. Test mobile responsiveness
5. Clean up old code
6. Update imports

---

### Phase 4: File-by-File Breakdown

#### `types/index.ts` (~50 lines)
```tsx
export interface TitleStyle {
  color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
  size?: {
    desktop: string;
    mobile: string;
  };
  alignment?: 'left' | 'center' | 'right';
  blockWidth?: string;
  blockColumns?: number;
}

export interface DescriptionStyle {
  color?: string;
  size?: {
    desktop: string;
    mobile: string;
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export interface ImageStyle {
  position?: 'left' | 'right' | 'full';
  fullPage?: boolean;
  width?: number;
  height?: number;
}

export interface BackgroundStyle {
  color?: string;
  is_gradient?: boolean;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
  seo_title?: string;
  column?: number;
}

export interface ButtonStyle {
  color?: string;
  gradient?: {
    from: string;
    via?: string;
    to: string;
  };
  aboveDescription?: boolean;
  isVideo?: boolean;
  url?: string;
}

export interface HeroFormData {
  title: string;
  description: string;
  button: string;
  image: string;
  title_style?: TitleStyle;
  description_style?: DescriptionStyle;
  image_style?: ImageStyle;
  background_style?: BackgroundStyle;
  button_style?: ButtonStyle;
  animation_element?: string;
  title_translation?: any;
  description_translation?: any;
  button_translation?: any;
}
```

#### `hooks/useHeroForm.ts` (~80 lines)
```tsx
import { useState, useEffect } from 'react';
import { HeroFormData } from '../types';

export function useHeroForm(editingSection: any) {
  const [formData, setFormData] = useState<HeroFormData>({
    title: '',
    description: '',
    button: 'Get Started',
    image: '',
    title_style: {
      color: 'gray-800',
      size: { desktop: 'text-7xl', mobile: 'text-5xl' },
      alignment: 'center',
      blockWidth: '2xl',
      blockColumns: 1
    },
    description_style: {
      color: 'gray-600',
      size: { desktop: 'text-2xl', mobile: 'text-lg' },
      weight: 'normal'
    },
    image_style: {
      position: 'right',
      fullPage: false,
      width: 400,
      height: 300
    },
    background_style: {
      color: 'white'
    },
    button_style: {
      aboveDescription: false,
      isVideo: false,
      url: '/products'
    },
    animation_element: '',
  });

  useEffect(() => {
    if (editingSection) {
      // Initialize from editingSection
      // ... migration logic here
    }
  }, [editingSection]);

  const updateField = (field: keyof HeroFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    // Reset to initial state
  };

  return {
    formData,
    updateField,
    resetForm,
    setFormData,
  };
}
```

#### `hooks/useColorPickers.ts` (~40 lines)
```tsx
import { useState } from 'react';

export function useColorPickers() {
  const [showTitleColorPicker, setShowTitleColorPicker] = useState(false);
  const [showDescColorPicker, setShowDescColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showButtonColorPicker, setShowButtonColorPicker] = useState(false);
  const [showTitleGradFromPicker, setShowTitleGradFromPicker] = useState(false);
  const [showTitleGradViaPicker, setShowTitleGradViaPicker] = useState(false);
  const [showTitleGradToPicker, setShowTitleGradToPicker] = useState(false);
  const [showBgGradFromPicker, setShowBgGradFromPicker] = useState(false);
  const [showBgGradViaPicker, setShowBgGradViaPicker] = useState(false);
  const [showBgGradToPicker, setShowBgGradToPicker] = useState(false);
  const [showButtonGradFromPicker, setShowButtonGradFromPicker] = useState(false);
  const [showButtonGradViaPicker, setShowButtonGradViaPicker] = useState(false);
  const [showButtonGradToPicker, setShowButtonGradToPicker] = useState(false);

  const closeAll = () => {
    setShowTitleColorPicker(false);
    setShowDescColorPicker(false);
    // ... close all
  };

  return {
    title: {
      color: [showTitleColorPicker, setShowTitleColorPicker],
      gradFrom: [showTitleGradFromPicker, setShowTitleGradFromPicker],
      gradVia: [showTitleGradViaPicker, setShowTitleGradViaPicker],
      gradTo: [showTitleGradToPicker, setShowTitleGradToPicker],
    },
    description: {
      color: [showDescColorPicker, setShowDescColorPicker],
    },
    background: {
      color: [showBgColorPicker, setShowBgColorPicker],
      gradFrom: [showBgGradFromPicker, setShowBgGradFromPicker],
      gradVia: [showBgGradViaPicker, setShowBgGradViaPicker],
      gradTo: [showBgGradToPicker, setShowBgGradToPicker],
    },
    button: {
      color: [showButtonColorPicker, setShowButtonColorPicker],
      gradFrom: [showButtonGradFromPicker, setShowButtonGradFromPicker],
      gradVia: [showButtonGradViaPicker, setShowButtonGradViaPicker],
      gradTo: [showButtonGradToPicker, setShowButtonGradToPicker],
    },
    closeAll,
  };
}
```

#### `sections/TitleStyleSection.tsx` (~150 lines)
```tsx
'use client';

import React from 'react';
import { FormInput, FormTextarea, FormCheckbox } from '@/components/modals/_shared';
import { ColorPaletteDropdown } from '@/components/Shared/ColorPaletteDropdown';
import { HeroFormData } from '../types';

interface TitleStyleSectionProps {
  formData: HeroFormData;
  onChange: (field: keyof HeroFormData, value: any) => void;
}

export function TitleStyleSection({ formData, onChange }: TitleStyleSectionProps) {
  const titleStyle = formData.title_style || {};

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Title Style
      </h3>

      <FormTextarea
        label="Title Text"
        value={formData.title}
        onChange={(e) => onChange('title', e.target.value)}
        rows={2}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          label="Desktop Size"
          type="text"
          value={titleStyle.size?.desktop || 'text-7xl'}
          onChange={(e) => onChange('title_style', {
            ...titleStyle,
            size: { ...titleStyle.size, desktop: e.target.value }
          })}
        />
        <FormInput
          label="Mobile Size"
          type="text"
          value={titleStyle.size?.mobile || 'text-5xl'}
          onChange={(e) => onChange('title_style', {
            ...titleStyle,
            size: { ...titleStyle.size, mobile: e.target.value }
          })}
        />
      </div>

      <FormCheckbox
        label="Use Gradient"
        checked={titleStyle.is_gradient || false}
        onChange={(checked) => onChange('title_style', {
          ...titleStyle,
          is_gradient: checked
        })}
      />

      {titleStyle.is_gradient ? (
        <div className="space-y-2">
          <ColorPaletteDropdown
            label="Gradient From"
            selectedColor={titleStyle.gradient?.from || 'gray-700'}
            onColorSelect={(color) => onChange('title_style', {
              ...titleStyle,
              gradient: { ...titleStyle.gradient, from: color }
            })}
          />
          {/* Gradient Via and To ... */}
        </div>
      ) : (
        <ColorPaletteDropdown
          label="Text Color"
          selectedColor={titleStyle.color || 'gray-800'}
          onColorSelect={(color) => onChange('title_style', {
            ...titleStyle,
            color
          })}
        />
      )}

      {/* Alignment, Block Width, Columns ... */}
    </div>
  );
}
```

#### `preview/HeroPreview.tsx` (~200 lines)
```tsx
'use client';

import React from 'react';
import { HeroFormData } from '../types';
import { HeroTitle } from './HeroTitle';
import { HeroDescription } from './HeroDescription';
import { HeroButton } from './HeroButton';
import { HeroImage } from './HeroImage';
import { HeroBackground } from './HeroBackground';
import { AnimationElements } from './AnimationElements';

interface HeroPreviewProps {
  formData: HeroFormData;
}

export function HeroPreview({ formData }: HeroPreviewProps) {
  const imagePosition = formData.image_style?.position || 'right';
  const isImageFullPage = formData.image_style?.fullPage || false;

  return (
    <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="absolute top-2 left-2 bg-gray-900/80 text-white px-3 py-1 rounded text-xs font-medium">
        Live Preview
      </div>

      <HeroBackground formData={formData}>
        <div className="container mx-auto px-4 py-16">
          {imagePosition === 'left' ? (
            <div className="flex gap-8 items-center">
              <HeroImage formData={formData} />
              <div className="flex-1">
                <HeroTitle formData={formData} />
                <HeroDescription formData={formData} />
                <HeroButton formData={formData} />
              </div>
            </div>
          ) : (
            <div className="flex gap-8 items-center">
              <div className="flex-1">
                <HeroTitle formData={formData} />
                <HeroDescription formData={formData} />
                <HeroButton formData={formData} />
              </div>
              <HeroImage formData={formData} />
            </div>
          )}
        </div>
        <AnimationElements type={formData.animation_element} />
      </HeroBackground>
    </div>
  );
}
```

---

## Summary

### Before Refactoring
- ❌ 2,626 lines in one file
- ❌ 30+ state variables
- ❌ Unmaintainable
- ❌ Hard to test
- ❌ Difficult to understand

### After Refactoring
- ✅ ~100 lines main modal
- ✅ 7 section components (~150 lines each)
- ✅ 7 preview components (~50-100 lines each)
- ✅ 6 custom hooks (~40-80 lines each)
- ✅ 4 shared components (~50-100 lines each)
- ✅ 1 types file (~50 lines)
- ✅ Maintainable, testable, understandable!

### Total Estimated Time
- **Setup & Types**: 1 hour
- **Extract Components**: 2 hours
- **Create Hooks**: 2 hours
- **Create Sections**: 4 hours
- **Create Preview**: 3 hours
- **Refactor Main**: 1 hour
- **Testing**: 2 hours
- **TOTAL**: 15 hours

---

## Next Steps

1. Review this plan
2. Approve the structure
3. Start with Phase 1: Extract types and shared components
4. Progress systematically through each phase
5. Test thoroughly at each step
6. Commit incrementally

**Ready to begin?**

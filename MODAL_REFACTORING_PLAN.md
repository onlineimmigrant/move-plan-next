# Modal System Refactoring Plan

## Overview
Unify and standardize all Level 1 modals (triggered by UniversalNewButton) to use consistent components, patterns, and styling.

---

## 📋 PHASE 1: Analysis & Organization

### Current Level 1 Components (Modal Parents)
1. **TemplateHeadingSectionEditModal** (`/components/TemplateHeadingSectionEdit/`)
   - Purpose: Edit heading sections with CTA
   - Features: Fullscreen, drag/resize (custom), color picker, style variants
   - Style: Custom implementation
   - Size: 744 lines

2. **PageCreationModal** (`/components/AdminQuickActions/`)
   - Purpose: Create new pages
   - Features: Basic form validation, slug auto-generation
   - Style: Simple modal
   - Size: 414 lines

3. **PostEditModal** (`/components/PostEditModal/`)
   - Purpose: Create/edit blog posts
   - Features: Fullscreen, drag/resize (custom), rich text editor, auto-save, draft management
   - Style: Most sophisticated, custom drag/resize
   - Size: 982 lines

4. **GlobalSettingsModal** (`/components/SiteManagement/`)
   - Purpose: Global site settings with sections
   - Features: Fullscreen, drag/resize (react-rnd), tabbed sections, form fields
   - Style: Modern with react-rnd
   - Size: 858 lines

5. **SiteMapModal** (`/components/SiteManagement/`)
   - Purpose: View/manage site structure
   - Features: Tree view, navigation
   - Style: Simple modal
   - Size: TBD

### Level 2 Components (Reusable within modals)
Currently identified:
- `SettingsFormFields` - Form rendering system
- `ColorPaletteDropdown` - Color selection
- `ImageGalleryModal` - Image selection
- `PostEditor` - Rich text editing
- Various Select components (BannerSelect, ProductSelect, etc.)

### Level 3 Components (Base UI elements)
Currently scattered:
- `Button` (`/ui/Button.tsx`) - Already exists
- Modal containers (inconsistent)
- Form inputs (inconsistent)
- Dropdowns (inconsistent)

---

## 🎯 PHASE 1 GOALS

### 1. Folder Reorganization
**Proposed Structure:**
```
src/
├── components/
│   ├── modals/                    # Level 1 - All primary modals
│   │   ├── GlobalSettingsModal/
│   │   │   ├── GlobalSettingsModal.tsx
│   │   │   ├── GlobalSettingsModalContext.tsx (moved from /context)
│   │   │   └── index.ts
│   │   ├── PostEditModal/
│   │   │   ├── PostEditModal.tsx
│   │   │   ├── PostEditModalContext.tsx
│   │   │   └── index.ts
│   │   ├── PageCreationModal/
│   │   │   ├── PageCreationModal.tsx
│   │   │   ├── PageCreationContext.tsx
│   │   │   └── index.ts
│   │   ├── TemplateHeadingSectionModal/
│   │   │   ├── TemplateHeadingSectionModal.tsx
│   │   │   ├── TemplateHeadingSectionContext.tsx
│   │   │   └── index.ts
│   │   ├── SiteMapModal/
│   │   │   ├── SiteMapModal.tsx
│   │   │   ├── SiteMapContext.tsx
│   │   │   └── index.ts
│   │   └── shared/                # Shared modal utilities
│   │       ├── BaseModal.tsx      # New: Base modal component
│   │       ├── ModalHeader.tsx    # New: Standardized header
│   │       ├── ModalFooter.tsx    # New: Standardized footer
│   │       └── useModalState.ts   # New: Common modal state hook
│   │
│   ├── forms/                     # Level 2 - Form components
│   │   ├── SettingsFormFields/
│   │   ├── ColorPaletteDropdown/
│   │   ├── ImageGalleryModal/
│   │   ├── PostEditor/
│   │   ├── EntitySelectors/       # ProductSelect, BannerSelect, etc.
│   │   └── FormFields/            # Standardized input components
│   │
│   └── ui/                        # Level 3 - Base design system
│       ├── Button.tsx             # Already exists
│       ├── Input.tsx              # New
│       ├── Select.tsx             # New
│       ├── TextArea.tsx           # New
│       ├── Checkbox.tsx           # New
│       ├── Panel.tsx              # New
│       ├── Badge.tsx              # New
│       └── Modal/                 # New: Base modal system
│           ├── Modal.tsx
│           ├── ModalContent.tsx
│           ├── ModalOverlay.tsx
│           └── index.ts
```

### 2. Feature Analysis & Standardization

#### Modal Features Comparison:

| Feature | Template | Page | Post | Settings | SiteMap |
|---------|----------|------|------|----------|---------|
| Fullscreen | ✅ Custom | ❌ | ✅ Custom | ✅ react-rnd | ❌ |
| Drag/Resize | ✅ Custom | ❌ | ✅ Custom | ✅ react-rnd | ❌ |
| Tabs/Sections | ❌ | ❌ | ❌ | ✅ | ❌ |
| Form Validation | Basic | ✅ | ✅ | ✅ | N/A |
| Auto-save | ❌ | ❌ | ✅ | ❌ | N/A |
| Draft Management | ❌ | ❌ | ✅ | ❌ | N/A |
| Image Picker | ✅ | ❌ | ✅ | ✅ | ❌ |
| Color Picker | ✅ | ❌ | ❌ | ✅ | ❌ |
| Delete Confirm | ✅ | ❌ | ✅ | ❌ | ❌ |
| Unsaved Warning | ❌ | ❌ | ✅ | ✅ | ❌ |

**Decision Points:**
- **Drag/Resize**: Use `react-rnd` everywhere (already working in GlobalSettings)
- **Fullscreen**: Standardize toggle button position and behavior
- **Auto-save**: Make optional feature, reusable hook
- **Validation**: Create unified validation system
- **Unsaved Changes**: Standard hook for all modals

### 3. Styling Standards

**Current Inconsistencies:**
- Template: Custom neomorphic style
- Page: Basic Tailwind
- Post: Custom drag implementation
- Settings: Modern with react-rnd
- SiteMap: Basic modal

**Proposed Standard (Neomorphic Design):**
```tsx
// From GlobalSettingsModal - most modern approach
- Background: `bg-gradient-to-br from-gray-50 via-white to-gray-50`
- Shadow: `shadow-[8px_8px_16px_rgba(163,177,198,0.4),-8px_-8px_16px_rgba(255,255,255,0.8)]`
- Border: `border border-gray-200/60`
- Buttons: Neomorphic with hover states
- Header: Sticky with gradient background
- Footer: Sticky with shadow
```

---

## 📝 PHASE 1 IMPLEMENTATION PLAN

### Step 1: Create Base UI Components (Level 3) ⏱️ 2-3 hours
**Priority: HIGH** - Foundation for everything else

**Tasks:**
1. Create `/components/ui/Modal/` directory
   - `Modal.tsx` - Base container with overlay
   - `ModalContent.tsx` - Draggable/resizable content using react-rnd
   - `ModalHeader.tsx` - Standardized header with title, fullscreen, close
   - `ModalFooter.tsx` - Standardized footer with actions
   - `ModalOverlay.tsx` - Backdrop with click-to-close

2. Create standardized form inputs:
   - `Input.tsx` - Text input with label, error, validation
   - `TextArea.tsx` - Multi-line with auto-resize
   - `Select.tsx` - Dropdown with search
   - `Checkbox.tsx` - Toggle with label
   - `Switch.tsx` - Modern toggle

3. Create utility components:
   - `Panel.tsx` - Section container
   - `Badge.tsx` - Status indicators
   - `Divider.tsx` - Section separators

**Deliverables:**
- 10-12 reusable base components
- Storybook documentation (optional)
- TypeScript interfaces for all props

### Step 2: Create Shared Modal Utilities ⏱️ 1-2 hours
**Priority: HIGH** - Common functionality

**Tasks:**
1. Create `useModalState` hook:
   ```tsx
   - isOpen, open, close
   - isFullscreen, toggleFullscreen
   - isDragging, position, size
   - hasChanges, setHasChanges
   ```

2. Create `useAutoSave` hook (from PostEditModal):
   ```tsx
   - Auto-save timer
   - Draft management
   - Last save timestamp
   ```

3. Create `useUnsavedChanges` hook:
   ```tsx
   - Detect changes
   - Confirm on close
   - Browser unload warning
   ```

4. Create `useModalValidation` hook:
   ```tsx
   - Field validation
   - Error messages
   - Submit handling
   ```

**Deliverables:**
- 4 reusable hooks
- Type-safe interfaces
- Unit tests

### Step 3: Move & Reorganize Files ⏱️ 1 hour
**Priority: MEDIUM** - Organization

**Tasks:**
1. Create new folder structure
2. Move existing modals to `/components/modals/`
3. Move contexts into respective modal folders
4. Update all imports (use find/replace)
5. Verify no broken imports

**Deliverables:**
- Clean folder structure
- All imports working
- No functionality broken

### Step 4: Create BaseModal Component ⏱️ 2-3 hours
**Priority: HIGH** - Template for all modals

**Tasks:**
1. Combine best features from all modals:
   - react-rnd for drag/resize
   - Fullscreen toggle
   - Sticky header/footer
   - Neomorphic styling
   - Loading states
   - Error handling

2. Support configuration:
   ```tsx
   interface BaseModalProps {
     isOpen: boolean;
     onClose: () => void;
     title: string;
     subtitle?: string;
     size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
     allowDrag?: boolean;
     allowResize?: boolean;
     allowFullscreen?: boolean;
     showFooter?: boolean;
     hasChanges?: boolean;
     isLoading?: boolean;
     children: React.ReactNode;
     footer?: React.ReactNode;
   }
   ```

**Deliverables:**
- Flexible BaseModal component
- Works for all use cases
- Proper TypeScript types

### Step 5: Refactor One Modal (Proof of Concept) ⏱️ 3-4 hours
**Priority: HIGH** - Validate approach

**Recommended: Start with PageCreationModal** (simplest, 414 lines)

**Tasks:**
1. Refactor using new base components
2. Implement using BaseModal
3. Apply standard styling
4. Test all functionality
5. Measure improvements:
   - Line count reduction
   - Code reusability
   - Maintainability

**Success Criteria:**
- ✅ Functionality identical
- ✅ Code reduced by 30-50%
- ✅ Consistent styling
- ✅ Type-safe
- ✅ No regressions

**Deliverables:**
- Refactored PageCreationModal
- Before/after comparison
- Validation that approach works

### Step 6: Refactor Remaining Modals ⏱️ 6-8 hours
**Priority: MEDIUM** - Apply pattern

**Order:**
1. SiteMapModal (simple)
2. TemplateHeadingSectionModal (medium)
3. PostEditModal (complex - has editor)
4. GlobalSettingsModal (most complex - has sections)

**Tasks per modal:**
1. Replace custom modal with BaseModal
2. Use shared hooks (useModalState, etc.)
3. Replace custom inputs with ui components
4. Apply standard styling
5. Test thoroughly
6. Update documentation

**Deliverables:**
- All 5 modals refactored
- Consistent UX
- Reduced code duplication
- Better maintainability

---

## 📊 PHASE 1 SUMMARY

### Time Estimate
- **Level 3 (Base UI)**: 2-3 hours
- **Shared Utilities**: 1-2 hours
- **Reorganization**: 1 hour
- **BaseModal**: 2-3 hours
- **Proof of Concept**: 3-4 hours
- **Remaining Modals**: 6-8 hours
- **Total**: **15-21 hours**

### Benefits
✅ **Code Reduction**: Estimated 40-50% reduction in modal code  
✅ **Consistency**: Uniform UX across all modals  
✅ **Maintainability**: Changes in one place affect all modals  
✅ **Type Safety**: Proper TypeScript throughout  
✅ **Reusability**: Components usable in future modals  
✅ **Performance**: Optimized with react-rnd and proper memoization  

### Risks
⚠️ **Import Updates**: Many imports need to be updated  
⚠️ **Regression Testing**: Need to test all modals thoroughly  
⚠️ **Learning Curve**: Team needs to understand new patterns  

---

## 🚀 RECOMMENDATION: What to Do First

### Option A: Full Sequential Approach (Recommended)
**Best for: Long-term quality, team learning**

1. Create Level 3 UI components (2-3 hours)
2. Create shared hooks (1-2 hours)
3. Create BaseModal (2-3 hours)
4. Refactor PageCreationModal as POC (3-4 hours)
5. **STOP & REVIEW** - Validate approach
6. Continue with remaining modals

**Pros**: Solid foundation, predictable results  
**Cons**: Longer initial investment

### Option B: Incremental Approach
**Best for: Quick wins, lower risk**

1. Create only essential ui components (Button, Input, Modal basics) - 1 hour
2. Create BaseModal with minimal features - 1 hour
3. Refactor PageCreationModal - 2 hours
4. **STOP & REVIEW** - Validate approach
5. Expand base components as needed
6. Continue modal by modal

**Pros**: Faster initial results, lower risk  
**Cons**: May need refactoring of base components later

### Option C: Hybrid Approach (RECOMMENDED) ⭐
**Best for: Balance of speed and quality**

**Phase 1A: Foundation** (4-5 hours)
1. Create core UI components only:
   - Modal system (Modal, ModalContent, ModalHeader, ModalFooter)
   - Input, TextArea, Select
   - Button (enhance existing)
2. Create BaseModal component
3. Create useModalState hook

**Phase 1B: Proof of Concept** (3-4 hours)
4. Refactor PageCreationModal completely
5. Test thoroughly
6. Document patterns

**Phase 1C: Review & Decision** (1 hour)
7. Team review of refactored modal
8. Measure improvements
9. Decide: Continue or adjust approach

**Phase 1D: Scale** (6-8 hours if approved)
10. Refactor remaining modals
11. Create additional components as needed
12. Final testing and documentation

**Total Time: 14-18 hours over 2-3 weeks**

**Pros**: ✅ Quick validation, ✅ Manageable chunks, ✅ Flexible  
**Cons**: None significant

---

## ✅ APPROVAL NEEDED

Before proceeding with implementation, please confirm:

1. **Approach**: Option A, B, or C (Hybrid)?
2. **Folder Structure**: Approved as proposed?
3. **Starting Modal**: PageCreationModal for POC?
4. **Timeline**: Can allocate 14-18 hours over 2-3 weeks?
5. **Scope**: Phase 1 only, or plan Phase 2 & 3 simultaneously?

**Next Steps After Approval:**
1. I'll create the base UI components
2. Build the BaseModal component
3. Refactor PageCreationModal as proof of concept
4. Present results for review
5. Continue with remaining modals if approved

---

## 📅 PHASES 2 & 3 Preview

**Phase 2: Level 2 Components** (6-8 hours)
- Refactor SettingsFormFields
- Unify entity selectors (BannerSelect, ProductSelect, etc.)
- Create reusable form patterns
- Standardize color/image pickers

**Phase 3: Documentation & Polish** (4-6 hours)
- Component documentation
- Usage examples
- Migration guide
- Performance optimization

**Total Project Time: 24-32 hours**

---

**Ready to proceed? Please approve the approach and I'll start implementation!** 🚀

# Phase 4: Remaining Modal Migrations - Detailed Plan

## Current Status

### ✅ Completed Migrations (2/7)
1. **SiteMapModal** - Simple read-only modal
2. **LayoutManagerModal** - Drag-and-drop modal with badges

### 🔄 Remaining Migrations (5/7)

## Migration Priority Order (Simple → Complex)

### Priority 1: HeroSectionModal (Medium Complexity)
**Estimated Effort**: 2-3 hours  
**Complexity**: Medium  
**File**: `src/components/modals/HeroSectionModal/HeroSectionModal.tsx`

**Current Features**:
- Form-based editing
- Image upload/gallery integration
- Style settings panel
- Single panel (no tabs)

**Migration Strategy**:
1. Replace `BaseModal` with `StandardModalContainer`
2. Add `StandardModalHeader` with icon (SparklesIcon or similar)
3. Use `StandardModalBody` for form content
4. Integrate `FormInput`, `FormTextarea` components
5. Add `StandardModalFooter` with Save/Cancel actions
6. Preserve ImageGalleryModal integration
7. Preserve StyleSettingsPanel functionality

**Key Components Needed**:
- FormInput (text inputs)
- FormTextarea (descriptions)
- ModalButton (for image selection)
- LoadingState (while saving)
- ErrorState (on save failure)

---

### Priority 2: FooterEditModal (High Complexity)
**Estimated Effort**: 4-5 hours  
**Complexity**: High (similar to HeaderEditModal)  
**File**: `src/components/modals/FooterEditModal/FooterEditModal.tsx`

**Current Features**:
- Menu item management
- Drag-and-drop reordering
- Submenu items support
- Inline editing
- Toggle visibility
- Style settings

**Migration Strategy**:
1. Replace `BaseModal` with `StandardModalContainer`
2. Add `StandardModalHeader` with badge ("Edit")
3. Use `StandardModalBody` with proper background layer
4. Preserve dnd-kit drag-and-drop functionality
5. Integrate `StatusBadge` for item states
6. Use `IconButton` for action buttons
7. Keep `StyleSettingsPanel` integration
8. Add `StandardModalFooter` with Save/Cancel

**Key Components Needed**:
- StatusBadge (for visibility states)
- IconButton (edit, delete, toggle)
- FormInput (inline editing)
- LoadingState
- ErrorState

**Similar to**: LayoutManagerModal (already migrated - use as reference)

---

### Priority 3: HeaderEditModal (Very High Complexity)
**Estimated Effort**: 5-6 hours  
**Complexity**: Very High (1,296 lines)  
**File**: `src/components/modals/HeaderEditModal/HeaderEditModal.tsx`

**Current Features**:
- Menu item management with submenu support
- Drag-and-drop reordering (main items + submenu items)
- Inline editing (display name, description, slug)
- Submenu image management
- Toggle visibility (header/footer)
- Icon selection (react_icon_id)
- Style settings panel
- Multiple style presets

**Migration Strategy**:
1. Break down into smaller components:
   - `HeaderMenuList` - Main menu items list
   - `HeaderSubmenuList` - Submenu items (nested)
   - `HeaderStyleSelector` - Style preset buttons
   - `HeaderMenuItem` - Individual menu item card
2. Replace `BaseModal` with `StandardModalContainer`
3. Add `StandardModalHeader` with badge
4. Use `StandardModalBody` with sections
5. Preserve all dnd-kit functionality
6. Integrate standardized components
7. Add `StandardModalFooter`

**Key Components Needed**:
- StatusBadge (visibility states)
- IconButton (all actions)
- FormInput (inline editing)
- FormTextarea (descriptions)
- CountBadge (submenu counts)
- LoadingState
- ErrorState
- EmptyState (no menu items)

**Refactoring Approach**:
- Extract `SortableMenuItem` component
- Extract `SortableSubmenuItem` component
- Use composition for better maintainability

---

### Priority 4: PageCreationModal (Very High Complexity)
**Estimated Effort**: 6-7 hours  
**Complexity**: Very High (multi-step wizard)  
**File**: `src/components/modals/PageCreationModal/PageCreationModal.tsx`

**Current Features**:
- Multi-step wizard
- Step 1: Page type selection
- Step 2: Template selection
- Step 3: Page details (name, slug, etc.)
- Step 4: SEO settings
- Progress indicator
- Navigation (back/next/finish)
- Form validation

**Migration Strategy**:
1. Replace `BaseModal` with `StandardModalContainer`
2. Add `StandardModalHeader` with tabs for steps
3. Use tab badges to show completion status
4. Use `StandardModalBody` for step content
5. Integrate `FormInput`, `FormTextarea` for all forms
6. Add `FilterSelect` for dropdowns
7. Create step-specific components
8. Add `StandardModalFooter` with dynamic actions (Back/Next/Finish)

**Key Components Needed**:
- Tabs (in StandardModalHeader)
- Tab badges (completion indicators)
- FormInput (all text fields)
- FormTextarea (descriptions)
- FormCheckbox (options)
- FilterSelect (dropdowns)
- StatusBadge (step status)
- LoadingState
- ErrorState

**Special Considerations**:
- Maintain step state
- Validate each step before proceeding
- Show progress in header tabs
- Dynamic footer buttons based on current step

---

### Priority 5: PostEditModal (Extreme Complexity)
**Estimated Effort**: 8-10 hours  
**Complexity**: Extreme (rich text editor integration)  
**File**: `src/components/modals/PostEditModal/PostEditModal.tsx`

**Current Features**:
- Rich text editor (TipTap or similar)
- Image upload/management
- Category/tag management
- SEO settings
- Publish/draft states
- Preview mode
- Auto-save
- Possibly tabbed interface

**Migration Strategy**:
1. Analyze current implementation first
2. Replace `BaseModal` with `StandardModalContainer`
3. Add `StandardModalHeader` with tabs:
   - Content tab
   - Settings tab
   - SEO tab
4. Use `StandardModalBody` for editor area
5. Preserve rich text editor completely
6. Integrate `FilterSelect` for categories/tags
7. Add `FilterTags` for active tags
8. Add `FormInput`, `FormTextarea` for metadata
9. Add `StandardModalFooter` with Save Draft/Publish actions

**Key Components Needed**:
- ALL form components
- FilterSelect (categories, tags)
- FilterTags (active selections)
- StatusBadge (publish status)
- LoadingState (auto-save indicator)
- ErrorState
- IconButton (toolbar actions)

**Special Considerations**:
- Don't break rich text editor
- Preserve auto-save functionality
- Handle large content gracefully
- Test extensively before deploying

---

## Migration Workflow (For Each Modal)

### 1. Preparation Phase
- [ ] Read entire modal file
- [ ] Document current features
- [ ] Identify all state management
- [ ] List all UI components used
- [ ] Note any complex interactions
- [ ] Check for child modals/dialogs

### 2. Migration Phase
- [ ] Create backup branch
- [ ] Replace BaseModal with StandardModalContainer
- [ ] Add StandardModalHeader (with icon, subtitle, optional badge)
- [ ] Wrap content in StandardModalBody
- [ ] Replace custom UI with standardized components
- [ ] Add StandardModalFooter with actions
- [ ] Preserve all business logic
- [ ] Maintain all context/state management

### 3. Testing Phase
- [ ] Check TypeScript errors
- [ ] Test on desktop (1920x1080, 1366x768)
- [ ] Test on tablet (iPad, 1024x768)
- [ ] Test on mobile (iPhone, Android)
- [ ] Test drag functionality (if applicable)
- [ ] Test resize functionality
- [ ] Test all form submissions
- [ ] Test error states
- [ ] Test loading states
- [ ] Test dark mode

### 4. Cleanup Phase
- [ ] Remove unused imports
- [ ] Remove commented code
- [ ] Update any inline styles to use standardized classes
- [ ] Ensure consistent spacing/padding
- [ ] Verify accessibility (ARIA labels)

### 5. Documentation Phase
- [ ] Document what changed
- [ ] Note any breaking changes
- [ ] Update component usage examples
- [ ] Add migration notes

---

## Component Mapping Reference

### Old Pattern → New Pattern

```tsx
// OLD
<BaseModal isOpen={isOpen} onClose={onClose} title="Title">
  <div className="p-6">Content</div>
</BaseModal>

// NEW
<StandardModalContainer 
  isOpen={isOpen} 
  onClose={onClose}
  size="large"
  enableDrag={true}
  enableResize={true}
  ariaLabel="Modal Name"
>
  <StandardModalHeader
    title="Title"
    subtitle="Description"
    icon={IconComponent}
    iconColor="text-blue-500"
    onClose={onClose}
  />
  <StandardModalBody>
    Content
  </StandardModalBody>
  <StandardModalFooter
    primaryAction={{
      label: 'Save',
      onClick: handleSave,
      variant: 'primary',
      loading: isSaving,
    }}
    secondaryAction={{
      label: 'Cancel',
      onClick: onClose,
      variant: 'secondary',
    }}
  />
</StandardModalContainer>
```

### Form Components

```tsx
// OLD
<input type="text" className="..." />

// NEW
<FormInput
  label="Label"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  required={true}
  error={error}
  helperText="Helper text"
/>
```

### Buttons

```tsx
// OLD
<button className="bg-blue-600 ...">Action</button>

// NEW
<ModalButton
  label="Action"
  onClick={handleAction}
  variant="primary"
  icon={IconComponent}
  loading={isLoading}
/>
```

### Loading States

```tsx
// OLD
<div className="flex items-center justify-center">
  <div className="spinner"></div>
</div>

// NEW
<LoadingState message="Loading..." size="lg" />
```

### Error States

```tsx
// OLD
<div className="text-red-600">{error}</div>

// NEW
<ErrorState
  title="Error"
  message={error}
  onRetry={handleRetry}
/>
```

---

## Success Criteria

Each migration must meet these criteria:

### Functionality
- ✅ All features work exactly as before
- ✅ No regressions in behavior
- ✅ All validations still work
- ✅ All API calls still work
- ✅ Context/state management preserved

### Design
- ✅ Matches MeetingsAdminModal visual style
- ✅ Glass morphism design
- ✅ System fonts throughout
- ✅ Consistent spacing/padding
- ✅ Smooth animations

### Responsive
- ✅ Desktop: 1120x900 default, draggable, resizable
- ✅ Mobile: Full width, 90vh height, centered with padding
- ✅ Proper touch interactions
- ✅ No horizontal scroll

### Accessibility
- ✅ Proper ARIA labels
- ✅ Keyboard navigation works
- ✅ Focus trap active
- ✅ Escape key closes modal
- ✅ Screen reader friendly

### Code Quality
- ✅ Zero TypeScript errors
- ✅ No console errors/warnings
- ✅ Clean imports
- ✅ Consistent naming
- ✅ No commented-out code

---

## Timeline Estimate

- **HeroSectionModal**: 2-3 hours
- **FooterEditModal**: 4-5 hours  
- **HeaderEditModal**: 5-6 hours
- **PageCreationModal**: 6-7 hours
- **PostEditModal**: 8-10 hours

**Total**: 25-31 hours of focused development

---

## Risk Assessment

### Low Risk
- HeroSectionModal (straightforward form migration)

### Medium Risk
- FooterEditModal (complex but similar to completed LayoutManagerModal)

### High Risk
- HeaderEditModal (1,296 lines, many nested components)
- PageCreationModal (multi-step state management)

### Very High Risk
- PostEditModal (rich text editor - DO NOT BREAK!)

---

## Recommended Approach

1. **Start with HeroSectionModal** (build confidence, establish patterns)
2. **Then FooterEditModal** (leverage LayoutManagerModal patterns)
3. **Then HeaderEditModal** (most complex menu management)
4. **Then PageCreationModal** (multi-step wizard complexity)
5. **Finally PostEditModal** (highest risk - rich editor)

Each migration should be:
- ✅ Committed separately
- ✅ Tested thoroughly
- ✅ Documented
- ✅ Pushed to remote

---

## Next Steps

1. Read this plan thoroughly
2. Choose starting modal (recommend: HeroSectionModal)
3. Create feature branch: `feat/migrate-hero-section-modal`
4. Follow migration workflow
5. Test extensively
6. Commit and push
7. Move to next modal

---

## Notes

- Take breaks between migrations to maintain code quality
- Don't rush - accuracy > speed
- Test dark mode for each migration
- Keep commits atomic and well-documented
- If stuck, refer to completed migrations (SiteMapModal, LayoutManagerModal)
- Use MeetingsAdminModal as the gold standard for comparison

---

**Last Updated**: 2025-11-12  
**Status**: Ready to begin Priority 1 (HeroSectionModal)

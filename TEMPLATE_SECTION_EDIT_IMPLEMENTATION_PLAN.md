# Template Section Edit Implementation Plan

## Overview
Add PostEditModal and ImageGalleryModal functionality to TemplateSection and TemplateHeadingSection components, enabling inline editing with shared components and reusable architecture.

**Date:** 7 October 2025  
**Status:** Planning Phase  
**Priority:** High

---

## 1. Current State Analysis

### 1.1 Existing Components

#### PostEditModal (Reference Implementation)
- **Location:** `src/components/PostEditModal/PostEditModal.tsx`
- **Features:**
  - Full-screen toggle
  - Rich text editor (TipTap)
  - Auto-save drafts
  - Image gallery integration
  - Advanced fields (SEO, metadata)
  - Multi-language support ready
- **Key Elements:**
  - Title, description, content editor
  - Image fields (main_photo, secondary_photo)
  - Section/subsection organization
  - Order management
  - Display toggles

#### ImageGalleryModal (Reference Implementation)
- **Location:** `src/components/ImageGalleryModal/ImageGalleryModal.tsx`
- **Features:**
  - Supabase storage browser
  - Folder navigation
  - Global search across all folders
  - Image upload
  - Image preview
  - Breadcrumb navigation
- **Integration:** Already proven in PostEditModal

#### TemplateSection (Target Component)
- **Location:** `src/components/TemplateSection.tsx`
- **Data Structure:**
  ```typescript
  interface TemplateSectionData {
    id: number;
    background_color?: string;
    is_full_width: boolean;
    is_section_title_aligned_center: boolean;
    is_section_title_aligned_right: boolean;
    section_title: string;
    section_title_translation?: Record<string, string>;
    section_description?: string;
    section_description_translation?: Record<string, string>;
    text_style_variant?: 'default' | 'apple' | 'codedharmony';
    grid_columns: number;
    image_metrics_height?: string;
    is_image_bottom: boolean;
    is_slider?: boolean;
    website_metric: Metric[];
    organization_id: string | null;
    is_reviews_section: boolean;
    is_help_center_section?: boolean;
    is_real_estate_modal?: boolean;
    max_faqs_display?: number;
  }
  
  interface Metric {
    id: number;
    title: string;
    title_translation?: Record<string, string>;
    is_title_displayed: boolean;
    description: string;
    description_translation?: Record<string, string>;
    image?: string;
    is_image_rounded_full: boolean;
    is_card_type: boolean;
    background_color?: string;
    organization_id: string | null;
  }
  ```

#### TemplateHeadingSection (Target Component)
- **Location:** `src/components/TemplateHeadingSection.tsx`
- **Data Structure:**
  ```typescript
  interface TemplateHeadingSectionData {
    id: number;
    name: string;
    name_translation?: Record<string, string>;
    name_part_2?: string;
    name_part_3?: string;
    description_text?: string;
    description_text_translation?: Record<string, string>;
    button_text?: string;
    button_text_translation?: Record<string, string>;
    url_page?: string;
    url?: string;
    image?: string;
    image_first?: boolean;
    is_included_templatesection?: boolean;
    style_variant?: 'default' | 'clean';
    text_style_variant?: 'default' | 'apple';
    is_text_link?: boolean;
  }
  ```

---

## 2. Architecture Design

### 2.1 Shared Components Strategy

To avoid code duplication and ensure maintainability, we'll create reusable sub-components:

```
src/components/
├── Shared/
│   ├── EditableText/
│   │   ├── EditableTextField.tsx       # Reusable text input
│   │   ├── EditableTextArea.tsx        # Reusable textarea
│   │   └── EditableRichText.tsx        # Reusable TipTap editor
│   ├── EditableImage/
│   │   ├── EditableImageField.tsx      # Image field with gallery button
│   │   └── ImagePreview.tsx            # Image preview component
│   ├── EditControls/
│   │   ├── EditButton.tsx              # Floating edit button
│   │   ├── SaveCancelButtons.tsx       # Save/Cancel actions
│   │   └── DeleteButton.tsx            # Delete with confirmation
│   └── ModalBase/
│       └── BaseEditModal.tsx           # Shared modal wrapper
├── TemplateSectionEdit/
│   ├── TemplateSectionEditModal.tsx    # Main edit modal for sections
│   ├── MetricEditCard.tsx              # Edit individual metrics
│   └── SectionStyleControls.tsx        # Style/layout controls
├── TemplateHeadingSectionEdit/
│   ├── TemplateHeadingSectionEditModal.tsx  # Main edit modal
│   └── HeadingStyleControls.tsx        # Style variant controls
└── ImageGalleryModal/
    └── ImageGalleryModal.tsx           # Already exists, reuse as-is
```

### 2.2 Context Management

Create dedicated contexts for each edit type:

```
src/context/
├── TemplateSectionEditContext.tsx
└── TemplateHeadingSectionEditContext.tsx
```

### 2.3 API Endpoints

New API routes needed:

```
src/app/api/
├── template-sections/
│   ├── route.ts              # GET (exists), POST, PUT, DELETE
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE by ID
├── template-heading-sections/
│   ├── route.ts              # GET, POST, PUT, DELETE
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE by ID
└── website-metrics/
    ├── route.ts              # POST, PUT, DELETE
    └── [id]/
        └── route.ts          # GET, PUT, DELETE by ID
```

---

## 3. Implementation Phases

### Phase 1: Shared Components (Foundation)
**Goal:** Create reusable building blocks for all edit modals

#### 3.1.1 EditableText Components
- **Files to Create:**
  - `src/components/Shared/EditableText/EditableTextField.tsx`
  - `src/components/Shared/EditableText/EditableTextArea.tsx`
  - `src/components/Shared/EditableText/EditableRichText.tsx`

- **Features:**
  - Props: `value`, `onChange`, `label`, `placeholder`, `error`, `disabled`
  - Multi-language support (translation fields)
  - Validation
  - Character count
  - Auto-resize for textarea

#### 3.1.2 EditableImage Components
- **Files to Create:**
  - `src/components/Shared/EditableImage/EditableImageField.tsx`
  - `src/components/Shared/EditableImage/ImagePreview.tsx`

- **Features:**
  - Image URL input
  - "Browse Gallery" button (opens ImageGalleryModal)
  - Image preview with lazy loading
  - Remove image button
  - Drag & drop upload (future enhancement)

#### 3.1.3 EditControls Components
- **Files to Create:**
  - `src/components/Shared/EditControls/EditButton.tsx`
  - `src/components/Shared/EditControls/SaveCancelButtons.tsx`
  - `src/components/Shared/EditControls/DeleteButton.tsx`

- **Features:**
  - Consistent styling across all edit modals
  - Loading states
  - Confirmation dialogs
  - Keyboard shortcuts (Ctrl+S for save, Esc for cancel)

#### 3.1.4 BaseEditModal Component
- **File to Create:**
  - `src/components/Shared/ModalBase/BaseEditModal.tsx`

- **Features:**
  - Full-screen toggle
  - Modal backdrop with blur
  - Close on Escape
  - Prevent close on unsaved changes
  - Responsive sizing
  - Common header with title and controls

**Deliverables:**
- 8 new shared component files
- Storybook stories for each (optional)
- Unit tests for validation logic

---

### Phase 2: TemplateSection Edit Implementation
**Goal:** Add full editing capability to TemplateSection

#### 3.2.1 Context Setup
- **File to Create:** `src/context/TemplateSectionEditContext.tsx`

- **Context State:**
  ```typescript
  {
    isOpen: boolean;
    editingSection: TemplateSectionData | null;
    editingMetric: Metric | null;
    mode: 'create' | 'edit';
    openSectionModal: (section?: TemplateSectionData) => void;
    openMetricModal: (metric?: Metric, sectionId: number) => void;
    closeModal: () => void;
    updateSection: (data: Partial<TemplateSectionData>) => Promise<void>;
    deleteSection: (id: number) => Promise<void>;
    updateMetric: (data: Partial<Metric>) => Promise<void>;
    deleteMetric: (id: number) => Promise<void>;
  }
  ```

#### 3.2.2 Edit Modal Component
- **File to Create:** `src/components/TemplateSectionEdit/TemplateSectionEditModal.tsx`

- **Structure:**
  ```tsx
  <BaseEditModal>
    <Header>
      <Title />
      <FullScreenToggle />
      <CloseButton />
    </Header>
    
    <Body>
      <TabGroup>
        <Tab name="Content">
          <EditableTextField name="section_title" />
          <EditableTextArea name="section_description" />
          <MetricList>
            {metrics.map(metric => (
              <MetricEditCard key={metric.id} metric={metric} />
            ))}
          </MetricList>
          <AddMetricButton />
        </Tab>
        
        <Tab name="Style">
          <SectionStyleControls
            backgroundColor={...}
            textStyleVariant={...}
            gridColumns={...}
            isFullWidth={...}
            alignments={...}
          />
        </Tab>
        
        <Tab name="Layout">
          <GridColumnsControl />
          <ImageHeightControl />
          <IsImageBottomToggle />
          <IsSliderToggle />
        </Tab>
        
        <Tab name="Advanced">
          <IsReviewsSectionToggle />
          <IsHelpCenterToggle />
          <IsRealEstateModalToggle />
          <MaxFaqsDisplayInput />
          <OrganizationIdInput />
        </Tab>
        
        <Tab name="Translations">
          <TranslationEditor
            fields={['section_title', 'section_description']}
            supportedLocales={['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh']}
          />
        </Tab>
      </TabGroup>
    </Body>
    
    <Footer>
      <DeleteButton />
      <SaveCancelButtons />
    </Footer>
  </BaseEditModal>
  ```

#### 3.2.3 Metric Edit Card
- **File to Create:** `src/components/TemplateSectionEdit/MetricEditCard.tsx`

- **Features:**
  - Collapsible card for each metric
  - Edit title, description, image
  - Style controls (rounded, card type, background)
  - Reorder metrics (drag handles)
  - Delete metric button
  - Translation fields

#### 3.2.4 Section Style Controls
- **File to Create:** `src/components/TemplateSectionEdit/SectionStyleControls.tsx`

- **Controls:**
  - Background color picker
  - Text style variant dropdown
  - Grid columns (1-5)
  - Full width toggle
  - Title alignment (left, center, right)

#### 3.2.5 Update TemplateSection Component
- **File to Modify:** `src/components/TemplateSection.tsx`

- **Changes:**
  - Add floating "Edit" button (visible only to authenticated users)
  - Wrap with TemplateSectionEditContext.Provider
  - Add onClick handlers to open edit modal
  - Show "Add Section" button between sections

#### 3.2.6 API Routes
- **Files to Create/Modify:**
  - `src/app/api/template-sections/route.ts` (add POST, PUT, DELETE)
  - `src/app/api/template-sections/[id]/route.ts` (create)
  - `src/app/api/website-metrics/route.ts` (create)
  - `src/app/api/website-metrics/[id]/route.ts` (create)

- **Endpoints:**
  ```
  POST   /api/template-sections          - Create new section
  PUT    /api/template-sections/[id]     - Update section
  DELETE /api/template-sections/[id]     - Delete section
  
  POST   /api/website-metrics            - Create new metric
  PUT    /api/website-metrics/[id]       - Update metric
  DELETE /api/website-metrics/[id]       - Delete metric
  ```

**Deliverables:**
- Context provider with full CRUD operations
- Main edit modal with tabs
- Metric edit card component
- Style controls component
- Updated TemplateSection with edit buttons
- 6 new API endpoints
- TypeScript types for all API requests/responses

---

### Phase 3: TemplateHeadingSection Edit Implementation
**Goal:** Add editing capability to TemplateHeadingSection (simpler than TemplateSection)

#### 3.3.1 Context Setup
- **File to Create:** `src/context/TemplateHeadingSectionEditContext.tsx`

- **Context State:**
  ```typescript
  {
    isOpen: boolean;
    editingSection: TemplateHeadingSectionData | null;
    mode: 'create' | 'edit';
    openModal: (section?: TemplateHeadingSectionData) => void;
    closeModal: () => void;
    updateSection: (data: Partial<TemplateHeadingSectionData>) => Promise<void>;
    deleteSection: (id: number) => Promise<void>;
  }
  ```

#### 3.3.2 Edit Modal Component
- **File to Create:** `src/components/TemplateHeadingSectionEdit/TemplateHeadingSectionEditModal.tsx`

- **Structure:**
  ```tsx
  <BaseEditModal>
    <Header>
      <Title />
      <FullScreenToggle />
      <CloseButton />
    </Header>
    
    <Body>
      <TabGroup>
        <Tab name="Content">
          <EditableTextField name="name" label="Heading Part 1" />
          <EditableTextField name="name_part_2" label="Heading Part 2 (highlighted)" />
          <EditableTextField name="name_part_3" label="Heading Part 3" />
          <EditableRichText name="description_text" />
          <EditableTextField name="button_text" />
          <EditableTextField name="url" />
          <EditableImageField name="image" />
        </Tab>
        
        <Tab name="Style">
          <HeadingStyleControls
            styleVariant={...}
            textStyleVariant={...}
            imageFirst={...}
            isTextLink={...}
          />
        </Tab>
        
        <Tab name="Advanced">
          <EditableTextField name="url_page" />
          <IsIncludedTemplateSectionToggle />
        </Tab>
        
        <Tab name="Translations">
          <TranslationEditor
            fields={['name', 'description_text', 'button_text']}
            supportedLocales={['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh']}
          />
        </Tab>
      </TabGroup>
    </Body>
    
    <Footer>
      <DeleteButton />
      <SaveCancelButtons />
    </Footer>
  </BaseEditModal>
  ```

#### 3.3.3 Heading Style Controls
- **File to Create:** `src/components/TemplateHeadingSectionEdit/HeadingStyleControls.tsx`

- **Controls:**
  - Style variant (default, clean)
  - Text style variant (default, apple)
  - Image first toggle
  - Is text link toggle

#### 3.3.4 Update TemplateHeadingSection Component
- **File to Modify:** `src/components/TemplateHeadingSection.tsx`

- **Changes:**
  - Add floating "Edit" button (visible only to authenticated users)
  - Wrap with TemplateHeadingSectionEditContext.Provider
  - Add onClick handlers to open edit modal
  - Show "Add Heading Section" button

#### 3.3.5 API Routes
- **Files to Create:**
  - `src/app/api/template-heading-sections/route.ts`
  - `src/app/api/template-heading-sections/[id]/route.ts`

- **Endpoints:**
  ```
  GET    /api/template-heading-sections       - List sections
  POST   /api/template-heading-sections       - Create section
  PUT    /api/template-heading-sections/[id]  - Update section
  DELETE /api/template-heading-sections/[id]  - Delete section
  ```

**Deliverables:**
- Context provider with full CRUD operations
- Main edit modal with tabs
- Style controls component
- Updated TemplateHeadingSection with edit buttons
- 4 new API endpoints

---

### Phase 4: Integration & Polish

#### 3.4.1 Authentication & Permissions
- Add auth checks to edit buttons (only show to admin users)
- Add RLS policies in Supabase for template tables
- Add organization_id filtering

#### 3.4.2 Real-time Updates
- Use Supabase real-time subscriptions
- Auto-refresh sections when changes occur
- Show "Edited by X" indicator for collaborative editing

#### 3.4.3 Validation & Error Handling
- Add Zod schemas for all data structures
- Client-side validation before API calls
- Server-side validation in API routes
- User-friendly error messages

#### 3.4.4 Performance Optimization
- Debounce auto-save
- Lazy load ImageGalleryModal
- Optimize re-renders with React.memo
- Add loading skeletons

#### 3.4.5 Testing
- Unit tests for shared components
- Integration tests for edit flows
- E2E tests for full edit cycle
- Accessibility testing (keyboard navigation, screen readers)

**Deliverables:**
- Complete auth implementation
- Real-time subscriptions
- Full validation suite
- Performance optimizations
- Test coverage >80%

---

## 4. Data Flow Diagrams

### 4.1 TemplateSection Edit Flow
```
User clicks "Edit" button
  ↓
TemplateSectionEditContext.openSectionModal(section)
  ↓
TemplateSectionEditModal opens with section data
  ↓
User edits fields (title, description, metrics, styles)
  ↓
Auto-save draft to localStorage every 2 minutes
  ↓
User clicks "Save"
  ↓
Validate data with Zod schema
  ↓
PUT /api/template-sections/[id] with updated data
  ↓
Supabase updates template_sections table
  ↓
Real-time subscription triggers re-fetch
  ↓
TemplateSection component re-renders with new data
  ↓
Modal closes, draft cleared
```

### 4.2 Metric Edit Flow
```
User clicks "Add Metric" or "Edit Metric"
  ↓
TemplateSectionEditContext.openMetricModal(metric?, sectionId)
  ↓
MetricEditCard component opens in modal
  ↓
User edits metric fields (title, description, image, style)
  ↓
User clicks "Save Metric"
  ↓
POST /api/website-metrics (new) or PUT /api/website-metrics/[id] (edit)
  ↓
Supabase updates website_metric table
  ↓
Parent section's website_metric array updates
  ↓
MetricEditCard closes, list refreshes
```

### 4.3 Image Selection Flow
```
User clicks "Browse Gallery" in EditableImageField
  ↓
ImageGalleryModal opens
  ↓
User navigates folders or searches globally
  ↓
User clicks image
  ↓
onSelectImage(url) callback fires
  ↓
EditableImageField updates with new URL
  ↓
Image preview shows new image
  ↓
Modal closes
```

---

## 5. Database Schema Considerations

### 5.1 Existing Tables
Verify current schema matches expected structure:

```sql
-- template_sections table
CREATE TABLE template_sections (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  url_page TEXT,
  section_title TEXT,
  section_title_translation JSONB,
  section_description TEXT,
  section_description_translation JSONB,
  background_color TEXT,
  is_full_width BOOLEAN DEFAULT false,
  is_section_title_aligned_center BOOLEAN DEFAULT false,
  is_section_title_aligned_right BOOLEAN DEFAULT false,
  text_style_variant TEXT DEFAULT 'default',
  grid_columns INTEGER DEFAULT 3,
  image_metrics_height TEXT,
  is_image_bottom BOOLEAN DEFAULT false,
  is_slider BOOLEAN DEFAULT false,
  is_reviews_section BOOLEAN DEFAULT false,
  is_help_center_section BOOLEAN DEFAULT false,
  is_real_estate_modal BOOLEAN DEFAULT false,
  max_faqs_display INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- website_metric table
CREATE TABLE website_metric (
  id BIGSERIAL PRIMARY KEY,
  template_section_id BIGINT REFERENCES template_sections(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  title TEXT,
  title_translation JSONB,
  description TEXT,
  description_translation JSONB,
  image TEXT,
  is_title_displayed BOOLEAN DEFAULT true,
  is_image_rounded_full BOOLEAN DEFAULT false,
  is_card_type BOOLEAN DEFAULT false,
  background_color TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- template_heading_sections table
CREATE TABLE template_heading_sections (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  url_page TEXT,
  name TEXT,
  name_translation JSONB,
  name_part_2 TEXT,
  name_part_3 TEXT,
  description_text TEXT,
  description_text_translation JSONB,
  button_text TEXT,
  button_text_translation JSONB,
  url TEXT,
  image TEXT,
  image_first BOOLEAN DEFAULT false,
  is_included_templatesection BOOLEAN DEFAULT false,
  style_variant TEXT DEFAULT 'default',
  text_style_variant TEXT DEFAULT 'default',
  is_text_link BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Required Indexes
```sql
CREATE INDEX idx_template_sections_org_id ON template_sections(organization_id);
CREATE INDEX idx_template_sections_url_page ON template_sections(url_page);
CREATE INDEX idx_website_metric_section_id ON website_metric(template_section_id);
CREATE INDEX idx_website_metric_org_id ON website_metric(organization_id);
CREATE INDEX idx_template_heading_sections_org_id ON template_heading_sections(organization_id);
CREATE INDEX idx_template_heading_sections_url_page ON template_heading_sections(url_page);
```

### 5.3 RLS Policies
```sql
-- Enable RLS
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_metric ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_heading_sections ENABLE ROW LEVEL SECURITY;

-- Policies for template_sections
CREATE POLICY "Public read access" ON template_sections FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert" ON template_sections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own org sections" ON template_sections FOR UPDATE USING (organization_id = auth.jwt() ->> 'organization_id');
CREATE POLICY "Users can delete own org sections" ON template_sections FOR DELETE USING (organization_id = auth.jwt() ->> 'organization_id');

-- Similar policies for website_metric and template_heading_sections
```

---

## 6. Reusable Components Benefits

### Why Shared Components?

1. **Code Reusability**
   - EditableTextField used in both TemplateSection and TemplateHeadingSection modals
   - ImageGalleryModal already proven, no need to rebuild
   - EditControls ensure consistent UX across all edit interfaces

2. **Maintainability**
   - Bug fixes in shared components benefit all consumers
   - Style updates propagate automatically
   - Single source of truth for edit patterns

3. **Consistency**
   - Users learn edit patterns once, apply everywhere
   - Designers maintain single design system
   - Developers follow established patterns

4. **Future Scalability**
   - Easy to add new editable components (Products, Pages, etc.)
   - Shared components can be enhanced without touching consumers
   - Translation support built-in from the start

### Comparison: With vs Without Shared Components

| Aspect | Without Shared | With Shared |
|--------|----------------|-------------|
| Lines of Code | ~3000 | ~1800 |
| Development Time | 6-8 weeks | 4-5 weeks |
| Maintenance Burden | High (3 copies) | Low (1 component) |
| Bug Fix Propagation | Manual (3 places) | Automatic |
| Design Consistency | Manual effort | Enforced |
| Adding New Edit Type | 2-3 days | 1 day |

---

## 7. Implementation Timeline

### Week 1-2: Foundation (Phase 1)
- **Days 1-3:** Shared EditableText components
- **Days 4-5:** Shared EditableImage components
- **Days 6-7:** Shared EditControls components
- **Days 8-10:** BaseEditModal component

### Week 3-4: TemplateSection (Phase 2)
- **Days 11-12:** Context setup & API routes
- **Days 13-15:** Main edit modal structure
- **Days 16-17:** Metric edit card
- **Days 18-19:** Style controls
- **Day 20:** Integration with TemplateSection component

### Week 5: TemplateHeadingSection (Phase 3)
- **Days 21-22:** Context setup & API routes
- **Days 23-24:** Main edit modal
- **Day 25:** Style controls & integration

### Week 6: Polish & Testing (Phase 4)
- **Days 26-27:** Authentication & permissions
- **Day 28:** Real-time updates
- **Day 29:** Validation & error handling
- **Day 30:** Testing & documentation

**Total Timeline:** 6 weeks (30 working days)

---

## 8. Success Metrics

### Technical Metrics
- [ ] All CRUD operations work for TemplateSection
- [ ] All CRUD operations work for TemplateHeadingSection
- [ ] All CRUD operations work for Metrics
- [ ] Auto-save functionality works (2-minute intervals)
- [ ] Image gallery integration works seamlessly
- [ ] Translation fields work for all supported locales
- [ ] Real-time updates work across multiple browsers
- [ ] API response times < 500ms (p95)
- [ ] Zero console errors in production

### User Experience Metrics
- [ ] Users can edit sections without page reload
- [ ] Changes appear instantly after save
- [ ] Error messages are clear and actionable
- [ ] Modal is responsive on all screen sizes
- [ ] Keyboard shortcuts work (Ctrl+S, Esc)
- [ ] Loading states provide clear feedback
- [ ] Undo/redo functionality works (stretch goal)

### Code Quality Metrics
- [ ] TypeScript strict mode with no errors
- [ ] Test coverage >80%
- [ ] No ESLint errors
- [ ] All components documented with JSDoc
- [ ] Storybook stories for all shared components
- [ ] Performance Lighthouse score >90

---

## 9. Risk Assessment

### High Risk
1. **Complex State Management**
   - *Risk:* Nested objects (metrics within sections) difficult to manage
   - *Mitigation:* Use Immer for immutable updates, thorough testing

2. **Real-time Conflicts**
   - *Risk:* Multiple users editing same section simultaneously
   - *Mitigation:* Implement optimistic locking, show "Edited by X" warnings

### Medium Risk
3. **API Performance**
   - *Risk:* Slow queries with many metrics per section
   - *Mitigation:* Add database indexes, implement pagination

4. **Translation Complexity**
   - *Risk:* Managing 11 languages × many fields
   - *Mitigation:* Use dedicated TranslationEditor component, validation

### Low Risk
5. **Image Upload Limits**
   - *Risk:* Users upload very large images
   - *Mitigation:* Client-side compression, file size limits (already in ImageGalleryModal)

---

## 10. Dependencies

### Required Libraries (Already Installed)
- ✅ React 18+
- ✅ Next.js 14+
- ✅ TypeScript
- ✅ TipTap (for rich text editing)
- ✅ Supabase Client
- ✅ Heroicons
- ✅ Tailwind CSS
- ✅ DOMPurify
- ✅ html-react-parser

### New Libraries to Consider
- **Zod** - Schema validation (highly recommended)
- **React Hook Form** - Form state management (optional, reduces boilerplate)
- **Immer** - Immutable state updates (recommended for nested objects)
- **React DnD** - Drag & drop for reordering metrics (stretch goal)

---

## 11. Next Steps

### Immediate Actions (Before Phase 1)
1. ✅ Review this plan with team
2. ⏳ Get approval for architecture decisions
3. ⏳ Verify database schema matches expectations
4. ⏳ Set up development branch (`feature/template-section-edit`)
5. ⏳ Create GitHub issues for each phase
6. ⏳ Install additional dependencies (Zod, React Hook Form, Immer)

### Phase 1 Kickoff Checklist
- [ ] Create `/src/components/Shared/` directory structure
- [ ] Set up Storybook for component development (optional)
- [ ] Create TypeScript interfaces in `/src/types/`
- [ ] Set up ESLint rules for new components
- [ ] Create first shared component: `EditableTextField.tsx`

---

## 12. Open Questions

1. **Authentication:**
   - Who can edit sections? All authenticated users or only admins?
   - Do we need role-based access control (RBAC)?

2. **Versioning:**
   - Should we keep edit history / versioning?
   - Undo/redo at what granularity (field, section, full save)?

3. **Collaboration:**
   - Do we need real-time collaborative editing (like Google Docs)?
   - Or just show "Someone else is editing" warnings?

4. **SEO Fields:**
   - Do TemplateSection/TemplateHeadingSection need SEO metadata like Posts?
   - Meta description, OG tags, structured data?

5. **Localization:**
   - Should we support RTL languages (Arabic, Hebrew)?
   - Date/time formatting per locale?

6. **Image Management:**
   - Can users upload images directly in edit modal?
   - Or must they use ImageGalleryModal?
   - Image optimization/compression on upload?

---

## 13. Documentation Needs

### Developer Documentation
- [ ] Architecture overview (this document)
- [ ] Shared components API reference
- [ ] Context usage guide
- [ ] API endpoint documentation
- [ ] Database schema documentation
- [ ] Deployment guide

### User Documentation
- [ ] How to edit a template section
- [ ] How to add/remove metrics
- [ ] How to manage translations
- [ ] How to use the image gallery
- [ ] Troubleshooting guide

---

## Conclusion

This implementation plan provides a comprehensive, scalable approach to adding rich editing capabilities to TemplateSection and TemplateHeadingSection components. By leveraging shared components and proven patterns from PostEditModal, we can deliver a consistent, maintainable solution in 6 weeks.

The phased approach allows for iterative development and early feedback, while the shared components strategy ensures future scalability and maintainability.

**Recommended Next Step:** Review this plan with the team, address open questions, and then begin Phase 1 (Shared Components) immediately.

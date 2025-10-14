# 🎨 Header, Footer & Layout Manager Modals - REVISED Implementation Plan

## 📋 Overview

Create 3 new edit modals for managing Header, Footer, and Page Content Order with correct table/field names based on your actual database schema.

---

## ✅ **IMPORTANT: Actual Database Schema**

Based on your clarifications:

### **Table Names (Correct)**
- ✅ `website_templatesection` (NOT "template_sections")
- ✅ `website_templatesectionheading` (NOT "template_heading_sections")  
- ✅ `blog_post` (NOT "blog_posts")
- ✅ `website_menuitem` (correct)
- ✅ `website_submenuitem` (correct)

### **Field Names (Correct)**
- ✅ `is_displayed` - Controls if menu item appears in **Header**
- ✅ `is_displayed_on_footer` - Controls if menu item appears in **Footer**
- ❌ ~~`is_footer`~~ - DOES NOT EXIST (use `is_displayed_on_footer` instead)
- ✅ `order` - Field for ordering menu items (exists)
- ✅ `display_order` - Field for ordering sections (need to verify/add to hero)

### **Blog Posts**
- ❌ **NOT** displayed on homepage as sections
- ❌ **NO** need for `display_order` on `blog_post` table
- ✅ Blog posts only managed separately via PostEditModal

---

## 🎯 Requirements Summary (REVISED)

### **1. Header Edit Modal**
- **Purpose**: Edit header styles and manage header menu items
- **Trigger**: "Edit" button on Header component
- **Data Sources**: 
  - `settings.header_style` (JSONB)
  - `website_menuitem` WHERE `is_displayed = true`
  - `website_submenuitem`
- **Features**:
  - Style settings (background, colors, gradient)
  - Menu width configuration
  - Menu items management (filter by `is_displayed`)
  - Submenu management
  - Icon selection

### **2. Footer Edit Modal**
- **Purpose**: Edit footer styles and manage footer menu items
- **Trigger**: "Edit" button on Footer component
- **Data Sources**:
  - `settings.footer_style` (JSONB)
  - `website_menuitem` WHERE `is_displayed_on_footer = true`
  - `website_submenuitem`
- **Features**:
  - Style settings (background, colors, gradient)
  - Footer type selection
  - Footer menu items management

### **3. Layout Manager Modal**
- **Purpose**: Reorder page sections with drag-and-drop
- **Trigger**: Link in UniversalNewButton dropdown menu
- **Data Sources**:
  - `website_hero` (Hero section)
  - `website_templatesection` (Brands, FAQs, Help Center, etc.)
  - `website_templatesectionheading`
  - ❌ **NOT blog_post** (posts don't appear as sections on homepage)
- **Features**:
  - Visual draggable list of all page sections
  - Display section type labels
  - Save new `display_order` to database

---

## 🗄️ Database Schema (ACTUAL)

### **settings Table**

```typescript
interface Settings {
  header_style: {
    type: 'default' | 'transparent' | 'blur';
    background: string;
    color: string;
    color_hover: string;
    menu_width: 'full' | '7xl' | '6xl' | '5xl';
    menu_items_are_text: boolean;
    is_gradient: boolean;
    gradient?: { from: string; via?: string; to: string };
  };
  footer_style: {
    type: 'default' | 'minimal' | 'extended';
    background: string;
    color: string;
    color_hover: string;
    is_gradient: boolean;
    gradient?: { from: string; via?: string; to: string };
  };
}
```

### **website_menuitem Table (ACTUAL)**

```sql
-- Existing fields (from your code)
CREATE TABLE website_menuitem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  display_name TEXT NOT NULL,
  url_name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  is_displayed BOOLEAN DEFAULT TRUE,              -- Controls Header display
  is_displayed_on_footer BOOLEAN DEFAULT FALSE,   -- Controls Footer display
  menu_items_are_text BOOLEAN,                    -- true=text, false=icon, NULL=use global
  react_icon_id INTEGER REFERENCES react_icons(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **website_submenuitem Table**

```sql
CREATE TABLE website_submenuitem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES website_menuitem(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  url_name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  is_displayed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Content Tables (For Layout Manager)**

```typescript
// Hero Section
interface WebsiteHero {
  id: string;
  organization_id: string;
  display_order?: number; // NEED TO ADD
  h1_title: string;
  // ... other fields
}

// Template Sections
interface WebsiteTemplateSection {
  id: string;
  organization_id: string;
  order: number; // EXISTS (use this for display_order)
  section_title: string;
  section_type: string;
  is_brand: boolean;
  is_faq_section: boolean;
  is_help_center_section: boolean;
  // ... other fields
}

// Template Heading Sections
interface WebsiteTemplateSectionHeading {
  id: string;
  organization_id: string;
  order: number; // EXISTS (use this for display_order)
  title: string;
  // ... other fields
}
```

---

## 🛠️ Implementation Steps (REVISED)

### **Phase 1: Database Migration** ✅

Only need to add `display_order` to `website_hero`:

```sql
-- Add display_order to website_hero
ALTER TABLE website_hero 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

UPDATE website_hero 
SET display_order = 0 
WHERE display_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_hero_display_order 
ON website_hero(organization_id, display_order);

COMMENT ON COLUMN website_hero.display_order IS 'Controls the order of hero section on page (0 = first)';
```

**Note**: 
- `website_templatesection.order` - ALREADY EXISTS ✅
- `website_templatesectionheading.order` - ALREADY EXISTS ✅
- `website_menuitem.order` - ALREADY EXISTS ✅
- `website_menuitem.is_displayed` - ALREADY EXISTS ✅
- `website_menuitem.is_displayed_on_footer` - ALREADY EXISTS ✅

---

### **Phase 2: Context Providers** ⏳

#### **2.1 HeaderEditContext**

**File**: `src/components/modals/HeaderEditModal/context.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/components/Shared/ToastContainer';
import { revalidateHomepage } from '@/lib/revalidation';

interface HeaderStyle {
  type: 'default' | 'transparent' | 'blur';
  background: string;
  color: string;
  color_hover: string;
  menu_width: 'full' | '7xl' | '6xl' | '5xl';
  menu_items_are_text: boolean;
  is_gradient: boolean;
  gradient?: { from: string; via?: string; to: string };
}

interface MenuItem {
  id: string;
  display_name: string;
  url_name: string;
  order: number;
  is_displayed: boolean;              // Header visibility
  is_displayed_on_footer: boolean;    // Footer visibility
  menu_items_are_text: boolean;
  react_icon_id: number | null;
  icon_name?: string;
  submenus?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  menu_item_id: string;
  display_name: string;
  url_name: string;
  order: number;
  is_displayed: boolean;
}

interface HeaderEditState {
  isOpen: boolean;
  headerStyle: HeaderStyle | null;
  menuItems: MenuItem[];
  isLoading: boolean;
  isSaving: boolean;
}

interface HeaderEditActions {
  openModal: () => void;
  closeModal: () => void;
  fetchHeaderData: (organizationId: string) => Promise<void>;
  saveHeaderStyle: (style: HeaderStyle, organizationId: string) => Promise<void>;
  saveMenuItems: (items: MenuItem[], organizationId: string) => Promise<void>;
  // ... CRUD methods
}

const HeaderEditContext = createContext<(HeaderEditState & HeaderEditActions) | null>(null);

export function HeaderEditProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const fetchHeaderData = useCallback(async (organizationId: string) => {
    setIsLoading(true);
    try {
      // Fetch settings (header_style)
      const settingsResponse = await fetch(`/api/organizations/${organizationId}`);
      if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
      
      const settingsData = await settingsResponse.json();
      setHeaderStyle(settingsData.settings?.header_style || null);

      // Fetch menu items (is_displayed = true for header)
      const menuResponse = await fetch(
        `/api/menu-items?organization_id=${organizationId}&is_displayed=true`
      );
      if (!menuResponse.ok) throw new Error('Failed to fetch menu items');
      
      const menuData = await menuResponse.json();
      setMenuItems(menuData.menu_items || []);
    } catch (error) {
      console.error('Failed to fetch header data:', error);
      showToast('error', 'Failed to load header data');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const saveHeaderStyle = useCallback(async (style: HeaderStyle, organizationId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { header_style: style }
        })
      });

      if (!response.ok) throw new Error('Failed to save header style');

      setHeaderStyle(style);
      showToast('success', 'Header style saved successfully!');
      
      // Revalidate cache
      revalidateHomepage(organizationId).catch(err => 
        console.warn('Cache revalidation failed (non-critical):', err)
      );
    } catch (error) {
      console.error('Failed to save header style:', error);
      showToast('error', 'Failed to save header style');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [showToast]);

  // ... other methods

  const value = {
    isOpen,
    headerStyle,
    menuItems,
    isLoading,
    isSaving,
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
    fetchHeaderData,
    saveHeaderStyle,
    saveMenuItems: async () => {}, // Implement
    // ... other methods
  };

  return (
    <HeaderEditContext.Provider value={value}>
      {children}
    </HeaderEditContext.Provider>
  );
}

export function useHeaderEdit() {
  const context = useContext(HeaderEditContext);
  if (!context) {
    throw new Error('useHeaderEdit must be used within HeaderEditProvider');
  }
  return context;
}
```

#### **2.2 FooterEditContext**

**File**: `src/components/modals/FooterEditModal/context.tsx`

Similar to HeaderEditContext, but:
- Fetch menu items with `is_displayed_on_footer = true`
- Manage `footer_style` instead of `header_style`

```typescript
// Fetch footer menu items
const menuResponse = await fetch(
  `/api/menu-items?organization_id=${organizationId}&is_displayed_on_footer=true`
);
```

#### **2.3 LayoutManagerContext**

**File**: `src/components/modals/LayoutManagerModal/context.tsx`

```typescript
interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'template_heading_section';
  display_order: number; // Use 'order' for sections, 'display_order' for hero
  title: string;
  subtype?: string; // For template sections: type of section
}

const fetchPageLayout = useCallback(async (organizationId: string) => {
  setIsLoading(true);
  try {
    const response = await fetch(
      `/api/page-layout?organization_id=${organizationId}`
    );
    if (!response.ok) throw new Error('Failed to fetch page layout');
    
    const data = await response.json();
    setSections(data.sections || []);
  } catch (error) {
    console.error('Failed to fetch page layout:', error);
    showToast('error', 'Failed to load page layout');
  } finally {
    setIsLoading(false);
  }
}, [showToast]);
```

---

### **Phase 3: API Routes** ⏳

#### **3.1 Menu Items API**

**File**: `src/app/api/menu-items/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/menu-items
// Query params: organization_id, is_displayed (for header), is_displayed_on_footer (for footer)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  const isDisplayed = searchParams.get('is_displayed'); // "true" for header menus
  const isDisplayedOnFooter = searchParams.get('is_displayed_on_footer'); // "true" for footer menus

  if (!organizationId) {
    return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('website_menuitem')
      .select(`
        *,
        website_submenuitem (*)
      `)
      .eq('organization_id', organizationId)
      .order('order', { ascending: true });

    // Filter by header display
    if (isDisplayed === 'true') {
      query = query.eq('is_displayed', true);
    }

    // Filter by footer display
    if (isDisplayedOnFooter === 'true') {
      query = query.eq('is_displayed_on_footer', true);
    }

    const { data: menuItems, error } = await query;

    if (error) throw error;

    return NextResponse.json({ menu_items: menuItems });
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

// POST /api/menu-items (Create new menu item)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, display_name, url_name, is_displayed, is_displayed_on_footer, order } = body;

    const { data, error } = await supabase
      .from('website_menuitem')
      .insert({
        organization_id,
        display_name,
        url_name,
        is_displayed: is_displayed ?? true,
        is_displayed_on_footer: is_displayed_on_footer ?? false,
        order: order ?? 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ menu_item: data });
  } catch (error) {
    console.error('Failed to create menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
```

**File**: `src/app/api/menu-items/[id]/route.ts` (NEW)

```typescript
// PUT /api/menu-items/[id] - Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { display_name, url_name, is_displayed, is_displayed_on_footer, order } = body;

    const { data, error } = await supabase
      .from('website_menuitem')
      .update({
        display_name,
        url_name,
        is_displayed,
        is_displayed_on_footer,
        order
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ menu_item: data });
  } catch (error) {
    console.error('Failed to update menu item:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

// DELETE /api/menu-items/[id] - Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('website_menuitem')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}
```

#### **3.2 Page Layout API**

**File**: `src/app/api/page-layout/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/page-layout?organization_id=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');

  if (!organizationId) {
    return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
  }

  try {
    // Fetch all sections for the page
    const [heroData, templateSections, headingSections] = await Promise.all([
      // Hero section
      supabase
        .from('website_hero')
        .select('id, h1_title, display_order')
        .eq('organization_id', organizationId)
        .maybeSingle(),
      
      // Template sections (use 'order' field)
      supabase
        .from('website_templatesection')
        .select('id, section_title, section_type, is_brand, is_faq_section, is_help_center_section, "order"')
        .eq('organization_id', organizationId)
        .order('order', { ascending: true }),
      
      // Template heading sections (use 'order' field)
      supabase
        .from('website_templatesectionheading')
        .select('id, title, "order"')
        .eq('organization_id', organizationId)
        .order('order', { ascending: true })
    ]);

    // Combine all sections into unified array
    const sections: any[] = [];

    if (heroData.data) {
      sections.push({
        id: heroData.data.id,
        type: 'hero',
        title: 'Hero Section',
        display_order: heroData.data.display_order || 0
      });
    }

    if (templateSections.data) {
      templateSections.data.forEach(section => {
        // Determine section type/title
        let sectionTitle = section.section_title;
        if (!sectionTitle) {
          if (section.is_brand) sectionTitle = 'Brands Section';
          else if (section.is_faq_section) sectionTitle = 'FAQ Section';
          else if (section.is_help_center_section) sectionTitle = 'Help Center';
          else sectionTitle = 'Section';
        }

        sections.push({
          id: section.id,
          type: 'template_section',
          subtype: section.section_type,
          title: sectionTitle,
          display_order: section.order || 100
        });
      });
    }

    if (headingSections.data) {
      headingSections.data.forEach(section => {
        sections.push({
          id: section.id,
          type: 'template_heading_section',
          title: section.title || 'Heading Section',
          display_order: section.order || 50
        });
      });
    }

    // Sort by display_order
    sections.sort((a, b) => a.display_order - b.display_order);

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Failed to fetch page layout:', error);
    return NextResponse.json({ error: 'Failed to fetch page layout' }, { status: 500 });
  }
}

// PUT /api/page-layout (Save new section order)
export async function PUT(request: NextRequest) {
  const { organization_id, sections } = await request.json();

  if (!organization_id || !sections) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    // Group sections by type
    const heroSections = sections.filter((s: any) => s.type === 'hero');
    const templateSections = sections.filter((s: any) => s.type === 'template_section');
    const headingSections = sections.filter((s: any) => s.type === 'template_heading_section');

    // Update each table
    await Promise.all([
      // Update hero (use 'display_order' column)
      ...heroSections.map((s: any) =>
        supabase
          .from('website_hero')
          .update({ display_order: s.display_order })
          .eq('id', s.id)
      ),
      // Update template sections (use 'order' column)
      ...templateSections.map((s: any) =>
        supabase
          .from('website_templatesection')
          .update({ order: s.display_order })
          .eq('id', s.id)
      ),
      // Update heading sections (use 'order' column)
      ...headingSections.map((s: any) =>
        supabase
          .from('website_templatesectionheading')
          .update({ order: s.display_order })
          .eq('id', s.id)
      )
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save page layout:', error);
    return NextResponse.json({ error: 'Failed to save page layout' }, { status: 500 });
  }
}
```

---

### **Phase 4: Modal Components** ⏳

(Modal component structure remains the same as original plan, just update API calls to use correct table/field names)

---

### **Phase 5: Integration** ⏳

Same as original plan - add edit buttons to Header/Footer, add Layout Manager to UniversalNewButton.

---

### **Phase 6: Update Page Rendering** ⏳

**File**: `src/app/[locale]/page.tsx`

```tsx
// Fetch sections ordered correctly
const { data: templateSections } = await supabase
  .from('website_templatesection')  // Correct table name
  .select('*')
  .eq('organization_id', organizationId)
  .order('order', { ascending: true }); // Use 'order' field

const { data: headingSections } = await supabase
  .from('website_templatesectionheading')  // Correct table name
  .select('*')
  .eq('organization_id', organizationId)
  .order('order', { ascending: true }); // Use 'order' field

const { data: heroData } = await supabase
  .from('website_hero')
  .select('*')
  .eq('organization_id', organizationId)
  .order('display_order', { ascending: true }) // Use 'display_order' field
  .maybeSingle();
```

---

## 📝 Database Migration (REVISED)

Only need to add `display_order` to `website_hero`:

```sql
-- Migration: Add display_order to website_hero
-- All other tables/fields already exist

ALTER TABLE website_hero 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

UPDATE website_hero 
SET display_order = 0 
WHERE display_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_hero_display_order 
ON website_hero(organization_id, display_order);

COMMENT ON COLUMN website_hero.display_order IS 'Controls the order of hero section on page (0 = first)';

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_hero' AND column_name = 'display_order'
  ) THEN
    RAISE EXCEPTION 'website_hero.display_order column missing!';
  END IF;
  
  RAISE NOTICE '✅ Migration complete: website_hero.display_order added';
  RAISE NOTICE '✅ Existing fields verified:';
  RAISE NOTICE '   - website_templatesection.order';
  RAISE NOTICE '   - website_templatesectionheading.order';
  RAISE NOTICE '   - website_menuitem.order';
  RAISE NOTICE '   - website_menuitem.is_displayed';
  RAISE NOTICE '   - website_menuitem.is_displayed_on_footer';
END $$;
```

---

## 🎯 Key Differences from Original Plan

### **1. Table Names**
- ❌ `template_sections` → ✅ `website_templatesection`
- ❌ `template_heading_sections` → ✅ `website_templatesectionheading`
- ❌ `blog_posts` → ✅ `blog_post` (but NOT used in Layout Manager)

### **2. Field Names**
- ❌ `is_footer` → ✅ `is_displayed_on_footer`
- ✅ `is_displayed` - Controls Header menu visibility
- ✅ `order` - Used for template sections/headings ordering
- ✅ `display_order` - Used for hero ordering (needs to be added)

### **3. Menu Item Filtering**
```typescript
// Header menu items
fetch(`/api/menu-items?organization_id=${id}&is_displayed=true`)

// Footer menu items
fetch(`/api/menu-items?organization_id=${id}&is_displayed_on_footer=true`)
```

### **4. Layout Manager Scope**
- ✅ Includes: Hero, Template Sections, Heading Sections
- ❌ Excludes: Blog Posts (not displayed as sections on homepage)

### **5. Ordering Fields**
```typescript
// Hero
UPDATE website_hero SET display_order = X WHERE id = Y

// Template Sections
UPDATE website_templatesection SET "order" = X WHERE id = Y

// Heading Sections
UPDATE website_templatesectionheading SET "order" = X WHERE id = Y
```

---

## ✅ Implementation Checklist (REVISED)

### **Database**
- [ ] Add `display_order` to `website_hero`
- [ ] Verify `website_templatesection.order` exists
- [ ] Verify `website_templatesectionheading.order` exists
- [ ] Verify `website_menuitem.is_displayed` exists
- [ ] Verify `website_menuitem.is_displayed_on_footer` exists

### **API Routes**
- [ ] Create `/api/menu-items` (GET/POST)
- [ ] Create `/api/menu-items/[id]` (PUT/DELETE)
- [ ] Create `/api/page-layout` (GET/PUT)
- [ ] Update query filters (use correct field names)

### **Context Providers**
- [ ] HeaderEditContext (use `is_displayed` filter)
- [ ] FooterEditContext (use `is_displayed_on_footer` filter)
- [ ] LayoutManagerContext (use correct table names)

### **Modal Components**
- [ ] HeaderEditModal
- [ ] FooterEditModal
- [ ] LayoutManagerModal

### **Integration**
- [ ] Add edit button to Header.tsx
- [ ] Add edit button to Footer.tsx
- [ ] Add Layout Manager to UniversalNewButton
- [ ] Add providers to ClientProviders.tsx

---

## 🚀 Ready to Implement!

**Status**: Plan revised with correct table/field names from your actual database schema.

**Next Step**: Run database migration, then proceed with API routes and contexts.

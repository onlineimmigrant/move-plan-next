# 🎨 Header, Footer & Page Reorder Modals - Implementation Plan

## 📋 Overview

Create 3 new edit modals for managing Header, Footer, and Page Content Order with consistent design patterns matching existing modals (HeroSectionEditModal, TemplateSectionEditModal, etc.).

---

## 🎯 Requirements Summary

### **1. Header Edit Modal**
- **Purpose**: Edit header styles and manage menu items
- **Trigger**: "Edit" button on Header component (similar to Hero edit button)
- **Data Sources**: 
  - `settings.header_style` (JSONB)
  - `website_menuitem` table
  - `website_submenuitem` table
- **Features**:
  - Style settings (background, colors, gradient)
  - Menu width configuration
  - Menu items management (add/edit/delete/reorder)
  - Submenu management
  - Icon selection (text vs icon display)

### **2. Footer Edit Modal**
- **Purpose**: Edit footer styles and manage footer menu items
- **Trigger**: "Edit" button on Footer component
- **Data Sources**:
  - `settings.footer_style` (JSONB)
  - `website_menuitem` table (where `is_footer = true`)
  - `website_submenuitem` table
- **Features**:
  - Style settings (background, colors, gradient)
  - Footer type selection
  - Footer menu items management
  - Social links management

### **3. Page Content Reorder Modal** (Better name: **"Layout Manager Modal"**)
- **Purpose**: Reorder page sections with drag-and-drop
- **Trigger**: Link in UniversalNewButton dropdown menu
- **Data Sources**:
  - `website_hero` (Hero section)
  - `template_sections` (Brands, FAQs, Help Center, etc.)
  - `template_heading_sections`
  - `blog_posts` (if on blog page)
- **Features**:
  - Visual draggable list of all page sections
  - Display section type labels (Brands, FAQs, Help Center, etc.)
  - Save new display order to database
  - Preview mode toggle

---

## 🏗️ Architecture & Design Pattern

### **Common Base: `BaseModal`**

All three modals will extend the `BaseModal` component pattern:

```typescript
import { BaseModal } from '@/components/modals/_shared/BaseModal';

<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Edit Header"
  subtitle="Customize header styles and menu items"
  primaryAction={{
    label: 'Save Changes',
    onClick: handleSave,
    loading: isSaving
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: handleClose
  }}
>
  {/* Modal Content */}
</BaseModal>
```

### **Context Pattern**

Each modal will have a Context Provider (matching existing pattern):

```
src/components/modals/
├── HeaderEditModal/
│   ├── context.tsx          // State management & API calls
│   ├── HeaderEditModal.tsx  // Main modal component
│   └── MenuItemManager.tsx  // Menu items CRUD component
├── FooterEditModal/
│   ├── context.tsx
│   ├── FooterEditModal.tsx
│   └── FooterMenuManager.tsx
└── LayoutManagerModal/
    ├── context.tsx
    ├── LayoutManagerModal.tsx
    └── DraggableSectionList.tsx
```

---

## 📊 Database Schema Reference

### **Settings Table** (Existing)

```typescript
interface Settings {
  // ... other fields
  header_style: {
    type: 'default' | 'transparent' | 'blur';
    background: string; // color name or hex
    color: string; // text color
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

### **website_menuitem Table**

```sql
CREATE TABLE website_menuitem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  display_name TEXT NOT NULL,
  url_name TEXT NOT NULL,
  order INTEGER DEFAULT 0,
  is_footer BOOLEAN DEFAULT FALSE, -- true for footer menus
  menu_items_are_text BOOLEAN,     -- true=text, false=icon
  react_icon_id INTEGER REFERENCES react_icons(id),
  is_active BOOLEAN DEFAULT TRUE,
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
  order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Content Tables** (For Layout Manager)

```typescript
// Hero
interface WebsiteHero {
  id: string;
  organization_id: string;
  display_order?: number; // NEW FIELD NEEDED
  // ... other fields
}

// Template Sections
interface TemplateSection {
  id: string;
  organization_id: string;
  type: 'brands' | 'faqs' | 'help_center' | 'pricing' | 'features' | 'testimonials';
  display_order: number; // EXISTING
  // ... other fields
}

// Template Heading Sections
interface TemplateHeadingSection {
  id: string;
  organization_id: string;
  display_order: number; // EXISTING
  // ... other fields
}

// Blog Posts
interface BlogPost {
  id: string;
  organization_id: string;
  display_order?: number; // May need to add
  // ... other fields
}
```

---

## 🛠️ Implementation Steps

### **Phase 1: Database Migrations** ✅

#### **1.1 Add display_order to website_hero**

```sql
-- migration: add_display_order_to_hero.sql
ALTER TABLE website_hero 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial values (heroes typically come first)
UPDATE website_hero 
SET display_order = 0 
WHERE display_order IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_hero_display_order 
ON website_hero(organization_id, display_order);

COMMENT ON COLUMN website_hero.display_order IS 'Controls the order of hero section on page (0 = first)';
```

#### **1.2 Ensure display_order exists on other tables**

```sql
-- Check template_sections (should exist)
ALTER TABLE template_sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 100;

-- Check template_heading_sections (should exist)
ALTER TABLE template_heading_sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 50;

-- Add to blog_posts if needed
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 200;

-- Create composite indexes
CREATE INDEX IF NOT EXISTS idx_template_sections_order 
ON template_sections(organization_id, display_order);

CREATE INDEX IF NOT EXISTS idx_template_heading_sections_order 
ON template_heading_sections(organization_id, display_order);

CREATE INDEX IF NOT EXISTS idx_blog_posts_order 
ON blog_posts(organization_id, display_order) 
WHERE is_published = TRUE;
```

#### **1.3 Add is_footer column if missing**

```sql
-- Ensure website_menuitem has is_footer flag
ALTER TABLE website_menuitem 
ADD COLUMN IF NOT EXISTS is_footer BOOLEAN DEFAULT FALSE;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_menuitem_footer 
ON website_menuitem(organization_id, is_footer, "order");

COMMENT ON COLUMN website_menuitem.is_footer IS 'true = footer menu, false = header menu';
```

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
  createMenuItem: (item: Partial<MenuItem>, organizationId: string) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  reorderMenuItems: (orderedIds: string[]) => Promise<void>;
}

const HeaderEditContext = createContext<(HeaderEditState & HeaderEditActions) | null>(null);

export function HeaderEditProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const fetchHeaderData = useCallback(async (organizationId: string) => {
    setIsLoading(true);
    try {
      // Fetch settings (header_style)
      const settingsResponse = await fetch(`/api/organizations/${organizationId}`);
      if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
      
      const settingsData = await settingsResponse.json();
      setHeaderStyle(settingsData.settings?.header_style || null);

      // Fetch menu items (is_footer = false)
      const menuResponse = await fetch(`/api/menu-items?organization_id=${organizationId}&is_footer=false`);
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

  const saveMenuItems = useCallback(async (items: MenuItem[], organizationId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/menu-items/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          menu_items: items
        })
      });

      if (!response.ok) throw new Error('Failed to save menu items');

      setMenuItems(items);
      showToast('success', 'Menu items saved successfully!');
      
      // Revalidate cache
      revalidateHomepage(organizationId).catch(err => 
        console.warn('Cache revalidation failed (non-critical):', err)
      );
    } catch (error) {
      console.error('Failed to save menu items:', error);
      showToast('error', 'Failed to save menu items');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [showToast]);

  // Additional CRUD methods...
  const createMenuItem = useCallback(async (item: Partial<MenuItem>, organizationId: string) => {
    // Implementation
  }, []);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    // Implementation
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    // Implementation
  }, []);

  const reorderMenuItems = useCallback(async (orderedIds: string[]) => {
    // Implementation
  }, []);

  const value = {
    isOpen,
    headerStyle,
    menuItems,
    isLoading,
    isSaving,
    openModal,
    closeModal,
    fetchHeaderData,
    saveHeaderStyle,
    saveMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems,
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

Similar structure to HeaderEditContext, but:
- Fetch menu items with `is_footer = true`
- Manage `footer_style` instead of `header_style`

#### **2.3 LayoutManagerContext**

**File**: `src/components/modals/LayoutManagerModal/context.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/components/Shared/ToastContainer';
import { revalidateHomepage } from '@/lib/revalidation';

interface PageSection {
  id: string;
  type: 'hero' | 'template_section' | 'template_heading_section' | 'blog_post';
  display_order: number;
  title: string; // Display name (e.g., "Hero", "Brands Section", "FAQ Section")
  subtype?: string; // For template_sections: 'brands', 'faqs', etc.
}

interface LayoutManagerState {
  isOpen: boolean;
  sections: PageSection[];
  isLoading: boolean;
  isSaving: boolean;
}

interface LayoutManagerActions {
  openModal: () => void;
  closeModal: () => void;
  fetchPageLayout: (organizationId: string, page?: string) => Promise<void>;
  reorderSections: (orderedSections: PageSection[]) => Promise<void>;
  saveSectionOrder: (organizationId: string) => Promise<void>;
}

const LayoutManagerContext = createContext<(LayoutManagerState & LayoutManagerActions) | null>(null);

export function LayoutManagerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const fetchPageLayout = useCallback(async (organizationId: string, page: string = 'home') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/page-layout?organization_id=${organizationId}&page=${page}`);
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

  const reorderSections = useCallback((orderedSections: PageSection[]) => {
    // Update display_order based on new position
    const reorderedSections = orderedSections.map((section, index) => ({
      ...section,
      display_order: index * 10 // Use increments of 10 for flexibility
    }));
    setSections(reorderedSections);
  }, []);

  const saveSectionOrder = useCallback(async (organizationId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/page-layout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          sections: sections
        })
      });

      if (!response.ok) throw new Error('Failed to save section order');

      showToast('success', 'Page layout saved successfully!');
      
      // Revalidate cache
      revalidateHomepage(organizationId).catch(err => 
        console.warn('Cache revalidation failed (non-critical):', err)
      );
    } catch (error) {
      console.error('Failed to save section order:', error);
      showToast('error', 'Failed to save page layout');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [sections, showToast]);

  const value = {
    isOpen,
    sections,
    isLoading,
    isSaving,
    openModal,
    closeModal,
    fetchPageLayout,
    reorderSections,
    saveSectionOrder,
  };

  return (
    <LayoutManagerContext.Provider value={value}>
      {children}
    </LayoutManagerContext.Provider>
  );
}

export function useLayoutManager() {
  const context = useContext(LayoutManagerContext);
  if (!context) {
    throw new Error('useLayoutManager must be used within LayoutManagerProvider');
  }
  return context;
}
```

---

### **Phase 3: Modal Components** ⏳

#### **3.1 HeaderEditModal**

**File**: `src/components/modals/HeaderEditModal/HeaderEditModal.tsx`

**Features**:
- Tabs: "Style" | "Menu Items"
- **Style Tab**:
  - Header type selector (default/transparent/blur)
  - Background color picker with gradient support
  - Text color pickers (normal + hover)
  - Menu width selector
  - Global menu items display toggle (text vs icons)
- **Menu Items Tab**:
  - List of current menu items
  - Add new item button
  - Edit/Delete buttons per item
  - Drag handle for reordering
  - Submenu management (expand/collapse per item)

**UI Structure**:
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={closeModal}
  title="Edit Header"
  subtitle="Customize header styles and menu items"
  primaryAction={{
    label: 'Save Changes',
    onClick: handleSave,
    loading: isSaving
  }}
>
  {/* Tabs */}
  <Tabs defaultValue="style">
    <TabsList>
      <TabsTrigger value="style">Style</TabsTrigger>
      <TabsTrigger value="menu">Menu Items</TabsTrigger>
    </TabsList>

    {/* Style Tab */}
    <TabsContent value="style">
      <div className="space-y-6">
        {/* Header Type */}
        <EditableSelect
          label="Header Type"
          value={headerStyle.type}
          options={[
            { value: 'default', label: 'Default (Solid)' },
            { value: 'transparent', label: 'Transparent' },
            { value: 'blur', label: 'Blur Effect' }
          ]}
          onChange={(value) => updateHeaderStyle({ type: value })}
        />

        {/* Background */}
        <EditableGradientPicker
          label="Background"
          isGradient={headerStyle.is_gradient}
          gradient={headerStyle.gradient}
          fallbackColor={headerStyle.background}
          onToggle={(enabled) => updateHeaderStyle({ is_gradient: enabled })}
          onChange={(gradient) => updateHeaderStyle({ gradient })}
        />

        {/* Text Colors */}
        <EditableColorPicker
          label="Text Color"
          color={headerStyle.color}
          onChange={(color) => updateHeaderStyle({ color })}
        />
        <EditableColorPicker
          label="Text Hover Color"
          color={headerStyle.color_hover}
          onChange={(color) => updateHeaderStyle({ color_hover: color })}
        />

        {/* Menu Width */}
        <EditableSelect
          label="Menu Width"
          value={headerStyle.menu_width}
          options={[
            { value: 'full', label: 'Full Width' },
            { value: '7xl', label: 'Extra Large' },
            { value: '6xl', label: 'Large' },
            { value: '5xl', label: 'Medium' }
          ]}
          onChange={(value) => updateHeaderStyle({ menu_width: value })}
        />

        {/* Global Icon/Text Toggle */}
        <EditableToggle
          label="Display as Text (not icons)"
          checked={headerStyle.menu_items_are_text}
          onChange={(checked) => updateHeaderStyle({ menu_items_are_text: checked })}
        />
      </div>
    </TabsContent>

    {/* Menu Items Tab */}
    <TabsContent value="menu">
      <MenuItemManager
        menuItems={menuItems}
        onUpdate={setMenuItems}
      />
    </TabsContent>
  </Tabs>
</BaseModal>
```

#### **3.2 MenuItemManager Component**

**File**: `src/components/modals/HeaderEditModal/MenuItemManager.tsx`

Drag-and-drop list similar to MetricManager:
- Each item shows: icon/text preview, display_name, url_name
- Edit button opens inline form
- Delete button with confirmation
- Drag handle for reordering
- Expand/collapse to show/edit submenus

**Libraries**:
- Use `@dnd-kit/core` for drag-and-drop (same as existing code)
- Similar pattern to `MetricManager.tsx`

#### **3.3 FooterEditModal**

**File**: `src/components/modals/FooterEditModal/FooterEditModal.tsx`

Nearly identical to HeaderEditModal, but:
- Title: "Edit Footer"
- Manage `footer_style`
- Fetch menu items with `is_footer = true`
- Footer-specific type options (default/minimal/extended)

#### **3.4 LayoutManagerModal**

**File**: `src/components/modals/LayoutManagerModal/LayoutManagerModal.tsx`

**Features**:
- Simple drag-and-drop list
- Each section shows:
  - Icon (based on type)
  - Title (e.g., "Hero Section", "Brands Section", "FAQ Section")
  - Type badge (color-coded)
  - Display order number
- Save button updates all display_order values
- Preview toggle (optional)

**UI Structure**:
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={closeModal}
  title="Page Layout Manager"
  subtitle="Drag sections to reorder page content"
  primaryAction={{
    label: 'Save Layout',
    onClick: handleSave,
    loading: isSaving
  }}
>
  <div className="space-y-4">
    {/* Instructions */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
      <p>Drag and drop sections to change their order on the page. Changes will be visible after saving.</p>
    </div>

    {/* Draggable List */}
    <DraggableSectionList
      sections={sections}
      onReorder={handleReorder}
    />
  </div>
</BaseModal>
```

#### **3.5 DraggableSectionList Component**

**File**: `src/components/modals/LayoutManagerModal/DraggableSectionList.tsx`

```tsx
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface SectionCardProps {
  section: PageSection;
}

const SectionCard: React.FC<SectionCardProps> = ({ section }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTypeIcon = (type: string) => {
    // Return appropriate icon based on type
  };

  const getTypeBadge = (type: string, subtype?: string) => {
    // Return color-coded badge
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border rounded-lg p-4 flex items-center gap-4',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        {getTypeIcon(section.type)}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="font-medium text-gray-900">{section.title}</div>
        <div className="text-sm text-gray-500">Display order: {section.display_order}</div>
      </div>

      {/* Badge */}
      {getTypeBadge(section.type, section.subtype)}
    </div>
  );
};

interface DraggableSectionListProps {
  sections: PageSection[];
  onReorder: (sections: PageSection[]) => void;
}

export const DraggableSectionList: React.FC<DraggableSectionListProps> = ({
  sections,
  onReorder
}) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);
    onReorder(newSections);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sections.map(section => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
```

---

### **Phase 4: API Routes** ⏳

#### **4.1 Menu Items API**

**File**: `src/app/api/menu-items/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/menu-items?organization_id=xxx&is_footer=false
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  const isFooter = searchParams.get('is_footer') === 'true';

  if (!organizationId) {
    return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
  }

  try {
    const { data: menuItems, error } = await supabase
      .from('website_menuitem')
      .select(`
        *,
        website_submenuitem (*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_footer', isFooter)
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ menu_items: menuItems });
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

// POST /api/menu-items (Create new menu item)
export async function POST(request: NextRequest) {
  // Implementation
}

// PUT /api/menu-items/[id] (Update menu item) - separate file
// DELETE /api/menu-items/[id] (Delete menu item) - separate file
```

**File**: `src/app/api/menu-items/batch/route.ts` (NEW)

```typescript
// PUT /api/menu-items/batch (Update multiple items' order)
export async function PUT(request: NextRequest) {
  const { organization_id, menu_items } = await request.json();

  // Update display order for all items in a transaction
  const updates = menu_items.map((item: any, index: number) => ({
    id: item.id,
    order: index
  }));

  // Bulk update using Supabase
  // Implementation...
}
```

#### **4.2 Page Layout API**

**File**: `src/app/api/page-layout/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/page-layout?organization_id=xxx&page=home
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  const page = searchParams.get('page') || 'home';

  if (!organizationId) {
    return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
  }

  try {
    // Fetch all sections for the page
    const [heroData, templateSections, templateHeadingSections] = await Promise.all([
      supabase
        .from('website_hero')
        .select('id, h1_title, display_order')
        .eq('organization_id', organizationId)
        .maybeSingle(),
      
      supabase
        .from('template_sections')
        .select('id, title, type, display_order')
        .eq('organization_id', organizationId)
        .order('display_order', { ascending: true }),
      
      supabase
        .from('template_heading_sections')
        .select('id, title, display_order')
        .eq('organization_id', organizationId)
        .order('display_order', { ascending: true })
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
        sections.push({
          id: section.id,
          type: 'template_section',
          subtype: section.type,
          title: section.title || getTypeName(section.type),
          display_order: section.display_order || 100
        });
      });
    }

    if (templateHeadingSections.data) {
      templateHeadingSections.data.forEach(section => {
        sections.push({
          id: section.id,
          type: 'template_heading_section',
          title: section.title || 'Heading Section',
          display_order: section.display_order || 50
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
      ...heroSections.map((s: any) =>
        supabase
          .from('website_hero')
          .update({ display_order: s.display_order })
          .eq('id', s.id)
      ),
      ...templateSections.map((s: any) =>
        supabase
          .from('template_sections')
          .update({ display_order: s.display_order })
          .eq('id', s.id)
      ),
      ...headingSections.map((s: any) =>
        supabase
          .from('template_heading_sections')
          .update({ display_order: s.display_order })
          .eq('id', s.id)
      )
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save page layout:', error);
    return NextResponse.json({ error: 'Failed to save page layout' }, { status: 500 });
  }
}

function getTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    brands: 'Brands Section',
    faqs: 'FAQ Section',
    help_center: 'Help Center',
    pricing: 'Pricing Section',
    features: 'Features Section',
    testimonials: 'Testimonials Section'
  };
  return typeNames[type] || 'Section';
}
```

---

### **Phase 5: Integration & Triggers** ⏳

#### **5.1 Add Edit Button to Header**

**File**: `src/components/Header.tsx`

```tsx
import { useHeaderEdit } from '@/components/modals/HeaderEditModal/context';
import { PencilIcon } from '@heroicons/react/24/outline';
import { isAdminClient } from '@/lib/auth';

// Inside Header component
const [isAdmin, setIsAdmin] = useState(false);
const { openModal } = useHeaderEdit();

useEffect(() => {
  const checkAdmin = async () => {
    setIsAdmin(await isAdminClient());
  };
  checkAdmin();
}, []);

// Add edit button (similar to Hero component)
{isAdmin && (
  <button
    onClick={openModal}
    className="fixed top-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
    title="Edit Header"
  >
    <PencilIcon className="w-5 h-5" />
  </button>
)}
```

#### **5.2 Add Edit Button to Footer**

**File**: `src/components/Footer.tsx`

Same pattern as Header

#### **5.3 Add Layout Manager to UniversalNewButton**

**File**: `src/components/AdminQuickActions/UniversalNewButton.tsx`

```tsx
import { useLayoutManager } from '@/components/modals/LayoutManagerModal/context';

const { openModal: openLayoutManager } = useLayoutManager();

// Add to menuCategories
{
  label: 'Page Management',
  items: [
    {
      label: 'Manage Layout',
      action: 'layout',
      description: 'Reorder page sections',
    },
    // ... other items
  ]
}

// Add case in handleMenuAction
case 'layout':
  openLayoutManager();
  break;
```

#### **5.4 Add Providers to Layout**

**File**: `src/app/ClientProviders.tsx`

```tsx
import { HeaderEditProvider } from '@/components/modals/HeaderEditModal/context';
import { FooterEditProvider } from '@/components/modals/FooterEditModal/context';
import { LayoutManagerProvider } from '@/components/modals/LayoutManagerModal/context';

// Wrap existing providers
<HeaderEditProvider>
  <FooterEditProvider>
    <LayoutManagerProvider>
      {/* Existing providers */}
    </LayoutManagerProvider>
  </FooterEditProvider>
</HeaderEditProvider>
```

#### **5.5 Import Modal Components**

**File**: `src/app/ClientProviders.tsx` (or wherever modals are rendered)

```tsx
import HeaderEditModal from '@/components/modals/HeaderEditModal/HeaderEditModal';
import FooterEditModal from '@/components/modals/FooterEditModal/FooterEditModal';
import LayoutManagerModal from '@/components/modals/LayoutManagerModal/LayoutManagerModal';

// Render modals
<HeaderEditModal />
<FooterEditModal />
<LayoutManagerModal />
```

---

### **Phase 6: Page Rendering Update** ⏳

Update homepage to respect display_order:

**File**: `src/app/[locale]/page.tsx`

```tsx
// Fetch sections ordered by display_order
const { data: templateSections } = await supabase
  .from('template_sections')
  .select('*')
  .eq('organization_id', organizationId)
  .order('display_order', { ascending: true }); // ← Add this

// Same for other tables
const { data: heroData } = await supabase
  .from('website_hero')
  .select('*')
  .eq('organization_id', organizationId)
  .order('display_order', { ascending: true }) // ← Add this
  .maybeSingle();
```

**File**: `src/components/HomePageSections/HomePage.tsx`

Update to render sections in order based on display_order

---

## 🎨 UI/UX Considerations

### **Consistent Design Patterns**

All modals should follow the existing design language:

1. **BaseModal** wrapper for consistent look
2. **Tabs** for multi-section modals (HeaderEdit, FooterEdit)
3. **Editable fields** using existing components:
   - `EditableTextField`
   - `EditableColorPicker`
   - `EditableGradientPicker`
   - `EditableToggle`
   - `EditableSelect`
4. **Drag-and-drop** using `@dnd-kit` (consistent with MetricManager)
5. **Loading states** with spinners
6. **Toast notifications** for success/error feedback
7. **Confirmation dialogs** for destructive actions

### **Color Coding**

Layout Manager type badges:
- **Hero**: Blue gradient (🔵 Indigo)
- **Template Section**: Color by subtype
  - Brands: Purple (🟣)
  - FAQs: Green (🟢)
  - Help Center: Orange (🟠)
  - Pricing: Yellow (🟡)
  - Features: Teal (🔵)
  - Testimonials: Pink (💗)
- **Heading Section**: Gray (⚪)
- **Blog Post**: Red (🔴)

### **Icons**

Use Heroicons for consistency:
- Hero: `RocketLaunchIcon`
- Brands: `SparklesIcon`
- FAQs: `QuestionMarkCircleIcon`
- Help Center: `LifebuoyIcon`
- Pricing: `CurrencyDollarIcon`
- Features: `CheckCircleIcon`
- Testimonials: `ChatBubbleLeftIcon`
- Heading: `Bars3BottomLeftIcon`
- Blog Post: `DocumentTextIcon`

---

## 📝 Testing Checklist

### **Header Edit Modal**
- [ ] Modal opens on edit button click
- [ ] Fetches current header_style from settings
- [ ] Style changes preview correctly
- [ ] Gradient picker works (from/via/to)
- [ ] Menu items load correctly
- [ ] Can add new menu item
- [ ] Can edit menu item (display_name, url_name)
- [ ] Can delete menu item (with confirmation)
- [ ] Can reorder menu items (drag-and-drop)
- [ ] Can manage submenus (add/edit/delete)
- [ ] Save updates settings table
- [ ] Save triggers cache revalidation
- [ ] Changes visible on page after save

### **Footer Edit Modal**
- [ ] Same tests as Header, but for footer
- [ ] Correctly filters menu items (is_footer = true)

### **Layout Manager Modal**
- [ ] Opens from UniversalNewButton dropdown
- [ ] Fetches all page sections
- [ ] Displays sections with correct type labels
- [ ] Drag-and-drop works smoothly
- [ ] Display order updates visually
- [ ] Save updates all tables correctly
- [ ] Page sections render in new order after save
- [ ] Cache revalidation triggers

### **Integration**
- [ ] All providers wrapped in ClientProviders
- [ ] Edit buttons visible only to admins
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Works on mobile (responsive)
- [ ] Loading states work correctly
- [ ] Error handling works (network failures)

---

## 🚀 Deployment Steps

1. **Run Database Migration**
   ```bash
   # Execute add_display_order_to_hero.sql
   ```

2. **Install Dependencies** (if new packages needed)
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

3. **Create Files** (in order)
   - Context providers
   - Modal components
   - API routes
   - Integration updates

4. **Test Locally**
   - Run dev server
   - Test all modals
   - Verify database updates

5. **Deploy to Staging**
   ```bash
   git add .
   git commit -m "feat: add Header/Footer/Layout Manager modals"
   git push
   ```

6. **Test in Staging**
   - Verify all functionality
   - Test cache revalidation
   - Check mobile responsiveness

7. **Deploy to Production**

---

## 📊 Estimated Timeline

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| **Phase 1: Database** | Migrations, indexes | 1 hour |
| **Phase 2: Contexts** | HeaderEdit, FooterEdit, LayoutManager | 4 hours |
| **Phase 3: Modals** | 3 main modals + sub-components | 8 hours |
| **Phase 4: API Routes** | menu-items, page-layout endpoints | 3 hours |
| **Phase 5: Integration** | Edit buttons, providers, routing | 2 hours |
| **Phase 6: Rendering** | Update page.tsx for display_order | 1 hour |
| **Testing** | Comprehensive testing | 3 hours |
| **Total** | | **~22 hours** |

---

## 🎯 Priority Order

**High Priority**:
1. ✅ Header Edit Modal (most requested, high visibility)
2. ✅ Layout Manager Modal (improves UX dramatically)

**Medium Priority**:
3. ✅ Footer Edit Modal (similar to header, easier after header is done)

---

## 💡 Future Enhancements

After initial implementation:

1. **Preview Mode**: Show live preview of changes before saving
2. **Undo/Redo**: Add history management for layout changes
3. **Templates**: Save/load layout presets
4. **Bulk Actions**: Select multiple menu items for batch operations
5. **Import/Export**: Export menu structure as JSON
6. **Permissions**: Fine-grained access control per modal
7. **Analytics**: Track which sections get reordered most

---

## 🎊 Success Criteria

✅ **All three modals implemented** with consistent design  
✅ **Edit buttons work** for Header and Footer  
✅ **Layout Manager** accessible from UniversalNewButton  
✅ **Database migrations** completed successfully  
✅ **Cache revalidation** works for all saves  
✅ **No TypeScript errors**  
✅ **Mobile responsive**  
✅ **Comprehensive testing** completed  
✅ **Documentation** updated  

---

**Status**: Ready for implementation! 🚀

**Next Step**: Start with Phase 1 (Database Migrations) and proceed sequentially.

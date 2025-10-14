# Quick Reference: Header, Footer & Layout Manager (REVISED)

## ✅ Correct Table & Field Names

### **Tables**
```
✅ website_hero
✅ website_templatesection
✅ website_templatesectionheading
✅ website_menuitem
✅ website_submenuitem
❌ blog_post (NOT included in Layout Manager)
```

### **Ordering Fields**
```
✅ website_hero.display_order          (needs to be ADDED)
✅ website_templatesection.order       (already EXISTS)
✅ website_templatesectionheading.order (already EXISTS)
✅ website_menuitem.order              (already EXISTS)
```

### **Menu Display Fields**
```
✅ is_displayed              (Controls Header menu visibility)
✅ is_displayed_on_footer    (Controls Footer menu visibility)
❌ is_footer                 (DOES NOT EXIST - don't use)
```

---

## 📊 Database Changes Required

### **Migration Needed**
```sql
-- ONLY need to add this one field:
ALTER TABLE website_hero 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
```

### **Fields Already Exist** ✅
- `website_templatesection.order`
- `website_templatesectionheading.order`
- `website_menuitem.order`
- `website_menuitem.is_displayed`
- `website_menuitem.is_displayed_on_footer`

---

## 🔌 API Endpoints (Correct Queries)

### **Header Menu Items**
```typescript
// GET header menus
GET /api/menu-items?organization_id={id}&is_displayed=true

// Query
.from('website_menuitem')
.eq('is_displayed', true)
.order('order', { ascending: true })
```

### **Footer Menu Items**
```typescript
// GET footer menus
GET /api/menu-items?organization_id={id}&is_displayed_on_footer=true

// Query
.from('website_menuitem')
.eq('is_displayed_on_footer', true)
.order('order', { ascending: true })
```

### **Page Layout**
```typescript
// GET page sections
GET /api/page-layout?organization_id={id}

// Queries
.from('website_hero')
  .select('id, h1_title, display_order')
  
.from('website_templatesection')
  .select('id, section_title, "order"')
  .order('order', { ascending: true })
  
.from('website_templatesectionheading')
  .select('id, title, "order"')
  .order('order', { ascending: true })
```

---

## 🎯 Layout Manager Scope

### **Included Sections**
✅ Hero (`website_hero`)
✅ Template Sections (`website_templatesection`)
✅ Heading Sections (`website_templatesectionheading`)

### **NOT Included**
❌ Blog Posts (`blog_post`) - Not displayed as sections on homepage

---

## 🔄 Update Operations

### **Reorder Hero**
```typescript
await supabase
  .from('website_hero')
  .update({ display_order: newOrder })
  .eq('id', heroId);
```

### **Reorder Template Sections**
```typescript
await supabase
  .from('website_templatesection')
  .update({ order: newOrder })  // Use 'order', not 'display_order'
  .eq('id', sectionId);
```

### **Reorder Heading Sections**
```typescript
await supabase
  .from('website_templatesectionheading')
  .update({ order: newOrder })  // Use 'order', not 'display_order'
  .eq('id', headingId);
```

### **Update Menu Item Display**
```typescript
// Show/hide in Header
await supabase
  .from('website_menuitem')
  .update({ is_displayed: true })
  .eq('id', menuId);

// Show/hide in Footer
await supabase
  .from('website_menuitem')
  .update({ is_displayed_on_footer: true })
  .eq('id', menuId);
```

---

## 📁 File Structure (Same)

```
src/components/modals/
├── HeaderEditModal/
│   ├── context.tsx
│   ├── HeaderEditModal.tsx
│   └── MenuItemManager.tsx
├── FooterEditModal/
│   ├── context.tsx
│   ├── FooterEditModal.tsx
│   └── FooterMenuManager.tsx
└── LayoutManagerModal/
    ├── context.tsx
    ├── LayoutManagerModal.tsx
    └── DraggableSectionList.tsx

src/app/api/
├── menu-items/
│   ├── route.ts
│   └── [id]/route.ts
└── page-layout/
    └── route.ts
```

---

## 🧪 Testing Queries

### **Check Hero Order**
```sql
SELECT id, h1_title, display_order 
FROM website_hero 
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY display_order;
```

### **Check Section Order**
```sql
-- Template sections
SELECT id, section_title, "order" 
FROM website_templatesection 
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY "order";

-- Heading sections
SELECT id, title, "order" 
FROM website_templatesectionheading 
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY "order";
```

### **Check Menu Items**
```sql
-- Header menus
SELECT display_name, url_name, "order", is_displayed
FROM website_menuitem 
WHERE organization_id = 'YOUR_ORG_ID'
  AND is_displayed = TRUE
ORDER BY "order";

-- Footer menus
SELECT display_name, url_name, "order", is_displayed_on_footer
FROM website_menuitem 
WHERE organization_id = 'YOUR_ORG_ID'
  AND is_displayed_on_footer = TRUE
ORDER BY "order";
```

---

## ⚡ Quick Start

```bash
# 1. Run migration
psql -d your_database -f migrations/add_display_order_to_hero_revised.sql

# 2. Create API routes
mkdir -p src/app/api/{menu-items/{[id]},page-layout}

# 3. Create modal directories
mkdir -p src/components/modals/{HeaderEditModal,FooterEditModal,LayoutManagerModal}

# 4. Start implementation
# Follow HEADER_FOOTER_LAYOUT_MODALS_REVISED_PLAN.md
```

---

## 🔑 Key Points

1. **Use `is_displayed`** for header menus (NOT `is_footer`)
2. **Use `is_displayed_on_footer`** for footer menus
3. **Use `order` field** for template sections and headings
4. **Use `display_order` field** for hero (after migration)
5. **Blog posts NOT included** in Layout Manager
6. **All menu items** can appear in both header AND footer (controlled by two boolean fields)

---

## 🚀 Implementation Priority

1. **Database Migration** (5 min) - Just add `display_order` to hero
2. **API Routes** (2 hours) - menu-items + page-layout endpoints
3. **HeaderEditContext** (1 hour) - Fetch/save header data
4. **HeaderEditModal** (2 hours) - UI with style + menu tabs
5. **FooterEditContext** (30 min) - Copy from header, change filters
6. **FooterEditModal** (1 hour) - Copy from header modal
7. **LayoutManagerContext** (1 hour) - Fetch/reorder sections
8. **LayoutManagerModal** (2 hours) - Drag-drop UI
9. **Integration** (1 hour) - Edit buttons + providers

**Total: ~11 hours** (reduced from 22 hours due to existing fields)

---

See `HEADER_FOOTER_LAYOUT_MODALS_REVISED_PLAN.md` for complete implementation details.

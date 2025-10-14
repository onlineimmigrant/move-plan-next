# Quick Reference: Header, Footer & Layout Manager Modals

## 🎯 Overview

Three new modals for managing header, footer, and page layout with drag-and-drop functionality.

---

## 📁 File Structure

```
src/
├── components/
│   ├── modals/
│   │   ├── HeaderEditModal/
│   │   │   ├── context.tsx                 ← State management
│   │   │   ├── HeaderEditModal.tsx         ← Main modal component
│   │   │   └── MenuItemManager.tsx         ← Drag-drop menu manager
│   │   │
│   │   ├── FooterEditModal/
│   │   │   ├── context.tsx
│   │   │   ├── FooterEditModal.tsx
│   │   │   └── FooterMenuManager.tsx
│   │   │
│   │   └── LayoutManagerModal/
│   │       ├── context.tsx
│   │       ├── LayoutManagerModal.tsx
│   │       └── DraggableSectionList.tsx    ← Drag-drop section list
│   │
│   ├── Header.tsx                           ← Add edit button
│   └── Footer.tsx                           ← Add edit button
│
├── app/
│   ├── api/
│   │   ├── menu-items/
│   │   │   ├── route.ts                     ← GET/POST menu items
│   │   │   ├── [id]/
│   │   │   │   └── route.ts                 ← PUT/DELETE individual item
│   │   │   └── batch/
│   │   │       └── route.ts                 ← Bulk update order
│   │   │
│   │   └── page-layout/
│   │       └── route.ts                     ← GET/PUT page section order
│   │
│   └── ClientProviders.tsx                  ← Add new providers
│
└── migrations/
    └── add_display_order_to_hero.sql        ← Database migration
```

---

## 🗄️ Database Changes

### **New Column**
```sql
ALTER TABLE website_hero 
ADD COLUMN display_order INTEGER DEFAULT 0;
```

### **Existing Columns** (verify)
- `template_sections.display_order` ✅
- `template_heading_sections.display_order` ✅
- `website_menuitem.order` ✅
- `website_menuitem.is_footer` ← Add if missing

---

## 🔌 Integration Points

### **1. Header Component**
```tsx
// src/components/Header.tsx

import { useHeaderEdit } from '@/components/modals/HeaderEditModal/context';
import { isAdminClient } from '@/lib/auth';

const { openModal } = useHeaderEdit();
const [isAdmin, setIsAdmin] = useState(false);

// Add edit button (visible only to admins)
{isAdmin && (
  <button onClick={openModal} className="...">
    <PencilIcon className="w-5 h-5" />
  </button>
)}
```

### **2. Footer Component**
```tsx
// src/components/Footer.tsx

import { useFooterEdit } from '@/components/modals/FooterEditModal/context';

const { openModal } = useFooterEdit();

// Same pattern as Header
```

### **3. UniversalNewButton**
```tsx
// src/components/AdminQuickActions/UniversalNewButton.tsx

import { useLayoutManager } from '@/components/modals/LayoutManagerModal/context';

const { openModal: openLayoutManager } = useLayoutManager();

// Add to menu
{
  label: 'Manage Layout',
  action: 'layout',
  description: 'Reorder page sections'
}

// Handle action
case 'layout':
  openLayoutManager();
  break;
```

### **4. Client Providers**
```tsx
// src/app/ClientProviders.tsx

import { HeaderEditProvider } from '@/components/modals/HeaderEditModal/context';
import { FooterEditProvider } from '@/components/modals/FooterEditModal/context';
import { LayoutManagerProvider } from '@/components/modals/LayoutManagerModal/context';
import HeaderEditModal from '@/components/modals/HeaderEditModal/HeaderEditModal';
import FooterEditModal from '@/components/modals/FooterEditModal/FooterEditModal';
import LayoutManagerModal from '@/components/modals/LayoutManagerModal/LayoutManagerModal';

<HeaderEditProvider>
  <FooterEditProvider>
    <LayoutManagerProvider>
      {/* Existing providers */}
      
      {/* Render modals */}
      <HeaderEditModal />
      <FooterEditModal />
      <LayoutManagerModal />
    </LayoutManagerProvider>
  </FooterEditProvider>
</HeaderEditProvider>
```

---

## 🎨 UI Components Used

### **From Existing Codebase**
- `BaseModal` - Main modal wrapper
- `EditableTextField` - Text inputs
- `EditableColorPicker` - Color selection
- `EditableGradientPicker` - Gradient backgrounds
- `EditableToggle` - Boolean switches
- `EditableSelect` - Dropdown selection
- `Button` - Action buttons
- `useToast` - Success/error notifications

### **New Components**
- `MenuItemManager` - Drag-drop menu list
- `FooterMenuManager` - Same for footer
- `DraggableSectionList` - Drag-drop page sections

### **Libraries**
- `@dnd-kit/core` - Drag and drop
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - CSS helpers

---

## 🔄 Data Flow

### **Header Edit Modal**

```
1. User clicks edit button
   ↓
2. openModal() from HeaderEditContext
   ↓
3. fetchHeaderData(organizationId)
   ↓
4. GET /api/organizations/{id} → header_style
   GET /api/menu-items?is_footer=false → menu items
   ↓
5. User edits styles/menu items
   ↓
6. saveHeaderStyle() or saveMenuItems()
   ↓
7. PUT /api/organizations/{id}
   PUT /api/menu-items/batch
   ↓
8. revalidateHomepage() → Cache updated
   ↓
9. Toast success message
```

### **Layout Manager Modal**

```
1. User clicks "Manage Layout" in UniversalNewButton
   ↓
2. openModal() from LayoutManagerContext
   ↓
3. fetchPageLayout(organizationId)
   ↓
4. GET /api/page-layout → all sections with display_order
   ↓
5. User drags sections to reorder
   ↓
6. reorderSections() → updates local state
   ↓
7. User clicks "Save Layout"
   ↓
8. saveSectionOrder()
   ↓
9. PUT /api/page-layout → updates display_order in DB
   ↓
10. revalidateHomepage() → Cache updated
    ↓
11. Toast success message
```

---

## 🧪 Testing Checklist

### **Header Edit Modal**
- [ ] Opens on button click
- [ ] Loads current styles
- [ ] Gradient picker works
- [ ] Menu items list loads
- [ ] Can add menu item
- [ ] Can edit menu item
- [ ] Can delete menu item
- [ ] Can reorder (drag-drop)
- [ ] Save works
- [ ] Cache revalidates
- [ ] Changes appear on site

### **Footer Edit Modal**
- [ ] Same as Header tests
- [ ] Correctly filters footer menus

### **Layout Manager**
- [ ] Opens from dropdown
- [ ] Shows all sections
- [ ] Drag-drop works
- [ ] Display order updates
- [ ] Save persists to DB
- [ ] Page renders in new order

---

## 🚀 Implementation Order

1. ✅ **Database Migration** (5 min)
2. ✅ **HeaderEditContext** (1 hour)
3. ✅ **HeaderEditModal** (2 hours)
4. ✅ **MenuItemManager** (2 hours)
5. ✅ **API Routes** (menu-items) (1 hour)
6. ✅ **Integration** (Header.tsx + providers) (30 min)
7. ✅ **Test Header Modal** (30 min)
8. ✅ **FooterEditContext** (copy from Header, 30 min)
9. ✅ **FooterEditModal** (copy from Header, 1 hour)
10. ✅ **Integration** (Footer.tsx) (15 min)
11. ✅ **LayoutManagerContext** (1 hour)
12. ✅ **LayoutManagerModal** (1 hour)
13. ✅ **DraggableSectionList** (2 hours)
14. ✅ **API Routes** (page-layout) (1 hour)
15. ✅ **Integration** (UniversalNewButton) (15 min)
16. ✅ **Update page rendering** (display_order) (30 min)
17. ✅ **Full testing** (1 hour)

**Total**: ~16 hours

---

## 📊 API Endpoints

### **Menu Items**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/menu-items?organization_id={id}&is_footer=false` | Get header menus |
| GET | `/api/menu-items?organization_id={id}&is_footer=true` | Get footer menus |
| POST | `/api/menu-items` | Create new menu item |
| PUT | `/api/menu-items/[id]` | Update menu item |
| DELETE | `/api/menu-items/[id]` | Delete menu item |
| PUT | `/api/menu-items/batch` | Bulk update order |

### **Page Layout**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/page-layout?organization_id={id}&page=home` | Get all sections |
| PUT | `/api/page-layout` | Save new section order |

---

## 💾 Context API Methods

### **HeaderEditContext**

```typescript
openModal()                                    // Open modal
closeModal()                                   // Close modal
fetchHeaderData(organizationId)                // Load data
saveHeaderStyle(style, organizationId)         // Save styles
saveMenuItems(items, organizationId)           // Save menu items
createMenuItem(item, organizationId)           // Add new item
updateMenuItem(id, updates)                    // Edit item
deleteMenuItem(id)                             // Remove item
reorderMenuItems(orderedIds)                   // Change order
```

### **LayoutManagerContext**

```typescript
openModal()                                    // Open modal
closeModal()                                   // Close modal
fetchPageLayout(organizationId, page)          // Load sections
reorderSections(orderedSections)               // Update order (local)
saveSectionOrder(organizationId)               // Persist to DB
```

---

## 🎨 Style Patterns

### **Type Badges** (Layout Manager)

```tsx
const getTypeBadge = (type: string, subtype?: string) => {
  const badges = {
    hero: 'bg-indigo-100 text-indigo-800',
    brands: 'bg-purple-100 text-purple-800',
    faqs: 'bg-green-100 text-green-800',
    help_center: 'bg-orange-100 text-orange-800',
    pricing: 'bg-yellow-100 text-yellow-800',
    features: 'bg-teal-100 text-teal-800',
    testimonials: 'bg-pink-100 text-pink-800',
    template_heading_section: 'bg-gray-100 text-gray-800',
    blog_post: 'bg-red-100 text-red-800'
  };
  
  const label = subtype || type;
  const className = badges[subtype || type] || badges.template_heading_section;
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>
      {label.replace('_', ' ').toUpperCase()}
    </span>
  );
};
```

### **Modal Tabs**

```tsx
<Tabs defaultValue="style">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="style">Style</TabsTrigger>
    <TabsTrigger value="menu">Menu Items</TabsTrigger>
  </TabsList>
  
  <TabsContent value="style">
    {/* Style settings */}
  </TabsContent>
  
  <TabsContent value="menu">
    {/* Menu manager */}
  </TabsContent>
</Tabs>
```

---

## ⚡ Quick Start

```bash
# 1. Run migration
psql -f migrations/add_display_order_to_hero.sql

# 2. Install dependencies (if needed)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# 3. Create directory structure
mkdir -p src/components/modals/{HeaderEditModal,FooterEditModal,LayoutManagerModal}
mkdir -p src/app/api/{menu-items/{[id],batch},page-layout}

# 4. Start with HeaderEditContext
# Create src/components/modals/HeaderEditModal/context.tsx
# (See full plan for complete code)

# 5. Test locally
npm run dev

# 6. Deploy
git add .
git commit -m "feat: add Header/Footer/Layout Manager modals"
git push
```

---

## 🎯 Success Metrics

✅ Admin can edit header styles without touching code  
✅ Admin can manage menu items with drag-drop  
✅ Admin can reorder page sections visually  
✅ All changes persist to database  
✅ Cache revalidates automatically  
✅ No TypeScript errors  
✅ Mobile responsive  
✅ Loading states work  
✅ Error handling robust  

---

**Ready to implement!** 🚀

See `HEADER_FOOTER_REORDER_MODALS_IMPLEMENTATION_PLAN.md` for full details.

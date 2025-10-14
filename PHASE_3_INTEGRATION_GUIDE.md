# 🚀 Phase 3 Quick Start: Integration Guide

**Time Required**: 30-45 minutes  
**Difficulty**: Easy  
**Prerequisites**: Phase 1 & 2 complete ✅

---

## 📋 INTEGRATION CHECKLIST

- [ ] Step 1: Update ClientProviders.tsx (10 min)
- [ ] Step 2: Add Header edit button (10 min)
- [ ] Step 3: Add Footer edit button (10 min)
- [ ] Step 4: Add Layout Manager link (10 min)
- [ ] Step 5: Quick test (5 min)

---

## STEP 1: Update ClientProviders.tsx

**File**: `src/components/ClientProviders.tsx`

### 1.1 Add Imports at Top
```tsx
// Add these imports at the top of the file
import { HeaderEditProvider } from './modals/HeaderEditModal/context';
import { FooterEditProvider } from './modals/FooterEditModal/context';
import { LayoutManagerProvider } from './modals/LayoutManagerModal/context';
import HeaderEditModal from './modals/HeaderEditModal/HeaderEditModal';
import FooterEditModal from './modals/FooterEditModal/FooterEditModal';
import LayoutManagerModal from './modals/LayoutManagerModal/LayoutManagerModal';
```

### 1.2 Wrap Existing Providers
```tsx
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <HeaderEditProvider>
      <FooterEditProvider>
        <LayoutManagerProvider>
          {/* ... all your existing providers stay here ... */}
          {children}
          
          {/* Add modal components at the very end, after children */}
          <HeaderEditModal />
          <FooterEditModal />
          <LayoutManagerModal />
        </LayoutManagerProvider>
      </FooterEditProvider>
    </HeaderEditProvider>
  );
}
```

**Why**: This makes the contexts available throughout the app and renders the modals.

---

## STEP 2: Add Header Edit Button

**File**: Find your Header component (likely `src/components/Header.tsx`)

### 2.1 Add Import
```tsx
import { useHeaderEdit } from '@/components/modals/HeaderEditModal/context';
```

### 2.2 Get Organization ID
You likely already have this in your Header component. If not:
```tsx
// Example - adjust based on your auth/org system
const { organization } = useOrganization();
// OR
const organizationId = 'your-org-id';
```

### 2.3 Get Modal Hook
```tsx
const { openModal } = useHeaderEdit();
```

### 2.4 Add Edit Button
Add this button somewhere in your header (typically near admin controls):
```tsx
{isAdmin && (
  <button
    onClick={() => openModal(organization.id)}
    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    title="Edit Header Settings"
  >
    ✏️ Edit Header
  </button>
)}
```

**Tip**: Adjust `isAdmin` check based on your permission system.

---

## STEP 3: Add Footer Edit Button

**File**: Find your Footer component (likely `src/components/Footer.tsx`)

### 3.1 Add Import
```tsx
import { useFooterEdit } from '@/components/modals/FooterEditModal/context';
```

### 3.2 Get Organization ID
```tsx
// Same as header - adjust based on your system
const { organization } = useOrganization();
```

### 3.3 Get Modal Hook
```tsx
const { openModal } = useFooterEdit();
```

### 3.4 Add Edit Button
```tsx
{isAdmin && (
  <button
    onClick={() => openModal(organization.id)}
    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    title="Edit Footer Settings"
  >
    ✏️ Edit Footer
  </button>
)}
```

---

## STEP 4: Add Layout Manager Link

**File**: Find your admin dropdown menu (likely `src/components/UniversalNewButton.tsx` or admin menu)

### 4.1 Add Import
```tsx
import { useLayoutManager } from '@/components/modals/LayoutManagerModal/context';
```

### 4.2 Get Organization ID
```tsx
const { organization } = useOrganization();
```

### 4.3 Get Modal Hook
```tsx
const { openModal } = useLayoutManager();
```

### 4.4 Add Menu Item
Add this to your dropdown/menu:
```tsx
<button
  onClick={() => openModal(organization.id)}
  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
>
  📐 Manage Page Layout
</button>
```

**Alternative**: If you have a dedicated admin menu, add it there instead.

---

## STEP 5: Quick Test

### 5.1 Build and Start
```bash
npm run build
npm start
```

### 5.2 Test Each Modal

**Test Header Modal**:
1. Navigate to your site as admin
2. Click "Edit Header" button in header
3. Modal should open
4. Try changing style selector
5. Try dragging menu items
6. Click Save
7. Verify changes appear

**Test Footer Modal**:
1. Click "Edit Footer" button in footer
2. Modal should open
3. Try changing style selector
4. Try dragging menu items
5. Click Save
6. Verify changes appear

**Test Layout Manager**:
1. Click "Manage Page Layout" in admin menu
2. Modal should open
3. See all page sections listed
4. Try dragging sections to reorder
5. Click Save Layout
6. Refresh page and verify order changed

---

## 🐛 TROUBLESHOOTING

### Modal Won't Open
- Check ClientProviders.tsx is properly wrapped
- Verify import paths are correct
- Check browser console for errors
- Ensure organization ID is valid

### Can't Find Organization ID
Look for existing patterns in your codebase:
```bash
# Search for organization usage
grep -r "organization.id" src/
grep -r "organizationId" src/
```

### TypeScript Errors
```bash
# Check for errors
npm run type-check
# or
npx tsc --noEmit
```

### Modal Opens But No Data
- Check browser Network tab for API calls
- Verify `/api/menu-items` and `/api/page-layout` are accessible
- Check browser console for errors
- Verify organization ID is correct

---

## 📍 EXAMPLE INTEGRATION LOCATIONS

### Typical Header Component Structure
```tsx
export default function Header() {
  const { openModal } = useHeaderEdit();
  const { organization } = useAuth(); // or similar
  const isAdmin = checkAdminRole();

  return (
    <header>
      <nav>
        {/* menu items */}
      </nav>
      
      {/* Add edit button here */}
      {isAdmin && (
        <div className="admin-controls">
          <button onClick={() => openModal(organization.id)}>
            ✏️ Edit Header
          </button>
        </div>
      )}
    </header>
  );
}
```

### Typical Footer Component Structure
```tsx
export default function Footer() {
  const { openModal } = useFooterEdit();
  const { organization } = useAuth(); // or similar
  const isAdmin = checkAdminRole();

  return (
    <footer>
      {/* footer content */}
      
      {/* Add edit button here */}
      {isAdmin && (
        <div className="admin-controls">
          <button onClick={() => openModal(organization.id)}>
            ✏️ Edit Footer
          </button>
        </div>
      )}
    </footer>
  );
}
```

### Typical Admin Menu Structure
```tsx
export default function AdminMenu() {
  const { openModal } = useLayoutManager();
  const { organization } = useAuth();

  return (
    <div className="dropdown-menu">
      <button>New Hero Section</button>
      <button>New Template Section</button>
      <button>New Blog Post</button>
      
      {/* Add this */}
      <button onClick={() => openModal(organization.id)}>
        📐 Manage Page Layout
      </button>
    </div>
  );
}
```

---

## ✅ INTEGRATION COMPLETE CHECKLIST

Once integration is done, verify:

- [ ] Header edit button visible to admins
- [ ] Footer edit button visible to admins
- [ ] Layout Manager link in admin menu
- [ ] All three modals open without errors
- [ ] Header modal shows current style
- [ ] Header modal shows menu items
- [ ] Footer modal shows current style
- [ ] Footer modal shows menu items
- [ ] Layout Manager shows all sections
- [ ] Drag-and-drop works in all modals
- [ ] Save button works in all modals
- [ ] Cancel button closes modal
- [ ] Changes persist after save
- [ ] No console errors

---

## 🎉 NEXT: TESTING PHASE

After integration, proceed to comprehensive testing:

### Test Scenarios
1. **Header Style Changes** - Change between all 3 styles
2. **Header Menu Reordering** - Drag items to new positions
3. **Header Menu Visibility** - Toggle items on/off
4. **Footer Style Changes** - Change between all 3 styles
5. **Footer Menu Reordering** - Drag items to new positions
6. **Footer Menu Visibility** - Toggle items on/off
7. **Page Layout Reordering** - Move sections around
8. **Cache Revalidation** - Verify changes appear immediately
9. **Error Handling** - Test with network errors
10. **Cancel Behavior** - Verify changes revert on cancel

---

## 📚 REFERENCE

### Context Hooks
- `useHeaderEdit()` - Header modal state
- `useFooterEdit()` - Footer modal state
- `useLayoutManager()` - Layout manager state

### Context Methods
All contexts provide:
- `openModal(organizationId)` - Open the modal
- `closeModal()` - Close the modal
- `isOpen` - Boolean modal state
- `isLoading` - Boolean loading state
- `isSaving` - Boolean saving state

### API Endpoints Used
- `GET /api/organizations/:id` - Get org settings
- `PUT /api/organizations/:id` - Update org settings
- `GET /api/menu-items` - Get menu items
- `PUT /api/menu-items/:id` - Update menu item
- `GET /api/page-layout` - Get page sections
- `PUT /api/page-layout` - Update section order

---

**Estimated Time**: 30-45 minutes  
**Difficulty**: Easy  
**Next**: Testing & deployment

Good luck! 🚀

# FooterEditModal Redesign Plan
## Making it Match TemplateHeadingSectionModal & HeroSectionModal Design

---

## 🎯 Goal
Redesign FooterEditModal to have the **exact same visual style, structure, and UX patterns** as TemplateHeadingSectionModal and HeroSectionModal.

---

## 📋 Analysis of Existing Modals (TemplateHeading & Hero)

### 1. **Modal Container Structure**
- ✅ Uses `StandardModalContainer` (glassmorphism background)
- ✅ Purple theme with primary color integration
- ✅ Draggable, resizable, fullscreen support

### 2. **Header Design**
```tsx
<StandardModalHeader
  title="Heading Section"
  subtitle="Edit your template heading section"
  icon={PaintBrushIcon}
  iconColor={primary.base}
  onClose={closeModal}
/>
```
**Elements:**
- Icon (PaintBrushIcon) with primary color
- Title + Subtitle
- Close button (top-right)
- Glassmorphism background

### 3. **Quick Action Panel (Menu Buttons Bar)**
Located **below header**, **above content**:
```tsx
<div className="px-6 py-3 flex items-center border-b border-white/10 bg-white/30">
  <div className="flex gap-2">
    {/* Menu buttons with glassmorphism */}
  </div>
</div>
```

**Menu Buttons:**
- **Content Menu**: Title, Description, Button sections
- **Background Menu**: Image, Background sections

**Button Styles:**
- **Closed state**: Transparent background, border with primary color
- **Open state**: Gradient background (primary.base → primary.hover), white text, shadow
- **Hover state**: Border color intensifies
- **Icons**: Chevron down icon on each button

### 4. **Mega Menu Dropdown**
When a menu button is clicked:
- **Overlay**: Fixed inset-0 backdrop (z-40) to close menu when clicked outside
- **Mega Menu Panel**: Absolute positioned, full width, below menu bar
  - Position: `top: 132px` (below header + menu bar)
  - Background: White with shadow-2xl
  - Rounded bottom corners
  - Scrollable content area
  - Header with section title + "Esc to close" hint

**Content Structure:**
```tsx
<div className="absolute left-0 right-0 bg-white shadow-2xl z-50">
  <div className="max-w-7xl mx-auto px-6 py-6">
    {/* Section Header */}
    <div className="flex justify-between items-center mb-4 pb-3 border-b">
      <h2>Content Settings</h2>
      <button>
        <kbd>Esc</kbd> to close
      </button>
    </div>
    
    {/* Section Components */}
    <TitleSection {...props} />
    <DescriptionSection {...props} />
    <ButtonSection {...props} />
  </div>
</div>
```

### 5. **Preview Panel (Right Side - 50%)**
Split layout: 50% settings, 50% live preview
```tsx
<div className="grid grid-cols-2 gap-6">
  <div>{/* Settings sections */}</div>
  <div>
    <HeadingPreview 
      formData={formData}
      computedStyles={computedStyles}
      onTitleClick={handleInlineEditOpen}
      onDescriptionClick={handleInlineEditOpen}
      previewRefreshing={previewRefreshing}
    />
  </div>
</div>
```

### 6. **Inline Editing**
Click on preview element → Inline editor popup appears:
```tsx
{inlineEdit.field && (
  <div 
    className="fixed z-[60] bg-white shadow-2xl rounded-lg p-3"
    style={{ left: inlineEdit.position.x, top: inlineEdit.position.y }}
  >
    <textarea
      value={inlineEdit.value}
      onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
      className="w-96 h-32 border rounded-lg p-2"
      autoFocus
    />
    <div className="flex gap-2 mt-2">
      <Button onClick={handleInlineEditSave}>Save</Button>
      <Button onClick={handleInlineEditCancel}>Cancel</Button>
    </div>
  </div>
)}
```

### 7. **Footer with Action Buttons**
```tsx
<StandardModalFooter>
  <Button variant="danger" onClick={openDeleteConfirm}>
    Delete Section
  </Button>
  <div className="flex-1" />
  <Button variant="secondary" onClick={closeModal}>
    Cancel
  </Button>
  <Button variant="primary" onClick={handleSave} loading={isSaving}>
    Save Changes
  </Button>
</StandardModalFooter>
```

**Button Features:**
- **Delete**: Red, left-aligned, glassmorphism
- **Cancel**: Gray, glassmorphism
- **Save**: Purple gradient, glassmorphism, loading spinner

### 8. **Color Theme**
- **Primary**: Purple (`var(--primary-color)`)
- **Accents**: Purple gradients
- **Backgrounds**: White/30 opacity (glassmorphism)
- **Borders**: White/10 opacity
- **Shadows**: Purple-tinted (`${primary.base}40`)

### 9. **Keyboard Shortcuts**
- **Cmd/Ctrl + S**: Save
- **Esc**: Close inline edit → Close mega menu → Close modal (nested)
- **Enter**: Save inline edit (when focused)

---

## 🏗️ FooterEditModal Design Plan

### **Structure Overview**
```
StandardModalContainer
├─ StandardModalHeader (Icon: Cog6ToothIcon, Title: "Footer Settings")
├─ Menu Button Panel (Style, Menu Items, Preview tabs)
├─ Mega Menu Content Area (based on active tab)
│  ├─ Style Menu → StyleSection component
│  ├─ Menu Items Menu → MenuSection component
│  └─ Preview (always visible, 50% right side)
└─ StandardModalFooter (Cancel, Save)
```

---

## 📐 Detailed Component Plan

### **1. Modal Header**
```tsx
<StandardModalHeader
  title="Footer Settings"
  subtitle="Customize your website footer"
  icon={Cog6ToothIcon} // or AdjustmentsHorizontalIcon
  iconColor={primary.base}
  onClose={handleCancel}
/>
```

### **2. Menu Button Panel**
Create 2 menu buttons:

**Menu 1: "Style"**
- Opens StyleSection in mega menu
- Contains: Footer style selector, color pickers, gradient controls

**Menu 2: "Menu Items"** (or just "Menu")
- Opens MenuSection in mega menu
- Contains: Menu items list, drag-and-drop reordering, add/edit/delete

**Button Implementation:**
```tsx
<div className="px-6 py-3 flex items-center border-b border-white/10 bg-white/30 relative z-30">
  <div className="flex gap-2">
    {[
      { id: 'style', label: 'Style', icon: PaintBrushIcon },
      { id: 'menu', label: 'Menu Items', icon: Bars3Icon },
    ].map((menu) => (
      <button
        key={menu.id}
        onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
        onMouseEnter={() => setHoveredButton(menu.id)}
        onMouseLeave={() => setHoveredButton(null)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
        style={
          openMenu === menu.id
            ? {
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white',
                boxShadow: `0 4px 12px ${primary.base}40`,
              }
            : {
                backgroundColor: 'transparent',
                color: hoveredButton === menu.id ? primary.hover : primary.base,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: hoveredButton === menu.id ? `${primary.base}80` : `${primary.base}40`,
              }
        }
      >
        <menu.icon className="w-4 h-4" />
        <span>{menu.label}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>
    ))}
  </div>
</div>
```

### **3. Mega Menu Dropdown**
```tsx
{openMenu && (
  <>
    {/* Backdrop */}
    <div 
      className="fixed inset-0 z-40" 
      onClick={() => setOpenMenu(null)}
    />
    
    {/* Mega Menu Panel */}
    <div className="absolute left-0 right-0 bg-white shadow-2xl z-50 overflow-y-auto rounded-b-2xl" style={{ top: '132px', bottom: '80px' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h2 className="text-lg font-semibold">
            {openMenu === 'style' ? 'Footer Style Settings' : 'Menu Items Settings'}
          </h2>
          <button onClick={() => setOpenMenu(null)}>
            <kbd>Esc</kbd> to close
          </button>
        </div>
        
        {/* Content Grid: 50% Settings, 50% Preview */}
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT: Settings */}
          <div>
            {openMenu === 'style' && <StyleSection {...styleProps} />}
            {openMenu === 'menu' && <MenuSection {...menuProps} />}
          </div>
          
          {/* RIGHT: Live Preview */}
          <div>
            <FooterPreview 
              menuItems={localMenuItems}
              footerStyle={selectedStyle}
              footerStyleFull={footerStyleFull}
              onMenuItemClick={handleInlineEditOpen}
              previewRefreshing={previewRefreshing}
            />
          </div>
        </div>
      </div>
    </div>
  </>
)}
```

### **4. StyleSection Component**
Located in `sections/StyleSection.tsx`:
```tsx
- Footer style buttons (default, centered, minimal, mega)
- Background color picker
- Text color picker
- Gradient controls (if applicable)
- Border/shadow controls
```

### **5. MenuSection Component**
Located in `sections/MenuSection.tsx`:
```tsx
- DnD sortable menu items list
- Each item shows: name, visibility toggle, edit, delete
- Expand/collapse for submenu items
- Add new menu item button at bottom
- Inline editing support for menu names
```

### **6. FooterPreview Component**
Create new file: `preview/FooterPreview.tsx`
```tsx
- Mirrors actual Footer.tsx design
- Shows live changes from formData
- Click on menu item → Opens inline editor
- Glassmorphism refresh animation on changes
```

### **7. Inline Editing for Menu Items**
```tsx
{inlineEdit.field && (
  <div 
    className="fixed z-[60] bg-white shadow-2xl rounded-lg p-3 border border-purple-200"
    style={{ left: inlineEdit.position.x, top: inlineEdit.position.y }}
  >
    <label className="text-xs text-gray-600 mb-1">Menu Item Name</label>
    <input
      type="text"
      value={inlineEdit.value}
      onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
      className="w-64 border rounded-lg p-2 mb-2"
      autoFocus
    />
    <div className="flex gap-2">
      <Button size="sm" onClick={handleInlineEditSave}>Save</Button>
      <Button size="sm" variant="secondary" onClick={handleInlineEditCancel}>Cancel</Button>
    </div>
  </div>
)}
```

### **8. Footer Actions**
```tsx
<StandardModalFooter>
  <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
    Cancel
  </Button>
  <Button variant="primary" onClick={handleSave} loading={isSaving}>
    Save Changes
  </Button>
</StandardModalFooter>
```

### **9. Delete Confirmation Modal**
(Already exists, keep current implementation)

---

## 🎨 Visual Elements Checklist

### Icons to Use:
- ✅ `Cog6ToothIcon` - Header icon
- ✅ `PaintBrushIcon` - Style menu button
- ✅ `Bars3Icon` - Menu Items button
- ✅ `ChevronDownIcon` - Dropdown indicators
- ✅ `EyeIcon/EyeSlashIcon` - Visibility toggles
- ✅ `TrashIcon` - Delete buttons
- ✅ `PencilIcon` - Edit buttons
- ✅ `Bars3Icon` - Drag handle

### Color Scheme:
```tsx
// Primary purple theme
const primary = themeColors.cssVars.primary;

// Backgrounds
background: 'white/30' // Glassmorphism
border: 'white/10'
shadow: `0 4px 12px ${primary.base}40`

// Buttons
gradient: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
hover border: `${primary.base}80`
```

### Animations:
- Button hover: transition-all duration-300
- Preview refresh: fade + scale animation
- Menu dropdown: slide down with shadow
- Inline edit: fade in with shadow

---

## 📂 File Structure

```
FooterEditModal/
├── FooterEditModal.tsx          (Main orchestrator - NEW DESIGN)
├── types/
│   └── index.ts                 (✅ Already exists)
├── hooks/
│   ├── index.ts                 (✅ Already exists)
│   ├── useMenuOperations.ts     (✅ Already exists)
│   ├── useDragDropHandlers.ts   (✅ Already exists)
│   └── useInlineEdit.ts         (🆕 NEW - for inline editing)
├── sections/
│   ├── index.ts                 (✅ Already exists)
│   ├── StyleSection.tsx         (🔄 UPDATE - use mega menu format)
│   └── MenuSection.tsx          (🔄 UPDATE - use mega menu format)
├── preview/
│   ├── index.ts                 (🆕 NEW)
│   └── FooterPreview.tsx        (🆕 NEW - live preview component)
├── components/
│   ├── index.ts                 (✅ Already exists)
│   ├── MenuItemCard.tsx         (✅ Already exists)
│   └── SubmenuList.tsx          (✅ Already exists)
└── context.tsx                  (✅ Already exists)
```

---

## 🔄 Implementation Steps

### Phase 1: Update Main Modal Structure
1. Replace `BaseModal` with `StandardModalContainer`
2. Add `StandardModalHeader` with icon
3. Create menu button panel below header
4. Implement mega menu dropdown logic
5. Add keyboard shortcuts (Cmd+S, Esc)

### Phase 2: Update StyleSection
1. Move StyleSection content into mega menu format
2. Add split layout: 50% settings, 50% preview
3. Use glassmorphism buttons
4. Add color picker with primary theme

### Phase 3: Update MenuSection
1. Move MenuSection content into mega menu format
2. Keep existing DnD functionality
3. Add inline editing for menu items
4. Use glassmorphism cards

### Phase 4: Create FooterPreview
1. Create new preview component
2. Mirror Footer.tsx design
3. Add click handlers for inline editing
4. Add refresh animation

### Phase 5: Add Inline Editing
1. Create useInlineEdit hook
2. Add inline editor popup
3. Connect to menu items
4. Add keyboard shortcuts (Enter, Esc)

### Phase 6: Update Footer
1. Use `StandardModalFooter`
2. Add glassmorphism buttons
3. Add loading states
4. Remove delete button (footer can't be deleted)

### Phase 7: Polish & Test
1. Test all keyboard shortcuts
2. Test inline editing
3. Test DnD functionality
4. Test mega menu interactions
5. Test preview updates
6. Verify color theme consistency

---

## ✅ Success Criteria

1. **Visual Match**: FooterEditModal looks identical to TemplateHeadingSectionModal
2. **Mega Menus**: Style and Menu Items use dropdown mega menus
3. **Preview**: Live preview shows on right side (50% width)
4. **Inline Editing**: Click menu item in preview → Edit inline
5. **Glassmorphism**: All buttons, panels, and overlays use glassmorphism
6. **Purple Theme**: Primary color used consistently
7. **Keyboard Shortcuts**: Cmd+S, Esc work correctly
8. **Animations**: Smooth transitions on all interactions
9. **DnD Works**: Menu items can still be reordered
10. **Mobile Responsive**: Layout adapts for mobile

---

## 🚀 Ready to Implement?

This plan provides:
- ✅ Complete visual design specification
- ✅ Component structure breakdown
- ✅ Code examples for each section
- ✅ File organization plan
- ✅ Step-by-step implementation phases
- ✅ Success criteria

**Next Step**: Start with Phase 1 - Update the main modal structure!

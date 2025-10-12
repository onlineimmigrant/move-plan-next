# Menu Items Individual Display Mode - Implementation Complete

## Overview
Fixed the menu display logic to support **individual display modes per menu item** instead of a collective "all or nothing" approach.

## Previous (Incorrect) Behavior
- If ANY menu item had `menu_items_are_text=false`, ALL menu items showed default MapIcon
- No differentiation between items - all forced to same display mode
- Individual item preferences were ignored

## New (Correct) Behavior
- Each menu item respects its own `menu_items_are_text` setting
- Items with `menu_items_are_text=false` show their **specific icon** from `react_icons` table
- Items with `menu_items_are_text=true` (or undefined/null) show **text** from `display_name`
- Mixed display modes supported: some items can show icons while others show text

## Implementation Details

### 1. Individual Display Mode Function
```typescript
const getItemDisplayMode = useCallback((item: MenuItem) => {
  // If explicitly set, use that value
  if (item.menu_items_are_text !== undefined && item.menu_items_are_text !== null) {
    return item.menu_items_are_text;
  }
  // Default to text mode if not specified
  return true;
}, []);
```

### 2. Icon Component Mapping
```typescript
const getIconComponent = useCallback((iconName: string | undefined) => {
  if (!iconName) return MapIcon;
  
  // Map of common heroicons
  const iconComponents: { [key: string]: React.ComponentType<any> } = {
    MapIcon,
    UserIcon,
    ShoppingCartIcon,
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    PlusIcon,
    MinusIcon,
  };
  
  return iconComponents[iconName] || MapIcon;
}, []);
```

### 3. Rendering Logic
Each menu item now checks its individual display mode:

```typescript
// Check individual item's display mode
const showAsText = getItemDisplayMode(item);

// Render based on item's preference
{showAsText ? (
  <span>{translatedDisplayName}</span>
) : item.image ? (
  <Image src={item.image} alt={translatedDisplayName} />
) : (
  <div>{renderIcon(getIconName(item.react_icons))}</div>
)}
```

## Database Schema

### website_menuitem Table
Each menu item has:
- `menu_items_are_text` (boolean, nullable): Display preference for this item
  - `true`: Show as text from `display_name`
  - `false`: Show as icon from `react_icons` table
  - `NULL/undefined`: Default to text mode
- `react_icon_id` (integer, nullable): Foreign key to `react_icons.id`
- `display_name` (text): Text to display when in text mode
- `image` (text, nullable): Optional custom image URL

### react_icons Table
Icons are fetched through JOIN:
```sql
SELECT 
  website_menuitem.*,
  react_icons.icon_name
FROM website_menuitem
LEFT JOIN react_icons ON website_menuitem.react_icon_id = react_icons.id
```

## Example Scenarios

### Scenario 1: Mixed Display
```sql
-- Menu Item 1: Show as text
menu_items_are_text = true
display_name = "About Us"
→ Renders: "About Us" (text)

-- Menu Item 2: Show as icon
menu_items_are_text = false
react_icon_id = 5 (UserIcon)
→ Renders: UserIcon (from react_icons table)

-- Menu Item 3: Default (no preference set)
menu_items_are_text = NULL
display_name = "Contact"
→ Renders: "Contact" (text, default)
```

### Scenario 2: All Icons
```sql
-- All items with menu_items_are_text = false
-- Each shows its specific icon from react_icons table
Item 1 → MapIcon
Item 2 → UserIcon
Item 3 → ShoppingCartIcon
```

### Scenario 3: All Text
```sql
-- All items with menu_items_are_text = true or NULL
-- All show their display_name as text
Item 1 → "Home"
Item 2 → "Products"
Item 3 → "Contact"
```

## Icon Fallback Logic

1. **Primary**: Use icon from `react_icons` table via `react_icon_id`
2. **Secondary**: Use custom `image` URL if provided
3. **Fallback**: Use `MapIcon` as default

## Debug Logging

Enhanced debug output shows individual item modes:

```javascript
console.log('Menu items breakdown (individual display modes):', 
  menuItems?.map(item => ({
    display_name: item.display_name,
    menu_items_are_text: item.menu_items_are_text,
    display_mode: getItemDisplayMode(item) ? 'text' : 'icon',
    has_react_icon_id: !!item.react_icon_id,
    icon_name: item.icon_name
  }))
);
```

## Files Modified

1. **src/components/Header.tsx**
   - Removed: `menuItemsAreText` useMemo (collective logic)
   - Added: `getItemDisplayMode()` callback (individual logic)
   - Updated: `getIconComponent()` for proper icon mapping
   - Updated: `renderIcon()` to use specific icon components
   - Updated: Desktop menu rendering with per-item logic
   - Updated: Debug logging to show individual modes

## Extending Icon Support

To add more icons, update the `iconComponents` map:

```typescript
const iconComponents: { [key: string]: React.ComponentType<any> } = {
  MapIcon,
  UserIcon,
  ShoppingCartIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  // Add new icons here
  HomeIcon,
  DocumentIcon,
  CogIcon,
  // etc.
};
```

## Testing Checklist

- [ ] Test menu item with `menu_items_are_text=true` shows text
- [ ] Test menu item with `menu_items_are_text=false` shows its specific icon
- [ ] Test menu item with `menu_items_are_text=NULL` defaults to text
- [ ] Test mixed menu (some text, some icons) displays correctly
- [ ] Test icon fallback when `icon_name` not found
- [ ] Test custom image fallback
- [ ] Verify MapIcon as final fallback
- [ ] Check browser console for debug output
- [ ] Verify no TypeScript errors
- [ ] Test both desktop and mobile views

## SQL Test Queries

### Test 1: Set specific items to icon mode
```sql
UPDATE website_menuitem 
SET menu_items_are_text = false, 
    react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'UserIcon')
WHERE display_name = 'About';
```

### Test 2: Set specific items to text mode
```sql
UPDATE website_menuitem 
SET menu_items_are_text = true
WHERE display_name = 'Contact';
```

### Test 3: Clear preference (default to text)
```sql
UPDATE website_menuitem 
SET menu_items_are_text = NULL
WHERE display_name = 'Home';
```

### Test 4: Verify current settings
```sql
SELECT 
  wm.display_name,
  wm.menu_items_are_text,
  wm.react_icon_id,
  ri.icon_name,
  wm.image,
  CASE 
    WHEN wm.menu_items_are_text = false THEN 'icon'
    WHEN wm.menu_items_are_text = true THEN 'text'
    ELSE 'text (default)'
  END as display_mode
FROM website_menuitem wm
LEFT JOIN react_icons ri ON wm.react_icon_id = ri.id
WHERE wm.is_displayed = true
ORDER BY wm.order;
```

## Benefits of Individual Display Mode

1. **Flexibility**: Each menu item can have its own display preference
2. **Mixed Layouts**: Support for icon-only, text-only, or mixed menus
3. **Specific Icons**: Each icon item shows its designated icon, not a generic fallback
4. **Backward Compatible**: NULL values default to text mode
5. **Extensible**: Easy to add new icons to the component map
6. **Maintainable**: Clear per-item logic, no complex collective rules

## Migration Path

If you have existing data with the old collective logic:

```sql
-- Option 1: Convert all to text mode (safest)
UPDATE website_menuitem 
SET menu_items_are_text = true;

-- Option 2: Convert specific items to icon mode
UPDATE website_menuitem 
SET menu_items_are_text = false,
    react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'YourIconName')
WHERE display_name IN ('Item1', 'Item2');

-- Option 3: Keep NULL for default text behavior
-- (no changes needed, NULL defaults to text)
```

## Status
✅ **Implementation Complete**
- Individual display mode logic implemented
- Proper icon component mapping added
- All TypeScript errors resolved
- Build successful
- Ready for testing

---
**Date**: October 12, 2025  
**Change Type**: Bug Fix + Feature Enhancement  
**Impact**: Header menu rendering logic  
**Breaking Changes**: None (backward compatible)

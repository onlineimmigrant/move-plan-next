# Header Style JSONB - Default Example

## Default Header Style Object

Based on the current Header.tsx component, here's the default `header_style` JSONB structure:

```json
{
  "type": "default",
  "background": "white",
  "color": "gray-700",
  "color_hover": "gray-900",
  "menu_width": "7xl",
  "menu_items_are_text": true
}
```

## Field Descriptions

### `type` (HeaderType)
**Values**: `'default' | 'minimal' | 'centered' | 'sidebar' | 'mega' | 'transparent'`
**Default**: `'default'`
**Description**: Determines the overall header layout and behavior

### `background` (string)
**Examples**: `'white'`, `'gray-50'`, `'#ffffff'`, `'transparent'`
**Default**: `'white'`
**Description**: Header background color (Tailwind class or hex)

### `color` (string)
**Examples**: `'gray-700'`, `'slate-600'`, `'#374151'`
**Default**: `'gray-700'`
**Description**: Default text/link color in header

### `color_hover` (string)
**Examples**: `'gray-900'`, `'black'`, `'#111827'`
**Default**: `'gray-900'`
**Description**: Hover state color for links/buttons

### `menu_width` (MenuWidth)
**Values**: `'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'`
**Default**: `'7xl'`
**Description**: Maximum width constraint for header content
**Maps to**: Tailwind's `max-w-{size}` classes

### `menu_items_are_text` (boolean)
**Values**: `true | false`
**Default**: `true`
**Description**: 
- `true`: Display menu items as text
- `false`: Display menu items as icons/images

## Current Header Styling (Default Type)

From the existing `Header.tsx` component:

### Typography
- **Menu item font size**: `text-[15px]` (15px)
- **Menu item font weight**: `font-medium` (500)
- **Active item font weight**: `font-semibold` (600)
- **Submenu heading**: `text-base font-semibold` (16px, 600)
- **Submenu item**: `text-sm` (14px)
- **Submenu description**: `text-xs text-gray-500` (12px)

### Colors
- **Default text**: `text-gray-700`
- **Hover text**: `text-gray-900`
- **Active text**: `text-gray-900 font-semibold`
- **Icon color**: `text-gray-600`
- **Dropdown arrow**: `text-gray-400` hover `text-gray-600`

### Spacing
- **Menu item padding**: `px-4 py-2.5`
- **Container padding**: Header uses max-width containers
- **Submenu padding**: `px-6 py-6`
- **Gap between items**: Flex layout with natural spacing

### Layout
- **Container**: `max-w-7xl mx-auto` (default)
- **Height**: Dynamic based on scroll state
- **Sticky behavior**: Fixed position with scroll effects
- **Submenu**: Mega menu dropdown for 2+ items
- **Mobile**: Slide-out panel with different layout

### Effects
- **Border radius**: `rounded-xl` on buttons (12px)
- **Transition**: `transition-colors duration-200`
- **Hover scale**: `hover:scale-105` on icons
- **Dropdown rotation**: `hover:rotate-180` on arrows
- **Shadow**: `shadow-lg` on submenus
- **Backdrop**: Glass effect on scroll with blur

### Submenu Features
- **Grid layout**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- **Image support**: `w-full h-40 object-cover rounded-lg`
- **Description**: Multi-line text with truncation
- **Hover effect**: `hover:shadow-xl transition-all duration-300`

## Header Type Variations

### 1. **Default** (`default`)
Current header - full-featured mega menu
- Multi-column dropdown
- Image support in submenus
- Full-width container
- Sticky with scroll effects

### 2. **Minimal** (`minimal`)
Simplified header with basic navigation
- Single-line menu items
- No mega menu (simple dropdowns)
- Smaller padding
- Less visual weight

### 3. **Centered** (`centered`)
Logo and menu centered in header
- Logo in center
- Menu items split left/right
- Balanced layout
- Good for portfolios

### 4. **Sidebar** (`sidebar`)
Vertical sidebar navigation
- Fixed left/right sidebar
- Vertical menu items
- Collapsible on mobile
- Good for dashboards

### 5. **Mega** (`mega`)
Enhanced mega menu focus
- Always show full-width menus
- Rich content in dropdowns
- Large images/descriptions
- E-commerce style

### 6. **Transparent** (`transparent`)
Overlay header for hero sections
- Transparent background
- White/light text
- Becomes solid on scroll
- Good for landing pages

## TypeScript Types

```typescript
export type HeaderType = 'default' | 'minimal' | 'centered' | 'sidebar' | 'mega' | 'transparent';
export type MenuWidth = 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';

export interface HeaderStyle {
  type?: HeaderType;
  color?: string;
  color_hover?: string;
  background?: string;
  menu_width?: MenuWidth;
  menu_items_are_text?: boolean;
}
```

## Migration from Legacy Fields

### Before (separate fields)
```typescript
settings: {
  header_style: 'default',  // string
  menu_width: '7xl',        // separate field
  menu_items_are_text: true // separate field
}
```

### After (JSONB consolidation)
```typescript
settings: {
  header_style: {
    type: 'default',
    background: 'white',
    color: 'gray-700',
    color_hover: 'gray-900',
    menu_width: '7xl',
    menu_items_are_text: true
  }
}
```

## Database Migration Query

```sql
-- Convert string header_style to JSONB with all fields
UPDATE settings
SET header_style = jsonb_build_object(
  'type', COALESCE(header_style::text, 'default'),
  'background', 'white',
  'color', 'gray-700',
  'color_hover', 'gray-900',
  'menu_width', COALESCE(menu_width, '7xl'),
  'menu_items_are_text', COALESCE(menu_items_are_text, true)
)
WHERE jsonb_typeof(header_style) = 'string' OR header_style IS NULL;
```

## Usage in Components

```tsx
// Parse header_style in Header.tsx
const headerStyles = useMemo(() => {
  if (!settings?.header_style) {
    return {
      type: 'default' as HeaderType,
      background: 'white',
      color: 'gray-700',
      colorHover: 'gray-900',
      menuWidth: '7xl',
      menuItemsAreText: true
    };
  }

  if (typeof settings.header_style === 'object') {
    return {
      type: (settings.header_style.type || 'default') as HeaderType,
      background: settings.header_style.background || 'white',
      color: settings.header_style.color || 'gray-700',
      colorHover: settings.header_style.color_hover || 'gray-900',
      menuWidth: settings.header_style.menu_width || '7xl',
      menuItemsAreText: settings.header_style.menu_items_are_text ?? true
    };
  }

  // Legacy string support
  return {
    type: 'default' as HeaderType,
    background: settings.header_style,
    color: 'gray-700',
    colorHover: 'gray-900',
    menuWidth: '7xl',
    menuItemsAreText: true
  };
}, [settings?.header_style]);
```

## Admin UI Controls

Header Style Field will include:
1. **Type Selector** - Dropdown for 6 header types
2. **Color Pickers** - Background, text, hover colors
3. **Menu Width** - Dropdown for lg through 7xl
4. **Display Mode Toggle** - Text vs Icon menu items
5. **Live Preview** - Shows current configuration

---

**Ready for implementation!**

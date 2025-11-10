# UnifiedMenu System

A unified, iOS-style menu system that consolidates all floating action buttons into a single, elegant interface with smart positioning and permission-based filtering.

## Overview

The UnifiedMenu replaces multiple individual floating buttons:
- ❌ ~~ChatHelpWidget~~
- ❌ ~~MeetingsAccountToggleButton~~
- ❌ ~~TicketsAccountToggleButton~~
- ❌ ~~UniversalNewButton~~

With a single, intelligent menu system: ✅ **UnifiedMenu**

## Features

### 🎨 Design
- **Glass Morphism**: Matches MeetingsBookingModal styling perfectly
- **Theme Support**: Uses `useThemeColors()` for dynamic primary colors
- **Responsive**: Mobile-first with full-screen overlay on mobile
- **Animations**: Smooth transitions and entrance animations

### 🧭 Smart Positioning
- **Viewport-Aware**: Automatically positions menu (top/bottom/left/right)
- **Collision Detection**: Prevents overflow at viewport edges
- **Mobile Optimized**: Full-screen modal on mobile devices

### 🔐 Permission System
- **Unauthenticated**: Limited access (Help Center, basic chat)
- **Authenticated**: Full access to personal features (Meetings, Tickets, Chat)
- **Admin/Superadmin**: Access to site management and quick actions
- **Feature Flags**: Support for organization-specific feature toggles

### ⌨️ Keyboard Navigation
- `↑/↓` - Navigate menu items
- `Enter` - Select item
- `Escape` - Close menu
- `Home/End` - Jump to first/last item

### 🔔 Badge System
- Dynamic badge counts per menu item
- Aggregated total badge on trigger button
- Support for both numbers and strings

## Architecture

```
UnifiedMenu/
├── UnifiedMenu.tsx              # Main orchestrator
├── UnifiedMenuButton.tsx        # Floating trigger button
├── UnifiedMenuDropdown.tsx      # Menu panel
├── UnifiedMenuItem.tsx          # Individual menu item
├── UnifiedModalManager.tsx      # Modal state management
├── types.ts                     # TypeScript definitions
├── config/
│   └── menuItems.ts            # Menu configuration
├── hooks/
│   ├── useMenuPosition.ts      # Position calculation
│   ├── useMenuItems.ts         # Permission filtering
│   └── useMenuKeyboard.ts      # Keyboard handling
└── utils/
    └── positioning.ts          # Position utilities
```

## Usage

### Basic Usage

```tsx
import { UnifiedModalManager } from '@/components/modals/UnifiedMenu';

// In your layout or page
<UnifiedModalManager />
```

### Custom Menu Items

```tsx
import { UnifiedMenu } from '@/components/modals/UnifiedMenu';
import { MenuItemConfig } from '@/components/modals/UnifiedMenu/types';

const customItems: MenuItemConfig[] = [
  {
    id: 'custom-feature',
    label: 'My Feature',
    description: 'Custom feature description',
    icon: MyIcon,
    action: () => openMyModal(),
    requireAuth: true,
    requireAdmin: false,
    section: 'top',
    badge: () => getUnreadCount(),
  },
];

<UnifiedMenu items={customItems} position="bottom-right" />
```

## Menu Item Configuration

### MenuItemConfig Interface

```typescript
interface MenuItemConfig {
  id: string;                    // Unique identifier
  label: string;                 // Display text
  description?: string;          // Subtitle text
  icon: ComponentType;           // Heroicon component
  action: () => void;            // Click handler
  
  // Permissions
  requireAuth: boolean;          // Must be logged in
  requireAdmin: boolean;         // Must be admin/superadmin
  requireSuperadmin?: boolean;   // Must be superadmin only
  requireFeature?: string;       // Feature flag requirement
  
  // UI
  badge?: (() => number | string | null) | number | string | null;
  section?: 'top' | 'bottom';    // Menu section
  color?: string;                // Custom color override
  hidden?: boolean;              // Hide from menu
}
```

## Default Menu Items

1. **Appointments** (Authenticated)
   - Opens MeetingsBookingModal
   - Schedule and manage meetings

2. **Support** (Authenticated)
   - Opens TicketsAccountModal
   - Create and track support tickets

3. **AI Chat** (All users)
   - Opens ChatWidget
   - Chat with AI assistant (limited for unauthenticated)

4. **Quick Actions** (Admin only)
   - Opens UniversalNewButton overlay
   - Create content quickly

5. **Help Center** (All users)
   - Opens ChatHelpWidget
   - Browse articles and FAQs

6. **Site Settings** (Admin only)
   - Navigates to /admin
   - Manage website settings

## Permission Model

```
┌─────────────────────────────────────────────────────────┐
│ User Type       │ Meetings │ Tickets │ Chat │ Admin    │
├─────────────────────────────────────────────────────────┤
│ Unauthenticated │    ❌    │    ❌   │  ⚠️  │    ❌    │
│ Authenticated   │    ✅    │    ✅   │  ✅  │    ❌    │
│ Admin           │    ✅    │    ✅   │  ✅  │    ✅    │
│ Superadmin      │    ✅    │    ✅   │  ✅  │    ✅    │
└─────────────────────────────────────────────────────────┘

⚠️ = Limited access
```

## Z-Index Layers

```
Fixed Elements:          52-56
Floating Buttons:        9998
Menu Dropdown:           10000
Modal Backdrops:         10000
Modal Content:           10001
Priority Modals:         10002
```

## Integration Points

### ClientProviders.tsx
```tsx
// Before
<ChatHelpWidget />
<UniversalNewButton />
<MeetingsAccountToggleButton />

// After
<UnifiedModalManager />
```

### Modal State Management
UnifiedModalManager handles:
- Opening/closing modals
- Modal state isolation
- Proper cleanup on unmount
- Z-index management

## Styling Guidelines

### Glass Morphism
```css
bg-white/50 dark:bg-gray-900/50
backdrop-blur-2xl
border border-white/20 dark:border-gray-700/20
shadow-2xl
rounded-2xl
```

### Theme Colors
Always use `useThemeColors()` hook:
```tsx
const themeColors = useThemeColors();
const primary = themeColors.cssVars.primary;

style={{ color: primary.base }}
```

## Future Enhancements

### Planned Features
- [ ] Badge animations (pulse on update)
- [ ] Swipe gestures on mobile
- [ ] Search/filter menu items
- [ ] Recent items section
- [ ] Customizable sections
- [ ] Drag-to-reorder items
- [ ] Persistent menu preferences

### Feature Flags (TODO)
Add to AuthContext:
```typescript
interface AuthContextType {
  // ... existing
  canAccessMeetings: boolean;
  canAccessTickets: boolean;
  canAccessChat: boolean;
  canAccessAdvancedAI: boolean;
}
```

## Troubleshooting

### Menu doesn't appear
- Check user permissions (console.log in useMenuItems)
- Verify not on /admin or /account routes
- Check Z-index conflicts

### Positioning issues
- Check viewport size calculations
- Verify button ref is attached
- Test on different screen sizes

### Modal not opening
- Verify modal props match interface
- Check modal lazy loading
- Inspect console for errors

## Performance

- ✅ Lazy loads all modals
- ✅ Memoized permission filtering
- ✅ Debounced position calculation
- ✅ Minimal re-renders
- ✅ Tree-shakeable exports

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## Accessibility

- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader announcements
- ✅ Focus management
- ✅ High contrast support

## Contributing

When adding new menu items:
1. Add to `config/menuItems.ts`
2. Update `UnifiedModalManager.tsx` action handler
3. Test all permission combinations
4. Verify mobile responsive
5. Update this README

## License

Same as parent project

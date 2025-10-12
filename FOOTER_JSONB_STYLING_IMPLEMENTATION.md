# Footer JSONB Styling Implementation

## Overview
Successfully migrated `footer_style` from a simple string value to a flexible JSONB object structure enabling complete footer theming control with dynamic colors for links, hover states, and backgrounds.

## Changes Made

### 1. Database Schema
Changed `settings.footer_style` column type from `VARCHAR` to `JSONB`:
```sql
ALTER TABLE settings 
ALTER COLUMN footer_style TYPE JSONB 
USING footer_style::text::jsonb;
```

### 2. Type Definitions (`src/types/settings.ts`)
Created new interface for JSONB structure:
```typescript
export interface FooterStyle {
  color?: string;         // Link default color
  color_hover?: string;   // Link hover color
  background?: string;    // Footer background color
}

export interface Settings {
  // Union type for backward compatibility
  footer_style: FooterStyle | string;
  // ... other properties
}
```

### 3. Footer Component (`src/components/Footer.tsx`)

#### A. Parsing Logic
Added `footerStyles` computed value using `useMemo`:
```typescript
const footerStyles = useMemo(() => {
  if (typeof settings.footer_style === 'object' && settings.footer_style !== null) {
    // JSONB object - extract properties
    return {
      background: settings.footer_style.background || 'neutral-900',
      color: settings.footer_style.color || 'neutral-400',
      colorHover: settings.footer_style.color_hover || 'white'
    };
  }
  // Legacy string value - use as background
  return {
    background: settings.footer_style || 'neutral-900',
    color: 'neutral-400',
    colorHover: 'white'
  };
}, [settings?.footer_style]);
```

#### B. Helper Functions
**getLinkColorClasses**: Returns Tailwind classes for standard colors or empty string for hex:
```typescript
const getLinkColorClasses = useCallback((isHeading: boolean = false) => {
  const { color, colorHover } = footerStyles;
  
  // If hex colors, return empty (use inline styles instead)
  if (color.startsWith('#') || colorHover.startsWith('#')) return '';
  
  // Return Tailwind classes
  return isHeading 
    ? `text-${color} hover:text-${colorHover}`
    : `text-${color} hover:text-${colorHover}`;
}, [footerStyles]);
```

**getLinkStyles**: Returns inline styles for hex colors:
```typescript
const getLinkStyles = useCallback((isHovered: boolean) => {
  const { color, colorHover } = footerStyles;
  
  // Only use inline styles for hex colors
  if (color.startsWith('#') || colorHover.startsWith('#')) {
    return {
      color: isHovered ? colorHover : color,
      transition: 'color 0.2s'
    };
  }
  
  return {};
}, [footerStyles]);
```

#### C. FooterLink Wrapper Component
Created reusable component managing hover state:
```typescript
const FooterLink = ({ 
  href, 
  children, 
  className = '', 
  isHeading = false 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string; 
  isHeading?: boolean 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={getLinkStyles(isHovered)}
    >
      <LocalizedLink
        href={href}
        className={`${getLinkColorClasses(isHeading)} ${className}`}
      >
        {children}
      </LocalizedLink>
    </span>
  );
};
```

#### D. Updated All Link Instances
Replaced all `<LocalizedLink>` with `<FooterLink>`:

**Menu heading links:**
```typescript
<h3 className="text-base font-semibold mb-4">
  <FooterLink
    href={item.url_name || '#'}
    className="transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
    isHeading={true}
  >
    {translatedDisplayName}
  </FooterLink>
</h3>
```

**Submenu item links:**
```typescript
<li key={subItem.id}>
  <FooterLink
    href={subItem.url_name || '#'}
    className="text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
  >
    {translatedSubItemName}
  </FooterLink>
</li>
```

**Privacy settings button:**
```typescript
<button
  type="button"
  onClick={handlePrivacySettings}
  onMouseEnter={() => setPrivacyHovered(true)}
  onMouseLeave={() => setPrivacyHovered(false)}
  className={`text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${getLinkColorClasses()}`}
  style={getLinkStyles(privacyHovered)}
>
  {translations.privacySettings}
</button>
```

## Features

### 1. Backward Compatibility
- Supports both JSONB object and legacy string values
- Automatically detects type and applies appropriate logic
- No breaking changes for existing installations

### 2. Flexible Color Support
- **Tailwind Classes**: `neutral-400`, `white`, `sky-500`, etc.
- **Hex Colors**: `#3B82F6`, `#10B981`, `#F59E0B`, etc.
- **System Colors**: `inherit`, `currentColor`, `transparent`

### 3. Dynamic Hover States
- Smooth transitions between normal and hover colors
- Works with both Tailwind classes and hex values
- Managed via React state for inline hex colors

### 4. Heading vs Regular Links
- `isHeading={true}` for menu heading links (h3 elements)
- Default for submenu items and regular links
- Consistent styling across all link types

## Example JSONB Values

### Default Theme (Dark)
```json
{
  "background": "neutral-900",
  "color": "neutral-400",
  "color_hover": "white"
}
```

### Blue Theme
```json
{
  "background": "blue-900",
  "color": "blue-300",
  "color_hover": "blue-100"
}
```

### Custom Hex Colors
```json
{
  "background": "#1E293B",
  "color": "#94A3B8",
  "color_hover": "#F1F5F9"
}
```

### Mixed Colors
```json
{
  "background": "slate-900",
  "color": "#94A3B8",
  "color_hover": "white"
}
```

## Next Steps

### 1. Update getSettings.ts
Change default `footer_style` value from string to JSONB object:
```typescript
footer_style: {
  background: 'neutral-900',
  color: 'neutral-400',
  color_hover: 'white'
}
```

### 2. Update SiteManagement Components
Add JSONB editing interface:

**src/components/SiteManagement/fieldConfig.tsx:**
- Update `footer_style` field type to support JSONB structure
- Add three input fields: `background`, `color`, `color_hover`
- Consider color picker component (e.g., `react-colorful`)

**src/components/SiteManagement/EditModal.tsx:**
- Parse JSONB structure for editing
- Provide separate inputs for each property
- Validate color values (Tailwind classes or hex)

**src/components/SiteManagement/CreateModal.tsx:**
- Set default JSONB structure for new records
- Ensure proper JSON formatting

**src/components/SiteManagement/LivePreview.tsx:**
- Preview footer with new colors in real-time
- Test hover states during editing

### 3. Update Other Routes
Check all API routes querying `settings.footer_style`:
```bash
grep -r "footer_style" src/app/api/
```
Verify JSONB parsing where needed.

### 4. Create Migration Script
SQL script for existing data:
```sql
-- Migrate existing string values to JSONB
UPDATE settings
SET footer_style = jsonb_build_object(
  'background', footer_style,
  'color', 'neutral-400',
  'color_hover', 'white'
)
WHERE jsonb_typeof(footer_style) = 'string';
```

## Testing Checklist

- [ ] Footer displays with correct background color
- [ ] Links show correct default color
- [ ] Links change color on hover
- [ ] Tailwind class colors work (e.g., `neutral-400`)
- [ ] Hex colors work (e.g., `#94A3B8`)
- [ ] Legacy string values still work (backward compatibility)
- [ ] Privacy settings button responds to hover
- [ ] Menu heading links styled correctly
- [ ] Submenu item links styled correctly
- [ ] Smooth transitions between colors
- [ ] No console errors or warnings
- [ ] TypeScript compilation successful
- [ ] All links remain functional

## Technical Notes

### Why Union Type?
Used `FooterStyle | string` for backward compatibility. Existing databases may have string values, and this approach ensures no breaking changes.

### Why Inline Styles for Hex?
Tailwind cannot generate classes for arbitrary hex values at runtime. Inline styles provide dynamic color support while maintaining performance.

### Why useState for Hover?
React state manages hover effects for hex colors, ensuring proper re-renders and smooth transitions. Tailwind's `hover:` pseudo-class handles standard colors automatically.

### Why useMemo and useCallback?
Performance optimization:
- `useMemo` prevents unnecessary re-computation of parsed styles
- `useCallback` maintains stable function references
- Reduces re-renders and improves footer performance

## Related Files

- **Types**: `src/types/settings.ts`
- **Component**: `src/components/Footer.tsx`
- **Settings**: `src/lib/getSettings.ts` (needs update)
- **Admin UI**: `src/components/SiteManagement/` (needs update)
- **Database**: `settings` table, `footer_style` column (JSONB)

## Migration Strategy

### Phase 1: ✅ Complete
- Type definitions updated
- Footer component refactored
- Backward compatibility implemented
- All links using new FooterLink wrapper

### Phase 2: 🔄 In Progress
- Update getSettings.ts default value
- Update SiteManagement components
- Add JSONB editing UI

### Phase 3: Pending
- Verify all routes
- Create migration script
- Update documentation
- Test deployment

## Deployment Notes

1. **Database Migration**: Run SQL to change column type
2. **Data Migration**: Convert existing string values to JSONB
3. **Code Deployment**: Deploy updated components
4. **Verification**: Test footer rendering across all pages
5. **Rollback Plan**: Revert column type if issues arise

## Support for Future Enhancements

This JSONB structure can be easily extended:
```json
{
  "background": "neutral-900",
  "color": "neutral-400",
  "color_hover": "white",
  "font_size": "text-sm",           // Future: font sizing
  "font_weight": "font-normal",     // Future: font weight
  "link_underline": false,          // Future: underline option
  "social_icon_color": "#3B82F6"    // Future: social icons
}
```

The current implementation provides a solid foundation for advanced footer theming capabilities.

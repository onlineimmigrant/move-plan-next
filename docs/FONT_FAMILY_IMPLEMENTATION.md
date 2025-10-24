# Font Family Implementation Guide

## Overview
The `settings.font_family` feature allows administrators to select the global font family for the entire site from the Site Management admin panel. This feature uses Next.js's optimized `next/font/google` system for optimal performance.

## Supported Fonts
The following Google Fonts are pre-loaded and available for selection:

1. **Inter** (Default) - Modern, clean sans-serif
2. **Roboto** - Popular, versatile sans-serif
3. **Poppins** - Geometric, friendly sans-serif
4. **Open Sans** - Humanist, highly readable
5. **Lato** - Classic, professional sans-serif

## How It Works

### 1. Font Loading (src/app/layout.tsx)
All supported fonts are pre-loaded using `next/font/google` with optimized settings:
- Display: swap (prevents FOIT)
- Preload: true (faster initial load)
- CSS variables: Each font gets its own CSS variable (e.g., `--font-inter`)

### 2. Font Selection
The selected font from `settings.font_family` is mapped to its corresponding CSS variable and applied to the `--app-font` CSS custom property on the `<body>` element.

### 3. Tailwind Integration
Tailwind's `fontFamily.sans` is configured to use `var(--app-font)`, making all Tailwind utility classes (`font-sans`, `text-*`, etc.) inherit the selected font.

### 4. CSS Fallback
A fallback is defined in `globals.css`:
```css
:root {
  --app-font: var(--font-inter, 'Inter', system-ui, sans-serif);
}
```

## Admin UI Usage

### Changing the Site Font
1. Navigate to **Admin Panel** → **Site Management**
2. Locate the **Layout & Design** section
3. Find **Typography & Colors** subsection
4. Select your desired font from the **Font Family** dropdown
5. Click **Save**
6. The change applies immediately across the entire site

## Technical Details

### Files Modified
- `src/types/settings.ts` - Added `FontFamily` type and `font_family` field
- `src/app/layout.tsx` - Implemented font loading and selection logic
- `src/app/globals.css` - Added CSS variable fallback
- `tailwind.config.js` - Updated to use dynamic font variable
- `src/components/SiteManagement/fieldConfig.tsx` - Added font selector dropdown

### Type Definition
```typescript
export type FontFamily = 'Inter' | 'Roboto' | 'Poppins' | 'Open Sans' | 'Lato';

export interface Settings {
  // ... other fields
  font_family?: FontFamily | string | null;
}
```

### CSS Variables
- `--font-inter` - Inter font
- `--font-roboto` - Roboto font
- `--font-poppins` - Poppins font
- `--font-opensans` - Open Sans font
- `--font-lato` - Lato font
- `--app-font` - Currently selected font (dynamic)

## Testing

### Manual Testing Steps
1. Start the development server: `npm run dev`
2. Navigate to admin panel: `http://localhost:3000/admin`
3. Change the font family setting
4. Inspect the `<body>` element in browser DevTools
5. Verify:
   - `class` attribute includes all font variable classes
   - `style` attribute contains `--app-font: var(--font-[selected])`
   - Computed `font-family` reflects the selected font

### Expected Results
- Font changes should apply immediately after saving
- All text across the site should use the selected font
- Fallback fonts (system-ui, -apple-system, sans-serif) should load if Google Fonts fail

## Performance Considerations

### Optimization Features
- **Preloading**: All fonts are preloaded for faster initial render
- **Display Swap**: Prevents Flash of Invisible Text (FOIT)
- **Font Subsetting**: Only Latin character subset is loaded by default
- **Adjust Font Fallback**: Matches fallback font metrics to reduce layout shift

### Best Practices
- Limit to 5 supported fonts to avoid network overhead
- All fonts are loaded once at server render time
- Font selection is cached per organization

## Troubleshooting

### Font Not Changing
1. Clear browser cache and hard refresh (Cmd/Ctrl + Shift + R)
2. Verify `settings.font_family` is saved in database
3. Check browser console for font loading errors
4. Inspect `<body>` element to verify CSS variables are set

### Font Loading Slowly
- Ensure `preload: true` is set for all font definitions
- Check network tab for font file loading times
- Verify CDN is not blocking Google Fonts

### TypeScript Errors
- Ensure `FontFamily` type includes all supported fonts
- Verify `settings.font_family` is optional (`?`) in Settings interface

## Future Enhancements

### Potential Additions
- Support for custom font uploads
- Per-component font overrides
- Font weight variants
- Additional Google Fonts
- Font preview in admin UI
- Font pairing suggestions

## Related Documentation
- [Next.js Font Optimization](https://nextjs.org/docs/basic-features/font-optimization)
- [Google Fonts](https://fonts.google.com/)
- [Tailwind CSS Customization](https://tailwindcss.com/docs/font-family)

# Header Style JSONB - Quick Reference

## 🎯 Default Structure

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

## 📋 Fields

| Field | Type | Values | Default |
|-------|------|--------|---------|
| `type` | HeaderType | default, minimal, centered, sidebar, mega, transparent | `'default'` |
| `background` | string | Tailwind class or hex | `'white'` |
| `color` | string | Tailwind class or hex | `'gray-700'` |
| `color_hover` | string | Tailwind class or hex | `'gray-900'` |
| `menu_width` | MenuWidth | lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl | `'7xl'` |
| `menu_items_are_text` | boolean | true, false | `true` |

## 🎨 Header Types

1. **default** - Full-featured mega menu (current)
2. **minimal** - Simplified navigation
3. **centered** - Logo centered, menu split
4. **sidebar** - Vertical sidebar navigation
5. **mega** - Enhanced mega menus
6. **transparent** - Overlay for hero sections

## 📏 Menu Widths

| Value | Pixels |
|-------|--------|
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |
| `3xl` | 1792px |
| `4xl` | 2048px |
| `5xl` | 2304px |
| `6xl` | 2560px |
| `7xl` | 2816px |

## 🔧 Files Modified

- ✅ `src/types/settings.ts`
- ✅ `src/components/SiteManagement/HeaderStyleField.tsx` (NEW)
- ✅ `src/components/SiteManagement/fieldConfig.tsx`
- ✅ `src/lib/getSettings.ts`
- ✅ `src/components/SiteManagement/SiteManagement.tsx`
- ✅ `src/app/api/organizations/[id]/route.ts`

## 📚 Documentation

- `HEADER_TYPE_SYSTEM_IMPLEMENTATION.md` - Full guide
- `HEADER_STYLE_DEFAULT_EXAMPLE.md` - Default structure
- `HEADER_STYLE_JSONB_IMPLEMENTATION_SUMMARY.md` - Summary

## ✅ Status

**Backend Complete** - Build successful, ready for Header.tsx implementation

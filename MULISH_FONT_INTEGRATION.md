# Mulish Font Integration

This document explains how the Mulish font was added to the multi-tenant system and how tenants can enable it.

## Summary
Mulish has been imported via `next/font/google` with weights 300–700 and added to the existing font loading strategy that preloads all supported families and applies the selected one using a CSS variable on the `<body>` element.

## Files Updated
- `src/app/layout.tsx`: Added `Mulish` import and configuration, appended `mulish.variable` to the aggregated `fontVarsClass`, and extended the font selection switch to map `settings.font_family === 'Mulish'` to the CSS variable `--font-mulish`.

## How Font Selection Works
1. Each tenant has a `settings` record with a `font_family` field.
2. In `layout.tsx`, the chosen font name (e.g., `Mulish`) maps to a CSS variable (e.g., `--font-mulish`).
3. All font variables are included in the `className` so fonts are preloaded and avoid layout shifts.
4. The `<body>` applies the selected font using `style={{ fontFamily: 
   "var(--font-mulish), system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}` when Mulish is selected.

## Adding Mulish for a Tenant
Set the `font_family` column in the `settings` row for the tenant to `Mulish` (exact capitalization). Example (Supabase SQL):
```sql
update settings set font_family = 'Mulish' where organization_id = 'YOUR_ORG_ID';
```
The next request for that domain will render with Mulish.

## Available Weights
Configured weights: `300, 400, 500, 600, 700`. Adjust in `layout.tsx` if more are needed.

## Fallback Behavior
`display: 'swap'` ensures text is immediately shown with system fallbacks until Mulish loads. The fallback stack matches other fonts for consistency.

## Extending Further
To add more fonts:
1. Import from `next/font/google` in `layout.tsx`.
2. Configure with `variable: '--font-newfont'`.
3. Add a `case 'New Font': return '--font-newfont';` in the selection switch.
4. Append the `.variable` to `fontVarsClass` array.

## Testing
To verify:
1. Set a tenant to `Mulish`.
2. Load a page and inspect `<body>` style—it should include `var(--font-mulish)`.
3. Check DevTools > Network for font files (they should use `swap`).

## Rollback
If issues occur, revert the `font_family` to a previous value (e.g., `Inter`) and remove the Mulish block in `layout.tsx`.

---
Maintainer Note: Keep font additions lean to avoid excessive font payloads; audit occasionally for unused families.

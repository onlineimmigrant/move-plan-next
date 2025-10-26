# Theme Colors Diagnostic

## Steps to Test

1. **Open Browser DevTools Console** (F12 or Cmd+Opt+I)

2. **Check if Settings are loaded:**
   ```javascript
   // Should show settings object with primary_color and primary_shade
   console.log('Settings check - open React DevTools and find SettingsProvider')
   ```

3. **Check if CSS Variables are set:**
   ```javascript
   // Run this in browser console
   const root = document.documentElement;
   console.log('--color-primary-base:', getComputedStyle(root).getPropertyValue('--color-primary-base'));
   console.log('--color-primary-hover:', getComputedStyle(root).getPropertyValue('--color-primary-hover'));
   console.log('Data attrs:', {
     color: root.getAttribute('data-primary-color'),
     shade: root.getAttribute('data-primary-shade')
   });
   ```

4. **Check if Button is receiving colors:**
   - Look for console.log "Button theme colors:" in console
   - Look for console.log "Theme colors applied:" from ThemeProvider

5. **Manually test inline style:**
   ```javascript
   // Find a button element and check its computed style
   const btn = document.querySelector('.btn-primary');
   if (btn) {
     console.log('Button background:', getComputedStyle(btn).backgroundColor);
     console.log('Button inline style:', btn.style.backgroundColor);
   }
   ```

## Expected Output

If working correctly:
- `--color-primary-base` should show a hex color like `rgb(2, 132, 199)` or similar
- Button should log theme colors object
- ThemeProvider should log "Theme colors applied" with color configuration
- Button background should be the theme color, not white or fallback

## Common Issues

### Issue 1: CSS Variables Not Set
**Symptom**: CSS variables return empty string
**Fix**: Check if ThemeProvider is wrapping the app in ClientProviders.tsx

### Issue 2: Settings Don't Include Colors
**Symptom**: Console shows primary_color is undefined
**Fix**: Check database migration was applied and getSettings includes color fields

### Issue 3: Button Shows Fallback Colors
**Symptom**: Buttons are still sky-600 hardcoded colors
**Fix**: Clear `.next` cache and rebuild: `rm -rf .next && npm run dev`

### Issue 4: Import Error with getColorValue
**Symptom**: Build error about getColorValue
**Fix**: Verify ColorPaletteDropdown exports the function properly

## Quick Fix Commands

```bash
# Clear cache and restart
rm -rf .next
npm run dev

# Check if server is running
curl -I http://localhost:3000

# Check database has color columns
# (Run in your database client)
SELECT primary_color, primary_shade, secondary_color, secondary_shade 
FROM settings 
LIMIT 1;
```

## Database Quick Test

If colors still don't work, manually set them:

```sql
UPDATE settings 
SET 
  primary_color = 'emerald',
  primary_shade = 500,
  secondary_color = 'purple',
  secondary_shade = 600
WHERE organization_id = (SELECT id FROM organizations LIMIT 1);
```

Then refresh browser - buttons should be emerald!

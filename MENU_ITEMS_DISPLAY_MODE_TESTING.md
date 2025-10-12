# Menu Items Display Mode - Testing Guide

## Quick Test Script

### Setup Test Data

```sql
-- Replace 'YOUR_ORG_ID' with your actual organization_id

-- Test 1: All items in text mode
UPDATE website_menuitem 
SET menu_items_are_text = true 
WHERE organization_id = 'YOUR_ORG_ID';

-- Verify
SELECT display_name, menu_items_are_text, react_icon_id, "order" 
FROM website_menuitem 
WHERE organization_id = 'YOUR_ORG_ID' 
ORDER BY "order";
```

**Expected Result:** All menu items display as text (display_name field)

---

### Test 2: Mixed Mode (One False = All Icons)

```sql
-- Set first item to icon mode (false)
UPDATE website_menuitem 
SET menu_items_are_text = false 
WHERE organization_id = 'YOUR_ORG_ID' 
AND "order" = 1;

-- Keep others as text mode (true)
UPDATE website_menuitem 
SET menu_items_are_text = true 
WHERE organization_id = 'YOUR_ORG_ID' 
AND "order" > 1;

-- Verify
SELECT display_name, menu_items_are_text, react_icon_id, icon_name, "order" 
FROM website_menuitem 
LEFT JOIN react_icons ON website_menuitem.react_icon_id = react_icons.id
WHERE organization_id = 'YOUR_ORG_ID' 
ORDER BY "order";
```

**Expected Result:** ALL menu items display as icons (because one has false)

---

### Test 3: All Items Icon Mode

```sql
-- Set all to icon mode
UPDATE website_menuitem 
SET menu_items_are_text = false 
WHERE organization_id = 'YOUR_ORG_ID';

-- Verify
SELECT display_name, menu_items_are_text, react_icon_id 
FROM website_menuitem 
WHERE organization_id = 'YOUR_ORG_ID' 
ORDER BY "order";
```

**Expected Result:** All menu items display as icons

---

### Test 4: Default Behavior (NULL values)

```sql
-- Set all to NULL
UPDATE website_menuitem 
SET menu_items_are_text = NULL 
WHERE organization_id = 'YOUR_ORG_ID';

-- Verify
SELECT display_name, menu_items_are_text, react_icon_id 
FROM website_menuitem 
WHERE organization_id = 'YOUR_ORG_ID' 
ORDER BY "order";
```

**Expected Result:** All menu items display as text (default fallback)

---

## Visual Verification Checklist

### Text Mode (All items `menu_items_are_text = true`)
- [ ] Header shows menu item names as text
- [ ] No icons visible in header menu
- [ ] Text is readable and properly styled
- [ ] Mobile menu shows text items
- [ ] Hover states work correctly

### Icon Mode (Any item `menu_items_are_text = false`)
- [ ] Header shows icons for ALL menu items
- [ ] Icons load from react_icons table (via react_icon_id)
- [ ] Icons are properly sized (24x24px)
- [ ] Custom images display if specified
- [ ] Fallback icons work if no react_icon_id
- [ ] Icons have proper hover effects
- [ ] Mobile menu shows icons

### Mixed Scenarios
- [ ] Setting one item to false makes all show icons
- [ ] Changing that item back to true shows all as text
- [ ] NULL/undefined values default to text mode
- [ ] Changes reflect immediately (no cache issues)

---

## Browser Console Verification

Open browser DevTools console and check logs:

```javascript
// You should see:
Menu items display mode (true=text, false=icons): [true/false]

// And breakdown:
Menu items breakdown: [
  {
    display_name: "About",
    menu_items_are_text: true,
    has_react_icon_id: true,
    icon_name: "InformationCircleIcon"
  },
  // ... more items
]
```

**Check:**
- Display mode matches expectations
- All items have correct `menu_items_are_text` value
- Icon names present when in icon mode

---

## API Response Verification

### Check `/api/menu` endpoint

```bash
curl "http://localhost:3000/api/menu?baseUrl=http://localhost:3000" | jq
```

**Verify each menu item has:**
```json
{
  "id": 1,
  "display_name": "About",
  "menu_items_are_text": true,  // or false
  "react_icon_id": 5,
  "react_icons": {
    "icon_name": "InformationCircleIcon"
  }
}
```

---

## Common Issues & Solutions

### Issue: All items show as text even when set to false
**Solution:** Check database values are actually `false` (not NULL or string 'false')
```sql
SELECT display_name, menu_items_are_text, pg_typeof(menu_items_are_text) 
FROM website_menuitem 
WHERE organization_id = 'YOUR_ORG_ID';
```

### Issue: Icons not loading
**Solution:** Verify react_icon_id is set and valid
```sql
SELECT wm.display_name, wm.react_icon_id, ri.icon_name
FROM website_menuitem wm
LEFT JOIN react_icons ri ON wm.react_icon_id = ri.id
WHERE wm.organization_id = 'YOUR_ORG_ID';
```

### Issue: Changes not reflecting
**Solution:** Clear Next.js cache
```bash
rm -rf .next
npm run dev
```

---

## Performance Testing

### Check Query Performance

```sql
EXPLAIN ANALYZE
SELECT 
  website_menuitem.*,
  react_icons.icon_name
FROM website_menuitem
LEFT JOIN react_icons ON website_menuitem.react_icon_id = react_icons.id
WHERE website_menuitem.organization_id = 'YOUR_ORG_ID'
ORDER BY website_menuitem."order";
```

**Expected:** Query should be < 5ms with proper indexes

---

## Edge Cases to Test

1. **No menu items**: Should show empty menu, no errors
2. **One menu item**: Logic should still work
3. **100+ menu items**: Performance should be acceptable
4. **Missing react_icon_id**: Should show fallback icon or text
5. **Invalid react_icon_id**: Should handle gracefully
6. **Special characters in display_name**: Should render correctly
7. **Very long display_name**: Should truncate or wrap
8. **Multilingual display_name**: Should use translations

---

## Regression Testing

Ensure these still work:

- [ ] Submenus open correctly
- [ ] Mobile hamburger menu works
- [ ] Language switcher still functions
- [ ] Contact modal opens from menu
- [ ] Shopping cart link works
- [ ] User menu (login/logout) works
- [ ] Active menu item highlighting
- [ ] Keyboard navigation
- [ ] Screen reader accessibility

---

## Admin Panel Testing

If you have an admin panel for managing menu items:

1. **Toggle menu_items_are_text via UI**
   - [ ] Checkbox or toggle works
   - [ ] Changes save to database
   - [ ] Preview updates immediately

2. **Assign react_icons via UI**
   - [ ] Icon picker works
   - [ ] Selected icon saves correctly
   - [ ] Icon displays in preview

3. **Bulk operations**
   - [ ] Set all to text mode
   - [ ] Set all to icon mode
   - [ ] Changes apply to all items

---

## Rollback Test

If something goes wrong:

```bash
# Run rollback migration
psql $DATABASE_URL < migrations/20251012_menu_items_text_footer_style_rollback.sql

# Restart dev server
npm run dev
```

**Verify:**
- [ ] Old behavior restored
- [ ] No errors in console
- [ ] Menu still displays correctly

---

## Success Criteria

✅ **All tests pass when:**
1. Text mode shows all items as text
2. Icon mode shows all items as icons
3. Mixed mode (one false) shows all as icons
4. NULL/undefined defaults to text
5. No console errors
6. No performance degradation
7. Mobile menu works correctly
8. Admin panel (if exists) works

---

**Test Duration:** ~15-30 minutes
**Prerequisites:** Database access, running dev server
**Tools Needed:** Browser DevTools, psql or database client

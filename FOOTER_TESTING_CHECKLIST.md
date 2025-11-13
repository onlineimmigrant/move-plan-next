# FooterEditModal - Testing Checklist ✅

## Quick Test Guide (15-20 minutes)

### Setup
- [ ] Run `npm run dev`
- [ ] Navigate to page with Footer edit button
- [ ] Open FooterEditModal

---

## 1. Style Settings (2 min)
- [ ] Click "default" style button - should show active state (blue border)
- [ ] Click "transparent" style button - should switch
- [ ] Click "fixed" style button - should switch
- [ ] Verify StyleSettingsPanel appears below
- [ ] Test any style setting changes - should show success toast

---

## 2. Menu Items - Add/Display (3 min)
- [ ] Click "Add Menu Item" button
- [ ] Type "Test Menu" in the input
- [ ] Press Enter → Should create new menu item
- [ ] Verify menu item appears in grid
- [ ] Verify count badge updates (e.g., "5 items")
- [ ] Click "Add Menu Item" again
- [ ] Type name and click "Create" button
- [ ] Click "Cancel" button - should close form

---

## 3. Menu Items - Inline Editing (4 min)
- [ ] Hover over menu item title → Edit icon should appear
- [ ] Click title → Should turn into input field
- [ ] Edit title and press Enter → Should save
- [ ] Hover over description → Click to edit
- [ ] Edit description and click outside (onBlur) → Should save
- [ ] Hover over URL slug (e.g., /about)
- [ ] Click URL → Should edit
- [ ] Type invalid chars (spaces, caps) → Should auto-clean on save
- [ ] Press Escape while editing → Should cancel changes

---

## 4. Menu Items - Visibility Toggle (1 min)
- [ ] Click eye icon (green) → Should turn gray (hidden)
- [ ] Click eye icon again → Should turn green (visible)
- [ ] Verify tooltip shows "Visible" or "Hidden"

---

## 5. Menu Items - Drag and Drop (2 min)
- [ ] Click and hold drag handle (6 dots icon)
- [ ] Drag menu item to different position
- [ ] Release → Should reorder
- [ ] Verify visual feedback during drag (card should scale up, show ring)
- [ ] Verify smooth animation after drop

---

## 6. Submenu Items - Add (3 min)
- [ ] If menu has submenus: Click chevron to expand
- [ ] If no submenus: Verify "Add Submenu Item" button shows
- [ ] Click "Add Submenu Item"
- [ ] Type submenu name
- [ ] Press Enter → Should create submenu
- [ ] Verify submenu count updates (e.g., "· 2 submenu")
- [ ] Add another submenu
- [ ] Click Cancel → Should close form

---

## 7. Submenu Items - Features (5 min)
- [ ] Click submenu image area (dashed border)
- [ ] ImageGalleryModal should open
- [ ] Select an image → Should display in submenu
- [ ] Click image again → Should allow changing
- [ ] Hover over submenu name → Edit icon appears
- [ ] Edit submenu name → Should save
- [ ] Edit submenu description → Should save
- [ ] Edit submenu URL slug → Should auto-clean
- [ ] Click submenu visibility toggle → Should work
- [ ] Verify purple header background on submenu cards

---

## 8. Submenu Items - Drag and Drop (2 min)
- [ ] Expand submenu disclosure (if not already)
- [ ] Drag submenu item by drag handle
- [ ] Reorder within submenu list
- [ ] Verify smooth drag animation
- [ ] Verify order saves successfully

---

## 9. Delete Operations (3 min)
- [ ] Click delete button (trash icon) on menu item
- [ ] Delete confirmation modal should appear
- [ ] Verify item name shows correctly in message
- [ ] Click "Cancel" → Should dismiss modal
- [ ] Click delete again
- [ ] Click "Delete" button → Should delete item
- [ ] Verify success toast appears
- [ ] Verify menu item removed from list
- [ ] Click delete on submenu item
- [ ] Verify delete confirmation shows "submenu item"
- [ ] Delete submenu → Should work

---

## 10. Save & Cancel (2 min)
- [ ] Make some changes (add item, reorder, etc.)
- [ ] Click "Cancel" button
- [ ] Modal should close
- [ ] Reopen modal → Changes should be reverted
- [ ] Make changes again
- [ ] Click "Save" button
- [ ] Should show saving spinner
- [ ] Modal should close on success
- [ ] Reopen modal → Changes should persist

---

## 11. Empty States (1 min)
- [ ] Delete all menu items
- [ ] Should show empty state:
  - Icon (3 horizontal lines)
  - "No menu items found"
  - "Add menu items to display them in the footer"

---

## 12. Error Handling (2 min)
- [ ] Disconnect internet (if possible)
- [ ] Try to save → Should show error message in red box
- [ ] Reconnect internet
- [ ] Save should work again
- [ ] Check browser console → No errors should appear

---

## 13. Responsive Design (2 min)
- [ ] Resize browser to mobile width (< 640px)
- [ ] Menu grid should show 1 column
- [ ] Resize to tablet (768px)
- [ ] Should show 2-3 columns
- [ ] Resize to desktop (1280px+)
- [ ] Should show 4-6 columns

---

## 14. Keyboard Shortcuts (1 min)
- [ ] Press Escape → Should close modal (if no unsaved changes)
- [ ] Open modal again
- [ ] In any input field:
  - [ ] Press Enter → Should save
  - [ ] Press Escape → Should cancel edit

---

## 15. Modal Features (1 min)
- [ ] Click fullscreen button (top right) → Should expand
- [ ] Click again → Should collapse
- [ ] Try to drag modal by title bar → Should move
- [ ] Click outside modal → Should close (or show save prompt)

---

## ✅ Expected Results

### All Tests Pass
- No console errors
- No TypeScript errors
- No visual glitches
- All animations smooth
- All saves successful
- All deletes successful
- All toasts appear correctly

### If Issues Found
1. Note specific test that failed
2. Check browser console for errors
3. Check Network tab for failed API calls
4. Document steps to reproduce
5. Report to dev team

---

## 🎯 Success Criteria

- [ ] **All 15 test sections passed**
- [ ] **0 console errors**
- [ ] **0 visual bugs**
- [ ] **Drag-and-drop works smoothly**
- [ ] **All saves persist correctly**
- [ ] **Modal opens/closes properly**

**If all checked → READY FOR PRODUCTION! 🚀**

---

## Quick Bug Report Template

```
**Test Section**: [e.g., "7. Submenu Items - Features"]
**Step**: [e.g., "Click submenu image area"]
**Expected**: [e.g., "ImageGalleryModal should open"]
**Actual**: [e.g., "Nothing happens"]
**Console Error**: [paste any errors]
**Screenshot**: [if applicable]
```

---

**Total Testing Time**: ~15-20 minutes  
**Last Updated**: [Current Session]

# Brands Section Fix - Query Parameter Mismatch

**Date**: October 13, 2025  
**Status**: ✅ **FIXED**

---

## 🐛 Issue Identified

The `is_brand` field was not fetching brands correctly because of a **query parameter naming mismatch**.

---

## 🔍 Root Cause

**API Route** (`/src/app/api/brands/route.ts`):
```typescript
const organizationId = searchParams.get('organizationId'); // ← Expects camelCase
```

**BrandsSection Component** (Before Fix):
```typescript
const response = await fetch(`/api/brands?organization_id=${organizationId}`); // ← Sending snake_case
```

**Result**: API returned 400 error "organizationId is required" because the parameter name didn't match.

---

## ✅ Fix Applied

**File**: `/src/components/TemplateSections/BrandsSection.tsx`

**Changed**:
```typescript
// BEFORE (Wrong - snake_case)
const response = await fetch(`/api/brands?organization_id=${organizationId}`);

// AFTER (Correct - camelCase)
const response = await fetch(`/api/brands?organizationId=${organizationId}`);
```

**Also added better error logging**:
```typescript
if (response.ok) {
  const data = await response.json();
  setBrands(data);
} else {
  console.error('Failed to fetch brands:', response.status, response.statusText);
}
```

---

## ✅ Verification

**Build Status**: ✅ Compiled successfully

**Expected Behavior Now**:
1. User toggles `is_brand` in Template Section Modal
2. Section saves with `is_brand = true`
3. Page renders `<BrandsSection />`
4. Component calls `/api/brands?organizationId=xxx` (correct param)
5. API returns brands data
6. `<Brands />` component displays brand logos carousel

---

## 🧪 Testing Steps

1. **Create Brand Section**:
   - Edit any template section
   - Toggle the 🏢 Brands button (purple)
   - Save

2. **Verify API Call**:
   - Open browser DevTools → Network tab
   - Look for `/api/brands?organizationId=...`
   - Should return 200 with brands data

3. **Verify Display**:
   - Refresh page
   - Brands carousel should appear
   - If no brands exist, section returns null (expected)

---

## 📝 Additional Notes

**Other Special Sections Work Because**:
- `BlogPostSlider` uses `/api/posts/featured` (no organizationId param issue)
- `ContactForm` is self-contained (no API call)
- `FAQSectionWrapper` uses `/api/faqs?organization_id=xxx` (API uses snake_case)

**Consistency Check**:
Should verify all API routes use consistent parameter naming. Current state:
- `/api/brands` → `organizationId` (camelCase) ✅
- `/api/faqs` → `organization_id` (snake_case) ⚠️
- `/api/posts/featured` → `organization_id` (snake_case) ⚠️

**Recommendation**: Either update all APIs to use camelCase OR update all components to use snake_case for consistency.

---

## ✅ Status

**Issue**: 🐛 Query parameter mismatch  
**Fix**: ✅ Applied - Changed to `organizationId`  
**Build**: ✅ Successful  
**Ready**: ✅ Ready for testing  

---

**Brands section should now work correctly!** 🎉

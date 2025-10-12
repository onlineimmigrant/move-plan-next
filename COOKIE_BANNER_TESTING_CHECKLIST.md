# Cookie Banner Phase 1 - Testing Checklist

## ✅ Pre-Testing Setup

- [ ] Deploy to production or staging environment
- [ ] Clear all browser cookies for testing
- [ ] Open Chrome DevTools (F12)
- [ ] Enable Network tab throttling (Fast 3G for realistic test)
- [ ] Open Performance tab for LCP measurement

---

## 🧪 Test 1: First-Time Visitor (No Cookie)

### Steps:
1. [ ] Clear cookies: `document.cookie = "cookies_accepted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"`
2. [ ] Hard refresh page (Cmd/Ctrl + Shift + R)
3. [ ] Observe banner appearance

### Expected Results:
- [ ] Banner appears **instantly** (no delay)
- [ ] No loading spinner visible
- [ ] Network tab shows **no request** to `/api/cookies/categories`
- [ ] Categories already populated

### Measure:
```javascript
// Run in console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('cookies/categories'))
  .forEach(r => console.log('FOUND:', r.name, r.duration));
// Expected: Empty array (no API calls)
```

### Pass Criteria:
- [ ] ✅ No API call to cookies endpoint
- [ ] ✅ Banner visible within 100ms
- [ ] ✅ All buttons functional

---

## 🧪 Test 2: Returning Visitor (Cookie Exists)

### Steps:
1. [ ] Accept cookies by clicking "Accept All"
2. [ ] Refresh page
3. [ ] Inspect page

### Expected Results:
- [ ] Banner does **not** appear at all
- [ ] No cookie banner in DOM
- [ ] No cookie-related JavaScript loaded

### Verify:
```javascript
// Check DOM
document.querySelector('[class*="cookie"]') === null
// Expected: true (no banner elements)
```

### Measure Bandwidth:
- [ ] Open Network tab
- [ ] Filter by "cookie"
- [ ] Expected: No banner-related files loaded

### Pass Criteria:
- [ ] ✅ Banner completely absent from page
- [ ] ✅ No banner elements in DOM
- [ ] ✅ Smaller initial bundle size

---

## 🧪 Test 3: Settings Modal Dynamic Load

### Steps:
1. [ ] Clear cookies
2. [ ] Refresh page
3. [ ] Click "Settings" button
4. [ ] Observe Network tab

### Expected Results:
- [ ] Modal appears after slight delay (< 500ms)
- [ ] Network tab shows dynamic chunk loaded
- [ ] Categories pre-populated (no API call)

### Verify:
```javascript
// Check for dynamic chunk in Network tab
// Look for: /_next/static/chunks/[hash].js
// This is the CookieSettings component loading
```

### Pass Criteria:
- [ ] ✅ Settings modal loads dynamically
- [ ] ✅ No API call for categories (uses props)
- [ ] ✅ Modal fully functional

---

## 🧪 Test 4: LCP Measurement (Critical!)

### Steps:
1. [ ] Clear cookies and cache
2. [ ] Open Performance tab in DevTools
3. [ ] Click "Record" button
4. [ ] Hard refresh page
5. [ ] Stop recording after page loads
6. [ ] Click on "LCP" marker in timeline

### Measure LCP:
```javascript
// In console BEFORE page load:
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('🎯 LCP:', Math.round(entry.renderTime || entry.loadTime), 'ms');
    console.log('📦 Element:', entry.element?.tagName, entry.element?.className);
  }
}).observe({type: 'largest-contentful-paint', buffered: true});
```

### Record Results:
- **LCP Before Phase 1:** _________ ms
- **LCP After Phase 1:** _________ ms
- **Improvement:** _________ ms
- **LCP Element:** _________ (should be Hero, not banner)

### Pass Criteria:
- [ ] ✅ LCP improved by 400-650ms
- [ ] ✅ LCP element is hero content (not cookie banner)
- [ ] ✅ LCP under 2.5s (Good threshold)

---

## 🧪 Test 5: PageSpeed Insights

### Steps:
1. [ ] Go to https://pagespeed.web.dev/
2. [ ] Enter your site URL
3. [ ] Run test for **Mobile**
4. [ ] Run test for **Desktop**

### Record Metrics:

**Before Phase 1:**
- Mobile LCP: _________ s
- Desktop LCP: _________ s
- Performance Score: _________ / 100

**After Phase 1:**
- Mobile LCP: _________ s
- Desktop LCP: _________ s
- Performance Score: _________ / 100

### Pass Criteria:
- [ ] ✅ LCP improvement visible in PageSpeed
- [ ] ✅ Performance score increased
- [ ] ✅ No new errors or warnings

---

## 🧪 Test 6: Functional Testing

### Banner Buttons:
- [ ] "Accept All" button works
- [ ] "Reject All" button works
- [ ] "Settings" button opens modal
- [ ] Cookie preferences saved correctly

### Settings Modal:
- [ ] Opens when "Settings" clicked
- [ ] All categories visible
- [ ] Toggles work correctly
- [ ] "Save" button saves preferences
- [ ] "Close" button closes modal
- [ ] Dragging modal works (desktop)

### User Consent:
- [ ] Accepted consent persists after refresh
- [ ] Rejected consent persists after refresh
- [ ] Custom preferences persist after refresh

---

## 🧪 Test 7: Cross-Browser Testing

### Chrome:
- [ ] Banner renders correctly
- [ ] All functionality works
- [ ] LCP measurement recorded

### Safari:
- [ ] Banner renders correctly
- [ ] All functionality works
- [ ] No console errors

### Firefox:
- [ ] Banner renders correctly
- [ ] All functionality works
- [ ] No console errors

### Edge:
- [ ] Banner renders correctly
- [ ] All functionality works
- [ ] No console errors

---

## 🧪 Test 8: Mobile Testing

### iOS Safari:
- [ ] Banner renders correctly
- [ ] Buttons are tappable
- [ ] Settings modal works
- [ ] No layout issues

### Android Chrome:
- [ ] Banner renders correctly
- [ ] Buttons are tappable
- [ ] Settings modal works
- [ ] No layout issues

### Mobile Performance:
- [ ] Banner doesn't block content
- [ ] Scrolling smooth
- [ ] No jank or layout shift

---

## 📊 Test Results Summary

### Performance Improvements:
```
Metric                  | Before  | After   | Improvement
------------------------|---------|---------|-------------
LCP (ms)                | _______ | _______ | _______ ms
API Call Eliminated     | Yes     | No      | -200ms
Bundle Size (KB)        | _______ | _______ | _______ KB
Time to Interactive (ms)| _______ | _______ | _______ ms
```

### Functionality:
- [ ] ✅ All features working
- [ ] ✅ No regressions
- [ ] ✅ No console errors
- [ ] ✅ GDPR compliant

### User Experience:
- [ ] ✅ Banner appears smoothly
- [ ] ✅ Settings load quickly
- [ ] ✅ No visual glitches
- [ ] ✅ Mobile-friendly

---

## 🚨 Troubleshooting

### Issue: Banner doesn't appear
**Check:**
- [ ] Is `cookieAccepted` prop being passed correctly?
- [ ] Check server logs for category fetch errors
- [ ] Verify cookie name is `cookies_accepted`

### Issue: Categories not showing
**Check:**
- [ ] Database query in `getCookieCategories()` returning data?
- [ ] Props being passed to CookieBanner correctly?
- [ ] Console errors in CookieBanner component?

### Issue: Settings modal doesn't load
**Check:**
- [ ] Dynamic import syntax correct?
- [ ] Network tab showing chunk load failure?
- [ ] Console errors about module resolution?

### Issue: No LCP improvement
**Check:**
- [ ] Is banner still in critical render path?
- [ ] Are other resources blocking LCP?
- [ ] Try measuring with throttled network

---

## ✅ Final Approval Checklist

Before proceeding to Phase 2:
- [ ] All tests passed
- [ ] LCP improvement confirmed (400-650ms)
- [ ] No functionality broken
- [ ] No console errors
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] PageSpeed scores improved
- [ ] User acceptance testing complete

---

## 📝 Test Report Template

```
Date: _______________
Tester: _______________
Environment: Production / Staging / Local

PHASE 1 TEST RESULTS
====================

✅ PASSED / ❌ FAILED

Performance:
- LCP Improvement: _____ ms
- API Calls Eliminated: Yes / No
- Bundle Size Reduced: _____ KB

Functionality:
- Banner: ✅ / ❌
- Settings: ✅ / ❌
- Consent Saving: ✅ / ❌

Browsers:
- Chrome: ✅ / ❌
- Safari: ✅ / ❌
- Firefox: ✅ / ❌
- Edge: ✅ / ❌

Mobile:
- iOS: ✅ / ❌
- Android: ✅ / ❌

DECISION:
[ ] Phase 1 sufficient - no further action
[ ] Proceed with Phase 2
[ ] Proceed with Phase 3
[ ] Issues found - need fixes

Notes:
_______________________________________
_______________________________________
_______________________________________
```

---

**Ready to test! Good luck! 🚀**

*After completing tests, share results and we'll proceed with Phase 2 & 3 if needed.*

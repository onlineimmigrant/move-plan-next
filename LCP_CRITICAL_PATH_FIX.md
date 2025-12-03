# LCP Critical Path Optimization - URGENT FIX

## Problem Identified ⚠️

**Current LCP: 2,690 ms** - Caused by blocking CSS chain:
1. Initial HTML: 2,118 ms
2. CSS with 10 @import statements: **+572 ms blocking**

### Root Cause

The font optimization actually **made performance WORSE**:

**globals.css lines 1-60**:
```css
@import url('https://fonts.googleapis.com/css2?family=Mulish:...');
@import url('https://fonts.googleapis.com/css2?family=Roboto:...');
@import url('https://fonts.googleapis.com/css2?family=Poppins:...');
/* ... 7 more @import statements */
```

**Problem**: CSS `@import` is **render-blocking**. Browser must:
1. Download globals.css
2. Parse and find 10 `@import` statements  
3. Download each Google Font CSS file sequentially
4. Only then can render begin

**Result**: Critical path chain = 2,690 ms LCP

---

## Solution: Proper Font Loading Strategy

### Option 1: **Preload Critical Fonts Only** (RECOMMENDED)

Load Inter (primary UI font) via Next.js (fast), load others async via `<link>` in document `<head>`.

**Changes needed**:

1. **Remove all @import from globals.css** (eliminate blocking)
2. **Add async font links to layout.tsx head** (non-blocking)
3. **Keep Inter via Next.js** (critical, optimized)

### Option 2: **Single Combined Font Request**

Combine all fonts into one Google Fonts URL to reduce requests.

**Example**:
```html
<link 
  rel="stylesheet" 
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Poppins:wght@300;400;500;600;700&display=swap"
  media="print" 
  onload="this.media='all'"
/>
```

**Note**: Still render-blocking unless deferred with `media="print"` trick.

### Option 3: **Remove Non-Essential Fonts** (FASTEST)

Only load fonts actually used by the current organization.

---

## Implementation: Option 1 (Best Performance)

### Step 1: Remove ALL @import from globals.css

**File**: `src/app/globals.css`

**Remove lines 7-60** (all font @imports):

```css
/* DELETE THIS SECTION */
@import url('https://fonts.googleapis.com/css2?family=Mulish:...');
@import url('https://fonts.googleapis.com/css2?family=Roboto:...');
/* ... all other @import url(...) */

/* KEEP CSS variables */
:root {
  --font-mulish: 'Mulish', system-ui, -apple-system, sans-serif;
  --font-roboto: 'Roboto', system-ui, -apple-system, sans-serif;
  /* ... keep all CSS variables */
}
```

**Result**: Removes 10 blocking HTTP requests from critical path.

---

### Step 2: Add Non-Blocking Font Links to Head

**File**: `src/app/layout.tsx`

Add after `<head>` opens in the return statement:

```tsx
{/* Non-blocking async font loading - won't block LCP */}
<link
  rel="preconnect"
  href="https://fonts.googleapis.com"
/>
<link
  rel="preconnect"
  href="https://fonts.gstatic.com"
  crossOrigin="anonymous"
/>

{/* Async load non-critical fonts - won't block render */}
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&display=swap"
  media="print"
  onLoad="this.media='all'"
/>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
  media="print"
  onLoad="this.media='all'"
/>
{/* ... repeat for other 8 fonts */}

<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" />
</noscript>
```

**How it works**:
- `media="print"` - Browser downloads but doesn't block render (low priority)
- `onLoad="this.media='all'"` - Once loaded, applies fonts
- `preconnect` - Warm up connection to fonts.googleapis.com
- Fonts load in parallel after critical content renders

---

### Step 3: Alternative - Use Next.js Font Optimization

**Revert to original approach** but use `preload: false` for non-critical fonts:

```tsx
// layout.tsx
import { Inter, Roboto, Poppins } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true, // Critical font
  variable: '--font-inter'
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Non-critical, load async
  variable: '--font-roboto'
});

// ... repeat for each font with preload: false
```

**Pros**: Next.js handles optimization automatically
**Cons**: Still loads all fonts upfront (but optimized)

---

## Recommended Fix (Fastest to Implement)

### Quick Win: Remove @import, Use Preload Link

**1. Edit globals.css** - Remove @import statements, keep CSS variables:

```css
/* DELETE all @import url(...) lines 7-60 */

/* KEEP CSS variable definitions */
:root {
  --font-inter: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mulish: 'Mulish', system-ui, -apple-system, sans-serif;
  --font-roboto: 'Roboto', system-ui, -apple-system, sans-serif;
  --font-poppins: 'Poppins', system-ui, -apple-system, sans-serif;
  --font-lato: 'Lato', system-ui, -apple-system, sans-serif;
  --font-opensans: 'Open Sans', system-ui, -apple-system, sans-serif;
  --font-montserrat: 'Montserrat', system-ui, -apple-system, sans-serif;
  --font-nunito: 'Nunito', system-ui, -apple-system, sans-serif;
  --font-raleway: 'Raleway', system-ui, -apple-system, sans-serif;
  --font-ubuntu: 'Ubuntu', system-ui, -apple-system, sans-serif;
  --font-merriweather: 'Merriweather', 'Georgia', serif;
  --font-jetbrains-mono: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
}
```

**2. Add to layout.tsx head section** (around line 300-320):

```tsx
{/* Preconnect to Google Fonts */}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

{/* Async load fonts - won't block LCP */}
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Poppins:wght@300;400;500;600;700&family=Lato:wght@300;400;700&family=Open+Sans:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Ubuntu:wght@300;400;500;700&family=Merriweather:wght@300;400;700&display=swap"
  media="print"
  onLoad="this.media='all'"
/>
```

**Expected LCP Improvement**: 2,690ms → **~1,200-1,500ms** (50% reduction)

---

## Other LCP Optimizations

### 1. Reduce Initial HTML Size (2,118ms)

**Current**: `/ai-agents-module` - 23.39 KiB

**Check**:
- Is server response slow? (database queries?)
- Can we cache more aggressively?
- Edge middleware adding latency?

**Action**: Check middleware.ts for unnecessary operations

### 2. Critical CSS Inlining

Extract critical above-the-fold CSS and inline it in `<head>`.

**Tool**: Use Critical CSS generator
```bash
npm install critical --save-dev
```

### 3. Preload LCP Image/Hero

If page has hero image, preload it:
```tsx
<link rel="preload" as="image" href="/hero.jpg" />
```

---

## Summary

**Root Cause**: 10 blocking `@import` statements in globals.css

**Fix**: 
1. Remove @import from globals.css
2. Add single combined font <link> with media="print" trick
3. Or use Next.js fonts with preload:false

**Expected Result**: LCP reduced from 2,690ms to ~1,200-1,500ms

**Next Steps After Fix**:
1. Test LCP with Lighthouse
2. Verify fonts still load correctly
3. Check PageSpeed Insights
4. Monitor Core Web Vitals in production

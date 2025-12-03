# Bundle Size Optimization - Implementation Guide

## Analysis Complete ✅

### Current Bundle Issues Identified:

1. **12 Google Fonts loaded upfront: ~600-800KB**
   - All fonts imported in layout.tsx lines 19-140
   - Only ONE font is used per organization
   - Biggest single issue

2. **@mediapipe/tasks-vision: ~500KB+**
   - NOT FOUND in codebase (can be removed from package.json)
   - Dead dependency taking up space

3. **TipTap Rich Text Editor: ~200-250KB**
   - Used in PostEditor.tsx
   - Loaded on ALL pages even when not needed
   - Should be dynamically imported

4. **Duplicate DnD Libraries: ~150KB**
   - Both @hello-pangea/dnd AND @dnd-kit/* installed
   - Only @hello-pangea used in 2 files (CardSyncPlanner)
   - Already have @dnd-kit elsewhere - consolidate

5. **Large Route Bundles:**
   - `/account/edupro/.../lesson/[lessonId]`: 411kB
   - `/account/edupro/memory-hub`: 358kB  
   - `/account`: 351kB

## Implementation Steps

### Step 1: Remove Unused Dependencies (~500KB)

**Remove from package.json:**
```json
{
  "dependencies": {
    "@mediapipe/tasks-vision": "^0.10.22-rc.20250304", // REMOVE - not used
    "@mapbox/node-pre-gyp": "^2.0.0", // REMOVE - likely unused
  }
}
```

**Run after:**
```bash
npm uninstall @mediapipe/tasks-vision @mapbox/node-pre-gyp
npm run build
```

### Step 2: Dynamic Font Loading (~600-800KB)

**Problem:** layout.tsx loads ALL 12 fonts upfront

**Solution Option A - Server-Side Dynamic Import (RECOMMENDED):**
Create `src/lib/fonts/getFontForOrganization.ts`:

```typescript
import { Inter, Roboto, Poppins, /* ... */ } from 'next/font/google';

const fontConfigs = {
  Inter: Inter({
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    fallback: ['system-ui', '-apple-system', 'sans-serif'],
    variable: '--font-inter'
  }),
  Roboto: Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    variable: '--font-roboto'
  }),
  // ... only load based on settings.font
};

export function getFontClassName(fontName: string) {
  const font = fontConfigs[fontName] || fontConfigs['Inter'];
  return font.className;
}

export function getFontVariable(fontName: string) {
  const font = fontConfigs[fontName] || fontConfigs['Inter'];
  return font.variable;
}
```

**Solution Option B - CSS Variables Only (SIMPLER):**
Use system fonts with CSS fallbacks:

```typescript
// layout.tsx - Only load Inter as default
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
});

// In globals.css - Add font fallbacks
:root {
  --font-roboto: 'Roboto', system-ui, sans-serif;
  --font-poppins: 'Poppins', system-ui, sans-serif;
  /* ... */
}

@supports (font-variation-settings: normal) {
  /* Load Google Fonts via CSS @import only when needed */
  body[data-font="Roboto"] {
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
  }
}
```

**Recommended:** Use Option B for immediate ~600KB savings with minimal code changes.

### Step 3: Dynamic Import TipTap Editor (~200KB)

**Update components using PostEditor:**

```typescript
// Before (src/app/[locale]/admin/edit/[slug]/page.tsx or wherever used)
import PostEditor from '@/components/PostPage/PostEditor';

// After
import dynamic from 'next/dynamic';

const PostEditor = dynamic(
  () => import('@/components/PostPage/PostEditor'),
  {
    ssr: false, // Editor only works client-side
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
);
```

### Step 4: Consolidate DnD Libraries (~150KB)

**Option A:** Migrate @hello-pangea/dnd → @dnd-kit (already have it)

```typescript
// Before (src/components/ai/CardSyncPlanner.tsx)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// After (using existing @dnd-kit)
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
```

**Option B:** Keep @hello-pangea, remove @dnd-kit (if only used in 2 places)

Check where @dnd-kit is used:
```bash
grep -r "@dnd-kit" src/
```

Then remove the one used less.

### Step 5: Add Bundle Analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

**Add to next.config.js:**
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

**Run:**
```bash
ANALYZE=true npm run build
```

## Expected Results

| Optimization | Bundle Reduction | Effort |
|-------------|------------------|--------|
| Remove @mediapipe | ~500KB | 5 min |
| Dynamic Font Loading | ~600KB | 30 min |
| Dynamic TipTap Import | ~200KB | 15 min |
| Remove Duplicate DnD | ~150KB | 20 min |
| **TOTAL** | **~1.45MB → 450KB** | **70 min** |

## Implementation Order

1. ✅ Remove unused dependencies (5 min)
2. ✅ Add bundle analyzer (5 min)
3. ✅ Dynamic font loading (30 min) 
4. ✅ Dynamic TipTap import (15 min)
5. ✅ Consolidate DnD libraries (20 min)

**Total time: ~75 minutes for 70% bundle reduction**

## Verification

After each step, run:
```bash
npm run build | grep -A 3 "First Load JS"
```

Track the "First Load JS" number going down from ~411kB to ~150kB target.

## Next Steps (Future Optimization)

- Code split large routes (/account/edupro/*)
- Tree-shake icon libraries
- Implement route-based chunking
- Enable SWC minification
- Use Brotli compression


# Bundle Size Optimization Plan

## Current State
- **Total bundle size:** ~1MB+ (105kB shared baseline)
- **Largest routes:** 411kB, 358kB, 351kB
- **Main issues:** 12 Google Fonts, heavy dependencies, no code splitting

## Immediate Wins (Quick Fixes)

### 1. Dynamic Font Loading (~300-600KB savings)
**Problem:** All 12 Google Fonts loaded upfront in layout.tsx
**Solution:** Load fonts dynamically based on organization settings

```typescript
// Before (layout.tsx lines 19-140): All fonts loaded
import { Inter, Roboto, Poppins, Lato, ... } from 'next/font/google';

// After: Load only needed font dynamically
// Use next/font/local or dynamic import based on settings
```

### 2. Code Split Heavy Dependencies (~200-400KB savings)
**Problem:** TipTap, MediaPipe, Cloudinary loaded eagerly
**Solution:** Dynamic imports with next/dynamic

```typescript
// Use dynamic imports for editor
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), {
  ssr: false,
  loading: () => <EditorSkeleton />
});

// Load MediaPipe only when needed
const VideoAnalyzer = dynamic(() => import('@/components/VideoAnalyzer'), {
  ssr: false
});
```

### 3. Tree Shake Icon Libraries (~50-100KB savings)
**Problem:** Entire @heroicons/react imported
**Solution:** Individual icon imports

```typescript
// Before
import { UserIcon, HomeIcon } from '@heroicons/react/24/outline';

// After (in specific components only)
import UserIcon from '@heroicons/react/24/outline/UserIcon';
```

## Medium Priority (Requires Testing)

### 4. Route-Based Code Splitting
- Split `/account/edupro/*` routes (largest at 411kB)
- Lazy load admin components
- Separate chunks for authenticated vs public routes

### 5. Optimize Dependencies
**Replace heavy packages:**
- `@hello-pangea/dnd` → `@dnd-kit/*` (already have both, remove one)
- Consider lighter rich text editor than TipTap
- Lazy load Stripe only on checkout pages

### 6. Image Optimization
- Use next/image for all images (already doing)
- Enable WebP/AVIF formats
- Implement blur placeholders

## Advanced Optimizations

### 7. Shared Chunk Optimization
Current shared chunks: 105kB baseline
- Split vendor chunks by usage frequency
- Extract common components to shared chunk
- Use SWC minification

### 8. Remove Unused Dependencies
Check if actually used:
- `@cloudinary/*` - Can you use Cloudflare R2 only?
- `@mediapipe/tasks-vision` - Used for what feature?
- Multiple DnD libraries - Choose one

### 9. Font Subsetting
- Load only Latin subset (already doing)
- Reduce font weights (300, 400, 700 only)
- Use variable fonts where possible

## Implementation Priority

### Phase 1 (This Session - ~500KB reduction)
1. ✅ Convert fonts to dynamic loading based on org settings
2. ✅ Add dynamic imports for TipTap editor
3. ✅ Add dynamic imports for MediaPipe (if used)
4. ✅ Optimize icon imports

### Phase 2 (Next Session - ~200KB reduction)
1. Remove duplicate DnD library
2. Split large routes into smaller chunks
3. Lazy load admin components

### Phase 3 (Future - ~100KB reduction)
1. Audit and remove unused dependencies
2. Implement advanced code splitting
3. Optimize shared chunks

## Expected Results
- **Current:** ~1MB total
- **After Phase 1:** ~500KB (50% reduction)
- **After Phase 2:** ~300KB (70% reduction)
- **After Phase 3:** ~200KB (80% reduction)

## Monitoring
Use these commands to track progress:
```bash
npm run build | grep "First Load JS"
npx @next/bundle-analyzer
```

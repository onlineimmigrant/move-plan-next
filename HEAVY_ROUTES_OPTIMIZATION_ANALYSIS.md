# Heavy Routes Optimization Analysis

## Problem Statement

Three routes have excessive bundle sizes:
- `/account/edupro/[slug]/topic/[topicSlug]/lesson/[lessonId]` - **411 kB**
- `/account/edupro/memory-hub` - **358 kB**  
- `/account` - **351 kB**

## Root Cause Analysis

### Heavy Dependencies Identified

| Dependency | Size (node_modules) | Usage | Currently Dynamic? |
|------------|---------------------|-------|-------------------|
| **three** | 31 MB | 3D graphics library | ❌ No |
| **epubjs** | 6.7 MB | EPUB book viewer | ❌ No |
| **recharts** | 7.9 MB | Charting library | ❌ No |
| **chart.js** | 6.2 MB | Charting library | ❌ No |
| **gsap** | 6.2 MB | Animation library | ❌ No |
| **framer-motion** | 3.0 MB | Animation library | ❌ No |

### Dependency Usage Locations

#### 1. **epubjs** (6.7 MB) - CRITICAL ISSUE ⚠️
**Used in**: `/account/edupro/[slug]/topic/[topicSlug]/lesson/[lessonId]/page.tsx`

```tsx
// CURRENT (BAD): Direct import loads epubjs in main bundle
import EpubViewer from '@/components/edupro/EpubViewer';
```

**Impact**: Adds ~6.7 MB to the lesson page route (largest contributor to 411 kB bundle)

**Solution**: Dynamic import with loading state
```tsx
const EpubViewer = dynamic(() => import('@/components/edupro/EpubViewer'), {
  ssr: false,
  loading: () => <div>Loading book viewer...</div>
});
```

**Expected Savings**: ~150-200 KB from route bundle

---

#### 2. **chart.js** (6.2 MB) - MODERATE ISSUE
**Used in**:
- `/app/[locale]/admin/reports/[table]/page.tsx`
- `/app/[locale]/admin/components/ReportConstructor.tsx`
- `src/components/DynamicReportComponent/DynamicReportBody.tsx`

```tsx
// CURRENT (BAD): Direct imports
import { Chart, registerables } from "chart.js";
```

**Impact**: Adds significant weight to admin routes and report components

**Solution**: Dynamic import for report components
```tsx
const DynamicReportBody = dynamic(() => import('@/components/DynamicReportComponent/DynamicReportBody'), {
  ssr: false,
  loading: () => <div>Loading report...</div>
});
```

**Expected Savings**: ~100-150 KB from admin routes

---

#### 3. **framer-motion** (3.0 MB) - LOW PRIORITY
**Used in**:
- `src/components/AnimateElements/Stepper.tsx` ✅ Already dynamic in `/investors`
- `src/components/tally/FormRenderer.tsx`
- `src/components/banners/BannerTimer.tsx`

**Current Status**: Stepper already uses dynamic import in investors page
```tsx
const Stepper = dynamic(() => import('@/components/AnimateElements/Stepper'), { ssr: false });
```

**Remaining Issue**: FormRenderer and BannerTimer still use direct imports

**Solution**: Check if FormRenderer/BannerTimer are used in heavy routes
- If yes → dynamic import
- If no → leave as is (not affecting heavy routes)

**Expected Savings**: ~30-50 KB if used in heavy routes

---

#### 4. **recharts** (7.9 MB) - LOW PRIORITY
**Used in**: `src/components/MinersComponent/MinerCard.tsx`

```tsx
import { LineChart, Line, Tooltip as RechartsTooltip } from 'recharts';
```

**Impact**: Only if MinerCard is used in account routes

**Solution**: Check usage, then dynamic import if needed

---

#### 5. **three** (31 MB) - LOW PRIORITY
**Size**: Largest dependency but likely tree-shaken

**Action**: Check if actually contributing to bundle
```bash
ANALYZE=true npm run build
```

**Note**: Modern bundlers tree-shake three.js well, so may not be actual issue

---

#### 6. **gsap** (6.2 MB) - LOW PRIORITY  
**Usage**: Animation library, check actual usage in account routes

---

## Implementation Priority

### Phase 1: Critical (Immediate) - Expected ~200-250 KB savings

1. **Dynamic EpubViewer** (~150-200 KB saved)
   - File: `src/app/[locale]/account/edupro/[slug]/topic/[topicSlug]/lesson/[lessonId]/page.tsx`
   - Change: `import EpubViewer` → `dynamic(() => import(...))`
   - Impact: Reduces lesson page from 411 kB significantly

2. **Dynamic CardSyncPlanner** (if possible) (~50-100 KB saved)
   - File: `/account/edupro/memory-hub/page.tsx`
   - Check if CardSyncPlanner can be lazy-loaded
   - Reduces memory-hub from 358 kB

### Phase 2: Important (Next) - Expected ~100-150 KB savings

3. **Dynamic DynamicReportBody** (~100-150 KB saved)
   - Files: Admin report pages
   - Change: Direct import → `dynamic(() => import(...))`
   - Impact: Reduces admin route sizes

4. **Verify chart.js tree-shaking**
   - Ensure only used components imported
   - Use named imports: `import { Line, Bar } from 'chart.js'` not `import Chart from 'chart.js'`

### Phase 3: Optional (Future) - Expected ~30-50 KB savings

5. **Audit framer-motion usage**
   - Check if FormRenderer/BannerTimer affect heavy routes
   - Dynamic import if needed

6. **Analyze bundle with ANALYZE=true**
   - Identify actual contributors vs theoretical sizes
   - Focus optimization on real bundle weight

---

## Account Page Analysis (351 kB)

**File**: `src/app/[locale]/account/page.tsx`

**Imports**:
```tsx
import Toast from '@/components/Toast';
import AccountTopBar from '@/components/AccountTopBar';
import { AccountModalCard, AccountLinkCard } from '@/components/account/AccountCards';
import ChatWidget from '@/components/modals/ChatWidget/ChatWidget';
import TicketsAccountModal from '@/components/modals/TicketsModals/TicketsAccountModal/TicketsAccountModal';
import MeetingsBookingModal from '@/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal';
import { UnifiedModalManager } from '@/components/modals/UnifiedMenu';
```

**Potential Issues**:
1. **UnifiedModalManager** - May pull in many modal components
2. **MeetingsBookingModal** - Video call dependencies?
3. **ChatWidget** - Real-time chat libraries?

**Solution**: Dynamic import modals that aren't immediately visible
```tsx
const TicketsAccountModal = dynamic(() => import('@/components/modals/TicketsModals/TicketsAccountModal/TicketsAccountModal'), {
  ssr: false
});

const MeetingsBookingModal = dynamic(() => import('@/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal'), {
  ssr: false
});
```

**Expected Savings**: ~50-100 KB

---

## Implementation Steps

### Step 1: EpubViewer Dynamic Import (PRIORITY)

**File**: `src/app/[locale]/account/edupro/[slug]/topic/[topicSlug]/lesson/[lessonId]/page.tsx`

```tsx
// BEFORE (line 12)
import EpubViewer from '@/components/edupro/EpubViewer';

// AFTER
import dynamic from 'next/dynamic';

const EpubViewer = dynamic(() => import('@/components/edupro/EpubViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-gray-500">Loading book viewer...</div>
    </div>
  )
});
```

### Step 2: Account Page Modals Dynamic Import

**File**: `src/app/[locale]/account/page.tsx`

```tsx
// Add at top
import dynamic from 'next/dynamic';

// Replace modal imports
const TicketsAccountModal = dynamic(
  () => import('@/components/modals/TicketsModals/TicketsAccountModal/TicketsAccountModal'),
  { ssr: false }
);

const MeetingsBookingModal = dynamic(
  () => import('@/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal'),
  { ssr: false }
);
```

### Step 3: Memory Hub CardSyncPlanner (Check feasibility)

**File**: `/account/edupro/memory-hub/page.tsx`

```tsx
// Check if CardSyncPlanner can be lazy-loaded
const CardSyncPlanner = dynamic(() => import('@/components/ai/CardSyncPlanner'), {
  ssr: false,
  loading: () => <div>Loading planner...</div>
});
```

**Note**: CardSyncPlanner has complex state management - test thoroughly

### Step 4: Admin Reports Dynamic Import

**File**: `src/app/[locale]/admin/reports/custom/page.tsx`

```tsx
const DynamicReportBody = dynamic(
  () => import('@/components/DynamicReportComponent/DynamicReportBody'),
  { ssr: false, loading: () => <div>Loading report...</div> }
);
```

---

## Expected Results

| Route | Current Size | After Optimization | Savings |
|-------|--------------|-------------------|---------|
| `/account/edupro/.../lesson/[lessonId]` | 411 kB | ~200-250 kB | **~160-210 kB** ✅ |
| `/account/edupro/memory-hub` | 358 kB | ~250-300 kB | **~60-100 kB** ✅ |
| `/account` | 351 kB | ~250-300 kB | **~50-100 kB** ✅ |

**Total Expected Savings**: **~270-410 kB** (35-50% reduction)

---

## DnD Library Consolidation (Deferred)

### Current State
- `@dnd-kit` (6.3.1): Used in 8+ components ✅ Primary library
- `@hello-pangea/dnd` (18.0.1): Used in 2 components (CardSyncPlanner, CardSyncPlanner_old)

### Migration Complexity
**CardSyncPlanner.tsx** uses @hello-pangea/dnd extensively:
- `DragDropContext` (root context)
- `Droppable` (used 3 times - new-plan + multiple plan lists)
- `Draggable` (used for each flashcard item)
- Complex drag-between-lists logic with database updates

**Migration would require**:
1. Replace `DragDropContext` → `DndContext` with sensors
2. Replace `Droppable` → `SortableContext` with strategy
3. Replace `Draggable` → `useSortable` hook in each item
4. Refactor all `provided.innerRef` and `provided.draggableProps`
5. Update event handlers (`DropResult` → `DragEndEvent`)
6. Handle `snapshot.isDragging` → custom active state tracking
7. Extensive testing of drag between lists

**Estimated effort**: 4-6 hours development + 2-3 hours testing

**Risk**: High - complex state management with database operations

**Decision**: **DEFER** migration for now
- Keep `@hello-pangea/dnd` (adds ~150 KB to bundle)
- Focus on higher-ROI optimizations first (EpubViewer, modals)
- Revisit after Phase 1-2 optimizations complete
- Potential savings (~150 KB) less than effort/risk ratio

---

## CardSyncPlanner @dnd-kit Migration (Deferred Technical Notes)

For future reference if migrating:

### API Differences

| @hello-pangea/dnd | @dnd-kit | Notes |
|-------------------|----------|-------|
| `<DragDropContext>` | `<DndContext>` | Need sensors config |
| `<Droppable id>` | `<SortableContext items>` | Different API |
| `<Draggable>` | `useSortable()` hook | Hook-based, not component |
| `provided.innerRef` | `setNodeRef` from hook | Different ref pattern |
| `provided.draggableProps` | `attributes, listeners` | Separate properties |
| `snapshot.isDragging` | Check `activeId === id` | Manual tracking |
| `DropResult` event | `DragEndEvent` | Different structure |

### Example Conversion

```tsx
// BEFORE (@hello-pangea/dnd)
<Droppable droppableId="plan-1">
  {(provided) => (
    <div ref={provided.innerRef} {...provided.droppableProps}>
      {items.map((item, index) => (
        <Draggable key={item.id} draggableId={item.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={snapshot.isDragging ? 'opacity-50' : ''}
            >
              {item.name}
            </div>
          )}
        </Draggable>
      ))}
      {provided.placeholder}
    </div>
  )}
</Droppable>

// AFTER (@dnd-kit)
const SortableItem = ({ id, name }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {name}
    </div>
  );
};

<SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
  {items.map(item => (
    <SortableItem key={item.id} id={item.id} name={item.name} />
  ))}
</SortableContext>
```

**Complexity**: CardSyncPlanner has 3 Droppable areas + complex drag-between logic → High refactor cost

---

## Monitoring & Verification

### After implementing each phase:

1. **Build analysis**:
```bash
npm run build
# Check "First Load JS" for each route
```

2. **Bundle analyzer**:
```bash
ANALYZE=true npm run build
# Opens webpack bundle analyzer in browser
```

3. **Performance metrics**:
- Check Lighthouse scores
- Monitor Core Web Vitals
- Test on slow 3G network

4. **Functionality testing**:
- Test book viewer loads correctly
- Test modals open properly
- Verify no regressions in UX

---

## Summary

**Immediate Actions** (Phase 1):
1. ✅ Dynamic import EpubViewer → Save ~150-200 KB
2. ✅ Dynamic import account page modals → Save ~50-100 KB

**Next Actions** (Phase 2):
3. Dynamic import DynamicReportBody → Save ~100-150 KB
4. Verify chart.js tree-shaking

**Deferred**:
- @hello-pangea/dnd migration (~150 KB, high risk/effort)
- framer-motion optimization (low impact on heavy routes)
- three.js analysis (likely already tree-shaken)

**Total Expected Improvement**: **~270-410 KB** (35-50% reduction on heavy routes)

**Next Step**: Implement Phase 1 optimizations and measure results.

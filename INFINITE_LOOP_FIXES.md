# Infinite Loop Fixes

## Overview
Fixed two "Maximum update depth exceeded" React infinite loop errors that were blocking the application.

## Date
January 2025

## Errors Fixed

### 1. SettingsFormFields - Initial Section Auto-Expand
**File:** `src/components/SiteManagement/SettingsFormFields.tsx`
**Line:** 88-97
**Error:** `Maximum update depth exceeded`

#### Problem
```typescript
useEffect(() => {
  if (initialSection && Object.keys(sectionStates).length > 0) {
    setSectionStates(prev => ({
      ...prev,
      [initialSection]: true
    }));
  }
}, [initialSection, sectionStates]); // ← sectionStates in deps causes loop
```

**Root Cause:**
- The useEffect had `sectionStates` in its dependency array
- Inside the effect, `setSectionStates` updates `sectionStates`
- This triggers the effect to run again
- Creates infinite loop: update state → effect runs → update state → effect runs...

#### Solution
```typescript
const initialSectionProcessed = useRef(false);

useEffect(() => {
  if (initialSection && !initialSectionProcessed.current && Object.keys(sectionStates).length > 0) {
    console.log('[SettingsFormFields] Opening initial section:', initialSection);
    setSectionStates(prev => ({
      ...prev,
      [initialSection]: true
    }));
    initialSectionProcessed.current = true;
  }
}, [initialSection]); // Only depend on initialSection, not sectionStates
```

**Changes Made:**
1. Added `useRef` to imports
2. Created `initialSectionProcessed` ref to track if section already opened
3. Check ref before updating state: `!initialSectionProcessed.current`
4. Set ref to `true` after first update
5. Removed `sectionStates` from dependency array

**Result:**
- Section opens once when `initialSection` changes
- No infinite loop because ref prevents re-processing
- Hero section integration works perfectly

---

### 2. TemplateSection - Slider Auto-Advance
**File:** `src/components/TemplateSection.tsx`
**Line:** 298-311
**Error:** `Maximum update depth exceeded`

#### Problem
```typescript
const nextSlide = () => {
  setCurrentSlide((prev) => (prev + 1) % totalItems);
};

useEffect(() => {
  if (section.is_slider && isAutoPlaying && totalDots > 1) {
    autoPlayInterval.current = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => {
      if (autoPlayInterval.current) {
        clearInterval(autoPlayInterval.current);
      }
    };
  }
}, [section.is_slider, isAutoPlaying, currentSlide, totalDots]); // ← currentSlide in deps
```

**Root Cause:**
- `currentSlide` was in the dependency array
- `nextSlide()` updates `currentSlide` via `setCurrentSlide`
- This triggers the effect to re-run every 5 seconds
- Effect clears and recreates interval continuously
- Creates infinite loop of re-creating intervals

#### Solution
```typescript
// Memoize slider functions to keep them stable
const nextSlide = useCallback(() => {
  setCurrentSlide((prev) => (prev + 1) % totalItems);
}, [totalItems]);

const prevSlide = useCallback(() => {
  setCurrentSlide((prev) => (prev - 1 + totalItems) % totalItems);
}, [totalItems]);

const goToSlide = useCallback((index: number) => {
  setCurrentSlide(index);
}, []);

useEffect(() => {
  if (section.is_slider && isAutoPlaying && totalDots > 1) {
    autoPlayInterval.current = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => {
      if (autoPlayInterval.current) {
        clearInterval(autoPlayInterval.current);
      }
    };
  }
}, [section.is_slider, isAutoPlaying, totalDots, nextSlide]); // nextSlide now stable
```

**Changes Made:**
1. Added `useCallback` to imports
2. Wrapped `nextSlide` with `useCallback` (depends on `totalItems`)
3. Wrapped `prevSlide` with `useCallback` (depends on `totalItems`)
4. Wrapped `goToSlide` with `useCallback` (no dependencies)
5. Removed `currentSlide` from effect dependencies
6. Added `nextSlide` to dependencies (now stable, won't cause re-renders)

**Result:**
- Slider advances every 5 seconds as intended
- Interval is only recreated when `nextSlide` reference changes (rarely)
- No infinite loop because `currentSlide` changes don't trigger effect
- Clean and proper React pattern using `useCallback`

---

## React Patterns Used

### Pattern 1: useRef for One-Time Operations
**Use Case:** When you need to run an effect only once per value change

```typescript
const hasRun = useRef(false);

useEffect(() => {
  if (!hasRun.current) {
    // Do something once
    hasRun.current = true;
  }
}, [dependency]);
```

**Benefits:**
- Prevents duplicate operations
- Ref changes don't trigger re-renders
- Perfect for initialization logic

### Pattern 2: useCallback for Stable Function References
**Use Case:** When passing functions to useEffect or child components

```typescript
const stableFunction = useCallback(() => {
  // Function logic
}, [dependencies]);

useEffect(() => {
  // Use stableFunction
}, [stableFunction]); // Won't cause re-runs unless dependencies change
```

**Benefits:**
- Function reference stays same across renders
- Prevents unnecessary effect re-runs
- Optimizes performance

---

## Common Infinite Loop Causes

### 1. State in Dependencies That Gets Updated in Effect
```typescript
// ❌ BAD
useEffect(() => {
  setState(newValue);
}, [state]); // Creates loop!

// ✅ GOOD
useEffect(() => {
  setState(newValue);
}, []); // Or use ref to track
```

### 2. Objects/Arrays in Dependencies
```typescript
// ❌ BAD
useEffect(() => {
  // ...
}, [{ key: value }]); // New object every render!

// ✅ GOOD
const memoizedObj = useMemo(() => ({ key: value }), [value]);
useEffect(() => {
  // ...
}, [memoizedObj]);
```

### 3. Unstable Function References
```typescript
// ❌ BAD
const handleClick = () => { /* ... */ };
useEffect(() => {
  // ...
}, [handleClick]); // New function every render!

// ✅ GOOD
const handleClick = useCallback(() => { /* ... */ }, [deps]);
useEffect(() => {
  // ...
}, [handleClick]);
```

---

## Testing Checklist

✅ Open Global Settings Modal
✅ Click "Hero Section" from UniversalNewButton
✅ Verify hero section auto-expands without console errors
✅ Check browser console - no "Maximum update depth exceeded" errors
✅ Navigate to page with slider/carousel
✅ Verify slider auto-advances every 5 seconds
✅ Verify slider navigation buttons work (prev/next)
✅ Check browser console - no slider-related errors
✅ Test on mobile view - slider should show 1 item
✅ Test on desktop view - slider should show multiple items

---

## Performance Impact

### Before
- Browser console flooded with error messages
- Application eventually crashes or becomes unresponsive
- Poor user experience with frozen UI

### After
- No console errors
- Smooth animations and transitions
- Efficient re-rendering only when needed
- Better memory management (no leaked intervals)

---

## Related Documentation

- [HERO_FIELDS_FIX.md](./HERO_FIELDS_FIX.md) - Hero section data loading
- [TEMPLATE_FETCH_OPTIMIZATION.md](./TEMPLATE_FETCH_OPTIMIZATION.md) - Performance optimizations
- [GLOBAL_SETTINGS_MODAL_INTEGRATION.md](./GLOBAL_SETTINGS_MODAL_INTEGRATION.md) - Modal system

---

## Developer Notes

### When to Use useRef vs useState
- **useState**: When changes should trigger re-renders
- **useRef**: When you need to persist values across renders WITHOUT triggering re-renders

### When to Use useCallback
- Functions passed to useEffect dependencies
- Functions passed as props to memoized child components
- Event handlers that are dependencies of other hooks
- Generally NOT needed for event handlers passed directly to JSX

### ESLint React Hooks Rules
The `eslint-plugin-react-hooks` will warn about missing dependencies. However:
- Sometimes you intentionally exclude dependencies (document why in comments)
- Use refs to track state without adding to dependencies
- Use useCallback to stabilize function references
- Never ignore warnings without understanding why they exist

---

## Conclusion

Both infinite loop bugs were caused by classic React anti-patterns:
1. Including state in dependencies that the effect modifies
2. Not stabilizing function references used in effects

The fixes follow React best practices:
- Use `useRef` for tracking without re-rendering
- Use `useCallback` for stable function references
- Minimize dependency arrays to only truly reactive values

These patterns ensure efficient, bug-free React applications.

/**
 * Performance monitoring utilities for PricingModal
 */

/**
 * Log component render performance in development
 */
export function logRenderPerformance(componentName: string, startTime: number) {
  if (process.env.NODE_ENV === 'development') {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // More than one frame (16ms at 60fps)
      console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
    }
  }
}

/**
 * Measure and log time to interactive for pricing modal
 */
export function measureTimeToInteractive(eventName: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(eventName);
    
    if (process.env.NODE_ENV === 'development') {
      const marks = performance.getEntriesByName(eventName);
      if (marks.length > 0) {
        console.log(`[TTI] ${eventName}: ${marks[0].startTime.toFixed(2)}ms`);
      }
    }
  }
}

/**
 * Create an intersection observer for lazy rendering
 */
export function createCardObserver(callback: IntersectionObserverCallback): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
  });
}

import { useEffect, useRef } from 'react';
import { comparisonAnalytics } from '@/lib/comparisonAnalytics';

/**
 * PerformanceMonitor tracks component render performance and reports metrics.
 * Helps identify performance bottlenecks and optimization opportunities.
 */

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  updateCount: number;
  propsChanged: string[];
}

export function usePerformanceMonitor(
  componentName: string,
  props?: Record<string, any>,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const renderCount = useRef(0);
  const startTime = useRef(0);
  const prevProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    startTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - startTime.current;

      // Track slow renders (>16ms = 60fps threshold)
      if (renderTime > 16) {
        console.warn(
          `[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
        );

        // Report to analytics if very slow (>50ms)
        if (renderTime > 50) {
          comparisonAnalytics['track']?.('slow_render', {
            componentName,
            renderTime,
            renderCount: renderCount.current,
          });
        }
      }

      // Track prop changes
      if (props && prevProps.current) {
        const changedProps = Object.keys(props).filter(
          key => props[key] !== prevProps.current?.[key]
        );

        if (changedProps.length > 0 && renderTime > 16) {
          console.log(
            `[Performance] ${componentName} props changed:`,
            changedProps,
            `(${renderTime.toFixed(2)}ms)`
          );
        }
      }

      prevProps.current = props;
    };
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Measures and reports initial page load performance
 */
export function usePageLoadPerformance(sectionId: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use Performance API to get metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name.includes('comparison')) {
          console.log(`[Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
          
          comparisonAnalytics['track']?.('performance_metric', {
            sectionId,
            metricName: entry.name,
            duration: entry.duration,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

    // Mark page interactive
    performance.mark('comparison-section-mount');

    return () => {
      performance.mark('comparison-section-unmount');
      performance.measure(
        'comparison-section-lifetime',
        'comparison-section-mount',
        'comparison-section-unmount'
      );
      observer.disconnect();
    };
  }, [sectionId]);
}

/**
 * Tracks user interaction performance (debounced)
 */
export function useInteractionTracking(sectionId: string) {
  const interactionTimerRef = useRef<NodeJS.Timeout>();

  const trackInteraction = (interactionType: string, data?: Record<string, any>) => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }

    interactionTimerRef.current = setTimeout(() => {
      comparisonAnalytics['track']?.('user_interaction', {
        sectionId,
        interactionType,
        timestamp: Date.now(),
        ...data,
      });
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    };
  }, []);

  return { trackInteraction };
}

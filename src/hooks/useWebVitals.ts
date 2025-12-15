/**
 * useWebVitals Hook
 * Monitors Core Web Vitals using Performance Observer API
 * Tracks: LCP, FID, CLS, FCP, TTFB
 */

import { useEffect } from 'react';

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
}

type WebVitalsCallback = (metric: WebVital) => void;

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function useWebVitals(onMetric?: WebVitalsCallback) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const value = lastEntry.renderTime || lastEntry.loadTime;
        
        const metric: WebVital = {
          name: 'LCP',
          value,
          rating: getRating('LCP', value),
          id: `lcp-${Date.now()}`,
        };
        
        onMetric?.(metric);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebVitals] LCP:', `${value.toFixed(2)}ms`, `(${metric.rating})`);
        }
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('[WebVitals] LCP observer not supported');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime;
          
          const metric: WebVital = {
            name: 'FID',
            value,
            rating: getRating('FID', value),
            id: `fid-${Date.now()}`,
          };
          
          onMetric?.(metric);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[WebVitals] FID:', `${value.toFixed(2)}ms`, `(${metric.rating})`);
          }
        });
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('[WebVitals] FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        const metric: WebVital = {
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          id: `cls-${Date.now()}`,
        };
        
        onMetric?.(metric);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[WebVitals] CLS:', clsValue.toFixed(3), `(${metric.rating})`);
        }
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('[WebVitals] CLS observer not supported');
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const metric: WebVital = {
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
            id: `fcp-${Date.now()}`,
          };
          
          onMetric?.(metric);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[WebVitals] FCP:', `${entry.startTime.toFixed(2)}ms`, `(${metric.rating})`);
          }
        });
      });
      
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('[WebVitals] FCP observer not supported');
    }

  }, [onMetric]);
}

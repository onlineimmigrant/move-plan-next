'use client';

import { useEffect, useState } from 'react';
import { debug } from '@/utils/debug';

/**
 * Web Vitals metrics interface
 */
interface WebVitals {
  LCP?: number; // Largest Contentful Paint
  INP?: number; // Interaction to Next Paint (replaces FID)
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

/**
 * Performance thresholds (in milliseconds, except CLS which is unitless)
 */
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

/**
 * Get status based on metric value and thresholds
 */
function getStatus(value: number, metric: keyof typeof THRESHOLDS): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Performance Monitoring Hook
 * 
 * Tracks Core Web Vitals and performance metrics.
 * Only collects data, does not render UI.
 * 
 * @param enabled - Whether to enable monitoring (typically set to isAdmin)
 * @returns Web Vitals metrics
 * 
 * @visibility The PerformanceDebugPanel component is only visible when:
 * - enabled prop is true (typically when user is an admin)
 * - vitals data has been collected (after page interaction)
 * - Component is rendered in the page
 * 
 * @note Web Vitals are collected progressively:
 * - TTFB: Immediately on page load
 * - FCP: After first content paint
 * - LCP: After largest content paint (2-4s typically)
 * - CLS: Continuously updated during page lifecycle
 * - INP: After first user interaction (click, tap, keypress)
 */
export function usePerformanceMonitoring(enabled = true) {
  const [vitals, setVitals] = useState<WebVitals>({});

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Dynamic import of web-vitals library
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      // Largest Contentful Paint
      onLCP((metric) => {
        const value = metric.value;
        const status = getStatus(value, 'LCP');
        debug.log('PerformanceMonitoring', `LCP: ${value.toFixed(2)}ms (${status})`);
        
        setVitals(prev => ({ ...prev, LCP: value }));
        
        if (status === 'poor') {
          debug.warn('PerformanceMonitoring', `LCP is poor: ${value.toFixed(2)}ms (threshold: ${THRESHOLDS.LCP.needsImprovement}ms)`);
        }
      });

      // Interaction to Next Paint (replaces FID in web-vitals v3+)
      onINP((metric) => {
        const value = metric.value;
        const status = getStatus(value, 'INP');
        debug.log('PerformanceMonitoring', `INP: ${value.toFixed(2)}ms (${status})`);
        
        setVitals(prev => ({ ...prev, INP: value }));
        
        if (status === 'poor') {
          debug.warn('PerformanceMonitoring', `INP is poor: ${value.toFixed(2)}ms (threshold: ${THRESHOLDS.INP.needsImprovement}ms)`);
        }
      });

      // Cumulative Layout Shift
      onCLS((metric) => {
        const value = metric.value;
        const status = getStatus(value, 'CLS');
        debug.log('PerformanceMonitoring', `CLS: ${value.toFixed(3)} (${status})`);
        
        setVitals(prev => ({ ...prev, CLS: value }));
        
        if (status === 'poor') {
          debug.warn('PerformanceMonitoring', `CLS is poor: ${value.toFixed(3)} (threshold: ${THRESHOLDS.CLS.needsImprovement})`);
        }
      });

      // First Contentful Paint
      onFCP((metric) => {
        const value = metric.value;
        const status = getStatus(value, 'FCP');
        debug.log('PerformanceMonitoring', `FCP: ${value.toFixed(2)}ms (${status})`);
        
        setVitals(prev => ({ ...prev, FCP: value }));
      });

      // Time to First Byte
      onTTFB((metric) => {
        const value = metric.value;
        const status = getStatus(value, 'TTFB');
        debug.log('PerformanceMonitoring', `TTFB: ${value.toFixed(2)}ms (${status})`);
        
        setVitals(prev => ({ ...prev, TTFB: value }));
      });
    }).catch((error) => {
      debug.error('PerformanceMonitoring', 'Failed to load web-vitals library:', error);
    });
  }, [enabled]);

  return vitals;
}

/**
 * Performance Debug Panel Component
 * 
 * Displays Web Vitals metrics for admins/developers.
 * 
 * @component
 * @param enabled - Whether to show the panel (set to isAdmin in PostPageClient)
 * @param vitals - Web Vitals metrics to display
 * 
 * @visibility Panel appears in bottom-right corner when:
 * - enabled=true (user is admin)
 * - At least one metric has been collected
 * - Automatically updates as metrics are collected
 * 
 * @admin This component is ONLY visible to admin users.
 * Regular users will never see the performance panel.
 * 
 * @metrics Metrics appear progressively:
 * - TTFB & FCP: Appear immediately on page load
 * - LCP: Appears after ~2-4 seconds (largest content rendered)
 * - CLS: Updates continuously during scrolling/interaction
 * - INP: Appears after first user interaction (click, tap, key press)
 */
export function PerformanceDebugPanel({ 
  enabled = false,
  vitals 
}: { 
  enabled?: boolean;
  vitals: WebVitals;
}) {
  if (!enabled || Object.keys(vitals).length === 0) return null;

  const getStatusColor = (value: number | undefined, metric: keyof typeof THRESHOLDS) => {
    if (!value) return 'text-gray-500';
    const status = getStatus(value, metric);
    if (status === 'good') return 'text-green-600';
    if (status === 'needs-improvement') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = (value: number | undefined, metric: keyof typeof THRESHOLDS) => {
    if (!value) return 'bg-gray-100';
    const status = getStatus(value, metric);
    if (status === 'good') return 'bg-green-50';
    if (status === 'needs-improvement') return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Web Vitals
      </h3>

      <div className="space-y-2">
        {/* LCP */}
        {vitals.LCP !== undefined && (
          <div className={`p-2 rounded ${getStatusBg(vitals.LCP, 'LCP')}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">LCP</span>
              <span className={`text-xs font-bold ${getStatusColor(vitals.LCP, 'LCP')}`}>
                {vitals.LCP.toFixed(0)}ms
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Largest Contentful Paint</div>
          </div>
        )}

        {/* INP */}
        {vitals.INP !== undefined && (
          <div className={`p-2 rounded ${getStatusBg(vitals.INP, 'INP')}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">INP</span>
              <span className={`text-xs font-bold ${getStatusColor(vitals.INP, 'INP')}`}>
                {vitals.INP.toFixed(0)}ms
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Interaction to Next Paint</div>
          </div>
        )}

        {/* CLS */}
        {vitals.CLS !== undefined && (
          <div className={`p-2 rounded ${getStatusBg(vitals.CLS, 'CLS')}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">CLS</span>
              <span className={`text-xs font-bold ${getStatusColor(vitals.CLS, 'CLS')}`}>
                {vitals.CLS.toFixed(3)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Cumulative Layout Shift</div>
          </div>
        )}

        {/* FCP */}
        {vitals.FCP !== undefined && (
          <div className={`p-2 rounded ${getStatusBg(vitals.FCP, 'FCP')}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">FCP</span>
              <span className={`text-xs font-bold ${getStatusColor(vitals.FCP, 'FCP')}`}>
                {vitals.FCP.toFixed(0)}ms
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">First Contentful Paint</div>
          </div>
        )}

        {/* TTFB */}
        {vitals.TTFB !== undefined && (
          <div className={`p-2 rounded ${getStatusBg(vitals.TTFB, 'TTFB')}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">TTFB</span>
              <span className={`text-xs font-bold ${getStatusColor(vitals.TTFB, 'TTFB')}`}>
                {vitals.TTFB.toFixed(0)}ms
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Time to First Byte</div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Poor</span>
          </div>
        </div>
      </div>
    </div>
  );
}

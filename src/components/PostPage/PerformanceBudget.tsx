'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';

// Lazy load icons to reduce initial bundle
const X = lazy(() => import('lucide-react').then(mod => ({ default: mod.X })));
const Minimize2 = lazy(() => import('lucide-react').then(mod => ({ default: mod.Minimize2 })));
const Maximize2 = lazy(() => import('lucide-react').then(mod => ({ default: mod.Maximize2 })));

/**
 * Performance Budget Thresholds
 * Based on Core Web Vitals "Good" ratings
 */
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  LCP: 2500, // Largest Contentful Paint (ms) - Good: ≤2.5s
  FID: 100,  // First Input Delay (ms) - Good: ≤100ms
  INP: 200,  // Interaction to Next Paint (ms) - Good: ≤200ms
  CLS: 0.1,  // Cumulative Layout Shift - Good: ≤0.1
  FCP: 1800, // First Contentful Paint (ms) - Good: ≤1.8s
  TTFB: 800, // Time to First Byte (ms) - Good: ≤800ms

  // Bundle Size (KB)
  BUNDLE_SIZE: 500,     // Total JS bundle
  INITIAL_JS: 200,      // Critical JS
  CSS_SIZE: 100,        // Total CSS
  IMAGE_SIZE: 2000,     // Total images per page

  // Runtime Performance
  MEMORY_USAGE: 50,     // MB - Heap size
  DOM_NODES: 1500,      // Total nodes
  LAYOUT_SHIFTS: 5,     // Max shifts
  LONG_TASKS: 3,        // Tasks >50ms
} as const;

/**
 * Budget Status Type
 */
export type BudgetStatus = 'good' | 'warning' | 'poor';

/**
 * Budget Item Interface
 */
export interface BudgetItem {
  name: string;
  current: number;
  budget: number;
  unit: string;
  status: BudgetStatus;
  percentage: number;
}

/**
 * Performance Budget Props
 */
interface PerformanceBudgetProps {
  enabled?: boolean;
  metrics?: {
    LCP?: number;
    FID?: number;
    INP?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  };
}

/**
 * Performance Budget Monitoring Component
 * 
 * Tracks and displays performance metrics against defined budgets.
 * Provides real-time alerts when metrics exceed thresholds.
 * 
 * @component
 * @param props.enabled - Whether to show the budget panel (admin-only)
 * @param props.metrics - Current performance metrics
 * 
 * @performance
 * - Minimal overhead: Only runs when enabled
 * - Efficient calculations: Memoized budget status
 * - Non-blocking: Runs in separate effect
 * 
 * @visibility
 * - Only visible when enabled={true}
 * - Typically admin-only
 * - Fixed position: bottom-left corner
 * 
 * @example
 * ```tsx
 * <PerformanceBudget 
 *   enabled={isAdmin}
 *   metrics={performanceVitals}
 * />
 * ```
 */
export const PerformanceBudget: React.FC<PerformanceBudgetProps> = ({
  enabled = false,
  metrics = {},
}) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [overallScore, setOverallScore] = useState<number>(100);
  const [bundleSize, setBundleSize] = useState<number>(0);
  const [domNodes, setDomNodes] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Load closed state after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
    const closed = localStorage.getItem('performanceBudgetClosed') === 'true';
    setIsClosed(closed);
  }, []);

  // Calculate budget status
  const getBudgetStatus = (current: number, budget: number, inverted = false): BudgetStatus => {
    const percentage = (current / budget) * 100;
    
    if (inverted) {
      // For metrics where lower is better (e.g., LCP, bundle size)
      if (percentage <= 100) return 'good';
      if (percentage <= 125) return 'warning';
      return 'poor';
    } else {
      // For metrics where higher is better (e.g., score)
      if (percentage >= 100) return 'good';
      if (percentage >= 75) return 'warning';
      return 'poor';
    }
  };

  // Measure bundle size
  useEffect(() => {
    if (!enabled) return;

    const measureBundleSize = () => {
      if (!performance || !performance.getEntriesByType) return;

      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let totalJS = 0;
      let totalCSS = 0;
      let totalImages = 0;

      resources.forEach((resource) => {
        const size = resource.encodedBodySize || resource.transferSize || 0;
        
        if (resource.name.endsWith('.js')) {
          totalJS += size;
        } else if (resource.name.endsWith('.css')) {
          totalCSS += size;
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
          totalImages += size;
        }
      });

      const totalKB = Math.round((totalJS + totalCSS) / 1024);
      setBundleSize(totalKB); // Store in KB
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measureBundleSize();
    } else {
      window.addEventListener('load', measureBundleSize);
      return () => window.removeEventListener('load', measureBundleSize);
    }
  }, [enabled]);

  // Measure DOM nodes
  useEffect(() => {
    if (!enabled) return;

    const measureDOMNodes = () => {
      const nodes = document.querySelectorAll('*').length;
      setDomNodes(nodes);
    };

    // Only measure initially, don't poll continuously to save memory
    measureDOMNodes();
    
    // Only poll if not minimized (reduce overhead)
    if (!isMinimized) {
      const interval = setInterval(measureDOMNodes, 10000);
      return () => clearInterval(interval);
    }
  }, [enabled, isMinimized]);

  // Measure memory usage (if available)
  useEffect(() => {
    if (!enabled) return;

    const measureMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
        setMemoryUsage(usedMB);
      }
    };

    measureMemory();
    
    // Only poll if not minimized (reduce overhead)
    if (!isMinimized) {
      const interval = setInterval(measureMemory, 10000);
      return () => clearInterval(interval);
    }
  }, [enabled, isMinimized]);

  // Calculate budget items
  useEffect(() => {
    if (!enabled) return;

    const items: BudgetItem[] = [];

    // Core Web Vitals
    if (metrics.LCP) {
      items.push({
        name: 'LCP',
        current: metrics.LCP,
        budget: PERFORMANCE_BUDGETS.LCP,
        unit: 'ms',
        status: getBudgetStatus(metrics.LCP, PERFORMANCE_BUDGETS.LCP, true),
        percentage: (metrics.LCP / PERFORMANCE_BUDGETS.LCP) * 100,
      });
    }

    if (metrics.INP) {
      items.push({
        name: 'INP',
        current: metrics.INP,
        budget: PERFORMANCE_BUDGETS.INP,
        unit: 'ms',
        status: getBudgetStatus(metrics.INP, PERFORMANCE_BUDGETS.INP, true),
        percentage: (metrics.INP / PERFORMANCE_BUDGETS.INP) * 100,
      });
    }

    if (metrics.CLS !== undefined) {
      items.push({
        name: 'CLS',
        current: metrics.CLS,
        budget: PERFORMANCE_BUDGETS.CLS,
        unit: '',
        status: getBudgetStatus(metrics.CLS, PERFORMANCE_BUDGETS.CLS, true),
        percentage: (metrics.CLS / PERFORMANCE_BUDGETS.CLS) * 100,
      });
    }

    if (metrics.FCP) {
      items.push({
        name: 'FCP',
        current: metrics.FCP,
        budget: PERFORMANCE_BUDGETS.FCP,
        unit: 'ms',
        status: getBudgetStatus(metrics.FCP, PERFORMANCE_BUDGETS.FCP, true),
        percentage: (metrics.FCP / PERFORMANCE_BUDGETS.FCP) * 100,
      });
    }

    if (metrics.TTFB) {
      items.push({
        name: 'TTFB',
        current: metrics.TTFB,
        budget: PERFORMANCE_BUDGETS.TTFB,
        unit: 'ms',
        status: getBudgetStatus(metrics.TTFB, PERFORMANCE_BUDGETS.TTFB, true),
        percentage: (metrics.TTFB / PERFORMANCE_BUDGETS.TTFB) * 100,
      });
    }

    // Bundle size (display in MB if over 1024KB)
    if (bundleSize > 0) {
      const displaySize = bundleSize > 1024 ? bundleSize / 1024 : bundleSize;
      const displayUnit = bundleSize > 1024 ? 'MB' : 'KB';
      const budgetInKB = PERFORMANCE_BUDGETS.BUNDLE_SIZE;
      
      items.push({
        name: 'Bundle',
        current: displaySize,
        budget: bundleSize > 1024 ? budgetInKB / 1024 : budgetInKB,
        unit: displayUnit,
        status: getBudgetStatus(bundleSize, budgetInKB, true),
        percentage: (bundleSize / budgetInKB) * 100,
      });
    }

    // DOM nodes
    if (domNodes > 0) {
      items.push({
        name: 'DOM',
        current: domNodes,
        budget: PERFORMANCE_BUDGETS.DOM_NODES,
        unit: 'nodes',
        status: getBudgetStatus(domNodes, PERFORMANCE_BUDGETS.DOM_NODES, true),
        percentage: (domNodes / PERFORMANCE_BUDGETS.DOM_NODES) * 100,
      });
    }

    // Memory
    if (memoryUsage > 0) {
      items.push({
        name: 'Memory',
        current: memoryUsage,
        budget: PERFORMANCE_BUDGETS.MEMORY_USAGE,
        unit: 'MB',
        status: getBudgetStatus(memoryUsage, PERFORMANCE_BUDGETS.MEMORY_USAGE, true),
        percentage: (memoryUsage / PERFORMANCE_BUDGETS.MEMORY_USAGE) * 100,
      });
    }

    setBudgetItems(items);

    // Calculate overall score (0-100)
    const totalScore = items.reduce((acc, item) => {
      const itemScore = Math.max(0, Math.min(100, 100 - (item.percentage - 100)));
      return acc + itemScore;
    }, 0);
    
    const avgScore = items.length > 0 ? Math.round(totalScore / items.length) : 100;
    setOverallScore(avgScore);
  }, [enabled, metrics, bundleSize, domNodes, memoryUsage]);

  // Handle close action
  const handleClose = () => {
    setIsClosed(true);
    localStorage.setItem('performanceBudgetClosed', 'true');
  };

  // Handle minimize toggle
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle reopen (can be triggered by keyboard shortcut or admin action)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Shift+P or Cmd+Shift+P to toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (isClosed) {
          setIsClosed(false);
          localStorage.removeItem('performanceBudgetClosed');
        } else {
          handleClose();
        }
      }
    };

    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [enabled, isClosed]);

  // Don't render until hydrated to avoid SSR mismatch
  if (!enabled || !isHydrated || isClosed) return null;

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusColor = (status: BudgetStatus): string => {
    if (status === 'good') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'warning') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Performance Budget
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-2 text-xs font-normal text-orange-600 dark:text-orange-400">(DEV)</span>
            )}
          </h3>
          <div className={`text-xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Suspense fallback={<div className="w-4 h-4" />}>
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </Suspense>
          <Suspense fallback={<div className="w-4 h-4" />}>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Close (Ctrl+Shift+P to reopen)"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </Suspense>
        </div>
      </div>

      {/* Budget Items */}
      {!isMinimized && (
        <div className="space-y-2 max-h-96 overflow-y-auto px-4 pb-2">
        {budgetItems.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-medium text-gray-700 dark:text-gray-300 w-16">
                {item.name}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.status === 'good' 
                      ? 'bg-green-500' 
                      : item.status === 'warning' 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-gray-600 dark:text-gray-400 tabular-nums">
                {item.unit === 'MB' || item.unit === '' 
                  ? item.current.toFixed(item.unit === '' ? 3 : 1)
                  : Math.round(item.current)
                }{item.unit}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Legend */}
      {!isMinimized && (
        <div className="mt-3 pt-3 px-4 pb-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Poor</span>
        </div>
        </div>
      )}

      {/* Minimized hint */}
      {isMinimized && (
        <div className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-400">
          Press Ctrl+Shift+P to close
        </div>
      )}
    </div>
  );
};

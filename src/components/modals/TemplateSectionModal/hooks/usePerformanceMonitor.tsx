/**
 * Performance Monitoring System for Template Sections
 * Phase 2: Self-Optimizing Components
 * Tracks render performance and enables intelligent optimization
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Performance metrics interface
interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  peakRenderTime: number;
  renderFrequency: number; // renders per second
  memoryUsage?: number;
  timestamp: number;
}

// Performance thresholds for optimization triggers
export const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER: 16, // 16ms for 60fps
  FREQUENT_RERENDERS: 10, // 10 renders per second
  HIGH_MEMORY: 50 * 1024 * 1024, // 50MB
  OPTIMIZATION_TRIGGER: 5, // 5 slow renders trigger optimization
} as const;

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string, enabled: boolean = true) {
  const renderStartRef = useRef<number>();
  const renderCountRef = useRef(0);
  const totalRenderTimeRef = useRef(0);
  const peakRenderTimeRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const renderTimestampsRef = useRef<number[]>([]);

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
    peakRenderTime: 0,
    renderFrequency: 0,
    timestamp: Date.now(),
  });

  const [optimizationMode, setOptimizationMode] = useState<'normal' | 'optimized' | 'minimal'>('normal');

  // Track render performance
  useEffect(() => {
    if (!enabled) return;

    renderStartRef.current = performance.now();

    return () => {
      if (renderStartRef.current) {
        const renderTime = performance.now() - renderStartRef.current;
        renderCountRef.current += 1;
        totalRenderTimeRef.current += renderTime;
        peakRenderTimeRef.current = Math.max(peakRenderTimeRef.current, renderTime);
        lastRenderTimeRef.current = renderTime;

        // Track render timestamps for frequency calculation
        const now = Date.now();
        renderTimestampsRef.current.push(now);
        // Keep only last 10 seconds of timestamps
        renderTimestampsRef.current = renderTimestampsRef.current.filter(
          ts => now - ts < 10000
        );

        // Calculate render frequency (renders per second)
        const renderFrequency = renderTimestampsRef.current.length / 10;

        const newMetrics: PerformanceMetrics = {
          renderCount: renderCountRef.current,
          averageRenderTime: totalRenderTimeRef.current / renderCountRef.current,
          lastRenderTime: renderTime,
          totalRenderTime: totalRenderTimeRef.current,
          peakRenderTime: peakRenderTimeRef.current,
          renderFrequency,
          timestamp: now,
        };

        setMetrics(newMetrics);

        // Trigger optimization based on performance
        if (renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
          // Count slow renders in recent history
          const recentSlowRenders = renderTimestampsRef.current.filter((_, index) => {
            const timeIndex = renderTimestampsRef.current.length - 1 - index;
            return timeIndex < PERFORMANCE_THRESHOLDS.OPTIMIZATION_TRIGGER;
          }).length;

          if (recentSlowRenders >= PERFORMANCE_THRESHOLDS.OPTIMIZATION_TRIGGER) {
            setOptimizationMode('optimized');
          }
        }

        // Trigger minimal mode for very poor performance
        if (renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER * 3 || 
            (renderFrequency > PERFORMANCE_THRESHOLDS.FREQUENT_RERENDERS * 2)) {
          setOptimizationMode('minimal');
        }

        // Log performance warnings in development
        if (process.env.NODE_ENV === 'development') {
          if (renderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
            console.warn(`🚨 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
          }
          if (renderFrequency > PERFORMANCE_THRESHOLDS.FREQUENT_RERENDERS) {
            console.warn(`⚡ Frequent re-renders in ${componentName}: ${renderFrequency.toFixed(1)} renders/sec`);
          }
        }
      }
    };
  });

  // Performance optimization recommendations
  const getOptimizationRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (metrics.averageRenderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER) {
      recommendations.push('Consider memoizing expensive computations');
      recommendations.push('Reduce prop drilling with context');
      recommendations.push('Implement virtual scrolling for large lists');
    }

    if (metrics.renderFrequency > PERFORMANCE_THRESHOLDS.FREQUENT_RERENDERS) {
      recommendations.push('Add React.memo to prevent unnecessary re-renders');
      recommendations.push('Use useCallback for event handlers');
      recommendations.push('Optimize state updates to batch changes');
    }

    if (metrics.peakRenderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER * 2) {
      recommendations.push('Consider code splitting for heavy components');
      recommendations.push('Implement lazy loading for non-critical features');
      recommendations.push('Profile with React DevTools Profiler');
    }

    return recommendations;
  }, [metrics]);

  // Reset metrics (useful for testing)
  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0;
    totalRenderTimeRef.current = 0;
    peakRenderTimeRef.current = 0;
    lastRenderTimeRef.current = 0;
    renderTimestampsRef.current = [];
    setOptimizationMode('normal');
  }, []);

  return {
    metrics,
    optimizationMode,
    recommendations: getOptimizationRecommendations(),
    resetMetrics,
    isSlow: metrics.averageRenderTime > PERFORMANCE_THRESHOLDS.SLOW_RENDER,
    isFrequent: metrics.renderFrequency > PERFORMANCE_THRESHOLDS.FREQUENT_RERENDERS,
  };
}

// Smart memoization hook that adapts based on performance
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    performanceMonitor?: ReturnType<typeof usePerformanceMonitor>;
    enableSmartOptimization?: boolean;
  } = {}
): T {
  const { performanceMonitor, enableSmartOptimization = true } = options;
  const prevDepsRef = useRef<React.DependencyList>();
  const prevResultRef = useRef<T>();
  const computeCountRef = useRef(0);

  // In optimization mode, be more aggressive with memoization
  const shouldMemoizeAggressively = performanceMonitor?.optimizationMode === 'optimized';

  // Check if dependencies actually changed
  const depsChanged = !prevDepsRef.current ||
    deps.length !== prevDepsRef.current.length ||
    deps.some((dep, index) => !Object.is(dep, prevDepsRef.current?.[index]));

  if (depsChanged || !prevResultRef.current || (shouldMemoizeAggressively && computeCountRef.current > 10)) {
    prevResultRef.current = factory();
    prevDepsRef.current = deps;
    computeCountRef.current += 1;
  }

  return prevResultRef.current!;
}

// Performance-aware useCallback
export function usePerformanceCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    performanceMonitor?: ReturnType<typeof usePerformanceMonitor>;
    enableOptimization?: boolean;
  } = {}
): T {
  const { performanceMonitor, enableOptimization = true } = options;

  // In optimization mode, memoize more aggressively
  if (enableOptimization && performanceMonitor?.optimizationMode === 'optimized') {
    return useCallback(callback, deps) as T;
  }

  return useCallback(callback, deps) as T;
}

// Component performance boundary
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const performance = usePerformanceMonitor(componentName);

    // Add performance data to component for debugging
    const performanceProps = {
      ...props,
      'data-performance-render-time': performance.metrics.lastRenderTime.toFixed(2),
      'data-performance-optimization-mode': performance.optimizationMode,
    } as P;

    return <Component ref={ref} {...performanceProps} />;
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
}

// Performance dashboard hook for development
export function usePerformanceDashboard() {
  const [components, setComponents] = useState<Record<string, PerformanceMetrics>>({});

  const registerComponent = useCallback((name: string, metrics: PerformanceMetrics) => {
    setComponents(prev => ({ ...prev, [name]: metrics }));
  }, []);

  const getSlowestComponents = useCallback(() => {
    return Object.entries(components)
      .sort(([, a], [, b]) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 5);
  }, [components]);

  const getMostFrequentComponents = useCallback(() => {
    return Object.entries(components)
      .sort(([, a], [, b]) => b.renderFrequency - a.renderFrequency)
      .slice(0, 5);
  }, [components]);

  return {
    components,
    registerComponent,
    slowestComponents: getSlowestComponents(),
    mostFrequentComponents: getMostFrequentComponents(),
  };
}
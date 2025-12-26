import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * VirtualizedFeatureList provides virtual scrolling for large feature lists.
 * Only renders visible items + buffer, significantly improving performance with 100+ features.
 * 
 * @param items - Array of items to render
 * @param renderItem - Function to render each item
 * @param itemHeight - Height of each item in pixels (default: 60)
 * @param bufferSize - Number of items to render above/below viewport (default: 5)
 * @param containerHeight - Height of the scrollable container (default: 600)
 */

interface VirtualizedFeatureListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  bufferSize?: number;
  containerHeight?: number;
  className?: string;
}

export function VirtualizedFeatureList<T>({
  items,
  renderItem,
  itemHeight = 60,
  bufferSize = 5,
  containerHeight = 600,
  className = '',
}: VirtualizedFeatureListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Smooth scroll restoration
  useEffect(() => {
    if (containerRef.current) {
      const savedScrollTop = sessionStorage.getItem('comparisonScrollTop');
      if (savedScrollTop) {
        containerRef.current.scrollTop = parseInt(savedScrollTop, 10);
        sessionStorage.removeItem('comparisonScrollTop');
      }
    }
  }, []);

  // Save scroll position before unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        sessionStorage.setItem('comparisonScrollTop', containerRef.current.scrollTop.toString());
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      role="region"
      aria-label="Feature comparison list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={startIndex + idx} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(VirtualizedFeatureList) as typeof VirtualizedFeatureList;

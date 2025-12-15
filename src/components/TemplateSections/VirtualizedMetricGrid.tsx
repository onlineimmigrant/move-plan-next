/**
 * VirtualizedMetricGrid Component
 * Uses react-virtuoso for efficient rendering of large metric lists
 * Only renders visible items, dramatically improving performance
 */

'use client';

import React, { useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { MetricCard } from '@/components/TemplateSections/MetricCard';
import { getTranslatedContent } from '@/utils/translationHelpers';
import type { Metric } from '@/types/templateSection';

interface VirtualizedMetricGridProps {
  metrics: Metric[];
  textVariant: {
    metricTitle: string;
    metricDescription: string;
  };
  textStyleVariant?: string;
  currentLocale: string | null;
  isPriority?: boolean;
  gridColumns: number;
}

// Grid container component
const GridContainer = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div 
    ref={ref}
    {...props}
    className="grid gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 md:gap-x-10 md:gap-y-12 lg:gap-x-12 lg:gap-y-14 xl:gap-x-14 xl:gap-y-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
    style={{
      gridTemplateColumns: `repeat(auto-fill, minmax(250px, 1fr))`,
    }}
  />
));
GridContainer.displayName = 'GridContainer';

// Item container component
const ItemContainer = React.forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} {...props} />
));
ItemContainer.displayName = 'ItemContainer';

export const VirtualizedMetricGrid: React.FC<VirtualizedMetricGridProps> = ({
  metrics,
  textVariant,
  textStyleVariant,
  currentLocale,
  isPriority = false,
  gridColumns,
}) => {
  // Calculate item height based on typical card dimensions
  const itemHeight = useMemo(() => {
    // Estimate: 500px for cards with images, 300px for text-only
    return 500;
  }, []);

  // Render individual metric item
  const renderItem = (index: number) => {
    const metric = metrics[index];
    if (!metric) return null;

    // Get translated content
    const translatedTitle = getTranslatedContent(
      metric.title || '',
      metric.title_translation,
      currentLocale
    );
    const translatedDescription = getTranslatedContent(
      metric.description || '',
      metric.description_translation,
      currentLocale
    );

    return (
      <MetricCard
        key={metric.id}
        metric={metric}
        translatedTitle={translatedTitle}
        translatedDescription={translatedDescription}
        textVariant={textVariant}
        textStyleVariant={textStyleVariant}
        isPriority={isPriority && index < 6} // Prioritize first 6 items
        animationDelay={0} // Disable stagger animation for virtual scroll
      />
    );
  };

  return (
    <VirtuosoGrid
      totalCount={metrics.length}
      components={{
        List: GridContainer,
        Item: ItemContainer,
      }}
      itemContent={renderItem}
      overscan={200} // Render 200px beyond viewport for smooth scrolling
      style={{ height: '100%', minHeight: '600px' }}
    />
  );
};

export default VirtualizedMetricGrid;

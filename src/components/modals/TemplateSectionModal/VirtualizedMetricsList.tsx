import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  Bars3Icon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
  RectangleGroupIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import SelfOptimizingMetricCard from './components/SelfOptimizingMetricCard';

interface Metric {
  id: number;
  title: string;
  description: string;
  image?: string;
  background_color?: string;
  is_gradient?: boolean;
  gradient?: any;
  is_card_type?: boolean;
  is_title_displayed?: boolean;
  is_image_rounded_full?: boolean;
}

interface VirtualizedMetricsListProps {
  metrics: Metric[];
  textStyleVariant: string;
  onMetricsChange: () => void;
  draggedIndex: number | null;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  setDeleteModalState: (state: { isOpen: boolean; metricId: number | null; metricTitle: string }) => void;
  setImageGalleryState: (state: { isOpen: boolean; metricId: number | null }) => void;
  setUrlPromptState: (state: { isOpen: boolean; metricId: number | null; currentUrl: string }) => void;
  setOpenColorPickerId: (id: number | null) => void;
  openColorPickerId: number | null;
  getBackgroundStyle: (isGradient: boolean, gradient: any, backgroundColor: string) => any;
  isVideoUrl: (url: string) => boolean;
  textVar: any;
  imageMetricsHeight?: string;
  isImageBottom?: boolean;
  getEmbedUrl: (url: string) => string;
}

const VirtualizedMetricsList: React.FC<VirtualizedMetricsListProps> = ({
  metrics,
  textStyleVariant,
  onMetricsChange,
  draggedIndex,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  setDeleteModalState,
  setImageGalleryState,
  setUrlPromptState,
  setOpenColorPickerId,
  openColorPickerId,
  getBackgroundStyle,
  isVideoUrl,
  textVar,
  imageMetricsHeight,
  isImageBottom,
  getEmbedUrl,
}) => {
  // Calculate dynamic heights based on metric content
  const getItemSize = (index: number) => {
    const metric = metrics[index];
    let height = 350; // Base height

    // Add height for image/video if present
    if (metric.image) {
      height += 200; // Additional height for media
    }

    // Add height for title if displayed
    if (metric.is_title_displayed) {
      height += 40;
    }

    // Add height for description
    height += 80;

    return height;
  };

  // Memoize the virtualizer to prevent unnecessary re-renders
  const virtualizer = useVirtualizer({
    count: metrics.length,
    getScrollElement: () => document.querySelector('.metrics-container') as HTMLElement,
    estimateSize: () => 400, // Average estimated height
    overscan: 5, // Render 5 items outside visible area
  });

  // Render individual metric item using SelfOptimizingMetricCard
  const MetricItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const metric = metrics[index];

    // Skip metrics without valid IDs
    if (!metric.id || typeof metric.id !== 'number') {
      console.warn('Skipping metric without valid ID:', metric);
      return null;
    }

    return (
      <SelfOptimizingMetricCard
        metric={metric}
        index={index}
        style={style}
        textStyleVariant={textStyleVariant}
        onMetricsChange={onMetricsChange}
        draggedIndex={draggedIndex}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDragEnd={handleDragEnd}
        setDeleteModalState={setDeleteModalState}
        setImageGalleryState={setImageGalleryState}
        setUrlPromptState={setUrlPromptState}
        setOpenColorPickerId={setOpenColorPickerId}
        openColorPickerId={openColorPickerId}
        getBackgroundStyle={getBackgroundStyle}
        isVideoUrl={isVideoUrl}
        textVar={textVar}
        imageMetricsHeight={imageMetricsHeight}
        isImageBottom={isImageBottom}
        getEmbedUrl={getEmbedUrl}
      />
    );
  };

  return (
    <div className="metrics-container flex gap-4 overflow-x-auto pb-4 pt-12">
      <List
        height={600} // Fixed height for the virtualized list
        itemCount={metrics.length}
        itemSize={400} // Average item height - will be adjusted dynamically
        width="100%"
        className="virtualized-metrics-list"
      >
        {MetricItem}
      </List>
    </div>
  );
};

export default VirtualizedMetricsList;
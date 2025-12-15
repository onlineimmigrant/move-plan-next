/**
 * Self-Optimizing Metric Card Component
 * Phase 2: Self-Optimizing Components
 * Adapts rendering strategy based on runtime performance
 */

'use client';

import React, { useMemo, useCallback } from 'react';
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
import ColorPaletteDropdown from '@/components/Shared/ColorPaletteDropdown';
import { usePerformanceMonitor, useSmartMemo, usePerformanceCallback } from '../hooks/usePerformanceMonitor';

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

interface SelfOptimizingMetricCardProps {
  metric: Metric;
  index: number;
  style?: React.CSSProperties;
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

const SelfOptimizingMetricCard: React.FC<SelfOptimizingMetricCardProps> = ({
  metric,
  index,
  style,
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
  // Performance monitoring for this component
  const performance = usePerformanceMonitor(`MetricCard-${metric.id}`, true);

  // Smart memoization for expensive computations
  const cardClasses = useSmartMemo(() => {
    const isCodedHarmony = textStyleVariant === 'codedharmony';
    return metric.is_card_type
      ? isCodedHarmony
        ? 'p-6 sm:p-12 md:p-16 rounded-3xl text-center gap-y-6 relative overflow-hidden backdrop-blur-xl bg-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/20'
        : 'p-8 sm:p-16 shadow-md rounded-3xl text-center gap-y-8'
      : '';
  }, [metric.is_card_type, textStyleVariant], { performanceMonitor: performance });

  const metricBgStyle = useSmartMemo(() => {
    if (!metric.is_card_type) return undefined;
    return getBackgroundStyle(
      metric.is_gradient || false,
      metric.gradient,
      metric.background_color || (textStyleVariant === 'codedharmony' ? 'gray-50' : 'white')
    );
  }, [metric.is_card_type, metric.is_gradient, metric.gradient, metric.background_color, textStyleVariant, getBackgroundStyle], { performanceMonitor: performance });

  // Performance-aware event handlers
  const handleTitleToggle = usePerformanceCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!metric.id || typeof metric.id !== 'number') {
      toast.error('Cannot update: Invalid metric ID');
      return;
    }

    try {
      const response = await fetch(`/api/metrics/${metric.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_title_displayed: !metric.is_title_displayed }),
      });
      if (!response.ok) throw new Error('Failed to update');
      onMetricsChange();
    } catch (error) {
      toast.error('Failed to update');
    }
  }, [metric.id, metric.is_title_displayed, onMetricsChange], { performanceMonitor: performance });

  const handleImageToggle = usePerformanceCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!metric.id || typeof metric.id !== 'number') {
      toast.error('Cannot update: Invalid metric ID');
      return;
    }

    try {
      const response = await fetch(`/api/metrics/${metric.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_image_rounded_full: !metric.is_image_rounded_full }),
      });
      if (!response.ok) throw new Error('Failed to update');
      onMetricsChange();
    } catch (error) {
      toast.error('Failed to update');
    }
  }, [metric.id, metric.is_image_rounded_full, onMetricsChange], { performanceMonitor: performance });

  const handleCardTypeToggle = usePerformanceCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!metric.id || typeof metric.id !== 'number') {
      toast.error('Cannot update: Invalid metric ID');
      return;
    }

    try {
      const response = await fetch(`/api/metrics/${metric.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_card_type: !metric.is_card_type }),
      });
      if (!response.ok) throw new Error('Failed to update');
      onMetricsChange();
    } catch (error) {
      toast.error('Failed to update');
    }
  }, [metric.id, metric.is_card_type, onMetricsChange], { performanceMonitor: performance });

  // Adaptive rendering based on performance mode
  const renderOptimizationLevel: 'normal' | 'optimized' | 'minimal' = useMemo(() => {
    if (performance.optimizationMode === 'minimal') {
      return 'minimal'; // Basic rendering only
    }
    if (performance.optimizationMode === 'optimized') {
      return 'optimized'; // Reduced animations and effects
    }
    return 'normal'; // Full features
  }, [performance.optimizationMode]);

  // Optimized media rendering
  const renderMedia = useSmartMemo(() => {
    if (!metric.image) return null;

    // In minimal mode, skip complex media rendering
    if (renderOptimizationLevel === 'minimal') {
      return (
        <div className={cn('w-full h-32 bg-gray-100 flex items-center justify-center')}>
          <PhotoIcon className="w-8 h-8 text-gray-400" />
        </div>
      );
    }

    const mediaClasses = cn(
      'relative group/image',
      isImageBottom ? 'order-3' : '',
      isVideoUrl(metric.image)
        ? metric.is_card_type
          ? '-mx-8 sm:-mx-16 mt-0'
          : 'mt-0'
        : 'mt-8'
    );

    if (isVideoUrl(metric.image)) {
      const videoContent = metric.image.toLowerCase().includes('youtube.com') ||
        metric.image.toLowerCase().includes('youtu.be') ||
        metric.image.toLowerCase().includes('vimeo.com') ? (
        <iframe
          src={getEmbedUrl(metric.image)}
          className={cn('w-full rounded-none', imageMetricsHeight || 'h-48')}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          src={metric.image}
          controls
          className={cn('w-full object-cover rounded-none', imageMetricsHeight || 'h-48')}
        >
          Your browser does not support the video tag.
        </video>
      );

      return (
        <div className={mediaClasses}>
          {videoContent}
          {/* Overlay controls - simplified in optimized mode */}
          {(renderOptimizationLevel === 'normal' || renderOptimizationLevel === 'optimized') && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageGalleryState({ isOpen: true, metricId: metric.id });
                }}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                title="Change media"
              >
                <PhotoIcon className="w-12 h-12 text-white" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!metric.id || typeof metric.id !== 'number') {
                    toast.error('Cannot remove media: Invalid metric ID');
                    return;
                  }
                  try {
                    const response = await fetch(`/api/metrics/${metric.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ image: null }),
                    });
                    if (!response.ok) throw new Error('Failed to remove media');
                    toast.success('Media removed');
                    onMetricsChange();
                  } catch (error) {
                    console.error('Error removing media:', error);
                    toast.error('Failed to remove media');
                  }
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Remove media"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      );
    } else {
      return (
        <div className={cn('w-full overflow-hidden flex items-center justify-center', imageMetricsHeight || 'h-48')}>
          <img
            src={metric.image}
            alt={metric.title || 'Metric image'}
            className={cn(
              'object-contain max-w-full max-h-full',
              metric.is_image_rounded_full && 'rounded-full'
            )}
            loading={renderOptimizationLevel === 'optimized' ? 'lazy' : 'eager'}
          />
          {/* Overlay controls - simplified in optimized mode */}
          {(renderOptimizationLevel === 'normal' || renderOptimizationLevel === 'optimized') && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageGalleryState({ isOpen: true, metricId: metric.id });
                }}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                title="Change media"
              >
                <PhotoIcon className="w-12 h-12 text-white" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!metric.id || typeof metric.id !== 'number') {
                    toast.error('Cannot remove media: Invalid metric ID');
                    return;
                  }
                  try {
                    const response = await fetch(`/api/metrics/${metric.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ image: null }),
                    });
                    if (!response.ok) throw new Error('Failed to remove media');
                    toast.success('Media removed');
                    onMetricsChange();
                  } catch (error) {
                    console.error('Error removing media:', error);
                    toast.error('Failed to remove media');
                  }
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Remove media"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      );
    }
  }, [
    metric.image,
    metric.title,
    metric.is_image_rounded_full,
    metric.id,
    renderOptimizationLevel,
    isImageBottom,
    isVideoUrl,
    metric.is_card_type,
    imageMetricsHeight,
    getEmbedUrl,
    setImageGalleryState,
    onMetricsChange,
  ], { performanceMonitor: performance });

  return (
    <div
      key={metric.id}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDragEnd={handleDragEnd}
      className={cn(
        'group transition-all min-h-[350px] flex flex-col relative space-y-4 mx-auto',
        'w-[350px] flex-shrink-0',
        draggedIndex === index ? 'opacity-50' : 'opacity-100',
        'border-2 border-dashed border-gray-200 hover:border-sky-400',
        cardClasses,
        // Performance-based styling adjustments
        performance.isSlow && 'transition-none', // Disable transitions when slow
        performance.isFrequent && 'will-change-auto' // Optimize for frequent updates
      )}
      style={{
        ...style,
        ...(metric.is_card_type && metricBgStyle ? metricBgStyle : {})
      }}
      // Performance debugging attributes
      data-performance-mode={performance.optimizationMode}
      data-render-time={performance.metrics.lastRenderTime.toFixed(2)}
    >
      {/* Floating Control Panel - Simplified in optimized mode */}
      <div className="absolute -top-12 left-0 right-0 z-20 px-2 py-2 flex items-center justify-between">
        {/* Left: Icon Toolbar */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-2 cursor-move bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition-colors"
            title="Drag to reorder"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Title Toggle - Skip animations in optimized mode */}
          <button
            onClick={handleTitleToggle}
            className={cn(
              'p-2 rounded-lg transition-colors',
              metric.is_title_displayed
                ? 'bg-sky-100 text-sky-700'
                : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700',
              renderOptimizationLevel === 'optimized' && 'transition-none'
            )}
            title={metric.is_title_displayed ? 'Hide title' : 'Show title'}
          >
            {metric.is_title_displayed ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
          </button>

          {/* Image Toggle - Skip animations in optimized mode */}
          <button
            onClick={handleImageToggle}
            className={cn(
              'p-2 rounded-lg transition-colors',
              metric.is_image_rounded_full
                ? 'bg-sky-100 text-sky-700'
                : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700',
              renderOptimizationLevel === 'optimized' && 'transition-none'
            )}
            title={metric.is_image_rounded_full ? 'Square image' : 'Round image'}
          >
            <PhotoIcon className="w-5 h-5" />
          </button>

          {/* Card Type Toggle - Skip animations in optimized mode */}
          <button
            onClick={handleCardTypeToggle}
            className={cn(
              'p-2 rounded-lg transition-colors',
              metric.is_card_type
                ? 'bg-sky-100 text-sky-700'
                : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700',
              renderOptimizationLevel === 'optimized' && 'transition-none'
            )}
            title={metric.is_card_type ? 'Disable card type' : 'Enable card type'}
          >
            <RectangleGroupIcon className="w-5 h-5" />
          </button>

          {/* Color Picker - Only show in normal mode */}
          {renderOptimizationLevel === 'normal' && (
            <ColorPaletteDropdown
              value={metric.background_color || 'white'}
              onChange={async (colorClass) => {
                if (!metric.id || typeof metric.id !== 'number') {
                  toast.error('Cannot update: Invalid metric ID');
                  return;
                }
                try {
                  const response = await fetch(`/api/metrics/${metric.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ background_color: colorClass }),
                  });
                  if (!response.ok) throw new Error('Failed to update');
                  onMetricsChange();
                  setOpenColorPickerId(null);
                } catch (error) {
                  toast.error('Failed to update');
                }
              }}
              isOpen={openColorPickerId === metric.id}
              onToggle={() => {
                setOpenColorPickerId(openColorPickerId === metric.id ? null : metric.id);
              }}
              onClose={() => setOpenColorPickerId(null)}
              buttonClassName="p-2 bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-lg"
              previewSize="sm"
              iconSize="md"
              useFixedPosition={true}
            />
          )}
        </div>

        {/* Right: Delete */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModalState({
                isOpen: true,
                metricId: metric.id,
                metricTitle: metric.title,
              });
            }}
            className="p-2 rounded-lg transition-colors bg-transparent text-gray-500 hover:bg-red-50 hover:text-red-600"
            title="Remove or delete metric"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metric Content */}
      {renderMedia}

      {/* Title - Skip in minimal mode */}
      {metric.is_title_displayed && (renderOptimizationLevel === 'normal' || renderOptimizationLevel === 'optimized') && (
        <h3 className={cn('order-1', textVar.metricTitle)}>
          <input
            type="text"
            value={metric.title}
            onChange={async (e) => {
              const newTitle = e.target.value;
              if (!metric.id || typeof metric.id !== 'number') {
                toast.error('Invalid metric ID for title update');
                return;
              }
              try {
                const response = await fetch(`/api/metrics/${metric.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: newTitle }),
                });
                if (!response.ok) throw new Error('Failed to update title');
                onMetricsChange();
              } catch (error) {
                console.error('Error updating title:', error);
                toast.error('Failed to update title');
              }
            }}
            className="w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent"
            placeholder="Metric title..."
          />
        </h3>
      )}

      {/* Description */}
      <div className={cn('flex-col order-2', textVar.metricDescription, 'tracking-wider')}>
        <textarea
          value={metric.description}
          onChange={async (e) => {
            const newDescription = e.target.value;
            if (!metric.id || typeof metric.id !== 'number') {
              toast.error('Invalid metric ID for description update');
              return;
            }
            try {
              const response = await fetch(`/api/metrics/${metric.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: newDescription }),
              });
              if (!response.ok) throw new Error('Failed to update description');
              onMetricsChange();
            } catch (error) {
              console.error('Error updating description:', error);
              toast.error('Failed to update description');
            }
          }}
          rows={renderOptimizationLevel === 'minimal' ? 2 : 3}
          className="w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent resize-none"
          placeholder="Metric description..."
        />
      </div>

      {/* Image URL Field - Only in normal mode */}
      {renderOptimizationLevel === 'normal' && (
        <input
          type="text"
          value={metric.image || ''}
          onChange={async (e) => {
            const newImage = e.target.value;
            try {
              const response = await fetch(`/api/metrics/${metric.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: newImage }),
              });
              if (!response.ok) throw new Error('Failed to update image');
              onMetricsChange();
            } catch (error) {
              console.error('Error updating image:', error);
              toast.error('Failed to update image');
            }
          }}
          className="text-xs text-gray-500 mt-2 w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent opacity-50 hover:opacity-100"
          placeholder="Image URL (optional)..."
        />
      )}
    </div>
  );
};

export default React.memo(SelfOptimizingMetricCard);
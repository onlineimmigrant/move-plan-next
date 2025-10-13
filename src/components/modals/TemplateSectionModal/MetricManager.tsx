// /components/TemplateSectionEdit/MetricManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
  CheckIcon,
  PhotoIcon,
  RectangleGroupIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import EditableTextField from '@/components/Shared/EditableFields/EditableTextField';
import EditableTextArea from '@/components/Shared/EditableFields/EditableTextArea';
import EditableToggle from '@/components/Shared/EditableFields/EditableToggle';
import EditableColorPicker from '@/components/Shared/EditableFields/EditableColorPicker';
import EditableGradientPicker from '@/components/Shared/EditableFields/EditableGradientPicker';
import ColorPaletteDropdown, { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import Button from '@/ui/Button';
import { useToast } from '@/components/Shared/ToastContainer';
import DeleteMetricModal from './DeleteMetricModal';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { getBackgroundStyle } from '@/utils/gradientHelper';

// Text style variants matching TemplateSection
const TEXT_VARIANTS = {
  default: {
    metricTitle: 'text-xl sm:text-2xl font-normal text-gray-800',
    metricDescription: 'text-base font-light text-gray-700'
  },
  apple: {
    metricTitle: 'text-xl font-medium text-gray-900',
    metricDescription: 'text-base font-light text-gray-600'
  },
  codedharmony: {
    metricTitle: 'text-base sm:text-lg font-semibold text-gray-900 leading-relaxed tracking-[-0.02em]',
    metricDescription: 'text-sm sm:text-base text-gray-600 font-normal leading-relaxed'
  }
};

// Helper function to check if URL is a video
const isVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  
  // Check for video file extensions
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
  const hasVideoExtension = videoExtensions.some(ext => urlLower.includes(ext));
  
  // Check for YouTube URLs
  const isYouTube = urlLower.includes('youtube.com') || urlLower.includes('youtu.be');
  
  // Check for Vimeo URLs
  const isVimeo = urlLower.includes('vimeo.com');
  
  return hasVideoExtension || isYouTube || isVimeo;
};

// Helper function to convert YouTube/Vimeo URLs to embed format
const getEmbedUrl = (url: string): string => {
  const urlLower = url.toLowerCase();
  
  // YouTube conversion
  if (urlLower.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (urlLower.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  
  // Vimeo conversion
  if (urlLower.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }
  
  return url;
};

interface GradientStyle {
  from: string;
  via?: string;
  to: string;
}

interface Metric {
  id: number;
  title: string;
  title_translation?: Record<string, string>;
  is_title_displayed: boolean;
  description: string;
  description_translation?: Record<string, string>;
  image?: string;
  is_image_rounded_full: boolean;
  is_card_type: boolean;
  background_color?: string;
  is_gradient?: boolean;
  gradient?: GradientStyle | null;
  organization_id: string | null;
}

interface MetricManagerProps {
  sectionId: number;
  metrics: Metric[];
  onMetricsChange: () => void;
  showCreateForm?: boolean;
  setShowCreateForm?: (show: boolean) => void;
  showAddModal?: boolean;
  setShowAddModal?: (show: boolean) => void;
  editingMetricId?: number | null;
  setEditingMetricId?: (id: number | null) => void;
  isImageBottom?: boolean; // Preview option
  imageMetricsHeight?: string; // Image height class
  textStyleVariant?: 'default' | 'apple' | 'codedharmony'; // Text style variant
}

interface EditingMetric {
  id?: number;
  title: string;
  description: string;
  image: string;
  is_image_rounded_full: boolean;
  is_title_displayed: boolean;
  is_card_type: boolean;
  background_color: string;
  is_gradient: boolean;
  gradient: GradientStyle | null;
}

export default function MetricManager({ 
  sectionId, 
  metrics, 
  onMetricsChange,
  showCreateForm: externalShowCreateForm,
  setShowCreateForm: externalSetShowCreateForm,
  showAddModal: externalShowAddModal,
  setShowAddModal: externalSetShowAddModal,
  editingMetricId: externalEditingMetricId,
  setEditingMetricId: externalSetEditingMetricId,
  isImageBottom = false,
  imageMetricsHeight = 'h-48',
  textStyleVariant = 'default',
}: MetricManagerProps) {
  const toast = useToast();
  const textVar = TEXT_VARIANTS[textStyleVariant];
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([]);
  const [internalShowAddModal, setInternalShowAddModal] = useState(false);
  const [internalShowCreateForm, setInternalShowCreateForm] = useState(false);
  const [internalEditingMetricId, setInternalEditingMetricId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openColorPickerId, setOpenColorPickerId] = useState<number | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    metricId: number | null;
    metricTitle: string;
  }>({ isOpen: false, metricId: null, metricTitle: '' });
  const [imageGalleryState, setImageGalleryState] = useState<{
    isOpen: boolean;
    metricId: number | null;
  }>({ isOpen: false, metricId: null });
  const [urlPromptState, setUrlPromptState] = useState<{
    isOpen: boolean;
    metricId: number | null;
    currentUrl: string;
  }>({ isOpen: false, metricId: null, currentUrl: '' });

  // Use external state if provided, otherwise use internal state
  const showAddModal = externalShowAddModal !== undefined ? externalShowAddModal : internalShowAddModal;
  const setShowAddModal = externalSetShowAddModal || setInternalShowAddModal;
  const showCreateForm = externalShowCreateForm !== undefined ? externalShowCreateForm : internalShowCreateForm;
  const setShowCreateForm = externalSetShowCreateForm || setInternalShowCreateForm;
  const editingMetricId = externalEditingMetricId !== undefined ? externalEditingMetricId : internalEditingMetricId;
  const setEditingMetricId = externalSetEditingMetricId || setInternalEditingMetricId;

  const [editingMetric, setEditingMetric] = useState<EditingMetric>({
    title: '',
    description: '',
    image: '',
    is_image_rounded_full: false,
    is_title_displayed: true,
    is_card_type: false,
    background_color: 'white',
    is_gradient: false,
    gradient: null,
  });

  // Fetch available metrics
  useEffect(() => {
    fetchAvailableMetrics();
  }, []);

  // Close color picker when clicking outside
  useEffect(() => {
    if (openColorPickerId !== null) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
          setOpenColorPickerId(null);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openColorPickerId]);

  const fetchAvailableMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setAvailableMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load available metrics');
    }
  };

  // Add existing metric to section
  const handleAddExisting = async (metricId: number) => {
    setIsLoading(true);
    console.log('MetricManager: Adding metric', { sectionId, metricId });
    
    try {
      const url = `/api/template-sections/${sectionId}/metrics`;
      const payload = { metric_id: metricId };
      
      console.log('MetricManager: Sending POST request', { url, payload });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('MetricManager: Response status', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('MetricManager: API error', error);
        throw new Error(error.error || 'Failed to add metric');
      }

      const result = await response.json();
      console.log('MetricManager: Successfully added metric', result);

      toast.success('Metric added successfully');
      setShowAddModal(false);
      
      console.log('MetricManager: Calling onMetricsChange');
      await onMetricsChange();
      console.log('MetricManager: onMetricsChange completed');
    } catch (error) {
      console.error('MetricManager: Error adding metric:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add metric');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new metric
  const handleCreateMetric = async () => {
    if (!editingMetric.title || !editingMetric.description) {
      toast.error('Title and description are required');
      return;
    }

    setIsLoading(true);
    try {
      // Create the metric
      const createResponse = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMetric),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to create metric');
      }

      const newMetric = await createResponse.json();

      // Add it to the section
      const addResponse = await fetch(`/api/template-sections/${sectionId}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric_id: newMetric.id }),
      });

      if (!addResponse.ok) {
        const error = await addResponse.json();
        throw new Error(error.error || 'Failed to add metric to section');
      }

      toast.success('Metric created and added successfully');
      setShowCreateForm(false);
      setEditingMetric({
        title: '',
        description: '',
        image: '',
        is_image_rounded_full: false,
        is_title_displayed: true,
        is_card_type: false,
        background_color: 'white',
        is_gradient: false,
        gradient: null,
      });
      onMetricsChange();
      fetchAvailableMetrics();
    } catch (error) {
      console.error('Error creating metric:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create metric');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image selection from gallery
  const handleImageSelect = async (imageUrl: string) => {
    const metricId = imageGalleryState.metricId;
    
    // For create form (no metricId)
    if (!metricId) {
      setEditingMetric({ ...editingMetric, image: imageUrl });
      setImageGalleryState({ isOpen: false, metricId: null });
      return;
    }

    // For existing metric - update immediately
    try {
      const response = await fetch(`/api/metrics/${metricId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to update metric image');
      }

      toast.success('Image updated successfully');
      setImageGalleryState({ isOpen: false, metricId: null });
      onMetricsChange();
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  };

  // Handle URL submission for image/video
  const handleUrlSubmit = async () => {
    const metricId = urlPromptState.metricId;
    const url = urlPromptState.currentUrl.trim();

    if (!url) {
      toast.error('Please enter a valid URL');
      return;
    }

    // For create form (no metricId)
    if (!metricId) {
      setEditingMetric({ ...editingMetric, image: url });
      setUrlPromptState({ isOpen: false, metricId: null, currentUrl: '' });
      return;
    }

    // For existing metric - update immediately
    try {
      const response = await fetch(`/api/metrics/${metricId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });

      if (!response.ok) {
        throw new Error('Failed to update metric');
      }

      toast.success('URL updated successfully');
      setUrlPromptState({ isOpen: false, metricId: null, currentUrl: '' });
      onMetricsChange();
    } catch (error) {
      console.error('Error updating URL:', error);
      toast.error('Failed to update URL');
    }
  };

  // Remove metric from section
  const handleRemoveMetric = async (metricId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/template-sections/${sectionId}/metrics?metric_id=${metricId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove metric');
      }

      toast.success('Metric removed from section');
      onMetricsChange();
    } catch (error) {
      console.error('Error removing metric:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove metric');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete metric permanently
  const handleDeleteMetric = async (metricId: number) => {
    setIsLoading(true);
    try {
      // Delete the metric with force=true to remove from all sections
      console.log('Deleting metric permanently (will remove from all sections)...');
      const response = await fetch(`/api/metrics/${metricId}?force=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete metric');
      }

      toast.success('Metric deleted permanently from all sections');
      onMetricsChange();
      fetchAvailableMetrics();
    } catch (error) {
      console.error('Error deleting metric:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete metric');
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder metrics
  const handleReorder = async (newOrder: Metric[]) => {
    const metricIds = newOrder.map(m => m.id);

    try {
      const response = await fetch(`/api/template-sections/${sectionId}/metrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric_ids: metricIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.warn('Reorder response:', error);
        // Don't throw error or show toast - the table might not have display_order column yet
        // The visual reorder will work temporarily until page refresh
        return;
      }

      const result = await response.json();
      console.log('Metrics reordered successfully:', result);
      toast.success('Metrics reordered');
      
      // Refresh to show persisted order
      await onMetricsChange();
    } catch (error) {
      console.error('Error reordering metrics:', error);
      // Don't show error toast - just log it
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMetrics = [...metrics];
    const draggedMetric = newMetrics[draggedIndex];
    newMetrics.splice(draggedIndex, 1);
    newMetrics.splice(index, 0, draggedMetric);

    setDraggedIndex(index);
    handleReorder(newMetrics);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get metrics not in this section
  const metricsNotInSection = availableMetrics.filter(
    am => !metrics.some(m => m.id === am.id)
  );

  return (
    <div className="space-y-4">
      {/* Horizontal Toolbar with Metric Icons - Only show if not controlled externally */}
      {externalShowCreateForm === undefined && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {/* Add New Metric Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
            title="Create new metric"
          >
            <PlusIcon className="w-5 h-5" />
          </button>

          {/* Add Existing Metric Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
            title="Add existing metric"
          >
            <PlusIcon className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 shrink-0" />

          {/* Existing Metrics as Icons */}
          {metrics.map((metric, index) => (
            <div
              key={metric.id}
              className="relative shrink-0"
            >
              <button
                className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title={metric.title || 'Untitled metric'}
              >
                {metric.image ? (
                  <img 
                    src={metric.image} 
                    alt={metric.title} 
                    className={cn(
                      'w-5 h-5 object-cover',
                      metric.is_image_rounded_full && 'rounded-full'
                    )}
                  />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    {index + 1}
                  </div>
                )}
              </button>
            </div>
          ))}

          {metrics.length === 0 && (
            <p className="text-sm text-gray-400 italic">No metrics yet. Click + to add one.</p>
          )}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Create New Metric</h4>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <EditableTextField
            label="Title"
            value={editingMetric.title}
            onChange={(value) => setEditingMetric({ ...editingMetric, title: value })}
            required
          />

          <EditableTextArea
            label="Description"
            value={editingMetric.description}
            onChange={(value) => setEditingMetric({ ...editingMetric, description: value })}
            required
            rows={2}
          />

          {/* Image Gallery Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Metric Image
            </label>
            <button
              type="button"
              onClick={() => setImageGalleryState({ isOpen: true, metricId: null })}
              className="w-full group relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors"
            >
              {editingMetric.image ? (
                <div className="flex items-center gap-4">
                  <img 
                    src={editingMetric.image} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">Change image</p>
                    <p className="text-xs text-gray-500 truncate">{editingMetric.image}</p>
                  </div>
                  <PhotoIcon className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <PhotoIcon className="w-12 h-12 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                    Click to select image from gallery
                  </span>
                </div>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EditableToggle
              label="Show Title"
              value={editingMetric.is_title_displayed}
              onChange={(value) => setEditingMetric({ ...editingMetric, is_title_displayed: value })}
            />

            <EditableToggle
              label="Card Type"
              value={editingMetric.is_card_type}
              onChange={(value) => setEditingMetric({ ...editingMetric, is_card_type: value })}
            />

            <EditableToggle
              label="Rounded Image"
              value={editingMetric.is_image_rounded_full}
              onChange={(value) => setEditingMetric({ ...editingMetric, is_image_rounded_full: value })}
            />
          </div>

          <EditableGradientPicker
            label="Background"
            isGradient={editingMetric.is_gradient}
            gradient={editingMetric.gradient}
            solidColor={editingMetric.background_color}
            onGradientChange={(isGradient, gradient) => 
              setEditingMetric({ ...editingMetric, is_gradient: isGradient, gradient })
            }
            onSolidColorChange={(color) => 
              setEditingMetric({ ...editingMetric, background_color: color })
            }
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMetric}
              variant="primary"
              size="sm"
              disabled={isLoading || !editingMetric.title || !editingMetric.description}
            >
              {isLoading ? 'Creating...' : 'Create & Add'}
            </Button>
          </div>
        </div>
      )}

      {/* Metrics List */}
      {metrics.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-sm text-gray-500">No metrics in this section</p>
          <p className="text-xs text-gray-400 mt-2">
            Click "Add Existing" to add metrics from your library or "Create New" to make a new one
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-12">
          {metrics.map((metric, index) => {
            console.log(`MetricManager rendering metric ${metric.id}:`, {
              background_color: metric.background_color,
              is_card_type: metric.is_card_type
            });

            const isCodedHarmony = textStyleVariant === 'codedharmony';
            const cardClasses = metric.is_card_type
              ? isCodedHarmony
                ? 'text-center p-4 sm:p-6 gap-y-4'
                : 'text-center p-4 sm:p-6 gap-y-4'
              : '';

            // Create background style supporting gradients
            const metricBgStyle = getBackgroundStyle(
              metric.is_gradient || false,
              metric.gradient,
              metric.background_color || 'white'
            );

            return (
            <div
              key={metric.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group border rounded-lg transition-all min-h-[350px] flex flex-col min-w-[280px] max-w-[350px] relative',
                draggedIndex === index ? 'opacity-50' : 'opacity-100',
                'border-gray-200 hover:border-gray-300',
                cardClasses
              )}
              style={{
                ...metricBgStyle,
                ...(metric.is_card_type && {
                  borderRadius: '1.5rem',
                })
              }}
            >
              {/* Floating Control Panel - Icons Only - Positioned relative to outer card */}
              <div className="absolute -top-12 left-0 right-0 z-20 px-2 py-2 flex items-center justify-between">
                {/* Left: Icon Toolbar */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Drag handle */}
                  <button 
                    className="p-2 cursor-move bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition-colors"
                    title="Drag to reorder"
                  >
                    <Bars3Icon className="w-5 h-5" />
                  </button>

                  {/* Show/Hide Title Toggle */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
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
                    }}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      metric.is_title_displayed
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    )}
                    title={metric.is_title_displayed ? 'Hide title' : 'Show title'}
                  >
                    {metric.is_title_displayed ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                  </button>

                  {/* Rounded Image Toggle */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
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
                    }}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      metric.is_image_rounded_full
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    )}
                    title={metric.is_image_rounded_full ? 'Square image' : 'Round image'}
                  >
                    <PhotoIcon className="w-5 h-5" />
                  </button>

                  {/* Card Type Toggle */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
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
                    }}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      metric.is_card_type
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    )}
                    title={metric.is_card_type ? 'Disable card type' : 'Enable card type'}
                  >
                    <RectangleGroupIcon className="w-5 h-5" />
                  </button>

                  {/* Background Color Picker */}
                  <ColorPaletteDropdown
                    value={metric.background_color || 'white'}
                    onChange={async (colorClass) => {
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

              {/* Display mode - Content Area */}
              <div 
                className="flex flex-col h-full rounded-lg transition-colors"
              >
                {/* Content Area with Padding */}
                <div className={cn(
                  'flex flex-col flex-grow',
                  metric.is_card_type ? 'px-2 py-2' : 'p-4'
                )}>
                {/* Image/Video - centered and can be reordered */}
                {metric.image ? (
                  <div 
                    className={cn(
                      'mb-3 relative group/image',
                      isImageBottom && 'order-3',
                      // Videos: full width with negative margins to break out of padding
                      isVideoUrl(metric.image) 
                        ? metric.is_card_type ? '-mx-2' : '-mx-4'
                        : 'flex justify-center' // Images: centered
                    )}
                  >
                    {/* Render Video or Image */}
                    {isVideoUrl(metric.image) ? (
                      metric.image.toLowerCase().includes('youtube.com') || 
                      metric.image.toLowerCase().includes('youtu.be') || 
                      metric.image.toLowerCase().includes('vimeo.com') ? (
                        <iframe
                          src={getEmbedUrl(metric.image)}
                          className={cn(
                            'w-full rounded-none',
                            imageMetricsHeight || 'h-48'
                          )}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={metric.image}
                          controls
                          className={cn(
                            'w-full object-cover rounded-none',
                            imageMetricsHeight || 'h-48'
                          )}
                          style={{ maxWidth: '100%' }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )
                    ) : (
                      <img
                        src={metric.image}
                        alt={metric.title}
                        className={cn(
                          'mx-auto w-auto object-cover',
                          imageMetricsHeight || 'h-48',
                          metric.is_image_rounded_full ? 'rounded-full' : 'rounded-lg'
                        )}
                      />
                    )}
                    {/* Overlay button to change media on hover */}
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
                    {/* Remove media button - top right corner */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
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
                  </div>
                ) : (
                  <div 
                    className={cn('flex justify-center mb-3 relative group/add-media', isImageBottom && 'order-3')}
                  >
                    {/* Add Media Container - shows two buttons on hover */}
                    <div 
                      className={cn(
                        'border-2 border-dashed border-gray-300 rounded-lg transition-all flex items-center justify-center relative overflow-hidden',
                        imageMetricsHeight || 'h-48',
                        'w-auto px-12'
                      )}
                    >
                      {/* Placeholder text - visible when not hovering */}
                      <div className="flex flex-col items-center gap-2 opacity-100 group-hover/add-media:opacity-0 transition-opacity">
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-500">Add Media</span>
                      </div>
                      
                      {/* Button options - visible on hover */}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover/add-media:opacity-100 transition-opacity bg-gray-50/80 backdrop-blur-sm">
                        {/* Gallery Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageGalleryState({ isOpen: true, metricId: metric.id });
                          }}
                          className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                          title="Select from gallery"
                        >
                          <PhotoIcon className="w-7 h-7 text-gray-600" />
                          <span className="text-xs font-medium text-gray-700">Gallery</span>
                        </button>
                        
                        {/* URL Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUrlPromptState({ isOpen: true, metricId: metric.id, currentUrl: '' });
                          }}
                          className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-lg bg-white hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                          title="Enter URL"
                        >
                          <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700">URL</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content - Grows to fill space */}
                <div className="space-y-2 flex-grow">
                  {metric.is_title_displayed && (
                    <input
                      type="text"
                          value={metric.title}
                          onChange={async (e) => {
                            const newTitle = e.target.value;
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
                          className={cn(
                            'w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent',
                            textVar.metricTitle
                          )}
                          placeholder="Metric title..."
                        />
                      )}
                      <textarea
                        value={metric.description}
                        onChange={async (e) => {
                          const newDescription = e.target.value;
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
                        rows={3}
                        className={cn(
                          'mt-2 w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent resize-none',
                          textVar.metricDescription
                        )}
                        placeholder="Metric description..."
                      />

                      {/* Image URL Field */}
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
                        className="text-xs text-gray-500 mt-2 w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent"
                        placeholder="Image URL (optional)..."
                      />
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Add Existing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Existing Metric</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {metricsNotInSection.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>All available metrics are already in this section</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {metricsNotInSection.map(metric => (
                    <button
                      key={metric.id}
                      onClick={() => handleAddExisting(metric.id)}
                      disabled={isLoading}
                      className="w-full text-left border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        {metric.image && (
                          <div
                            className={cn(
                              'w-12 h-12 shrink-0 overflow-hidden',
                              metric.is_image_rounded_full ? 'rounded-full' : 'rounded-lg'
                            )}
                          >
                            <img
                              src={metric.image}
                              alt={metric.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{metric.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {metric.description}
                          </p>
                        </div>
                        <PlusIcon className="w-5 h-5 text-gray-400 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Metric Modal */}
      <DeleteMetricModal
        isOpen={deleteModalState.isOpen}
        metricTitle={deleteModalState.metricTitle}
        metricId={deleteModalState.metricId || 0}
        onRemoveFromSection={async () => {
          if (deleteModalState.metricId) {
            await handleRemoveMetric(deleteModalState.metricId);
          }
        }}
        onDeletePermanently={async () => {
          if (deleteModalState.metricId) {
            await handleDeleteMetric(deleteModalState.metricId);
          }
        }}
        onCancel={() => setDeleteModalState({ isOpen: false, metricId: null, metricTitle: '' })}
      />

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={imageGalleryState.isOpen}
        onClose={() => setImageGalleryState({ isOpen: false, metricId: null })}
        onSelectImage={handleImageSelect}
      />

      {/* URL Prompt Modal */}
      {urlPromptState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setUrlPromptState({ isOpen: false, metricId: null, currentUrl: '' })}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enter Image/Video URL</h3>
              <button
                onClick={() => setUrlPromptState({ isOpen: false, metricId: null, currentUrl: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={urlPromptState.currentUrl}
                  onChange={(e) => setUrlPromptState({ ...urlPromptState, currentUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlSubmit();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a direct link to an image or video file
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setUrlPromptState({ isOpen: false, metricId: null, currentUrl: '' })}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUrlSubmit}
                  variant="primary"
                  size="sm"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

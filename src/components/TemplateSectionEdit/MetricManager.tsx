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
  SwatchIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import EditableTextField from '@/components/Shared/EditableFields/EditableTextField';
import EditableTextArea from '@/components/Shared/EditableFields/EditableTextArea';
import EditableToggle from '@/components/Shared/EditableFields/EditableToggle';
import EditableColorPicker from '@/components/Shared/EditableFields/EditableColorPicker';
import Button from '@/ui/Button';
import { useToast } from '@/components/Shared/ToastContainer';
import DeleteMetricModal from './DeleteMetricModal';

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
}: MetricManagerProps) {
  const toast = useToast();
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([]);
  const [internalShowAddModal, setInternalShowAddModal] = useState(false);
  const [internalShowCreateForm, setInternalShowCreateForm] = useState(false);
  const [internalEditingMetricId, setInternalEditingMetricId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    metricId: number | null;
    metricTitle: string;
  }>({ isOpen: false, metricId: null, metricTitle: '' });

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
    background_color: '#FFFFFF',
  });

  // Fetch available metrics
  useEffect(() => {
    fetchAvailableMetrics();
  }, []);

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
        background_color: '#FFFFFF',
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

          <EditableTextField
            label="Image URL"
            value={editingMetric.image}
            onChange={(value) => setEditingMetric({ ...editingMetric, image: value })}
          />

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

            <EditableColorPicker
              label="Background Color"
              value={editingMetric.background_color}
              onChange={(value) => setEditingMetric({ ...editingMetric, background_color: value })}
            />
          </div>

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
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div
              key={metric.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'border rounded-lg transition-all',
                draggedIndex === index ? 'opacity-50' : 'opacity-100',
                'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {/* Display mode - All controls inline */}
              <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Drag handle */}
                    <button 
                      className="cursor-move text-gray-400 hover:text-gray-600 mt-1"
                      title="Drag to reorder"
                    >
                      <Bars3Icon className="w-5 h-5" />
                    </button>

                    {/* Image */}
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

                    {/* Content */}
                    <div className="flex-1 min-w-0">
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
                          className="text-sm font-medium text-gray-900 w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent"
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
                        rows={2}
                        className="text-xs text-gray-500 mt-1 w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-1 bg-transparent resize-none"
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

                      {/* Inline Controls Below Description */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {/* Left: Icon Toolbar */}
                        <div className="flex items-center gap-1">
                          {/* Show Title Toggle */}
                          <button
                            onClick={async () => {
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
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            )}
                            title={metric.is_title_displayed ? 'Hide title' : 'Show title'}
                          >
                            <Bars3Icon className="w-5 h-5" />
                          </button>

                          {/* Rounded Image Toggle */}
                          <button
                            onClick={async () => {
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
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            )}
                            title={metric.is_image_rounded_full ? 'Square image' : 'Round image'}
                          >
                            <PhotoIcon className="w-5 h-5" />
                          </button>

                          {/* Card Type Toggle */}
                          <button
                            onClick={async () => {
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
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            )}
                            title={metric.is_card_type ? 'Disable card type' : 'Enable card type'}
                          >
                            <RectangleGroupIcon className="w-5 h-5" />
                          </button>

                          {/* Background Color Picker */}
                          <div className="relative flex items-center">
                            <input
                              type="color"
                              value={metric.background_color || '#FFFFFF'}
                              onChange={async (e) => {
                                try {
                                  const response = await fetch(`/api/metrics/${metric.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ background_color: e.target.value }),
                                  });
                                  if (!response.ok) throw new Error('Failed to update');
                                  onMetricsChange();
                                } catch (error) {
                                  toast.error('Failed to update');
                                }
                              }}
                              className="absolute opacity-0 w-full h-full cursor-pointer"
                            />
                            <button
                              className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                              title="Background color"
                            >
                              <SwatchIcon className="w-5 h-5" />
                              <div 
                                className="w-4 h-4 rounded border border-gray-300" 
                                style={{ backgroundColor: metric.background_color || '#FFFFFF' }}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Right: Metadata & Delete */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          
                          <button
                            onClick={() => setDeleteModalState({
                              isOpen: true,
                              metricId: metric.id,
                              metricTitle: metric.title,
                            })}
                            className="p-2 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove or delete metric"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          ))}
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
    </div>
  );
}

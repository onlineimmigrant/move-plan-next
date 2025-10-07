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

export default function MetricManager({ sectionId, metrics, onMetricsChange }: MetricManagerProps) {
  const toast = useToast();
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    metricId: number | null;
    metricTitle: string;
  }>({ isOpen: false, metricId: null, metricTitle: '' });

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

  // Update metric
  const handleUpdateMetric = async () => {
    if (!editingMetricId || !editingMetric.title || !editingMetric.description) {
      toast.error('Title and description are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/metrics/${editingMetricId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMetric),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update metric');
      }

      toast.success('Metric updated successfully');
      setEditingMetricId(null);
      onMetricsChange();
      fetchAvailableMetrics();
    } catch (error) {
      console.error('Error updating metric:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update metric');
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

  const startEditing = (metric: Metric) => {
    setEditingMetricId(metric.id);
    setEditingMetric({
      id: metric.id,
      title: metric.title,
      description: metric.description,
      image: metric.image || '',
      is_image_rounded_full: metric.is_image_rounded_full,
      is_title_displayed: metric.is_title_displayed,
      is_card_type: metric.is_card_type,
      background_color: metric.background_color || '#FFFFFF',
    });
  };

  const cancelEditing = () => {
    setEditingMetricId(null);
    setEditingMetric({
      title: '',
      description: '',
      image: '',
      is_image_rounded_full: false,
      is_title_displayed: true,
      is_card_type: false,
      background_color: '#FFFFFF',
    });
  };

  // Get metrics not in this section
  const metricsNotInSection = availableMetrics.filter(
    am => !metrics.some(m => m.id === am.id)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Metrics/Cards</h3>
          <p className="text-sm text-gray-500 mt-1">
            {metrics.length} metric{metrics.length !== 1 ? 's' : ''} in this section
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="secondary"
            size="sm"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Create New
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="sm"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Existing
          </Button>
        </div>
      </div>

            {/* Info about ordering */}
      {metrics.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>💡 Tip:</strong> Drag metrics to reorder them. Changes are saved automatically!
          </p>
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
                editingMetricId === metric.id
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {editingMetricId === metric.id ? (
                // Editing mode
                <div className="p-4 space-y-4">
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
                    <Button onClick={cancelEditing} variant="secondary" size="sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateMetric}
                      variant="primary"
                      size="sm"
                      disabled={isLoading}
                    >
                      <CheckIcon className="w-4 h-4 mr-1" />
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Display mode
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
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {metric.title}
                        </h4>
                      )}
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {metric.description}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                        {metric.is_card_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Card
                          </span>
                        )}
                        {metric.background_color && (
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: metric.background_color }}
                            title={metric.background_color}
                          />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditing(metric)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit metric"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModalState({
                          isOpen: true,
                          metricId: metric.id,
                          metricTitle: metric.title,
                        })}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove or delete metric"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

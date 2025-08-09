import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import Tooltip from '../Tooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Feature interface matching the database structure
interface Feature {
  id?: number;
  name: string;
  slug?: string;
  content?: string;
  feature_image?: string;
  display_content?: boolean;
  display_on_product_card?: boolean;
  type?: string;
  package?: string;
  organization_id?: string | null;
  created_at?: string;
  order?: number; // For sorting
}

// Interface for pricing plan features relationship
interface PricingPlanFeature {
  id?: number;
  pricing_plan_id: number;
  feature_id: number;
  is_included: boolean;
  limit_value?: string;
  created_at?: string;
}

// Utility function to generate slug from feature name
const generateSlug = (featureName: string): string => {
  if (!featureName) return '';
  
  return featureName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Sortable Feature Item Component
interface SortableFeatureItemProps {
  feature: Feature;
  index: number;
  onEdit: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  onToggleProductCard: (index: number) => void;
  // Edit form props
  isEditing: boolean;
  editingIndex: number | null;
  editForm: Partial<Feature>;
  setEditForm: (form: Partial<Feature>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDeleteClick: (index: number) => void;
  isDragDisabled?: boolean;
}

function SortableFeatureItem({
  feature,
  index,
  onEdit,
  onToggleVisibility,
  onToggleProductCard,
  // Edit form props
  isEditing,
  editingIndex,
  editForm,
  setEditForm,
  handleSave,
  handleCancel,
  handleDeleteClick,
  isDragDisabled = false,
}: SortableFeatureItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: feature.id?.toString() || `temp-${index}`,
    disabled: isDragDisabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  // Helper function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
      .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Auto-generate slug when name changes
  useEffect(() => {
    if (isEditing && editingIndex === index && editForm.name && !editForm.slug) {
      const newSlug = generateSlug(editForm.name);
      setEditForm({ ...editForm, slug: newSlug });
    }
  }, [editForm.name, isEditing, editingIndex, index, editForm, setEditForm]);

  // Tooltip content for feature info
  const tooltipContent = (
    <div className="space-y-2">
      <div><strong>Name:</strong> {feature.name}</div>
      {feature.slug && <div><strong>Slug:</strong> {feature.slug}</div>}
      {feature.type && <div><strong>Type:</strong> {feature.type}</div>}
      {feature.package && <div><strong>Package:</strong> {feature.package}</div>}
      <div><strong>Display Content:</strong> {feature.display_content ? 'Yes' : 'No'}</div>
      <div><strong>Show on Product Card:</strong> {feature.display_on_product_card ? 'Yes' : 'No'}</div>
      {feature.content && <div><strong>Content:</strong> {truncateText(feature.content, 100)}</div>}
    </div>
  );

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white border border-gray-200 rounded-lg transition-all duration-200 ${
        isDragging ? 'shadow-lg border-emerald-300 bg-emerald-50/50' : 'hover:shadow-md hover:border-gray-300'
      }`}
    >
      {/* Feature Item Display */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Tooltip content={tooltipContent}>
                <h4 className="text-sm font-medium text-gray-900 truncate cursor-help">
                  {truncateText(feature.name || 'Untitled Feature', 15)}
                </h4>
              </Tooltip>
              {feature.type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {feature.type}
                </span>
              )}
            </div>

          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleVisibility(index)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              feature.display_content 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={feature.display_content ? 'Hide content' : 'Show content'}
          >
            {feature.display_content ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onToggleProductCard(index)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              feature.display_on_product_card 
                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={feature.display_on_product_card ? 'Remove from product card' : 'Show on product card'}
          >
            {feature.display_on_product_card ? '🏷️' : '🏷️'}
          </button>
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit feature"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Form - Positioned right under the feature item */}
      {isEditing && editingIndex === index && (
        <div className="border-t border-gray-200 bg-gray-50/50 p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">
            {editingIndex !== null ? 'Edit Feature' : 'Add New Feature'}
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Feature Name *
              </label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter feature name..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={editForm.slug || ''}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                placeholder="e.g., premium-feature"
                title="Auto-generated from feature name, but can be manually edited"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <input
                type="text"
                value={editForm.type || ''}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., premium, basic, addon"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Package
              </label>
              <input
                type="text"
                value={editForm.package || ''}
                onChange={(e) => setEditForm({ ...editForm, package: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., starter, professional, enterprise"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Feature Image URL
              </label>
              <input
                type="url"
                value={editForm.feature_image || ''}
                onChange={(e) => setEditForm({ ...editForm, feature_image: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://example.com/feature-image.jpg"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.display_content === true}
                  onChange={(e) => setEditForm({ ...editForm, display_content: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Display Content</span>
              </label>
              
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.display_on_product_card === true}
                  onChange={(e) => setEditForm({ ...editForm, display_on_product_card: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-700">Show on Product Card</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={editForm.content || ''}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Feature description and details..."
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center gap-2 pt-4 border-t border-gray-200 mt-4">
            <div>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => handleDeleteClick(editingIndex)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-800"
                >
                  <TrashIcon className="w-3 h-3" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editForm.name}
                className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Feature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FeatureSelectProps {
  label: string;
  name: string;
  value: Feature[];
  onChange: (name: string, value: Feature[]) => void;
}

export const FeatureSelect: React.FC<FeatureSelectProps> = ({
  label,
  name,
  value = [],
  onChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Feature>>({});
  const [displayCount, setDisplayCount] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<number | null>(null);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Delete functionality
  const handleDelete = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    // Update order values to be sequential
    const reorderedValue = newValue.map((feature, idx) => ({
      ...feature,
      order: idx + 1,
    }));
    onChange(name, reorderedValue);
    
    // Dispatch auto-save event for features
    const autoSaveEvent = new CustomEvent('autoSaveFeatureChanges', { 
      detail: { 
        type: 'feature_delete',
        updatedFeatures: reorderedValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for feature delete');
  };

  const handleDeleteClick = (index: number) => {
    setFeatureToDelete(index);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (featureToDelete !== null) {
      handleDelete(featureToDelete);
      setShowDeleteModal(false);
      setFeatureToDelete(null);
      setIsEditing(false);
      setEditingIndex(null);
      setEditForm({});
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFeatureToDelete(null);
  };

  const handleAdd = useCallback(() => {
    const nextOrder = Math.max(0, ...value.map(feature => feature.order || 0)) + 1;
    setEditForm({
      name: '',
      slug: '',
      content: '',
      feature_image: '',
      display_content: true,
      display_on_product_card: false,
      type: '',
      package: '',
      order: nextOrder,
    });
    setEditingIndex(null);
    setIsEditing(true);
  }, [value]);

  const handleEdit = useCallback((index: number) => {
    const featureToEdit = value[index];
    setEditForm({ ...featureToEdit });
    setEditingIndex(index);
    setIsEditing(true);
  }, [value]);

  const handleSave = useCallback(() => {
    if (!editForm.name) return;
    
    let newValue;
    if (editingIndex !== null) {
      // Update existing feature
      newValue = value.map((feature, index) => 
        index === editingIndex ? { ...feature, ...editForm } : feature
      );
    } else {
      // Add new feature
      const newFeature: Feature = {
        name: editForm.name || '',
        slug: editForm.slug || '',
        content: editForm.content || '',
        feature_image: editForm.feature_image || '',
        display_content: editForm.display_content || true,
        display_on_product_card: editForm.display_on_product_card || false,
        type: editForm.type || '',
        package: editForm.package || '',
        order: editForm.order || 1,
        organization_id: editForm.organization_id || null
      };
      newValue = [...value, newFeature];
    }
    
    onChange(name, newValue);
    
    // Dispatch auto-save event for features
    const autoSaveEvent = new CustomEvent('autoSaveFeatureChanges', { 
      detail: { 
        type: editingIndex !== null ? 'feature_update' : 'feature_add',
        updatedFeatures: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for feature save');
    
    setIsEditing(false);
    setEditingIndex(null);
    setEditForm({});
  }, [editForm, editingIndex, value, name, onChange]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditingIndex(null);
    setEditForm({});
  }, []);

  const handleToggleVisibility = (index: number) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      display_content: !newValue[index].display_content
    };
    onChange(name, newValue);
    
    // Dispatch auto-save event for features
    const autoSaveEvent = new CustomEvent('autoSaveFeatureChanges', { 
      detail: { 
        type: 'feature_visibility_toggle',
        updatedFeatures: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for feature visibility toggle');
  };

  const handleToggleProductCard = (index: number) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      display_on_product_card: !newValue[index].display_on_product_card
    };
    onChange(name, newValue);
    
    // Dispatch auto-save event for features
    const autoSaveEvent = new CustomEvent('autoSaveFeatureChanges', { 
      detail: { 
        type: 'feature_product_card_toggle',
        updatedFeatures: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for feature product card toggle');
  };

  // Handle drag and drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(feature => 
        (feature.id?.toString() || `temp-${value.indexOf(feature)}`) === active.id
      );
      const newIndex = value.findIndex(feature => 
        (feature.id?.toString() || `temp-${value.indexOf(feature)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newValue = arrayMove(value, oldIndex, newIndex);
        // Update order values to match new positions
        const reorderedValue = newValue.map((feature, index) => ({
          ...feature,
          order: index + 1,
        }));
        onChange(name, reorderedValue);
        
        // Dispatch auto-save event for features
        const autoSaveEvent = new CustomEvent('autoSaveFeatureChanges', { 
          detail: { 
            type: 'feature_reorder',
            updatedFeatures: reorderedValue 
          }
        });
        window.dispatchEvent(autoSaveEvent);
        console.log('🚀 Auto-save event dispatched for feature reorder');
      }
    }
  };

  // Sort features by order
  const sortedFeatures = useMemo(() => {
    return [...value].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [value]);

  const displayedFeatures = sortedFeatures.slice(0, displayCount);
  const hasMoreFeatures = sortedFeatures.length > displayCount;

  const loadMoreFeatures = () => {
    setDisplayCount(prev => prev + 10);
  };

  // Listen for the addFeature event (similar to ProductSelect)
  useEffect(() => {
    const handleAddFeatureEvent = () => {
      handleAdd();
    };
    
    window.addEventListener('addFeature', handleAddFeatureEvent);
    
    return () => {
      window.removeEventListener('addFeature', handleAddFeatureEvent);
    };
  }, [handleAdd]);

  return (
    <div className="space-y-4">
      {/* Add Form - Only for adding new features - Positioned at top */}
      {isEditing && editingIndex === null && (
        <div className="border border-orange-300 rounded-lg p-4 bg-orange-50 space-y-4">
          <h4 className="text-sm font-medium text-orange-900">
            Add Feature
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Feature Name *
              </label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => {
                  const newFeatureName = e.target.value;
                  const newSlug = generateSlug(newFeatureName);
                  setEditForm(prev => ({ 
                    ...prev, 
                    name: newFeatureName,
                    slug: newSlug
                  }));
                }}
                placeholder="Enter feature name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug (URL-friendly name) *
              </label>
              <input
                type="text"
                value={editForm.slug || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="feature-slug"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={editForm.content || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Feature description/content"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Feature Image URL
              </label>
              <input
                type="url"
                value={editForm.feature_image || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, feature_image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <input
                type="text"
                value={editForm.type || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                placeholder="Feature type"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Package
            </label>
            <input
              type="text"
              value={editForm.package || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, package: e.target.value }))}
              placeholder="Package name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.display_content || false}
                onChange={(e) => setEditForm(prev => ({ ...prev, display_content: e.target.checked }))}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-medium text-gray-700">Display Content</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.display_on_product_card || false}
                onChange={(e) => setEditForm(prev => ({ ...prev, display_on_product_card: e.target.checked }))}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-medium text-gray-700">Display on Product Card</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editForm.name}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save Feature
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={displayedFeatures.map(feature => feature.id?.toString() || `temp-${sortedFeatures.indexOf(feature)}`)}
            strategy={verticalListSortingStrategy}
          >
            {displayedFeatures.map((feature, index) => (
                <SortableFeatureItem
                  key={`${feature.id?.toString() || `temp-${index}`}-${feature.name}-${feature.order}`}
                  feature={feature}
                  index={sortedFeatures.indexOf(feature)} // Use original index for operations
                  onEdit={handleEdit}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleProductCard={handleToggleProductCard}
                  isEditing={isEditing}
                  editingIndex={editingIndex}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                  handleDeleteClick={handleDeleteClick}
                  isDragDisabled={isEditing}
                />
              ))
            }
          </SortableContext>
        </DndContext>
        
        {/* Load More Button */}
        {hasMoreFeatures && (
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              onClick={loadMoreFeatures}
              className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 hover:border-sky-300 transition-colors duration-200"
            >
              Load More Features (+10)
            </button>
          </div>
        )}

        {value.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No features yet</h3>
              <p className="text-xs text-gray-500">
                Use "Add Feature" in the section header to create your first feature.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && featureToDelete !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Feature</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{truncateText(value[featureToDelete]?.name || '', 30)}"?
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback, SetStateAction, Dispatch } from 'react';
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

// FAQ interface matching the database structure
interface FAQ {
  id?: number;
  question: string;
  answer?: string;
  section?: string;
  order?: number;
  display_order?: number;
  display_home_page?: boolean;
  product_sub_type_id?: number;
  organization_id?: string | null;
  created_at?: string;
}

// Utility function to generate slug from FAQ question
const generateSlug = (question: string): string => {
  if (!question) return '';
  
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Sortable FAQ Item Component
interface SortableFAQItemProps {
  faq: FAQ;
  index: number;
  onEdit: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  // Edit form props
  isEditing: boolean;
  editingIndex: number | null;
  editForm: Partial<FAQ>;
  setEditForm: (form: Partial<FAQ>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDeleteClick: (index: number) => void;
  isDragDisabled?: boolean;
}

function SortableFAQItem({
  faq,
  index,
  onEdit,
  onToggleVisibility,
  // Edit form props
  isEditing,
  editingIndex,
  editForm,
  setEditForm,
  handleSave,
  handleCancel,
  handleDeleteClick,
  isDragDisabled = false,
}: SortableFAQItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: faq.id?.toString() || `temp-${index}`,
    disabled: isDragDisabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  // Helper function to truncate long text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`group bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-sm'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <button
              type="button"
              className={`cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors mt-1 ${isDragDisabled ? 'opacity-50' : ''}`}
              {...attributes}
              {...listeners}
              disabled={isDragDisabled}
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {truncateText(faq.question, 60)}
              </h4>
              {faq.answer && (
                <p className="text-xs text-gray-500 mb-2">
                  {truncateText(faq.answer, 100)}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {faq.section && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Section: {faq.section}
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                  faq.display_home_page 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {faq.display_home_page ? 'Visible on Homepage' : 'Hidden from Homepage'}
                </span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                  Order: {faq.order || index + 1}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content="Toggle homepage visibility">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(index);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                {faq.display_home_page ? (
                  <EyeIcon className="h-4 w-4" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4" />
                )}
              </button>
            </Tooltip>
            
            <Tooltip content="Edit FAQ">
              <button
                type="button"
                onClick={() => onEdit(index)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </Tooltip>
            
            <Tooltip content="Delete FAQ">
              <button
                type="button"
                onClick={() => handleDeleteClick(index)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && editingIndex === index && (
          <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 -mx-4 px-4 -mb-4 pb-4 rounded-b-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={editForm.question || ''}
                  onChange={(e) => {
                    const updatedForm = { ...editForm, question: e.target.value };
                    setEditForm(updatedForm);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Enter FAQ question"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Answer *
                </label>
                <textarea
                  value={editForm.answer || ''}
                  onChange={(e) => {
                    const updatedForm = { ...editForm, answer: e.target.value };
                    setEditForm(updatedForm);
                  }}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Enter FAQ answer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={editForm.section || ''}
                    onChange={(e) => {
                      const updatedForm = { ...editForm, section: e.target.value };
                      setEditForm(updatedForm);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="e.g., General, Pricing, Support"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={editForm.order || ''}
                    onChange={(e) => {
                      const updatedForm = { ...editForm, order: parseInt(e.target.value) || undefined };
                      setEditForm(updatedForm);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Display order"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.display_home_page || false}
                    onChange={(e) => {
                      const updatedForm = { ...editForm, display_home_page: e.target.checked };
                      setEditForm(updatedForm);
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-700">Display on Homepage</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editForm.question || !editForm.answer}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main FAQSelect Component
interface FAQSelectProps {
  label: string;
  name: string;
  value: FAQ[];
  onChange: (name: string, value: FAQ[]) => void;
}

export const FAQSelect: React.FC<FAQSelectProps> = ({
  label,
  name,
  value = [],
  onChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<FAQ>>({});
  const [displayCount, setDisplayCount] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [faqToDelete, setFAQToDelete] = useState<number | null>(null);

  // Helper function to update edit form
  const updateEditForm = useCallback((field: keyof Partial<FAQ>, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

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
    const reorderedValue = newValue.map((faq, idx) => ({
      ...faq,
      order: idx + 1,
    }));
    onChange(name, reorderedValue);
    
    // Dispatch auto-save event for FAQs
    const autoSaveEvent = new CustomEvent('autoSaveFAQChanges', { 
      detail: { 
        type: 'faq_delete',
        updatedFAQs: reorderedValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for FAQ delete');
  };

  const handleDeleteClick = (index: number) => {
    setFAQToDelete(index);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (faqToDelete !== null) {
      handleDelete(faqToDelete);
      setShowDeleteModal(false);
      setFAQToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFAQToDelete(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = sortedFAQs.findIndex(faq => faq.id?.toString() === active.id || `temp-${sortedFAQs.indexOf(faq)}` === active.id);
    const newIndex = sortedFAQs.findIndex(faq => faq.id?.toString() === over.id || `temp-${sortedFAQs.indexOf(faq)}` === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedFAQs, oldIndex, newIndex);
      // Update order field
      const reorderedValue = newOrder.map((faq, index) => ({
        ...faq,
        order: index + 1,
      }));
      
      onChange(name, reorderedValue);
      
      // Dispatch auto-save event for reordering
      const autoSaveEvent = new CustomEvent('autoSaveFAQChanges', { 
        detail: { 
          type: 'faq_reorder',
          updatedFAQs: reorderedValue 
        }
      });
      window.dispatchEvent(autoSaveEvent);
      console.log('🚀 Auto-save event dispatched for FAQ reorder');
    }
  };

  const handleAdd = useCallback(() => {
    const nextOrder = Math.max(...value.map(f => f.order || 0), 0) + 1;
    setEditForm({
      question: '',
      answer: '',
      section: '',
      order: nextOrder,
      display_home_page: true
    });
    setEditingIndex(null);
    setIsEditing(true);
  }, [value]);

  // Listen for custom add FAQ event
  useEffect(() => {
    const handleAddFAQEvent = () => {
      handleAdd();
    };
    
    window.addEventListener('addFAQ', handleAddFAQEvent);
    
    return () => {
      window.removeEventListener('addFAQ', handleAddFAQEvent);
    };
  }, [handleAdd]);

  const handleEdit = (index: number) => {
    setEditForm({ ...value[index] });
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = useCallback(() => {
    if (!editForm.question || !editForm.answer) return;
    
    let newValue;
    if (editingIndex !== null) {
      // Update existing FAQ
      newValue = value.map((faq, index) => 
        index === editingIndex ? { ...faq, ...editForm } : faq
      );
    } else {
      // Add new FAQ
      const newFAQ: FAQ = {
        question: editForm.question || '',
        answer: editForm.answer || '',
        section: editForm.section || '',
        order: editForm.order || 1,
        display_home_page: editForm.display_home_page || true,
        organization_id: editForm.organization_id || null
      };
      newValue = [...value, newFAQ];
    }
    
    onChange(name, newValue);
    
    // Dispatch auto-save event for FAQs
    const autoSaveEvent = new CustomEvent('autoSaveFAQChanges', { 
      detail: { 
        type: editingIndex !== null ? 'faq_update' : 'faq_add',
        updatedFAQs: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for FAQ save');
    
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
      display_home_page: !newValue[index].display_home_page
    };
    onChange(name, newValue);
    
    // Dispatch auto-save event for FAQ visibility toggle
    const autoSaveEvent = new CustomEvent('autoSaveFAQChanges', { 
      detail: { 
        type: 'faq_visibility_toggle',
        updatedFAQs: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for FAQ visibility toggle');
  };

  const sortedFAQs = useMemo(() => {
    return [...value].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [value]);

  const displayedFAQs = sortedFAQs.slice(0, displayCount);
  const hasMoreFAQs = sortedFAQs.length > displayCount;

  const loadMoreFAQs = () => {
    setDisplayCount(prev => prev + 10);
  };

  // Helper function to truncate long text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="space-y-4">
      {/* Add Form - Only for adding new FAQs - Positioned at top */}
      {isEditing && editingIndex === null && (
        <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 space-y-4">
          <h4 className="text-sm font-medium text-blue-900">
            Add FAQ
          </h4>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Question *
            </label>
            <input
              type="text"
              value={editForm.question || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter FAQ question"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Answer *
            </label>
            <textarea
              value={editForm.answer || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Enter FAQ answer"
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                type="text"
                value={editForm.section || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, section: e.target.value }))}
                placeholder="e.g., General, Pricing, Support"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                value={editForm.order || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, order: parseInt(e.target.value) || undefined }))}
                placeholder="Display order"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.display_home_page || false}
                onChange={(e) => setEditForm(prev => ({ ...prev, display_home_page: e.target.checked }))}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">Display on Homepage</span>
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
              disabled={!editForm.question || !editForm.answer}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save FAQ
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
            items={displayedFAQs.map(faq => faq.id?.toString() || `temp-${sortedFAQs.indexOf(faq)}`)}
            strategy={verticalListSortingStrategy}
          >
            {displayedFAQs.map((faq, index) => (
                <SortableFAQItem
                  key={`${faq.id?.toString() || `temp-${index}`}-${faq.question}-${faq.order}`}
                  faq={faq}
                  index={sortedFAQs.indexOf(faq)} // Use original index for operations
                  onEdit={handleEdit}
                  onToggleVisibility={handleToggleVisibility}
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
        {hasMoreFAQs && (
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              onClick={loadMoreFAQs}
              className="px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 hover:border-sky-300 transition-colors duration-200"
            >
              Load More FAQs (+10)
            </button>
          </div>
        )}

        {value.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No FAQs yet</h3>
              <p className="text-xs text-gray-500">
                Use "Add FAQ" in the section header to create your first FAQ.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && faqToDelete !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete FAQ</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{truncateText(value[faqToDelete]?.question || '', 30)}"?
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

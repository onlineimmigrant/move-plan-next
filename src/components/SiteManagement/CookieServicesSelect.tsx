'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
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

interface CookieService {
  id?: number;
  name: string;
  description: string;
  active: boolean;
  processing_company?: string | null;
  data_processor_cookie_policy_url?: string | null;
  data_processor_privacy_policy_url?: string | null;
  data_protection_officer_contact?: string | null;
  retention_period?: string | null;
  category_id: number;
  organization_id?: string;
  created_at?: string;
  order?: number;
}

interface CookieCategory {
  id: number;
  name: string;
  description: string;
}

// Category Dropdown Component
interface CategoryDropdownProps {
  value: number | '';
  onChange: (categoryId: number) => void;
  categories: CookieCategory[];
  className?: string;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ 
  value, 
  onChange, 
  categories,
  className = ''
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const selectedCategory = categories.find(cat => cat.id === value) || null;
  
  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateButtonRect();
      const handleScroll = () => updateButtonRect();
      const handleResize = () => updateButtonRect();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleChange = (categoryId: number) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const dropdownContent = isOpen && buttonRect && createPortal(
    <div
      className="fixed z-[99999] mt-2 max-h-80 overflow-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: Math.max(buttonRect.width, 200),
      }}
    >
      <div className="py-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleChange(category.id)}
            className={`relative cursor-pointer select-none py-3 px-4 w-full text-left transition-colors duration-200 hover:bg-emerald-50/80 hover:text-emerald-900 ${
              category.id === value ? 'bg-emerald-100/60 text-emerald-900' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700">{category.name}</span>
                  {category.description && (
                    <span className="text-xs text-gray-500 truncate max-w-[160px]">
                      {category.description}
                    </span>
                  )}
                </div>
              </div>
              {category.id === value && (
                <CheckIcon className="h-4 w-4 text-emerald-600" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedCategory ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded">
                  <span className="text-xs font-medium text-gray-600">
                    {selectedCategory.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-gray-700">{selectedCategory.name}</span>
              </div>
            ) : (
              <span className="text-gray-500">Select Category</span>
            )}
          </div>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </span>
        </div>
      </button>
      {dropdownContent}
    </div>
  );
};

// Sortable Service Item Component
interface SortableServiceItemProps {
  service: CookieService;
  index: number;
  categories: CookieCategory[];
  onEdit: (index: number) => void;
  onToggleActive: (index: number) => void;
  // Edit form props
  isEditing: boolean;
  editingIndex: number | null;
  editForm: Partial<CookieService>;
  setEditForm: (form: Partial<CookieService>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDeleteClick: () => void;
  isDragDisabled?: boolean;
}

function SortableServiceItem({
  service,
  index,
  categories,
  onEdit,
  onToggleActive,
  isEditing,
  editingIndex,
  editForm,
  setEditForm,
  handleSave,
  handleCancel,
  handleDeleteClick,
  isDragDisabled = false,
}: SortableServiceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: service.id?.toString() || `temp-${index}`,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  };

  const tooltipContent = (
    <div className="space-y-1">
      <div><strong>Description:</strong> {service.description || 'No description'}</div>
      <div><strong>Category:</strong> {getCategoryName(service.category_id)}</div>
      {service.processing_company && (
        <div><strong>Company:</strong> {service.processing_company}</div>
      )}
      {service.retention_period && (
        <div><strong>Retention:</strong> {service.retention_period}</div>
      )}
      {service.created_at && (
        <div><strong>Created:</strong> {formatDate(service.created_at)}</div>
      )}
      <div><strong>Status:</strong> {service.active ? 'Active' : 'Inactive'}</div>
    </div>
  );

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-sky-500/20' : ''
      }`}
    >
      {/* Main Service Item */}
      <div className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors rounded-t-xl">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
            disabled={isDragDisabled}
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <Tooltip content={tooltipContent} variant="info-top">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 truncate cursor-help">
                  {truncateText(service.name, 20)}
                </span>
                {!service.active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                    Inactive
                  </span>
                )}
                <span className="text-xs text-blue-600 font-medium">
                  {getCategoryName(service.category_id)}
                </span>
              </div>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleActive(index)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              service.active 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={service.active ? 'Deactivate service' : 'Activate service'}
          >
            {service.active ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit service"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && editingIndex === index && (
        <div className="border-t border-gray-200/60 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
            <h4 className="text-sm font-semibold text-emerald-900">
              Edit Cookie Service
            </h4>
          </div>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Service Name *
              </label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., Google Analytics"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category *
              </label>
              <CategoryDropdown
                value={editForm.category_id || ''}
                onChange={(categoryId) => setEditForm({ ...editForm, category_id: categoryId })}
                categories={categories}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Processing Company
              </label>
              <input
                type="text"
                value={editForm.processing_company || ''}
                onChange={(e) => setEditForm({ ...editForm, processing_company: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., Google LLC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Retention Period
              </label>
              <input
                type="text"
                value={editForm.retention_period || ''}
                onChange={(e) => setEditForm({ ...editForm, retention_period: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., 2 years, Session"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description *
              </label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-vertical"
                placeholder="Brief description of what this service does and what data it collects..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cookie Policy URL
              </label>
              <input
                type="url"
                value={editForm.data_processor_cookie_policy_url || ''}
                onChange={(e) => setEditForm({ ...editForm, data_processor_cookie_policy_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="https://example.com/cookie-policy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Privacy Policy URL
              </label>
              <input
                type="url"
                value={editForm.data_processor_privacy_policy_url || ''}
                onChange={(e) => setEditForm({ ...editForm, data_processor_privacy_policy_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="https://example.com/privacy-policy"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.active === true}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-200/60 rounded focus:ring-emerald-500/20 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="px-3 py-2 text-sm font-medium text-red-700 bg-white/80 backdrop-blur-sm border border-red-200/60 rounded-xl hover:bg-red-50/80 focus:outline-none focus:ring-2 focus:ring-red-500/20 flex items-center gap-2 transition-all duration-200"
                  title="Delete this service"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editForm.name || !editForm.description || !editForm.category_id}
                className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 border border-transparent rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {editingIndex !== null ? 'Update' : 'Add'} Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CookieServicesSelectProps {
  value: CookieService[];
  onChange: (services: CookieService[]) => void;
  error?: string;
  availableCategories?: CookieCategory[];
}

export const CookieServicesSelect: React.FC<CookieServicesSelectProps> = ({
  value = [],
  onChange,
  error,
  availableCategories = []
}) => {
  console.log('🍪 CookieServicesSelect render - current value count:', value?.length || 0, 'value:', value);
  
  // Dispatch count update event when value changes
  useEffect(() => {
    const countUpdateEvent = new CustomEvent('cookieServicesCountUpdate', {
      detail: { count: value?.length || 0 }
    });
    window.dispatchEvent(countUpdateEvent);
    console.log('🔢 Dispatched cookieServicesCountUpdate event with count:', value?.length || 0);
  }, [value]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CookieService>>({});
  const [displayCount, setDisplayCount] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    const reorderedValue = newValue.map((service, idx) => ({
      ...service,
      order: idx + 1,
    }));
    onChange(reorderedValue);
    
    // Dispatch auto-save event
    const autoSaveEvent = new CustomEvent('autoSaveCookieServiceChanges', { 
      detail: { 
        type: 'cookie_service_delete',
        updatedCookieServices: reorderedValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for cookie service delete');
  };

  const handleDeleteClick = () => {
    if (editingIndex !== null) {
      setServiceToDelete(editingIndex);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (serviceToDelete !== null) {
      handleDelete(serviceToDelete);
      setShowDeleteModal(false);
      setServiceToDelete(null);
      setIsEditing(false);
      setEditingIndex(null);
      setEditForm({});
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  const handleAdd = useCallback(() => {
    const nextOrder = Math.max(0, ...value.map(service => service.order || 0)) + 1;
    setEditForm({
      name: '',
      description: '',
      active: true,
      processing_company: '',
      data_processor_cookie_policy_url: '',
      data_processor_privacy_policy_url: '',
      data_protection_officer_contact: '',
      retention_period: '',
      category_id: availableCategories[0]?.id || 1,
      order: nextOrder
    });
    setEditingIndex(null);
    setIsEditing(true);
  }, [value, availableCategories]);

  // Listen for custom add service event
  useEffect(() => {
    const handleAddServiceEvent = () => {
      handleAdd();
    };
    
    window.addEventListener('addCookieService', handleAddServiceEvent);
    
    return () => {
      window.removeEventListener('addCookieService', handleAddServiceEvent);
    };
  }, [handleAdd]);

  const handleEdit = (index: number) => {
    setEditForm({ ...value[index] });
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    console.log('🔍 HandleSave called with editForm:', editForm);
    console.log('🔍 Validation check - name:', editForm.name, 'description:', editForm.description, 'category_id:', editForm.category_id);
    
    if (!editForm.name || !editForm.description || !editForm.category_id) {
      console.log('❌ Validation failed - missing required fields');
      return;
    }

    // Get organization ID from environment variable
    const organizationId = process.env.NEXT_PUBLIC_TENANT_ID;
    console.log('🏢 Organization ID from env:', organizationId);
    if (!organizationId) {
      console.error('Organization ID not found - cannot save cookie service');
      return;
    }

    const newService: CookieService = {
      ...editForm,
      name: editForm.name!,
      description: editForm.description!,
      category_id: editForm.category_id!,
      active: editForm.active === true,
      processing_company: editForm.processing_company || null,
      data_processor_cookie_policy_url: editForm.data_processor_cookie_policy_url || null,
      data_processor_privacy_policy_url: editForm.data_processor_privacy_policy_url || null,
      data_protection_officer_contact: editForm.data_protection_officer_contact || null,
      retention_period: editForm.retention_period || null,
      organization_id: organizationId,
      order: editForm.order || 1
    };

    let newValue: CookieService[];
    let operationType: string;
    
    if (editingIndex !== null) {
      // Editing existing service - preserve the original ID
      const originalService = value[editingIndex];
      newValue = [...value];
      newValue[editingIndex] = {
        ...newService,
        id: originalService.id, // Preserve the existing ID
        created_at: originalService.created_at, // Preserve original creation date
        organization_id: originalService.organization_id || organizationId // Preserve organization ID or use current
      };
      operationType = 'cookie_service_edit';
    } else {
      // Adding new service
      newValue = [...value, newService];
      operationType = 'cookie_service_add';
    }

    onChange(newValue);
    
    console.log('🔄 Updated cookie services count:', newValue.length);
    console.log('🔄 Calling onChange with new value, should trigger parent re-render');
    
    // Dispatch auto-save event
    const autoSaveEvent = new CustomEvent('autoSaveCookieServiceChanges', { 
      detail: { 
        type: operationType,
        updatedCookieServices: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for cookie service', operationType);
    
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
  };

  const handleToggleActive = (index: number) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      active: !newValue[index].active
    };
    onChange(newValue);
    
    // Dispatch auto-save event
    const autoSaveEvent = new CustomEvent('autoSaveCookieServiceChanges', { 
      detail: { 
        type: 'cookie_service_active_toggle',
        updatedCookieServices: newValue 
      }
    });
    window.dispatchEvent(autoSaveEvent);
    console.log('🚀 Auto-save event dispatched for cookie service active toggle');
  };

  // Handle drag and drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(service => 
        (service.id?.toString() || `temp-${value.indexOf(service)}`) === active.id
      );
      const newIndex = value.findIndex(service => 
        (service.id?.toString() || `temp-${value.indexOf(service)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newValue = arrayMove(value, oldIndex, newIndex);
        
        // Update order values to match new positions
        const updatedValue = newValue.map((service, index) => ({
          ...service,
          order: index + 1,
        }));

        onChange(updatedValue);

        // Dispatch auto-save event
        const autoSaveEvent = new CustomEvent('autoSaveCookieServiceChanges', { 
          detail: { 
            type: 'cookie_service_reorder',
            updatedCookieServices: updatedValue 
          }
        });
        window.dispatchEvent(autoSaveEvent);
        console.log('🚀 Auto-save event dispatched for cookie service reorder');
      }
    }
  };

  const loadMoreServices = () => {
    setDisplayCount(prev => prev + 10);
  };

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return value;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return value.filter(service => {
      const name = service.name?.toLowerCase() || '';
      const description = service.description?.toLowerCase() || '';
      const processingCompany = service.processing_company?.toLowerCase() || '';
      
      return name.includes(query) || description.includes(query) || processingCompany.includes(query);
    });
  }, [value, searchQuery]);

  const sortedServices = filteredServices.sort((a, b) => (a.order || 0) - (b.order || 0));
  const displayedServices = sortedServices.slice(0, displayCount);
  const hasMoreServices = sortedServices.length > displayCount;

  return (
    <div className="space-y-4">
      {/* Add Form - Only for adding new services - Positioned at top */}
      {isEditing && editingIndex === null && (
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 backdrop-blur-sm border border-emerald-200/60 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
            <h4 className="text-sm font-semibold text-emerald-900">
              Add New Cookie Service
            </h4>
          </div>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Service Name *
              </label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., Google Analytics"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category *
              </label>
              <CategoryDropdown
                value={editForm.category_id || ''}
                onChange={(categoryId) => setEditForm({ ...editForm, category_id: categoryId })}
                categories={availableCategories}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Processing Company
              </label>
              <input
                type="text"
                value={editForm.processing_company || ''}
                onChange={(e) => setEditForm({ ...editForm, processing_company: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., Google LLC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Retention Period
              </label>
              <input
                type="text"
                value={editForm.retention_period || ''}
                onChange={(e) => setEditForm({ ...editForm, retention_period: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="e.g., 2 years, Session"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description *
              </label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-vertical"
                placeholder="Brief description of what this service does and what data it collects..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cookie Policy URL
              </label>
              <input
                type="url"
                value={editForm.data_processor_cookie_policy_url || ''}
                onChange={(e) => setEditForm({ ...editForm, data_processor_cookie_policy_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="https://example.com/cookie-policy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Privacy Policy URL
              </label>
              <input
                type="url"
                value={editForm.data_processor_privacy_policy_url || ''}
                onChange={(e) => setEditForm({ ...editForm, data_processor_privacy_policy_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="https://example.com/privacy-policy"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.active === true}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-200/60 rounded focus:ring-emerald-500/20 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editForm.name || !editForm.description || !editForm.category_id}
                className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 border border-transparent rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Input - Only show when there are services */}
      {value && value.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayCount(10); // Reset display count when searching
              }}
              placeholder="Search cookie services by name, description, or company..."
              className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white/90"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDisplayCount(10);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-gray-600">
              Found {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Services List */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
        {sortedServices && sortedServices.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayedServices.map(service => service.id?.toString() || `temp-${sortedServices.indexOf(service)}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {displayedServices.map((service, index) => (
                  <SortableServiceItem
                    key={service.id || `temp-${index}`}
                    service={service}
                    index={index}
                    categories={availableCategories}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    isEditing={isEditing}
                    editingIndex={editingIndex}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    handleSave={handleSave}
                    handleCancel={handleCancel}
                    handleDeleteClick={handleDeleteClick}
                    isDragDisabled={isEditing}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">No services found</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  No cookie services match "{searchQuery}". Try a different search term.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-600 hover:text-emerald-800 underline text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <PlusIcon className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">No Cookie Services Found</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  No cookie services are configured for this organization yet.
                </p>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-sky-700 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/60 rounded-lg hover:from-sky-100 hover:to-blue-100 hover:shadow-sm transition-all duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create First Service
                </button>
              </div>
            )}
          </div>
        )}

        {hasMoreServices && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreServices}
              className="px-4 py-2.5 text-sm font-medium text-sky-600 bg-gradient-to-r from-sky-50/80 to-blue-50/80 backdrop-blur-sm border border-sky-200/60 rounded-lg hover:from-sky-100 hover:to-blue-100 hover:border-sky-300/60 hover:shadow-sm transition-all duration-200"
            >
              Load More (+{sortedServices.length - displayCount} services)
            </button>
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Error Loading Services</h4>
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Cookie Service</h3>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                  Are you sure you want to delete this cookie service? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/60">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300/60 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-md transition-all duration-200 shadow-sm"
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

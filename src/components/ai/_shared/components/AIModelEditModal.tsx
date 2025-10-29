/**
 * AI Model Edit Modal Component
 * Modal for creating and editing AI models
 * Integrates with ImageGalleryModal for icon selection and AIRoleEditModal for role management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import Button from '@/ui/Button';
import Tooltip from '@/components/Tooltip';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { AIRoleEditModal } from './AIRoleEditModal';
import type { DefaultModel, NewModelForm, FieldErrors, TouchedFields, TaskItem, ThemeColors, PredefinedRole } from '../types/aiManagement';
import type { AIRoleFormData, AIPredefinedRole } from '../types';

interface AIModelEditModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  model: NewModelForm | DefaultModel;
  taskBuilder: TaskItem[];
  fieldErrors: FieldErrors;
  touchedFields: TouchedFields;
  loading: boolean;
  primary: ThemeColors;
  context?: 'admin' | 'account';
  
  // Search state
  modelQuery: string;
  endpointQuery: string;
  filteredModels: readonly string[] | string[];
  filteredEndpoints: readonly string[] | string[];
  
  // Role management
  predefinedRoles: PredefinedRole[];
  
  // Handlers
  onClose: () => void;
  onSubmit: () => void;
  onModelChange: (value: any) => void;
  handleFieldChange: (field: string, value: any, isEdit: boolean) => void;
  handleFieldBlur: (field: string, value: any) => void;
  setModelQuery: (query: string) => void;
  setEndpointQuery: (query: string) => void;
  setTaskBuilder: (tasks: TaskItem[]) => void;
  setHasUnsavedChanges?: (value: boolean) => void;
}

export function AIModelEditModal({
  isOpen,
  mode,
  model,
  taskBuilder,
  fieldErrors,
  touchedFields,
  loading,
  primary,
  context = 'admin',
  modelQuery,
  endpointQuery,
  filteredModels,
  filteredEndpoints,
  predefinedRoles,
  onClose,
  onSubmit,
  onModelChange,
  handleFieldChange,
  handleFieldBlur,
  setModelQuery,
  setEndpointQuery,
  setTaskBuilder,
  setHasUnsavedChanges,
}: AIModelEditModalProps) {
  const isEdit = mode === 'edit';
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleQuery, setRoleQuery] = useState('');
  const [roleData, setRoleData] = useState<AIRoleFormData>({
    role: model.role || '',
    customRole: '',
    systemMessage: model.system_message || '',
    isCustomRole: false
  });

  // Update roleData when model changes
  useEffect(() => {
    setRoleData({
      role: model.role || '',
      customRole: '',
      systemMessage: model.system_message || '',
      isCustomRole: false
    });
  }, [model.role, model.system_message]);

  if (!isOpen) return null;

  // Handle task builder updates
  const handleTaskBuilderUpdate = (index: number, field: 'name' | 'system_message', value: string) => {
    const currentTasks = [...taskBuilder];
    currentTasks[index] = { ...currentTasks[index], [field]: value };
    setTaskBuilder(currentTasks);
    handleFieldChange('task', currentTasks, isEdit);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleTaskBuilderDelete = (index: number) => {
    const newTasks = taskBuilder.filter((_, i) => i !== index);
    setTaskBuilder(newTasks);
    handleFieldChange('task', newTasks.length > 0 ? newTasks : null, isEdit);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleTaskBuilderAdd = () => {
    const newTasks = [...taskBuilder, { name: '', system_message: '' }];
    setTaskBuilder(newTasks);
    handleFieldChange('task', newTasks, isEdit);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // Handle image selection from gallery
  const handleImageSelect = (url: string) => {
    handleFieldChange('icon', url, isEdit);
    setIsImageGalleryOpen(false);
  };

  // Handle role modal open
  const handleOpenRoleModal = () => {
    setRoleData({
      role: model.role || '',
      customRole: '',
      systemMessage: model.system_message || '',
      isCustomRole: false
    });
    setIsRoleModalOpen(true);
  };

  // Handle role save from modal
  const handleRoleSave = () => {
    handleFieldChange('role', roleData.role, isEdit);
    handleFieldChange('system_message', roleData.systemMessage, isEdit);
    setIsRoleModalOpen(false);
  };

  // Handle tasks update from role selection
  const handleTasksUpdate = (tasks: Array<{ name: string; system_message: string }> | null) => {
    handleFieldChange('task', tasks, isEdit);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden border-2"
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            borderColor: primary.light,
            boxShadow: `0 25px 50px -12px ${primary.base}40`,
            animation: 'slideUp 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div 
            className="relative px-6 sm:px-8 py-5 sm:py-6 border-b"
            style={{ 
              borderColor: primary.lighter,
              background: `linear-gradient(to right, ${primary.lighter}, white)`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                  style={{ 
                    backgroundColor: primary.lighter,
                    borderColor: primary.light,
                  }}
                >
                  {model.icon ? (
                    <img
                      className="h-8 w-8 sm:h-10 sm:w-10 object-contain relative z-10"
                      src={model.icon}
                      alt="Model icon"
                    />
                  ) : (
                    <svg className="h-8 w-8 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.dark || primary.base }} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {isEdit ? 'Edit Model' : 'Add New Model'}
                  </h2>
                  <p className="text-sm sm:text-base font-bold" style={{ color: primary.dark || primary.base }}>
                    {isEdit ? 'Update model configuration' : 'Create a new AI model'}
                  </p>
                </div>
              </div>
              <Tooltip content="Close">
                <button
                  onClick={onClose}
                  className="h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:rotate-90 border-2"
                  style={{ 
                    backgroundColor: '#f3f4f6',
                    borderColor: '#d1d5db',
                    color: '#6b7280'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <svg className="h-5 w-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-6 sm:p-8" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Model Name *
                </label>
                <input
                  type="text"
                  value={model.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value, isEdit)}
                  placeholder="e.g., GPT-4, Claude 3.5 Sonnet"
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                  style={{
                    borderColor: touchedFields.name && fieldErrors.name ? '#fca5a5' : primary.light,
                    backgroundColor: touchedFields.name && fieldErrors.name ? '#fee2e2' : 'white',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.name) {
                      e.currentTarget.style.borderColor = primary.base;
                    }
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('name', e.target.value);
                    if (!fieldErrors.name) {
                      e.currentTarget.style.borderColor = primary.light;
                    }
                  }}
                />
                {touchedFields.name && fieldErrors.name && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* API Key Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  API Key *
                </label>
                <input
                  type="password"
                  value={model.api_key || ''}
                  onChange={(e) => handleFieldChange('api_key', e.target.value, isEdit)}
                  placeholder="Your API key"
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                  style={{
                    borderColor: touchedFields.api_key && fieldErrors.api_key ? '#fca5a5' : primary.light,
                    backgroundColor: touchedFields.api_key && fieldErrors.api_key ? '#fee2e2' : 'white',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.api_key) {
                      e.currentTarget.style.borderColor = primary.base;
                    }
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('api_key', e.target.value);
                    if (!fieldErrors.api_key) {
                      e.currentTarget.style.borderColor = primary.light;
                    }
                  }}
                />
                {touchedFields.api_key && fieldErrors.api_key && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{fieldErrors.api_key}</p>
                )}
              </div>

              {/* Icon Field with Image Gallery */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Model Icon
                </label>
                <div className="flex gap-3">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={model.icon || ''}
                      onChange={(e) => handleFieldChange('icon', e.target.value, isEdit)}
                      placeholder="Icon URL or click to browse gallery"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                      style={{
                        borderColor: primary.light,
                        backgroundColor: 'white',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = primary.base;
                      }}
                      onBlur={(e) => {
                        handleFieldBlur('icon', e.target.value);
                        e.currentTarget.style.borderColor = primary.light;
                      }}
                    />
                  </div>
                  <Tooltip content="Browse Image Gallery">
                    <button
                      type="button"
                      onClick={() => setIsImageGalleryOpen(true)}
                      className="px-4 py-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-bold"
                      style={{
                        backgroundColor: primary.lighter,
                        borderColor: primary.light,
                        color: primary.base
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = primary.light;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = primary.lighter;
                        e.currentTarget.style.color = primary.base;
                      }}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Gallery
                    </button>
                  </Tooltip>
                </div>
                {model.icon && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-sm text-gray-500">Preview:</span>
                    <img src={model.icon} alt="Icon preview" className="h-10 w-10 object-contain rounded-lg border-2" style={{ borderColor: primary.light }} />
                  </div>
                )}
              </div>

              {/* Endpoint Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  API Endpoint *
                </label>
                <Combobox
                  value={model.endpoint || ''}
                  onChange={(value) => handleFieldChange('endpoint', value, isEdit)}
                >
                  <div className="relative">
                    <Combobox.Input
                      className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                      placeholder="e.g., https://api.openai.com/v1"
                      onChange={(e) => {
                        setEndpointQuery(e.target.value);
                        handleFieldChange('endpoint', e.target.value, isEdit);
                      }}
                      onBlur={(e) => handleFieldBlur('endpoint', e.target.value)}
                      style={{
                        borderColor: touchedFields.endpoint && fieldErrors.endpoint ? '#fca5a5' : primary.light,
                        backgroundColor: touchedFields.endpoint && fieldErrors.endpoint ? '#fee2e2' : 'white',
                      }}
                      onFocus={(e) => {
                        if (!fieldErrors.endpoint) {
                          e.currentTarget.style.borderColor = primary.base;
                        }
                      }}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.base }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Combobox.Button>
                    {filteredEndpoints.length > 0 && (
                      <Combobox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border-2 bg-white py-1 shadow-lg"
                        style={{ borderColor: primary.light }}
                      >
                        {filteredEndpoints.map((endpointOption) => (
                          <Combobox.Option
                            key={endpointOption}
                            value={endpointOption}
                            className="cursor-pointer select-none px-4 py-2 hover:font-bold transition-colors text-gray-900"
                          >
                            {({ active }) => (
                              <div
                                style={{
                                  backgroundColor: active ? primary.lighter : 'white',
                                  color: active ? primary.base : '#111827'
                                }}
                              >
                                {endpointOption}
                              </div>
                            )}
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    )}
                  </div>
                </Combobox>
                {touchedFields.endpoint && fieldErrors.endpoint && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{fieldErrors.endpoint}</p>
                )}
              </div>

              {/* Max Tokens Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Max Tokens *
                </label>
                <input
                  type="number"
                  value={model.max_tokens || 200}
                  onChange={(e) => handleFieldChange('max_tokens', parseInt(e.target.value) || 200, isEdit)}
                  placeholder="e.g., 200"
                  min="1"
                  max="100000"
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
                  style={{
                    borderColor: touchedFields.max_tokens && fieldErrors.max_tokens ? '#fca5a5' : primary.light,
                    backgroundColor: touchedFields.max_tokens && fieldErrors.max_tokens ? '#fee2e2' : 'white',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.max_tokens) {
                      e.currentTarget.style.borderColor = primary.base;
                    }
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('max_tokens', parseInt(e.target.value) || 200);
                    if (!fieldErrors.max_tokens) {
                      e.currentTarget.style.borderColor = primary.light;
                    }
                  }}
                />
                {touchedFields.max_tokens && fieldErrors.max_tokens && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{fieldErrors.max_tokens}</p>
                )}
              </div>

              {/* Role Field with Modal Integration */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Role & System Message
                </label>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={model.role || ''}
                        readOnly
                        placeholder="Click 'Edit Role' to set role and system message"
                        className="w-full px-4 py-3 rounded-xl border-2 bg-gray-50 cursor-not-allowed"
                        style={{
                          borderColor: primary.light,
                        }}
                      />
                    </div>
                    <Tooltip content="Edit Role & System Message">
                      <button
                        type="button"
                        onClick={handleOpenRoleModal}
                        className="px-4 py-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-bold"
                        style={{
                          backgroundColor: '#fef3c7',
                          borderColor: '#fbbf24',
                          color: '#92400e'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fde68a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef3c7';
                        }}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Role
                      </button>
                    </Tooltip>
                  </div>
                  {model.system_message && (
                    <div className="px-4 py-3 rounded-xl border-2 bg-gray-50" style={{ borderColor: primary.lighter }}>
                      <p className="text-sm text-gray-600 font-medium">System Message:</p>
                      <p className="text-sm text-gray-800 mt-1">{model.system_message}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* User Role to Access (Admin only) */}
              {context === 'admin' && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    User Role to Access *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('user_role_to_access', 'user', isEdit)}
                      className="px-4 py-3 rounded-xl border-2 transition-all font-bold"
                      style={{
                        backgroundColor: model.user_role_to_access === 'user' ? primary.lighter : 'white',
                        borderColor: model.user_role_to_access === 'user' ? primary.base : primary.light,
                        color: model.user_role_to_access === 'user' ? primary.base : '#6b7280'
                      }}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('user_role_to_access', 'admin', isEdit)}
                      className="px-4 py-3 rounded-xl border-2 transition-all font-bold"
                      style={{
                        backgroundColor: model.user_role_to_access === 'admin' ? primary.lighter : 'white',
                        borderColor: model.user_role_to_access === 'admin' ? primary.base : primary.light,
                        color: model.user_role_to_access === 'admin' ? primary.base : '#6b7280'
                      }}
                    >
                      Admin
                    </button>
                  </div>
                  {touchedFields.user_role_to_access && fieldErrors.user_role_to_access && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{fieldErrors.user_role_to_access}</p>
                  )}
                </div>
              )}

              {/* Tasks Builder */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Tasks
                </label>
                <div className="space-y-3">
                  {taskBuilder.map((task, index) => (
                    <div key={index} className="p-4 rounded-xl border-2" style={{ borderColor: primary.lighter, backgroundColor: '#f9fafb' }}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-bold" style={{ color: primary.base }}>Task {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleTaskBuilderDelete(index)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                          style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                          }}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => handleTaskBuilderUpdate(index, 'name', e.target.value)}
                          placeholder="Task name"
                          className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                          style={{ borderColor: primary.light }}
                        />
                        <textarea
                          value={task.system_message}
                          onChange={(e) => handleTaskBuilderUpdate(index, 'system_message', e.target.value)}
                          placeholder="System message"
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none resize-none"
                          style={{ borderColor: primary.light }}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleTaskBuilderAdd}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 font-bold"
                    style={{
                      backgroundColor: primary.lighter,
                      borderColor: primary.light,
                      borderStyle: 'dashed',
                      color: primary.base
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = primary.light;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderStyle = 'solid';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = primary.lighter;
                      e.currentTarget.style.color = primary.base;
                      e.currentTarget.style.borderStyle = 'dashed';
                    }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Task
                  </button>
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={('is_active' in model ? model.is_active : true) ?? true}
                      onChange={(e) => handleFieldChange('is_active', e.target.checked, isEdit)}
                      className="sr-only"
                    />
                    <div
                      className="w-14 h-8 rounded-full transition-all duration-300 border-2"
                      style={{
                        backgroundColor: ('is_active' in model ? model.is_active : true) ? primary.base : '#d1d5db',
                        borderColor: ('is_active' in model ? model.is_active : true) ? primary.dark || primary.base : '#9ca3af'
                      }}
                    >
                      <div
                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md"
                        style={{
                          transform: ('is_active' in model ? model.is_active : true) ? 'translateX(24px)' : 'translateX(0)'
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {('is_active' in model ? model.is_active : true) ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div 
            className="px-6 sm:px-8 py-5 border-t flex items-center justify-end gap-3"
            style={{ borderColor: primary.lighter }}
          >
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              loading={loading}
              style={{
                backgroundColor: primary.base,
                borderColor: primary.base
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = primary.dark || primary.base;
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = primary.base;
                }
              }}
            >
              {isEdit ? 'Save Changes' : 'Create Model'}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        onSelectImage={handleImageSelect}
      />

      {/* Role Edit Modal */}
      {isRoleModalOpen && (
        <AIRoleEditModal
          isOpen={isRoleModalOpen}
          selectedModel={{
            id: (model as any).id || 'new',
            name: model.name || 'New Model',
            role: model.role,
            system_message: model.system_message,
            type: 'user' // Always editable in this context
          }}
          roleData={roleData}
          setRoleData={setRoleData}
          filteredRoles={predefinedRoles as AIPredefinedRole[]}
          roleQuery={roleQuery}
          setRoleQuery={setRoleQuery}
          onClose={() => setIsRoleModalOpen(false)}
          onSave={handleRoleSave}
          onTasksUpdate={handleTasksUpdate}
          loading={false}
          primary={primary}
          context={context}
        />
      )}
    </>
  );
}

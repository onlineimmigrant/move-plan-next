/**
 * System Model Edit Modal Component
 * Extended modal for creating/editing system-wide AI models (Superadmin only)
 * Includes additional fields: organization_types, required_plan, token limits, flags, etc.
 */

'use client';

import React, { useState } from 'react';
import Button from '@/ui/Button';
import Tooltip from '@/components/Tooltip';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import { AIRoleEditModal } from './AIRoleEditModal';
import type { SystemModel, SystemModelForm, ORGANIZATION_TYPES, PLAN_OPTIONS, TOKEN_LIMIT_PERIODS } from '../types/systemModels';
import type { TaskItem, FieldErrors, TouchedFields, RoleFormData } from '../types/aiManagement';
import { ORGANIZATION_TYPES as ORG_TYPES, PLAN_OPTIONS as PLANS, TOKEN_LIMIT_PERIODS as PERIODS } from '../types/systemModels';
import { PREDEFINED_ROLES } from '../types/aiManagement';

interface SystemModelEditModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  model: SystemModelForm | SystemModel;
  taskBuilder: TaskItem[];
  fieldErrors: FieldErrors;
  touchedFields: TouchedFields;
  saving: boolean;
  
  // Handlers
  onClose: () => void;
  onSubmit: () => void;
  handleFieldChange: (field: string, value: any) => void;
  handleFieldBlur: (field: string, value: any) => void;
  setTaskBuilder: (tasks: TaskItem[]) => void;
  setHasUnsavedChanges?: (value: boolean) => void;
}

export function SystemModelEditModal({
  isOpen,
  mode,
  model,
  taskBuilder,
  fieldErrors,
  touchedFields,
  saving,
  onClose,
  onSubmit,
  handleFieldChange,
  handleFieldBlur,
  setTaskBuilder,
  setHasUnsavedChanges,
}: SystemModelEditModalProps) {
  const isEdit = mode === 'edit';
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'system' | 'limits' | 'metadata'>('basic');
  
  // Role modal state
  const [roleQuery, setRoleQuery] = useState('');
  const [roleData, setRoleData] = useState<RoleFormData>({
    role: model.role || '',
    customRole: '',
    systemMessage: model.system_message || '',
    isCustomRole: false,
  });

  // Filter roles based on search query
  const filteredRoles = roleQuery
    ? PREDEFINED_ROLES.filter(r => 
        r.label.toLowerCase().includes(roleQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(roleQuery.toLowerCase())
      )
    : PREDEFINED_ROLES;

  if (!isOpen) return null;

  // Handle task builder updates
  const handleTaskBuilderUpdate = (index: number, field: 'name' | 'system_message', value: string) => {
    const currentTasks = [...taskBuilder];
    currentTasks[index] = { ...currentTasks[index], [field]: value };
    setTaskBuilder(currentTasks);
    handleFieldChange('task', currentTasks);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleTaskBuilderDelete = (index: number) => {
    const newTasks = taskBuilder.filter((_, i) => i !== index);
    setTaskBuilder(newTasks);
    handleFieldChange('task', newTasks.length > 0 ? newTasks : null);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleTaskBuilderAdd = () => {
    const newTasks = [...taskBuilder, { name: '', system_message: '' }];
    setTaskBuilder(newTasks);
    handleFieldChange('task', newTasks);
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // Handle image selection
  const handleImageSelect = (url: string) => {
    handleFieldChange('icon', url);
    setIsImageGalleryOpen(false);
  };

  // Handle organization type toggle
  const handleOrgTypeToggle = (orgType: string) => {
    const currentTypes = model.organization_types || [];
    const newTypes = currentTypes.includes(orgType)
      ? currentTypes.filter(t => t !== orgType)
      : [...currentTypes, orgType];
    handleFieldChange('organization_types', newTypes);
  };

  // Handle tag input
  const handleTagAdd = (tag: string) => {
    const currentTags = model.tags || [];
    if (tag.trim() && !currentTags.includes(tag.trim())) {
      handleFieldChange('tags', [...currentTags, tag.trim()]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    const currentTags = model.tags || [];
    handleFieldChange('tags', currentTags.filter(t => t !== tagToRemove));
  };

  const primary = {
    base: '#8B5CF6',
    light: '#A78BFA',
    lighter: '#C4B5FD',
    dark: '#7C3AED',
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden border-2"
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            borderColor: primary.light,
            boxShadow: `0 25px 50px -12px ${primary.base}40`,
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
                  className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg border-2 cursor-pointer hover:scale-105 transition-transform"
                  style={{ 
                    backgroundColor: primary.lighter,
                    borderColor: primary.light,
                  }}
                  onClick={() => setIsImageGalleryOpen(true)}
                >
                  <span className="text-3xl">{model.icon || '🤖'}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isEdit ? 'Edit System Model' : 'Add New System Model'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isEdit ? 'Update system-wide AI model configuration' : 'Create a new system-wide AI model'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 mt-4">
              {[
                { key: 'basic', label: 'Basic Info', icon: '📝' },
                { key: 'system', label: 'System Config', icon: '⚙️' },
                { key: 'limits', label: 'Limits & Plans', icon: '📊' },
                { key: 'metadata', label: 'Metadata', icon: '🏷️' },
              ].map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key as any)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeSection === section.key
                      ? 'text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  style={activeSection === section.key ? { backgroundColor: primary.base } : {}}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-250px)]">
            {/* Basic Info Section */}
            {activeSection === 'basic' && (
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    value={model.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={(e) => handleFieldBlur('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors.name && touchedFields.name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-purple-500'
                    }`}
                    placeholder="e.g., Blog Content Writer Pro"
                  />
                  {fieldErrors.name && touchedFields.name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Role & System Message - Use Role Modal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role & System Message *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={model.role || ''}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Select a role..."
                    />
                    <Button
                      onClick={() => setIsRoleModalOpen(true)}
                      variant="outline"
                      className="px-6"
                    >
                      Edit Role
                    </Button>
                  </div>
                  {fieldErrors.role && touchedFields.role && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
                  )}
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={model.api_key}
                    onChange={(e) => handleFieldChange('api_key', e.target.value)}
                    onBlur={(e) => handleFieldBlur('api_key', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors.api_key && touchedFields.api_key
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-purple-500'
                    }`}
                    placeholder="sk-..."
                  />
                  {fieldErrors.api_key && touchedFields.api_key && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.api_key}</p>
                  )}
                </div>

                {/* Endpoint & Max Tokens */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endpoint *
                    </label>
                    <input
                      type="url"
                      value={model.endpoint}
                      onChange={(e) => handleFieldChange('endpoint', e.target.value)}
                      onBlur={(e) => handleFieldBlur('endpoint', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens *
                    </label>
                    <input
                      type="number"
                      value={model.max_tokens}
                      onChange={(e) => handleFieldChange('max_tokens', parseInt(e.target.value))}
                      onBlur={(e) => handleFieldBlur('max_tokens', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={model.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Brief description of this model's purpose and capabilities..."
                  />
                </div>
              </div>
            )}

            {/* System Config Section */}
            {activeSection === 'system' && (
              <div className="space-y-6">
                {/* Organization Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available to Organization Types
                    <span className="ml-2 text-xs text-gray-500">(Leave empty for all types)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ORG_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                          model.organization_types?.includes(type.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={model.organization_types?.includes(type.value)}
                          onChange={() => handleOrgTypeToggle(type.value)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Flags */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={model.is_active}
                      onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium text-sm">Active</span>
                      <p className="text-xs text-gray-600">Model is active system-wide</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={model.is_featured}
                      onChange={(e) => handleFieldChange('is_featured', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium text-sm">Featured</span>
                      <p className="text-xs text-gray-600">Show in recommended</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={model.is_free}
                      onChange={(e) => handleFieldChange('is_free', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium text-sm">Free</span>
                      <p className="text-xs text-gray-600">Free for all users</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={model.is_trial}
                      onChange={(e) => handleFieldChange('is_trial', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium text-sm">Trial</span>
                      <p className="text-xs text-gray-600">Trial period available</p>
                    </div>
                  </label>
                </div>

                {/* Trial Days (if trial enabled) */}
                {model.is_trial && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Period (Days) *
                    </label>
                    <input
                      type="number"
                      value={model.trial_expires_days || ''}
                      onChange={(e) => handleFieldChange('trial_expires_days', parseInt(e.target.value) || null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      placeholder="30"
                    />
                  </div>
                )}

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={model.sort_order}
                    onChange={(e) => handleFieldChange('sort_order', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
              </div>
            )}

            {/* Limits & Plans Section */}
            {activeSection === 'limits' && (
              <div className="space-y-6">
                {/* Required Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Plan *
                  </label>
                  <select
                    value={model.required_plan}
                    onChange={(e) => handleFieldChange('required_plan', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {PLANS.map((plan) => (
                      <option key={plan.value} value={plan.value}>
                        {plan.label} - {plan.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Token Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token Limit Period
                    </label>
                    <select
                      value={model.token_limit_period || ''}
                      onChange={(e) => handleFieldChange('token_limit_period', e.target.value || null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {PERIODS.map((period) => (
                        <option key={String(period.value)} value={String(period.value)}>
                          {period.label} - {period.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token Limit Amount
                    </label>
                    <input
                      type="number"
                      value={model.token_limit_amount || ''}
                      onChange={(e) => handleFieldChange('token_limit_amount', parseInt(e.target.value) || null)}
                      onBlur={(e) => handleFieldBlur('token_limit_amount', parseInt(e.target.value) || null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      placeholder="e.g., 50000"
                      disabled={!model.token_limit_period}
                    />
                    {fieldErrors.token_limit_amount && touchedFields.token_limit_amount && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.token_limit_amount}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Section */}
            {activeSection === 'metadata' && (
              <div className="space-y-6">
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(model.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagRemove(tag)}
                          className="hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tag and press Enter..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Predefined Tasks
                    </label>
                    <Button
                      onClick={handleTaskBuilderAdd}
                      variant="outline"
                      size="sm"
                    >
                      + Add Task
                    </Button>
                  </div>

                  {taskBuilder.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      No tasks defined. Click "Add Task" to create predefined tasks.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {taskBuilder.map((task, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <input
                              type="text"
                              value={task.name}
                              onChange={(e) => handleTaskBuilderUpdate(index, 'name', e.target.value)}
                              placeholder="Task name..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm mr-2"
                            />
                            <button
                              onClick={() => handleTaskBuilderDelete(index)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <textarea
                            value={task.system_message}
                            onChange={(e) => handleTaskBuilderUpdate(index, 'system_message', e.target.value)}
                            placeholder="System message for this task..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={saving}
              style={{ backgroundColor: primary.base }}
            >
              {saving ? 'Saving...' : isEdit ? 'Update Model' : 'Create Model'}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={() => setIsImageGalleryOpen(false)}
          onSelectImage={handleImageSelect}
        />
      )}

      {/* Role Edit Modal */}
      {isRoleModalOpen && (
        <AIRoleEditModal
          isOpen={isRoleModalOpen}
          selectedModel={{
            id: (model as SystemModel).id || 0,
            name: model.name,
            role: model.role || null,
            system_message: model.system_message || '',
            type: 'system', // This is a system model
          }}
          roleData={roleData}
          setRoleData={setRoleData}
          filteredRoles={filteredRoles}
          roleQuery={roleQuery}
          setRoleQuery={setRoleQuery}
          onClose={() => setIsRoleModalOpen(false)}
          onSave={() => {
            // Update the model fields with role data
            handleFieldChange('role', roleData.isCustomRole ? roleData.customRole : roleData.role);
            handleFieldChange('system_message', roleData.systemMessage);
            setIsRoleModalOpen(false);
          }}
          loading={false}
          primary={{
            base: '#3b82f6',
            light: '#93c5fd',
            lighter: '#dbeafe',
            dark: '#2563eb',
            darker: '#1e40af',
            hover: '#1d4ed8',
          }}
          context="admin"
          onTasksUpdate={(tasks) => handleFieldChange('task', tasks)}
        />
      )}
    </>
  );
}

/**
 * AI Model Form Component
 * Unified form for creating and editing AI models with validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AIFormField } from './AIFormField';
import { AIIcons } from './AIIcons';
import { AIConfirmationDialog } from './AIConfirmationDialog';
import { useAIModelValidation, useUnsavedChanges } from '../hooks';
import { POPULAR_MODELS, POPULAR_ENDPOINTS, DEFAULT_VALUES } from '../utils';
import { PREDEFINED_ROLES } from '../types/aiManagement';
import type { AIModelFormData, AIModelFormProps } from '../types';

// ============================================================================
// Component
// ============================================================================

export const AIModelForm: React.FC<AIModelFormProps> = ({
  initialData,
  mode,
  onSubmit,
  onCancel,
  loading = false,
  className = ""
}) => {
  // Form state
  const [formData, setFormData] = useState<AIModelFormData>({
    ...DEFAULT_VALUES,
    ...initialData
  });

  const [originalData] = useState<AIModelFormData>({
    ...DEFAULT_VALUES,
    ...initialData
  });

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const {
    fieldErrors,
    validateSingleField,
    validateAllFields,
    markFieldTouched,
    markAllFieldsTouched,
    getFieldError,
    resetValidation
  } = useAIModelValidation({ formData });

  // Check for unsaved changes
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
  const { confirmAction } = useUnsavedChanges({
    hasUnsavedChanges,
    message: 'You have unsaved changes. Are you sure you want to cancel?'
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({ ...DEFAULT_VALUES, ...initialData });
    }
  }, [initialData]);

  // Handle field change
  const handleChange = (field: keyof AIModelFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateSingleField(field, value);
  };

  // Handle field blur
  const handleBlur = (field: keyof AIModelFormData) => {
    markFieldTouched(field);
  };

  // Handle popular model selection
  const handlePopularModelSelect = (modelName: string) => {
    const popularModel = POPULAR_MODELS.find(m => m.name === modelName);
    if (popularModel) {
      setFormData(prev => ({
        ...prev,
        name: popularModel.name,
        endpoint: popularModel.endpoint,
        icon: popularModel.icon || prev.icon
      }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    markAllFieldsTouched();
    const errors = validateAllFields();

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      resetValidation();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Add New AI Model' : 'Edit AI Model'}
          </h2>
          <div className="flex items-center space-x-2">
            <AIIcons.Sparkles className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Popular Models Quick Select */}
        {mode === 'create' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Start: Select Popular Model
            </label>
            <select
              value=""
              onChange={(e) => handlePopularModelSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a popular model to auto-fill --</option>
              {POPULAR_MODELS.map(model => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-600">
              Selecting a model will auto-fill the name, endpoint, and icon fields
            </p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Basic Information
          </h3>

          <AIFormField
            label="Model Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(value) => handleChange('name', value)}
            onBlur={() => handleBlur('name')}
            error={getFieldError('name')}
            required
            placeholder="e.g., GPT-4, Claude 3.5, Gemini Pro"
            helpText="Enter a descriptive name for this AI model"
          />

          <AIFormField
            label="API Key"
            name="api_key"
            type="text"
            value={formData.api_key}
            onChange={(value) => handleChange('api_key', value)}
            onBlur={() => handleBlur('api_key')}
            error={getFieldError('api_key')}
            required
            placeholder="sk-..."
            helpText="Your API key for this model (will be encrypted)"
            icon={<AIIcons.Eye className="w-4 h-4" />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.endpoint}
              onChange={(e) => handleChange('endpoint', e.target.value)}
              onBlur={() => handleBlur('endpoint')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('endpoint') ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select or enter custom endpoint --</option>
              {POPULAR_ENDPOINTS.map(endpoint => (
                <option key={endpoint.url} value={endpoint.url}>
                  {endpoint.name}
                </option>
              ))}
            </select>
            {getFieldError('endpoint') && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AIIcons.AlertCircle className="w-4 h-4 mr-1" />
                {getFieldError('endpoint')}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-600">
              Or enter custom endpoint URL below
            </p>
          </div>

          <AIFormField
            label="Custom Endpoint URL"
            name="endpoint_custom"
            type="url"
            value={formData.endpoint}
            onChange={(value) => handleChange('endpoint', value)}
            onBlur={() => handleBlur('endpoint')}
            error={getFieldError('endpoint')}
            placeholder="https://api.example.com/v1/chat/completions"
            helpText="Full API endpoint URL (must start with http:// or https://)"
          />

          <AIFormField
            label="Icon URL"
            name="icon"
            type="url"
            value={formData.icon}
            onChange={(value) => handleChange('icon', value)}
            onBlur={() => handleBlur('icon')}
            error={getFieldError('icon')}
            placeholder="https://example.com/icon.png"
            helpText="URL to model icon image (.png, .jpg, .svg)"
          />
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Configuration
          </h3>

          <AIFormField
            label="Max Tokens"
            name="max_tokens"
            type="number"
            value={formData.max_tokens}
            onChange={(value) => handleChange('max_tokens', value)}
            onBlur={() => handleBlur('max_tokens')}
            error={getFieldError('max_tokens')}
            min={1}
            max={100000}
            step={1}
            helpText="Maximum number of tokens for responses (1-100,000)"
          />

          <AIFormField
            label="System Message"
            name="system_message"
            type="textarea"
            value={formData.system_message}
            onChange={(value) => handleChange('system_message', value)}
            onBlur={() => handleBlur('system_message')}
            error={getFieldError('system_message')}
            rows={4}
            placeholder="You are a helpful AI assistant..."
            helpText="Instructions that define the AI's behavior and personality"
          />
        </div>

        {/* Role & Task */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Role & Purpose
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role || ''}
              onChange={(e) => handleChange('role', e.target.value)}
              onBlur={() => handleBlur('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a role --</option>
              {PREDEFINED_ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {formData.role && (
              <p className="mt-1 text-xs text-gray-600">
                {PREDEFINED_ROLES.find(r => r.value === formData.role)?.description}
              </p>
            )}
          </div>

          <AIFormField
            label="Custom Role"
            name="role_custom"
            type="text"
            value={formData.role}
            onChange={(value) => handleChange('role', value)}
            onBlur={() => handleBlur('role')}
            error={getFieldError('role')}
            placeholder="e.g., Marketing Expert, Code Reviewer"
            helpText="Enter a custom role or select from predefined roles above"
          />

          <AIFormField
            label="Task Description"
            name="task"
            type="textarea"
            value={Array.isArray(formData.task) ? formData.task.join('\n') : formData.task}
            onChange={(value) => {
              // Convert textarea lines to array
              const tasks = value.split('\n').filter((t: string) => t.trim());
              handleChange('task', tasks);
            }}
            onBlur={() => handleBlur('task')}
            rows={3}
            placeholder="Write code\nReview pull requests\nAnswer questions"
            helpText="Enter tasks, one per line. These describe what this model can do."
          />
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Status
          </h3>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (available for use)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || loading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting || loading ? (
              <>
                <AIIcons.Refresh className="w-5 h-5 mr-2 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                <AIIcons.Check className="w-5 h-5 mr-2" />
                {mode === 'create' ? 'Create Model' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Cancel Confirmation Dialog */}
      <AIConfirmationDialog
        isOpen={showCancelConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to cancel? All changes will be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        variant="warning"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </>
  );
};

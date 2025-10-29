/**
 * AI Model Form Simple Component
 * Form for creating and editing AI models (admin style)
 * Shared between admin and account contexts
 */

'use client';

import React from 'react';
import { Combobox } from '@headlessui/react';
import Button from '@/ui/Button';
import type { 
  DefaultModel, 
  NewModelForm, 
  FieldErrors, 
  TouchedFields, 
  TaskInputMode, 
  TaskItem,
  ThemeColors
} from '../types/aiManagement';
import type { Dispatch, SetStateAction } from 'react';

interface AIModelFormSimpleProps {
  mode: 'add' | 'edit';
  model: NewModelForm | DefaultModel;
  taskInputMode: TaskInputMode;
  taskBuilder: TaskItem[];
  fieldErrors: FieldErrors;
  touchedFields: TouchedFields;
  loading: boolean;
  primary: ThemeColors;
  context?: 'admin' | 'account'; // Add context prop
  
  // Search state
  modelQuery: string;
  endpointQuery: string;
  filteredModels: readonly string[] | string[];
  filteredEndpoints: readonly string[] | string[];
  
  // Setters
  setModel: Dispatch<SetStateAction<NewModelForm>> | Dispatch<SetStateAction<DefaultModel | null>>;
  setTaskInputMode: (mode: TaskInputMode) => void;
  setTaskBuilder: (tasks: TaskItem[]) => void;
  setModelQuery: (query: string) => void;
  setEndpointQuery: (query: string) => void;
  setHasUnsavedChanges?: (value: boolean) => void;
  
  // Handlers
  handleFieldChange: (field: string, value: any, isEdit: boolean) => void;
  handleFieldBlur: (field: string, value: any) => void;
  onSubmit: () => void;
}

export default function AIModelFormSimple({
  mode,
  model,
  taskInputMode,
  taskBuilder,
  fieldErrors,
  touchedFields,
  loading,
  primary,
  context = 'admin', // Default to admin
  modelQuery,
  endpointQuery,
  filteredModels,
  filteredEndpoints,
  setModel,
  setTaskInputMode,
  setTaskBuilder,
  setModelQuery,
  setEndpointQuery,
  setHasUnsavedChanges,
  handleFieldChange,
  handleFieldBlur,
  onSubmit,
}: AIModelFormSimpleProps) {
  const isEdit = mode === 'edit';
  
  const handleTaskBuilderUpdate = (index: number, field: 'name' | 'system_message', value: string) => {
    const currentTasks = [...taskBuilder];
    currentTasks[index] = { ...currentTasks[index], [field]: value };
    setTaskBuilder(currentTasks);
    (setModel as any)({ ...model, task: currentTasks });
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleTaskBuilderDelete = (index: number) => {
    const newTasks = taskBuilder.filter((_, i) => i !== index);
    setTaskBuilder(newTasks);
    (setModel as any)({ ...model, task: newTasks.length > 0 ? newTasks : null });
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleTaskBuilderAdd = () => {
    const newTasks = [...taskBuilder, { name: '', system_message: '' }];
    setTaskBuilder(newTasks);
    (setModel as any)({ ...model, task: newTasks });
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const currentTasks = Array.isArray(model.task) ? model.task : taskBuilder;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Model Name */}
      <div className="relative mb-3 sm:mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Model Name *
        </label>
        {!isEdit ? (
          <Combobox
            value={model.name}
            onChange={(value: string) => {
              handleFieldChange('name', value, false);
              setModelQuery(value);
            }}
          >
            <Combobox.Input
              className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
                fieldErrors.name && touchedFields.name 
                  ? 'border-red-300' 
                  : 'border-gray-200'
              }`}
              style={{
                '--tw-ring-color': fieldErrors.name && touchedFields.name ? '#ef4444' : primary.base
              } as React.CSSProperties}
              onChange={(e) => {
                setModelQuery(e.target.value);
                handleFieldChange('name', e.target.value, false);
              }}
              onBlur={(e) => handleFieldBlur('name', e.target.value)}
              placeholder="Model Name (e.g., grok-3)"
              displayValue={(value: string) => value}
            />
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
              {filteredModels.length === 0 && modelQuery !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No models found. Enter a custom model name.
                </div>
              ) : (
                filteredModels.map((modelName) => (
                  <Combobox.Option
                    key={modelName}
                    value={modelName}
                  >
                    {({ active }) => (
                      <div
                        className="relative cursor-pointer select-none py-2 px-4 text-gray-900"
                        style={{
                          backgroundColor: active ? primary.lighter : 'transparent'
                        }}
                      >
                        {modelName}
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox>
        ) : (
          <input
            type="text"
            value={model.name}
            onChange={(e) => handleFieldChange('name', e.target.value, true)}
            onBlur={(e) => handleFieldBlur('name', e.target.value)}
            placeholder="Model Name"
            className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
              fieldErrors.name && touchedFields.name 
                ? 'border-red-300' 
                : 'border-gray-200'
            }`}
            style={{
              '--tw-ring-color': fieldErrors.name && touchedFields.name ? '#ef4444' : primary.base
            } as React.CSSProperties}
          />
        )}
        {fieldErrors.name && touchedFields.name && (
          <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
        )}
      </div>

      {/* API Key */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          API Key *
        </label>
        <input
          type="password"
          value={model.api_key}
          onChange={(e) => handleFieldChange('api_key', e.target.value, isEdit)}
          onBlur={(e) => handleFieldBlur('api_key', e.target.value)}
          placeholder="API Key"
          className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
            fieldErrors.api_key && touchedFields.api_key 
              ? 'border-red-300' 
              : 'border-gray-200'
          }`}
          style={{
            '--tw-ring-color': fieldErrors.api_key && touchedFields.api_key ? '#ef4444' : primary.base
          } as React.CSSProperties}
          autoComplete="new-password"
        />
        {fieldErrors.api_key && touchedFields.api_key && (
          <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.api_key}</p>
        )}
      </div>

      {/* API Endpoint */}
      <div className="relative mb-3 sm:mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          API Endpoint *
        </label>
        {!isEdit ? (
          <Combobox
            value={model.endpoint}
            onChange={(value: string) => {
              handleFieldChange('endpoint', value, false);
              setEndpointQuery(value);
            }}
          >
            <Combobox.Input
              className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
                fieldErrors.endpoint && touchedFields.endpoint 
                  ? 'border-red-300' 
                  : 'border-gray-200'
              }`}
              style={{
                '--tw-ring-color': fieldErrors.endpoint && touchedFields.endpoint ? '#ef4444' : primary.base
              } as React.CSSProperties}
              onChange={(e) => {
                setEndpointQuery(e.target.value);
                handleFieldChange('endpoint', e.target.value, false);
              }}
              onBlur={(e) => handleFieldBlur('endpoint', e.target.value)}
              placeholder="API Endpoint (e.g., https://api.x.ai/v1/chat/completions)"
              displayValue={(value: string) => value}
            />
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
              {filteredEndpoints.length === 0 && endpointQuery !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No endpoints found. Enter a custom endpoint.
                </div>
              ) : (
                filteredEndpoints.map((endpoint) => (
                  <Combobox.Option
                    key={endpoint}
                    value={endpoint}
                  >
                    {({ active }) => (
                      <div
                        className="relative cursor-pointer select-none py-2 px-4 text-gray-900"
                        style={{
                          backgroundColor: active ? primary.lighter : 'transparent'
                        }}
                      >
                        {endpoint}
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox>
        ) : (
          <input
            type="text"
            value={model.endpoint}
            onChange={(e) => handleFieldChange('endpoint', e.target.value, true)}
            onBlur={(e) => handleFieldBlur('endpoint', e.target.value)}
            placeholder="API Endpoint"
            className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
              fieldErrors.endpoint && touchedFields.endpoint 
                ? 'border-red-300' 
                : 'border-gray-200'
            }`}
            style={{
              '--tw-ring-color': fieldErrors.endpoint && touchedFields.endpoint ? '#ef4444' : primary.base
            } as React.CSSProperties}
          />
        )}
        {fieldErrors.endpoint && touchedFields.endpoint && (
          <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.endpoint}</p>
        )}
      </div>

      {/* Max Tokens */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          Max Tokens
        </label>
        <input
          type="number"
          value={model.max_tokens}
          onChange={(e) => handleFieldChange('max_tokens', e.target.value, isEdit)}
          onBlur={(e) => handleFieldBlur('max_tokens', e.target.value)}
          placeholder="Max Tokens (default: 200)"
          className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
            fieldErrors.max_tokens && touchedFields.max_tokens 
              ? 'border-red-300' 
              : 'border-gray-200'
          }`}
          style={{
            '--tw-ring-color': fieldErrors.max_tokens && touchedFields.max_tokens ? '#ef4444' : primary.base
          } as React.CSSProperties}
          autoComplete="off"
        />
        {fieldErrors.max_tokens && touchedFields.max_tokens && (
          <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.max_tokens}</p>
        )}
      </div>

      {/* User Role - Only show for admin context */}
      {context === 'admin' && (
        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            User Role
          </label>
          <select
            value={model.user_role_to_access}
            onChange={(e) => {
              (setModel as any)({ ...model, user_role_to_access: e.target.value });
              if (isEdit && setHasUnsavedChanges) setHasUnsavedChanges(true);
            }}
            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2"
            style={{
              '--tw-ring-color': primary.base
            } as React.CSSProperties}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      )}

      {/* Icon URL */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          Icon URL (optional)
        </label>
        <input
          type="text"
          value={model.icon || ''}
          onChange={(e) => handleFieldChange('icon', e.target.value, isEdit)}
          onBlur={(e) => handleFieldBlur('icon', e.target.value)}
          placeholder="Icon URL (optional)"
          className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
            fieldErrors.icon && touchedFields.icon 
              ? 'border-red-300' 
              : 'border-gray-200'
          }`}
          style={{
            '--tw-ring-color': fieldErrors.icon && touchedFields.icon ? '#ef4444' : primary.base
          } as React.CSSProperties}
        />
        {fieldErrors.icon && touchedFields.icon && (
          <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.icon}</p>
        )}
      </div>

      {/* Role */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          Role (optional)
        </label>
        <input
          type="text"
          value={model.role || ''}
          onChange={(e) => {
            (setModel as any)({ ...model, role: e.target.value || null });
            if (isEdit && setHasUnsavedChanges) setHasUnsavedChanges(true);
          }}
          placeholder="e.g., assistant, analyst, translator"
          className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2"
          style={{
            '--tw-ring-color': primary.base
          } as React.CSSProperties}
        />
        <p className="text-xs text-gray-500 mt-1">Specify the AI model's role or specialty</p>
      </div>

      {/* Task Configuration */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700">
            Task Configuration (optional)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTaskInputMode('builder')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                taskInputMode === 'builder'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Task Builder
            </button>
            <button
              type="button"
              onClick={() => setTaskInputMode('json')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                taskInputMode === 'json'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              JSON Input
            </button>
          </div>
        </div>

        {taskInputMode === 'builder' ? (
          <div className="space-y-3">
            {currentTasks.map((task, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Task {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleTaskBuilderDelete(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={task.name || ''}
                  onChange={(e) => handleTaskBuilderUpdate(index, 'name', e.target.value)}
                  placeholder="Task name (e.g., Write Full Article)"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded mb-2 focus:outline-none focus:ring-1"
                  style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                />
                <textarea
                  value={task.system_message || ''}
                  onChange={(e) => handleTaskBuilderUpdate(index, 'system_message', e.target.value)}
                  placeholder="System message for this task..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded resize-y min-h-[60px] focus:outline-none focus:ring-1"
                  style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleTaskBuilderAdd}
              className="w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Build task configurations by adding name and system message for each task
            </p>
          </div>
        ) : (
          <div>
            <textarea
              value={model.task ? JSON.stringify(model.task, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                  (setModel as any)({ ...model, task: parsed });
                  if (parsed && Array.isArray(parsed)) {
                    setTaskBuilder(parsed);
                  }
                  if (isEdit && setHasUnsavedChanges) setHasUnsavedChanges(true);
                } catch {
                  // Invalid JSON - don't update
                  if (isEdit && setHasUnsavedChanges) setHasUnsavedChanges(true);
                }
              }}
              placeholder='[{"name": "Task Name", "system_message": "Task instructions..."}]'
              className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 resize-y min-h-[120px] max-h-[300px] overflow-y-auto font-mono text-xs"
              style={{
                '--tw-ring-color': primary.base
              } as React.CSSProperties}
            />
            <p className="text-xs text-gray-500 mt-2">
              JSON array of tasks with "name" and "system_message" properties
            </p>
          </div>
        )}
      </div>

      {/* System Message */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          System Message
        </label>
        <textarea
          value={model.system_message}
          onChange={(e) => {
            (setModel as any)({ ...model, system_message: e.target.value });
            if (isEdit && setHasUnsavedChanges) setHasUnsavedChanges(true);
          }}
          placeholder="System Message"
          className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 resize-y min-h-[100px] max-h-[300px] overflow-y-auto"
          style={{
            '--tw-ring-color': primary.base
          } as React.CSSProperties}
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={loading || !model.name || !model.api_key || !model.endpoint}
        variant="primary"
        size="lg"
        loading={loading}
        loadingText={isEdit ? 'Saving...' : 'Adding...'}
        className="w-full mt-4 sm:mt-6 group"
      >
        {!isEdit && (
          <svg
            className="h-5 w-5 transition-transform group-hover:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
        <span>{isEdit ? 'Save Changes' : 'Add Model'}</span>
      </Button>
    </div>
  );
}

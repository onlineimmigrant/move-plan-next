/**
 * AI Model Management Hook
 * Handles all CRUD operations, validation, filtering, and state management
 * Shared between admin and account contexts
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  DefaultModel,
  TaskItem,
  NewModelForm,
  RoleFormData,
  TabType,
  FilterRoleType,
  FilterActiveType,
  SortByType,
  SortOrderType,
  TaskInputMode,
  TaskModalMode,
  FieldErrors,
  TouchedFields,
} from '../types/aiManagement';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// Validation Functions
// ============================================================================

export const validateField = (field: string, value: any): string | null => {
  switch(field) {
    case 'name':
      if (!value || !value.trim()) return 'Model name is required';
      if (value.trim().length < 2) return 'Model name must be at least 2 characters';
      return null;
    
    case 'api_key':
      if (!value || !value.trim()) return 'API key is required';
      if (value.trim().length < 10) return 'API key seems too short (minimum 10 characters)';
      return null;
    
    case 'endpoint':
      if (!value || !value.trim()) return 'Endpoint URL is required';
      if (!/^https?:\/\/.+/.test(value)) return 'Must be a valid URL (http:// or https://)';
      return null;
    
    case 'max_tokens':
      const num = parseInt(value);
      if (isNaN(num)) return 'Must be a number';
      if (num < 1) return 'Must be at least 1';
      if (num > 100000) return 'Maximum is 100,000 tokens';
      return null;
    
    case 'icon':
      if (value && value.trim()) {
        if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp|ico)(\?.*)?$/i.test(value)) {
          return 'Must be a valid image URL (.jpg, .png, .svg, etc.)';
        }
      }
      return null;
    
    default:
      return null;
  }
};

export const validateForm = (data: NewModelForm | DefaultModel): FieldErrors => {
  const errors: FieldErrors = {};
  
  ['name', 'api_key', 'endpoint', 'max_tokens', 'icon'].forEach(field => {
    const error = validateField(field, data[field as keyof typeof data]);
    if (error) errors[field] = error;
  });
  
  return errors;
};

// ============================================================================
// Hook Configuration Interface
// ============================================================================

interface UseModelManagementConfig {
  context?: 'admin' | 'account'; // Optional context identifier
}

// ============================================================================
// Main Hook
// ============================================================================

export const useModelManagement = (config: UseModelManagementConfig = {}) => {
  const { context = 'admin' } = config;

  // Determine table name based on context
  const tableName = context === 'account' ? 'ai_models' : 'ai_models_default';

  // Model data state
  const [defaultModels, setDefaultModels] = useState<DefaultModel[]>([]);
  const [selectedEditModel, setSelectedEditModel] = useState<DefaultModel | null>(null);
  const [editModel, setEditModel] = useState<DefaultModel | null>(null);
  
  // Form state
  const [newModel, setNewModel] = useState<NewModelForm>({
    name: '',
    api_key: '',
    endpoint: '',
    max_tokens: 200,
    user_role_to_access: 'user',
    system_message: 'You are a helpful assistant.',
    icon: '',
    role: null,
    task: null,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('models');
  
  // Search and filter state
  const [modelSearch, setModelSearch] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRoleType>('all');
  const [filterActive, setFilterActive] = useState<FilterActiveType>('all');
  const [sortBy, setSortBy] = useState<SortByType>('name');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('asc');
  
  // Validation state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Task state
  const [taskInputMode, setTaskInputMode] = useState<TaskInputMode>('builder');
  const [taskBuilder, setTaskBuilder] = useState<TaskItem[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedModelForTasks, setSelectedModelForTasks] = useState<DefaultModel | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<TaskModalMode>('view');
  
  // Role state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedModelForRole, setSelectedModelForRole] = useState<DefaultModel | null>(null);
  const [editRoleData, setEditRoleData] = useState<RoleFormData>({
    role: '',
    customRole: '',
    systemMessage: '',
    isCustomRole: false,
  });
  
  // Model Edit Modal state
  const [modelEditModalOpen, setModelEditModalOpen] = useState(false);
  const [modelEditMode, setModelEditMode] = useState<'add' | 'edit'>('add');

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ============================================================================
  // Field Validation Handlers
  // ============================================================================

  const handleFieldChange = useCallback((field: string, value: any, isEdit: boolean = false) => {
    if (isEdit && editModel) {
      setEditModel({ ...editModel, [field]: value });
      setHasUnsavedChanges(true);
    } else {
      setNewModel(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [editModel, fieldErrors]);

  const handleFieldBlur = useCallback((field: string, value: any) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  }, []);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchDefaultModels = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError('Please log in to access AI management.');
      console.error('Auth error:', authError?.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      setError('Profile not found. Please contact support.');
      console.error('Profile error:', profileError?.message);
      setLoading(false);
      return;
    }

    if (context === 'account') {
      // For account context, fetch THREE types of models:
      // 1. User's own models (editable)
      // 2. Organization default models (read-only)
      // 3. Enabled system models (read-only)
      
      // 1. Fetch user's own models from ai_models (editable)
      const { data: userModels, error: userModelsError } = await supabase
        .from('ai_models')
        .select('id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon, role, task, organization_id, user_id')
        .eq('organization_id', profile.organization_id)
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (userModelsError) {
        console.error('User models error:', userModelsError.message);
      }

      // 2. Fetch organization default models with user_role_to_access='user' (read-only)
      const { data: orgModels, error: orgModelsError } = await supabase
        .from('ai_models_default')
        .select('id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon, role, task, organization_id')
        .eq('organization_id', profile.organization_id)
        .eq('user_role_to_access', 'user')
        .eq('is_active', true) // Only show active default models
        .order('name', { ascending: true });

      if (orgModelsError) {
        console.error('Org models error:', orgModelsError.message);
      }

      // 3. Fetch enabled system models (read-only)
      // Join ai_models_system with org_system_model_config to get only enabled models
      const { data: systemModels, error: systemModelsError } = await supabase
        .from('ai_models_system')
        .select(`
          id,
          name,
          api_key,
          endpoint,
          max_tokens,
          is_active,
          system_message,
          icon,
          role,
          task,
          org_system_model_config!inner (
            is_enabled_for_users,
            organization_id
          )
        `)
        .eq('is_active', true)
        .eq('org_system_model_config.organization_id', profile.organization_id)
        .eq('org_system_model_config.is_enabled_for_users', true)
        .order('name', { ascending: true });

      if (systemModelsError) {
        console.error('System models error:', systemModelsError.message);
      }

      // Transform system models to match the expected format
      const systemModelsFormatted = (systemModels || []).map(m => ({
        id: m.id,
        name: m.name,
        api_key: m.api_key,
        endpoint: m.endpoint,
        max_tokens: m.max_tokens,
        user_role_to_access: 'user' as const,
        is_active: m.is_active,
        system_message: m.system_message,
        icon: m.icon,
        role: m.role,
        task: m.task,
        organization_id: profile.organization_id,
      }));

      // Combine all three sets of models
      // Mark each with a type property to distinguish them
      const userModelsWithType = (userModels || []).map(m => ({ ...m, type: 'user' as const }));
      const orgModelsWithType = (orgModels || []).map(m => ({ ...m, type: 'default' as const }));
      const systemModelsWithType = systemModelsFormatted.map(m => ({ ...m, type: 'system' as const }));
      
      const allModels = [...userModelsWithType, ...orgModelsWithType, ...systemModelsWithType];
      setDefaultModels(allModels as unknown as DefaultModel[]);

      if (userModelsError || orgModelsError || systemModelsError) {
        setError('Failed to load some models.');
      }
    } else {
      // For admin context, fetch TWO types of models:
      // 1. Organization default models from ai_models_default
      // 2. Enabled system models from ai_models_system
      
      const selectColumns = 'id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon, role, task, organization_id';

      // 1. Fetch organization default models
      const { data: defaults, error: defaultsError } = await supabase
        .from(tableName)
        .select(selectColumns)
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true });

      if (defaultsError) {
        setError('Failed to load default models.');
        console.error('Defaults error:', defaultsError.message);
      }

      // 2. Fetch enabled system models (same query as account context)
      const { data: systemModels, error: systemModelsError } = await supabase
        .from('ai_models_system')
        .select(`
          id,
          name,
          api_key,
          endpoint,
          max_tokens,
          is_active,
          system_message,
          icon,
          role,
          task,
          org_system_model_config!inner (
            is_enabled_for_users,
            organization_id
          )
        `)
        .eq('is_active', true)
        .eq('org_system_model_config.organization_id', profile.organization_id)
        .eq('org_system_model_config.is_enabled_for_users', true)
        .order('name', { ascending: true });

      if (systemModelsError) {
        console.error('System models error:', systemModelsError.message);
      }

      // Transform system models to match the expected format
      const systemModelsFormatted = (systemModels || []).map(m => ({
        id: m.id,
        name: m.name,
        api_key: m.api_key,
        endpoint: m.endpoint,
        max_tokens: m.max_tokens,
        user_role_to_access: 'admin' as const, // System models accessible to admin
        is_active: m.is_active,
        system_message: m.system_message,
        icon: m.icon,
        role: m.role,
        task: m.task,
        organization_id: profile.organization_id,
      }));

      // Combine default models and system models
      const defaultModelsWithType = (defaults || []).map(m => ({ ...m, type: 'default' as const }));
      const systemModelsWithType = systemModelsFormatted.map(m => ({ ...m, type: 'system' as const }));
      
      const allModels = [...defaultModelsWithType, ...systemModelsWithType];
      setDefaultModels(allModels as unknown as DefaultModel[]);
    }
    
    setLoading(false);
  }, [context, tableName]);

  useEffect(() => {
    fetchDefaultModels();
  }, [fetchDefaultModels]);

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  const addDefaultModel = useCallback(async () => {
    // Validate form first
    const errors = validateForm(newModel);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors below before submitting.');
      setTouchedFields({
        name: true,
        api_key: true,
        endpoint: true,
        max_tokens: true,
        icon: true
      });
      return;
    }

    setLoading(true);
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError('Please log in to add a model.');
      console.error('Auth error:', authError?.message);
      setLoading(false);
      return;
    }

    if (!newModel.name || !newModel.api_key || !newModel.endpoint) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      setError('Profile not found. Please contact support.');
      console.error('Profile error:', profileError?.message);
      setLoading(false);
      return;
    }

    try {
      // Prepare insert data based on context
      const insertData: any = {
        organization_id: profile.organization_id,
        name: newModel.name,
        api_key: newModel.api_key,
        endpoint: newModel.endpoint,
        max_tokens: newModel.max_tokens,
        system_message: newModel.system_message,
        icon: newModel.icon || null,
        is_active: true,
        role: newModel.role,
        task: newModel.task,
      };

      // For account context, add user_id and force user_role_to_access to 'user'
      if (context === 'account') {
        insertData.user_id = user.id;
        insertData.user_role_to_access = 'user';
      } else {
        // For admin context, use the provided user_role_to_access
        insertData.user_role_to_access = newModel.user_role_to_access;
      }

      // Select columns based on context
      const selectColumns = context === 'account'
        ? 'id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon, role, task, organization_id, user_id'
        : 'id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon, role, task, organization_id';

      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select(selectColumns)
        .single();
      if (error) {
        throw new Error('Failed to add model: ' + error.message);
      }
      if (data) {
        // Type assertion: data matches DefaultModel structure
        setDefaultModels(prev => [...prev, data as unknown as DefaultModel]);
        setNewModel({
          name: '',
          api_key: '',
          endpoint: '',
          max_tokens: 200,
          user_role_to_access: 'user',
          system_message: 'You are a helpful assistant.',
          icon: '',
          role: null,
          task: null,
        });
        setSuccessMessage('Model added successfully!');
        setActiveTab('models');
        // Close modal if it's open
        if (modelEditModalOpen) {
          setModelEditModalOpen(false);
          setFieldErrors({});
          setTouchedFields({});
          setHasUnsavedChanges(false);
          setTaskBuilder([]);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add model.');
      console.error('Add model error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [newModel, context, tableName, modelEditModalOpen]);

  const updateModel = useCallback(async () => {
    if (!editModel) return;

    // For account context, only allow updating user's own models
    if (context === 'account' && (editModel.type === 'default' || editModel.type === 'system')) {
      setError('You cannot edit organization default or system models. Only your own models are editable.');
      return;
    }

    // Validate form first
    const errors = validateForm(editModel);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors below before saving.');
      setTouchedFields({
        name: true,
        api_key: true,
        endpoint: true,
        max_tokens: true,
        icon: true
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare update data
      const updateData: any = {
        name: editModel.name,
        api_key: editModel.api_key,
        endpoint: editModel.endpoint,
        max_tokens: editModel.max_tokens,
        system_message: editModel.system_message,
        icon: editModel.icon || null,
        role: editModel.role,
        task: editModel.task,
      };

      // For admin context, allow updating user_role_to_access
      // For account context, it's always 'user' and shouldn't be updated
      if (context === 'admin') {
        updateData.user_role_to_access = editModel.user_role_to_access;
      }

      // For account context with user models, use ai_models table
      const tableToUse = context === 'account' && editModel.type === 'user' ? 'ai_models' : tableName;

      const { error } = await supabase
        .from(tableToUse)
        .update(updateData)
        .eq('id', editModel.id);
      if (error) {
        throw new Error('Failed to update model: ' + error.message);
      }
      setDefaultModels(prev =>
        prev.map((model) =>
          model.id === editModel.id ? { ...editModel } : model
        )
      );
      setSelectedEditModel(null);
      setEditModel(null);
      setHasUnsavedChanges(false);
      setFieldErrors({});
      setTouchedFields({});
      setSuccessMessage(`${editModel.name} updated successfully!`);
      setActiveTab('models');
      // Close modal if it's open
      if (modelEditModalOpen) {
        setModelEditModalOpen(false);
        setTaskBuilder([]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update model.');
      console.error('Update model error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [editModel, modelEditModalOpen]);

  const deleteModel = useCallback(async (id: number) => {
    const modelToDelete = defaultModels.find(m => m.id === id);
    if (!modelToDelete) return;

    // For account context, only allow deleting user's own models
    if (context === 'account' && (modelToDelete.type === 'default' || modelToDelete.type === 'system')) {
      setError('You cannot delete organization default or system models. Only your own models can be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${modelToDelete.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      // For account context with user models, use ai_models table
      const tableToUse = context === 'account' && modelToDelete.type === 'user' ? 'ai_models' : tableName;
      
      const { error } = await supabase
        .from(tableToUse)
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error('Failed to delete model: ' + error.message);
      }
      setDefaultModels(prev => prev.filter((model) => model.id !== id));
      if (selectedEditModel?.id === id) {
        setSelectedEditModel(null);
        setEditModel(null);
        setActiveTab('models');
      }
      setSuccessMessage(`${modelToDelete.name} deleted successfully`);
    } catch (error: any) {
      setError(error.message || 'Failed to delete model.');
      console.error('Delete model error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [defaultModels, selectedEditModel, context, tableName]);

  const toggleModelActive = useCallback(async (id: number, is_active: boolean) => {
    const model = defaultModels.find(m => m.id === id);
    
    // For account context, check if model is editable
    if (context === 'account' && (model?.type === 'default' || model?.type === 'system')) {
      setError('You cannot toggle organization default or system models. Only your own models can be modified.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For account context with user models, use ai_models table
      const tableToUse = context === 'account' && model?.type === 'user' ? 'ai_models' : tableName;
      
      const { error } = await supabase
        .from(tableToUse)
        .update({ is_active })
        .eq('id', id);
      if (error) {
        throw new Error('Failed to update model status: ' + error.message);
      }
      setDefaultModels(prev =>
        prev.map((m) =>
          m.id === id ? { ...m, is_active } : m
        )
      );
      if (selectedEditModel?.id === id) {
        setSelectedEditModel(prev => prev ? { ...prev, is_active } : null);
        setEditModel(prev => prev ? { ...prev, is_active } : null);
      }
      setSuccessMessage(`${model?.name} ${is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      setError(error.message || 'Failed to update model status.');
      console.error('Toggle active error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [defaultModels, selectedEditModel, context, tableName]);

  // ============================================================================
  // Model Edit Modal Handlers
  // ============================================================================

  const openAddModelModal = useCallback(() => {
    setModelEditMode('add');
    setNewModel({
      name: '',
      api_key: '',
      endpoint: '',
      max_tokens: 200,
      user_role_to_access: 'user',
      system_message: 'You are a helpful assistant.',
      icon: '',
      role: null,
      task: null,
    });
    setTaskBuilder([]);
    setFieldErrors({});
    setTouchedFields({});
    setHasUnsavedChanges(false);
    setModelEditModalOpen(true);
  }, []);

  const selectModelForEdit = useCallback((model: DefaultModel) => {
    // For account context, only allow editing user's own models (type='user')
    if (context === 'account' && model.type === 'default' || model.type === 'system') {
      setError('You cannot edit organization default models. Only your own models are editable.');
      return;
    }

    setModelEditMode('edit');
    setSelectedEditModel(model);
    setEditModel({ ...model });
    setHasUnsavedChanges(false);
    setFieldErrors({});
    setTouchedFields({});
    if (model.task && Array.isArray(model.task)) {
      setTaskBuilder(model.task);
    } else {
      setTaskBuilder([]);
    }
    setModelEditModalOpen(true);
  }, [context]);

  const closeModelEditModal = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close? Your changes will be lost.'
      );
      if (!confirmed) return;
    }
    
    setModelEditModalOpen(false);
    setSelectedEditModel(null);
    setEditModel(null);
    setFieldErrors({});
    setTouchedFields({});
    setHasUnsavedChanges(false);
    setTaskBuilder([]);
  }, [hasUnsavedChanges]);

  // ============================================================================
  // Tab and Edit Selection (Legacy - keeping for backward compatibility)
  // ============================================================================

  const selectModelForEditLegacy = useCallback((model: DefaultModel) => {
    // For account context, only allow editing user's own models (type='user')
    if (context === 'account' && model.type === 'default' || model.type === 'system') {
      setError('You cannot edit organization default models. Only your own models are editable.');
      return;
    }

    setSelectedEditModel(model);
    setEditModel({ ...model });
    setHasUnsavedChanges(false);
    setFieldErrors({});
    setTouchedFields({});
    if (model.task && Array.isArray(model.task)) {
      setTaskBuilder(model.task);
    } else {
      setTaskBuilder([]);
    }
    setActiveTab('edit');
  }, [context]);

  const handleTabSwitch = useCallback((tab: TabType) => {
    if (activeTab === 'edit' && hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      );
      if (!confirmed) return;
    }
    
    setFieldErrors({});
    setTouchedFields({});
    if (tab !== 'edit') {
      setHasUnsavedChanges(false);
    }
    
    setActiveTab(tab);
  }, [activeTab, hasUnsavedChanges]);

  // ============================================================================
  // Task Management
  // ============================================================================

  const openTaskModal = useCallback((model: DefaultModel, mode: TaskModalMode = 'view') => {
    // For account context, only allow viewing tasks for organization default models
    if (context === 'account' && model.type === 'default' || model.type === 'system' && mode === 'add') {
      setError('You cannot add tasks to organization default models. Only your own models are editable.');
      return;
    }
    
    setSelectedModelForTasks(model);
    setTaskModalMode(mode);
    setTaskModalOpen(true);
  }, [context]);

  const closeTaskModal = useCallback(() => {
    setTaskModalOpen(false);
    setSelectedModelForTasks(null);
    setTaskModalMode('view');
  }, []);

  const addTaskToModel = useCallback(async (taskName: string, systemMessage: string) => {
    if (!selectedModelForTasks) return;

    // For account context, prevent adding tasks to organization default models
    if (context === 'account' && selectedModelForTasks.type === 'default') {
      setError('You cannot add tasks to organization default models.');
      return;
    }

    const currentTasks = Array.isArray(selectedModelForTasks.task) ? selectedModelForTasks.task : [];
    const newTasks = [...currentTasks, { name: taskName, system_message: systemMessage }];

    try {
      // For account context with user models, use ai_models table
      const tableToUse = context === 'account' && selectedModelForTasks.type === 'user' ? 'ai_models' : tableName;
      
      const { error } = await supabase
        .from(tableToUse)
        .update({ task: newTasks })
        .eq('id', selectedModelForTasks.id);

      if (error) throw error;

      setDefaultModels(prev => prev.map(model => 
        model.id === selectedModelForTasks.id 
          ? { ...model, task: newTasks }
          : model
      ));

      setSelectedModelForTasks(prev => prev ? { ...prev, task: newTasks } : null);
      setSuccessMessage('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task');
    }
  }, [selectedModelForTasks, context, tableName]);

  const removeTaskFromModel = useCallback(async (modelId: number, taskIndex: number) => {
    const model = defaultModels.find(m => m.id === modelId);
    if (!model || !Array.isArray(model.task)) return;

    // For account context, prevent removing tasks from organization default models
    if (context === 'account' && model.type === 'default' || model.type === 'system') {
      setError('You cannot remove tasks from organization default models.');
      return;
    }

    const newTasks = model.task.filter((_, index) => index !== taskIndex);

    try {
      // For account context with user models, use ai_models table
      const tableToUse = context === 'account' && model.type === 'user' ? 'ai_models' : tableName;
      
      const { error } = await supabase
        .from(tableToUse)
        .update({ task: newTasks.length > 0 ? newTasks : null })
        .eq('id', modelId);

      if (error) throw error;

      setDefaultModels(prev => prev.map(m => 
        m.id === modelId 
          ? { ...m, task: newTasks.length > 0 ? newTasks : null }
          : m
      ));

      if (selectedModelForTasks?.id === modelId) {
        setSelectedModelForTasks(prev => prev ? { ...prev, task: newTasks.length > 0 ? newTasks : null } : null);
      }

      setSuccessMessage('Task removed successfully!');
    } catch (error) {
      console.error('Error removing task:', error);
      setError('Failed to remove task');
    }
  }, [defaultModels, selectedModelForTasks, context, tableName]);

  // ============================================================================
  // Role Management
  // ============================================================================

  const openRoleModal = useCallback((model: DefaultModel, predefinedRoles: any[]) => {
    // For account context, prevent editing roles for organization default models
    if (context === 'account' && model.type === 'default' || model.type === 'system') {
      setError('You cannot edit roles for organization default models. Only your own models are editable.');
      return;
    }
    
    setSelectedModelForRole(model);
    const isPredefinedRole = predefinedRoles.some(r => r.value === model.role);
    setEditRoleData({
      role: isPredefinedRole && model.role ? model.role : 'custom',
      customRole: !isPredefinedRole && model.role ? model.role : '',
      systemMessage: model.system_message || 'You are a helpful assistant.',
      isCustomRole: !isPredefinedRole
    });
    setRoleModalOpen(true);
  }, [context]);

  const closeRoleModal = useCallback(() => {
    setRoleModalOpen(false);
    setSelectedModelForRole(null);
    setEditRoleData({
      role: '',
      customRole: '',
      systemMessage: '',
      isCustomRole: false,
    });
  }, []);

  const saveRoleChanges = useCallback(async () => {
    if (!selectedModelForRole) return;

    // For account context, prevent saving roles for organization default models
    if (context === 'account' && selectedModelForRole.type === 'default') {
      setError('You cannot edit roles for organization default models.');
      return;
    }

    const finalRole = editRoleData.role === 'custom' ? editRoleData.customRole : editRoleData.role;
    
    if (!finalRole.trim()) {
      setError('Role cannot be empty');
      return;
    }

    try {
      setLoading(true);
      
      // For account context with user models, use ai_models table
      const tableToUse = context === 'account' && selectedModelForRole.type === 'user' ? 'ai_models' : tableName;
      
      const { error } = await supabase
        .from(tableToUse)
        .update({ 
          role: finalRole,
          system_message: editRoleData.systemMessage 
        })
        .eq('id', selectedModelForRole.id);

      if (error) throw error;

      setDefaultModels(prev => prev.map(model => 
        model.id === selectedModelForRole.id 
          ? { ...model, role: finalRole, system_message: editRoleData.systemMessage }
          : model
      ));

      setSuccessMessage('Role updated successfully!');
      closeRoleModal();
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  }, [selectedModelForRole, editRoleData, closeRoleModal, context, tableName]);

  // ============================================================================
  // Filtering and Sorting
  // ============================================================================

  // Calculate filter counts
  // ============================================================================
  // Filtering and Counts
  // ============================================================================

  const totalCount = defaultModels.length;
  
  // Context-aware counts
  const userCount = context === 'account'
    ? defaultModels.filter(m => m.type === 'user').length // Custom models for account
    : defaultModels.filter(m => m.user_role_to_access === 'user').length; // User role for admin
    
  const adminCount = context === 'account'
    ? defaultModels.filter(m => m.type === 'default' || m.type === 'system').length // Default + System models for account
    : defaultModels.filter(m => m.user_role_to_access === 'admin' && m.type !== 'system').length; // Admin role for admin (excluding system)
  
  const systemCount = defaultModels.filter(m => m.type === 'system').length; // System models count
    
  const activeCount = defaultModels.filter(m => m.is_active).length;
  const inactiveCount = defaultModels.filter(m => !m.is_active).length;

  const filteredDefaultModels = defaultModels
    .filter((model) => {
      const searchQuery = modelSearch.toLowerCase();
      
      // Search in model name
      const matchesModelName = model.name.toLowerCase().includes(searchQuery);
      
      // Search in role
      const matchesRole = model.role && model.role.toLowerCase().includes(searchQuery);
      
      // Search in task names
      const matchesTaskNames = model.task && Array.isArray(model.task) && 
        model.task.some((task: any) => 
          task.name && task.name.toLowerCase().includes(searchQuery)
        );
      
      // Combined search match
      const matchesSearch = !searchQuery || matchesModelName || matchesRole || matchesTaskNames;
      
      // Context-aware role filter
      let matchesRoleFilter = true;
      if (context === 'account') {
        // For account: filter by model type (user='custom', admin='default')
        if (filterRole === 'user') {
          matchesRoleFilter = model.type === 'user';
        } else if (filterRole === 'admin') {
          matchesRoleFilter = model.type === 'default' || model.type === 'system';
        } else if (filterRole === 'system') {
          matchesRoleFilter = model.type === 'system';
        }
        // filterRole === 'all' shows everything
      } else {
        // For admin: filter by model type or user_role_to_access
        if (filterRole === 'system') {
          matchesRoleFilter = model.type === 'system';
        } else {
          matchesRoleFilter = filterRole === 'all' || model.user_role_to_access === filterRole;
        }
      }
      
      // Filter by active status
      const matchesActive = filterActive === 'all' || 
        (filterActive === 'active' && model.is_active) ||
        (filterActive === 'inactive' && !model.is_active);
      
      return matchesSearch && matchesRoleFilter && matchesActive;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'role':
          const roleA = a.role || a.user_role_to_access || '';
          const roleB = b.role || b.user_role_to_access || '';
          comparison = roleA.localeCompare(roleB);
          break;
        case 'created':
          comparison = a.id - b.id;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Context
    context,
    
    // Data
    defaultModels,
    filteredDefaultModels,
    selectedEditModel,
    editModel,
    newModel,
    
    // Filter counts
    totalCount,
    userCount,
    adminCount,
    systemCount,
    activeCount,
    inactiveCount,
    
    // UI State
    loading,
    error,
    successMessage,
    activeTab,
    
    // Search & Filters
    modelSearch,
    filterRole,
    filterActive,
    sortBy,
    sortOrder,
    
    // Validation
    fieldErrors,
    touchedFields,
    hasUnsavedChanges,
    
    // Task State
    taskInputMode,
    taskBuilder,
    taskModalOpen,
    selectedModelForTasks,
    taskModalMode,
    
    // Role State
    roleModalOpen,
    selectedModelForRole,
    editRoleData,
    
    // Model Edit Modal State
    modelEditModalOpen,
    modelEditMode,
    
    // Setters
    setNewModel,
    setEditModel,
    setError,
    setSuccessMessage,
    setModelSearch,
    setFilterRole,
    setFilterActive,
    setSortBy,
    setSortOrder,
    setTaskInputMode,
    setTaskBuilder,
    setHasUnsavedChanges,
    setEditRoleData,
    setSelectedEditModel,
    setActiveTab,
    setTaskModalMode,
    
    // Actions
    fetchDefaultModels,
    addDefaultModel,
    updateModel,
    deleteModel,
    toggleModelActive,
    selectModelForEdit,
    handleTabSwitch,
    handleFieldChange,
    handleFieldBlur,
    
    // Model Edit Modal Actions
    openAddModelModal,
    closeModelEditModal,
    
    // Task Actions
    openTaskModal,
    closeTaskModal,
    addTaskToModel,
    removeTaskFromModel,
    
    // Role Actions
    openRoleModal,
    closeRoleModal,
    saveRoleChanges,
  };
};

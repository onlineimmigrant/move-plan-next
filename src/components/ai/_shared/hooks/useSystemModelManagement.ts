/**
 * System Model Management Hook
 * Custom hook for managing system-wide AI models (Superadmin only)
 * Extends useModelManagement pattern with system-specific fields
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { SystemModel, SystemModelForm, DEFAULT_SYSTEM_MODEL } from '../types/systemModels';
import type { TaskItem, FieldErrors, TouchedFields } from '../types/aiManagement';
import { validateSystemModel } from '../types/systemModels';

export function useSystemModelManagement() {
  // Data State
  const [models, setModels] = useState<SystemModel[]>([]);
  const [selectedEditModel, setSelectedEditModel] = useState<SystemModel | null>(null);
  const [newModel, setNewModel] = useState<SystemModelForm | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal State
  const [modelEditModalOpen, setModelEditModalOpen] = useState(false);
  const [modelEditMode, setModelEditMode] = useState<'add' | 'edit'>('add');
  
  // Validation State
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Task Builder State
  const [taskBuilder, setTaskBuilder] = useState<TaskItem[]>([]);
  const [taskInputMode, setTaskInputMode] = useState<'json' | 'builder'>('builder');
  
  // Search & Filters
  const [modelSearch, setModelSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'starter' | 'pro' | 'enterprise'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'regular'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'sort_order'>('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Fetch models
  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('ai_models_system')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });
      
      if (fetchError) {
        console.error('Error fetching system models:', fetchError);
        setError(fetchError.message);
        return;
      }
      
      setModels(data || []);
    } catch (err) {
      console.error('Failed to fetch system models:', err);
      setError('Failed to load system models');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);
  
  // Initial fetch
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);
  
  // Filter models
  const filteredModels = models.filter((model) => {
    // Search filter
    if (modelSearch && !model.name.toLowerCase().includes(modelSearch.toLowerCase())) {
      return false;
    }
    
    // Plan filter
    if (filterPlan !== 'all' && model.required_plan !== filterPlan) {
      return false;
    }
    
    // Active filter
    if (filterActive === 'active' && !model.is_active) return false;
    if (filterActive === 'inactive' && model.is_active) return false;
    
    // Featured filter
    if (filterFeatured === 'featured' && !model.is_featured) return false;
    if (filterFeatured === 'regular' && model.is_featured) return false;
    
    return true;
  });
  
  // Open Add Modal
  const openAddModelModal = () => {
    const defaultModel: SystemModelForm = {
      name: '',
      role: '',
      system_message: '',
      api_key: '',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      max_tokens: 1000,
      icon: '🤖',
      organization_types: [],
      required_plan: 'free',
      token_limit_period: null,
      token_limit_amount: null,
      is_free: false,
      is_trial: false,
      trial_expires_days: null,
      is_active: true,
      is_featured: false,
      description: '',
      tags: [],
      sort_order: 0,
      task: null,
    };
    
    setNewModel(defaultModel);
    setSelectedEditModel(null);
    setTaskBuilder([]);
    setFieldErrors({});
    setTouchedFields({});
    setHasUnsavedChanges(false);
    setModelEditMode('add');
    setModelEditModalOpen(true);
  };
  
  // Open Edit Modal
  const selectModelForEdit = (model: SystemModel) => {
    setSelectedEditModel(model);
    setNewModel(null);
    setTaskBuilder(model.task || []);
    setFieldErrors({});
    setTouchedFields({});
    setHasUnsavedChanges(false);
    setModelEditMode('edit');
    setModelEditModalOpen(true);
  };
  
  // Close Modal
  const closeModelEditModal = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    setModelEditModalOpen(false);
    setSelectedEditModel(null);
    setNewModel(null);
    setTaskBuilder([]);
    setFieldErrors({});
    setTouchedFields({});
    setHasUnsavedChanges(false);
  };
  
  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    const isEdit = modelEditMode === 'edit';
    
    if (isEdit && selectedEditModel) {
      setSelectedEditModel({ ...selectedEditModel, [field]: value });
    } else if (newModel) {
      setNewModel({ ...newModel, [field]: value });
    }
    
    setHasUnsavedChanges(true);
    
    // Clear error for this field
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Handle field blur
  const handleFieldBlur = (field: string, value: any) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    
    // Validate field
    const currentModel = modelEditMode === 'edit' ? selectedEditModel : newModel;
    if (currentModel) {
      const errors = validateSystemModel(currentModel as SystemModelForm);
      if (errors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }));
      }
    }
  };
  
  // Add Model
  const addModel = async () => {
    if (!newModel) return;
    
    // Validate
    const errors = validateSystemModel(newModel);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix validation errors');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const { error: insertError } = await supabase
        .from('ai_models_system')
        .insert([newModel]);
      
      if (insertError) {
        throw insertError;
      }
      
      setSuccessMessage('System model added successfully');
      closeModelEditModal();
      fetchModels();
    } catch (err: any) {
      console.error('Error adding model:', err);
      setError(err.message || 'Failed to add model');
    } finally {
      setSaving(false);
    }
  };
  
  // Update Model
  const updateModel = async () => {
    if (!selectedEditModel) return;
    
    // Validate
    const errors = validateSystemModel(selectedEditModel as SystemModelForm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix validation errors');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const { error: updateError } = await supabase
        .from('ai_models_system')
        .update(selectedEditModel)
        .eq('id', selectedEditModel.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccessMessage('System model updated successfully');
      closeModelEditModal();
      fetchModels();
    } catch (err: any) {
      console.error('Error updating model:', err);
      setError(err.message || 'Failed to update model');
    } finally {
      setSaving(false);
    }
  };
  
  // Delete Model
  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this system model? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('ai_models_system')
        .delete()
        .eq('id', modelId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      setSuccessMessage('System model deleted successfully');
      fetchModels();
    } catch (err: any) {
      console.error('Error deleting model:', err);
      setError(err.message || 'Failed to delete model');
    }
  };
  
  // Toggle Active
  const toggleModelActive = async (modelId: string, currentStatus: boolean) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('ai_models_system')
        .update({ is_active: !currentStatus })
        .eq('id', modelId);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccessMessage(`Model ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchModels();
    } catch (err: any) {
      console.error('Error toggling model:', err);
      setError(err.message || 'Failed to toggle model status');
    }
  };
  
  // Toggle Featured
  const toggleModelFeatured = async (modelId: string, currentStatus: boolean) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('ai_models_system')
        .update({ is_featured: !currentStatus })
        .eq('id', modelId);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccessMessage(`Model ${!currentStatus ? 'featured' : 'unfeatured'} successfully`);
      fetchModels();
    } catch (err: any) {
      console.error('Error toggling featured:', err);
      setError(err.message || 'Failed to toggle featured status');
    }
  };
  
  return {
    // Data
    models,
    filteredModels,
    selectedEditModel,
    newModel,
    
    // UI State
    loading,
    saving,
    error,
    successMessage,
    
    // Modal State
    modelEditModalOpen,
    modelEditMode,
    
    // Validation
    fieldErrors,
    touchedFields,
    hasUnsavedChanges,
    
    // Task State
    taskBuilder,
    taskInputMode,
    
    // Filters
    modelSearch,
    filterPlan,
    filterActive,
    filterFeatured,
    sortBy,
    sortOrder,
    
    // Setters
    setError,
    setSuccessMessage,
    setModelSearch,
    setFilterPlan,
    setFilterActive,
    setFilterFeatured,
    setSortBy,
    setSortOrder,
    setTaskBuilder,
    setTaskInputMode,
    setHasUnsavedChanges,
    setNewModel,
    setSelectedEditModel,
    
    // Actions
    fetchModels,
    openAddModelModal,
    selectModelForEdit,
    closeModelEditModal,
    addModel,
    updateModel,
    deleteModel,
    toggleModelActive,
    toggleModelFeatured,
    handleFieldChange,
    handleFieldBlur,
  };
}

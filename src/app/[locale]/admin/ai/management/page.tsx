'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';
import InfoCards from '@/components/ai/InfoCards';
import DialogModals from '@/components/ai/DialogModals';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';

// Add animations
const modalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Predefined models and endpoints (unchanged)
const popularModels = [
  'grok-3',
  'grok-3-mini',
  'grok-3-mini-fast',
  'gpt-4o',
  'o1',
  'o3-mini',
  'claude-3.5-sonnet',
  'claude-4-sonnet',
  'claude-3.7-sonnet',
  'deepseek-r1',
  'deepseek-v3',
  'deepseek-r1-0528',
  'mistral-large-2',
  'mistral-small-3.1',
  'mixtral-8x7b',
  'llama-4-scout',
  'llama-4-maverick',
  'llama-3.3',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemma-2',
  'llama-3-70b',
  'vicuna-13b',
  'mistral-7b',
];

const popularEndpoints = [
  'https://api.x.ai/v1/chat/completions',
  'https://api.openai.com/v1/chat/completions',
  'https://api.anthropic.com/v1/messages',
  'https://api.together.ai/v1/completions',
  'https://generativelanguage.googleapis.com/v1',
  'https://api.deepseek.com/v1',
  'https://api.mixtral.ai/v1',
  'https://api-inference.huggingface.co/v1',
];

// Predefined AI Agent Roles
const predefinedRoles = [
  { value: 'assistant', label: 'Assistant', description: 'General purpose helpful assistant' },
  { value: 'analyst', label: 'Analyst', description: 'Data analysis and insights specialist' },
  { value: 'translator', label: 'Translator', description: 'Multi-language translation expert' },
  { value: 'writer', label: 'Writer', description: 'Content creation and copywriting' },
  { value: 'blog_content_writer', label: 'Blog Content Writer', description: 'Specialized blog post and article writing' },
  { value: 'flashcard', label: 'Flashcard', description: 'Educational flashcard creator' },
  { value: 'tutor', label: 'Tutor', description: 'Educational guidance and tutoring' },
  { value: 'researcher', label: 'Researcher', description: 'Research and information gathering' },
  { value: 'coder', label: 'Coder', description: 'Programming and code assistance' },
  { value: 'reviewer', label: 'Reviewer', description: 'Content review and feedback' },
  { value: 'summarizer', label: 'Summarizer', description: 'Text summarization specialist' },
];

interface DefaultModel {
  id: number;
  name: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  user_role_to_access: string;
  is_active: boolean;
  system_message: string;
  icon: string | null;
  role: string | null;
  task: any | null;
  organization_id?: string;
  src?: string;
}

export default function AIManagement() {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [defaultModels, setDefaultModels] = useState<DefaultModel[]>([]);
  const [selectedEditModel, setSelectedEditModel] = useState<DefaultModel | null>(null);
  const [newModel, setNewModel] = useState({
    name: '',
    api_key: '',
    endpoint: '',
    max_tokens: 200,
    user_role_to_access: 'user',
    system_message: 'You are a helpful assistant.',
    icon: '',
    role: null as string | null,
    task: null as any | null,
  });
  const [editModel, setEditModel] = useState<DefaultModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modelQuery, setModelQuery] = useState('');
  const [endpointQuery, setEndpointQuery] = useState('');
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'add' | 'edit'>('models');
  const [modelSearch, setModelSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [taskInputMode, setTaskInputMode] = useState<'json' | 'builder'>('builder');
  const [taskBuilder, setTaskBuilder] = useState<Array<{ name: string; system_message: string }>>([]);
  
  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedModelForTasks, setSelectedModelForTasks] = useState<DefaultModel | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<'view' | 'add'>('view');
  
  // Role edit modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedModelForRole, setSelectedModelForRole] = useState<DefaultModel | null>(null);
  const [editRoleData, setEditRoleData] = useState({
    role: '',
    customRole: '',
    system_message: ''
  });

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Validation function
  const validateField = (field: string, value: any): string | null => {
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

  // Validate entire form
  const validateForm = (data: typeof newModel | DefaultModel): boolean => {
    const errors: Record<string, string> = {};
    
    ['name', 'api_key', 'endpoint', 'max_tokens', 'icon'].forEach(field => {
      const error = validateField(field, data[field as keyof typeof data]);
      if (error) errors[field] = error;
    });
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle field change with validation
  const handleFieldChange = (field: string, value: any, isEdit: boolean = false) => {
    if (isEdit && editModel) {
      setEditModel({ ...editModel, [field]: value });
      setHasUnsavedChanges(true);
    } else {
      setNewModel({ ...newModel, [field]: value });
    }
    
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle field blur with validation
  const handleFieldBlur = (field: string, value: any) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  useEffect(() => {
    const fetchDefaultModels = async () => {
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

      const { data: defaults, error: defaultsError } = await supabase
        .from('ai_models_default')
        .select('id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon, role, task, organization_id')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true });
      if (defaultsError) {
        setError('Failed to load default models.');
        console.error('Defaults error:', defaultsError.message);
      } else {
        setDefaultModels(defaults || []);
      }
      setLoading(false);
    };
    fetchDefaultModels();
  }, []);

  const addDefaultModel = async () => {
    // Validate form first
    if (!validateForm(newModel)) {
      setError('Please fix the errors below before submitting.');
      // Mark all fields as touched to show errors
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
      const { data, error } = await supabase
        .from('ai_models_default')
        .insert({
          organization_id: profile.organization_id,
          name: newModel.name,
          api_key: newModel.api_key,
          endpoint: newModel.endpoint,
          max_tokens: newModel.max_tokens,
          user_role_to_access: newModel.user_role_to_access,
          system_message: newModel.system_message,
          icon: newModel.icon || null,
          is_active: true,
          role: newModel.role,
          task: newModel.task,
        })
        .select('id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon, role, task, organization_id')
        .single();
      if (error) {
        throw new Error('Failed to add model: ' + error.message);
      }
      if (data) {
        setDefaultModels([...defaultModels, data]);
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
        setModelQuery('');
        setEndpointQuery('');
        setSuccessMessage('Model added successfully!');
        setActiveTab('models');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add model.');
      console.error('Add model error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateModel = async () => {
    if (!editModel) return;

    // Validate form first
    if (!validateForm(editModel)) {
      setError('Please fix the errors below before saving.');
      // Mark all fields as touched to show errors
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
      const { error } = await supabase
        .from('ai_models_default')
        .update({
          name: editModel.name,
          api_key: editModel.api_key,
          endpoint: editModel.endpoint,
          max_tokens: editModel.max_tokens,
          user_role_to_access: editModel.user_role_to_access,
          system_message: editModel.system_message,
          icon: editModel.icon || null,
          role: editModel.role,
          task: editModel.task,
        })
        .eq('id', editModel.id);
      if (error) {
        throw new Error('Failed to update model: ' + error.message);
      }
      setDefaultModels(
        defaultModels.map((model) =>
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
    } catch (error: any) {
      setError(error.message || 'Failed to update model.');
      console.error('Update model error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteModel = async (id: number) => {
    const modelToDelete = defaultModels.find(m => m.id === id);
    if (!modelToDelete) return;

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${modelToDelete.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('ai_models_default')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error('Failed to delete model: ' + error.message);
      }
      setDefaultModels(defaultModels.filter((model) => model.id !== id));
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
  };

  const toggleModelActive = async (id: number, is_active: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('ai_models_default')
        .update({ is_active })
        .eq('id', id);
      if (error) {
        throw new Error('Failed to update model status: ' + error.message);
      }
      setDefaultModels(
        defaultModels.map((model) =>
          model.id === id ? { ...model, is_active } : model
        )
      );
      if (selectedEditModel?.id === id) {
        setSelectedEditModel({ ...selectedEditModel, is_active });
        setEditModel({ ...editModel!, is_active });
      }
      const model = defaultModels.find(m => m.id === id);
      setSuccessMessage(`${model?.name} ${is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      setError(error.message || 'Failed to update model status.');
      console.error('Toggle active error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectModelForEdit = (model: DefaultModel) => {
    setSelectedEditModel(model);
    setEditModel({ ...model });
    setHasUnsavedChanges(false);
    setFieldErrors({});
    setTouchedFields({});
    // Initialize task builder if model has tasks
    if (model.task && Array.isArray(model.task)) {
      setTaskBuilder(model.task);
    } else {
      setTaskBuilder([]);
    }
    setActiveTab('edit');
  };

  // Handle tab switching with unsaved changes warning
  const handleTabSwitch = (tab: 'models' | 'add' | 'edit') => {
    if (activeTab === 'edit' && hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      );
      if (!confirmed) return;
    }
    
    // Clear form errors when switching
    setFieldErrors({});
    setTouchedFields({});
    if (tab !== 'edit') {
      setHasUnsavedChanges(false);
    }
    
    setActiveTab(tab);
  };

  // Open task modal
  const openTaskModal = (model: DefaultModel, mode: 'view' | 'add' = 'view') => {
    setSelectedModelForTasks(model);
    setTaskModalMode(mode);
    setTaskModalOpen(true);
  };

  // Close task modal
  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedModelForTasks(null);
    setTaskModalMode('view');
  };

  // Add task to model from modal
  const addTaskToModel = async (taskName: string, systemMessage: string) => {
    if (!selectedModelForTasks) return;

    const currentTasks = Array.isArray(selectedModelForTasks.task) ? selectedModelForTasks.task : [];
    const newTasks = [...currentTasks, { name: taskName, system_message: systemMessage }];

    try {
      const { error } = await supabase
        .from('ai_models_default')
        .update({ task: newTasks })
        .eq('id', selectedModelForTasks.id);

      if (error) throw error;

      // Update local state
      setDefaultModels(defaultModels.map(model => 
        model.id === selectedModelForTasks.id 
          ? { ...model, task: newTasks }
          : model
      ));

      setSelectedModelForTasks({ ...selectedModelForTasks, task: newTasks });
      setSuccessMessage('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task');
    }
  };

  // Remove task from model
  const removeTaskFromModel = async (modelId: number, taskIndex: number) => {
    const model = defaultModels.find(m => m.id === modelId);
    if (!model || !Array.isArray(model.task)) return;

    const newTasks = model.task.filter((_, index) => index !== taskIndex);

    try {
      const { error } = await supabase
        .from('ai_models_default')
        .update({ task: newTasks.length > 0 ? newTasks : null })
        .eq('id', modelId);

      if (error) throw error;

      // Update local state
      setDefaultModels(defaultModels.map(m => 
        m.id === modelId 
          ? { ...m, task: newTasks.length > 0 ? newTasks : null }
          : m
      ));

      if (selectedModelForTasks?.id === modelId) {
        setSelectedModelForTasks({ ...selectedModelForTasks, task: newTasks.length > 0 ? newTasks : null });
      }

      setSuccessMessage('Task removed successfully!');
    } catch (error) {
      console.error('Error removing task:', error);
      setError('Failed to remove task');
    }
  };

  // Role modal functions
  const openRoleModal = (model: DefaultModel) => {
    setSelectedModelForRole(model);
    const isPredefinedRole = predefinedRoles.some(r => r.value === model.role);
    setEditRoleData({
      role: isPredefinedRole && model.role ? model.role : 'custom',
      customRole: !isPredefinedRole && model.role ? model.role : '',
      system_message: model.system_message || 'You are a helpful assistant.'
    });
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setSelectedModelForRole(null);
    setEditRoleData({
      role: '',
      customRole: '',
      system_message: ''
    });
  };

  const saveRoleChanges = async () => {
    if (!selectedModelForRole) return;

    const finalRole = editRoleData.role === 'custom' ? editRoleData.customRole : editRoleData.role;
    
    if (!finalRole.trim()) {
      setError('Role cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('ai_models_default')
        .update({ 
          role: finalRole,
          system_message: editRoleData.system_message 
        })
        .eq('id', selectedModelForRole.id);

      if (error) throw error;

      // Update local state
      setDefaultModels(defaultModels.map(model => 
        model.id === selectedModelForRole.id 
          ? { ...model, role: finalRole, system_message: editRoleData.system_message }
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
  };

  const filteredModels = modelQuery
    ? popularModels.filter((model) => model.toLowerCase().includes(modelQuery.toLowerCase()))
    : popularModels;
  const filteredEndpoints = endpointQuery
    ? popularEndpoints.filter((endpoint) => endpoint.toLowerCase().includes(endpointQuery.toLowerCase()))
    : popularEndpoints;

  // Filter and sort models based on search, filters, and sorting
  const filteredDefaultModels = defaultModels
    .filter((model) => {
      const matchesSearch = model.name.toLowerCase().includes(modelSearch.toLowerCase());
      const matchesRole = filterRole === 'all' || model.user_role_to_access === filterRole;
      const matchesActive = filterActive === 'all' || 
        (filterActive === 'active' && model.is_active) ||
        (filterActive === 'inactive' && !model.is_active);
      
      return matchesSearch && matchesRole && matchesActive;
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
          // Since we don't have created_at in the schema, fall back to ID (older = lower ID)
          comparison = a.id - b.id;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div>
      <style>{modalStyles}</style>
      <div className="mt-4 sm:mt-8 flex flex-col items-center">
        <Tooltip content="AI Management">
          <h1 className="mt-0 sm:mt-2 mb-3 sm:mb-6 text-xl sm:text-3xl font-bold text-center text-gray-900 relative">
            AI Management
            <span 
              className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full" 
              style={{ backgroundColor: primary.base }}
            />
          </h1>
        </Tooltip>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-7 p-2 sm:p-4 rounded-lg min-h-screen gap-3 sm:gap-8">
        <div className="sm:col-span-5">
          {/* Error Message */}
          {error && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 sm:gap-3">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2 sm:gap-3">
              <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex justify-center mb-3 sm:mb-6">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide max-w-full pb-1">
              <button
                onClick={() => handleTabSwitch('models')}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: activeTab === 'models' ? primary.base : 'white',
                  color: activeTab === 'models' ? 'white' : primary.base,
                  border: `1.5px solid ${activeTab === 'models' ? primary.base : primary.light}40`,
                }}
              >
                Models
              </button>
              <button
                onClick={() => handleTabSwitch('add')}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: activeTab === 'add' ? primary.base : 'white',
                  color: activeTab === 'add' ? 'white' : primary.base,
                  border: `1.5px solid ${activeTab === 'add' ? primary.base : primary.light}40`,
                  minWidth: '100px'
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Agent</span>
              </button>
              {selectedEditModel && (
                <button
                  onClick={() => handleTabSwitch('edit')}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: activeTab === 'edit' ? primary.base : 'white',
                    color: activeTab === 'edit' ? 'white' : primary.base,
                    border: `1.5px solid ${activeTab === 'edit' ? primary.base : primary.light}40`,
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit: {selectedEditModel.name}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-8">
            {/* Add Agent Tab */}
            {activeTab === 'add' && (
              <div className="max-w-2xl mx-auto">
                  <div className="relative mb-3 sm:mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Model Name *
                    </label>
                    <Combobox
                      value={newModel.name}
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
                          filteredModels.map((model) => (
                            <Combobox.Option
                              key={model}
                              value={model}
                            >
                              {({ active }) => (
                                <div
                                  className="relative cursor-pointer select-none py-2 px-4 text-gray-900"
                                  style={{
                                    backgroundColor: active ? primary.lighter : 'transparent'
                                  }}
                                >
                                  {model}
                                </div>
                              )}
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </Combobox>
                    {fieldErrors.name && touchedFields.name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      API Key *
                    </label>
                    <input
                      type="password"
                      value={newModel.api_key}
                      onChange={(e) => handleFieldChange('api_key', e.target.value, false)}
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
                  <div className="relative mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      API Endpoint *
                    </label>
                    <Combobox
                      value={newModel.endpoint}
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
                    {fieldErrors.endpoint && touchedFields.endpoint && (
                      <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.endpoint}</p>
                    )}
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={newModel.max_tokens}
                      onChange={(e) => handleFieldChange('max_tokens', e.target.value, false)}
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
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      User Role
                    </label>
                    <select
                      value={newModel.user_role_to_access}
                      onChange={(e) => setNewModel({ ...newModel, user_role_to_access: e.target.value })}
                      className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2"
                      style={{
                        '--tw-ring-color': primary.base
                      } as React.CSSProperties}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Icon URL (optional)
                    </label>
                    <input
                      type="text"
                      value={newModel.icon}
                      onChange={(e) => handleFieldChange('icon', e.target.value, false)}
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
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Role (optional)
                    </label>
                    <input
                      type="text"
                      value={newModel.role || ''}
                      onChange={(e) => setNewModel({ ...newModel, role: e.target.value || null })}
                      placeholder="e.g., assistant, analyst, translator"
                      className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2"
                      style={{
                        '--tw-ring-color': primary.base
                      } as React.CSSProperties}
                    />
                    <p className="text-xs text-gray-500 mt-1">Specify the AI model's role or specialty</p>
                  </div>
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
                        {taskBuilder.map((task, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">Task {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newTasks = taskBuilder.filter((_, i) => i !== index);
                                  setTaskBuilder(newTasks);
                                  setNewModel({ ...newModel, task: newTasks.length > 0 ? newTasks : null });
                                }}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={task.name}
                              onChange={(e) => {
                                const newTasks = [...taskBuilder];
                                newTasks[index].name = e.target.value;
                                setTaskBuilder(newTasks);
                                setNewModel({ ...newModel, task: newTasks });
                              }}
                              placeholder="Task name (e.g., Write Full Article)"
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded mb-2 focus:outline-none focus:ring-1"
                              style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                            />
                            <textarea
                              value={task.system_message}
                              onChange={(e) => {
                                const newTasks = [...taskBuilder];
                                newTasks[index].system_message = e.target.value;
                                setTaskBuilder(newTasks);
                                setNewModel({ ...newModel, task: newTasks });
                              }}
                              placeholder="System message for this task..."
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded resize-y min-h-[60px] focus:outline-none focus:ring-1"
                              style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newTasks = [...taskBuilder, { name: '', system_message: '' }];
                            setTaskBuilder(newTasks);
                          }}
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
                          value={newModel.task ? JSON.stringify(newModel.task, null, 2) : ''}
                          onChange={(e) => {
                            try {
                              const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                              setNewModel({ ...newModel, task: parsed });
                              if (parsed && Array.isArray(parsed)) {
                                setTaskBuilder(parsed);
                              }
                            } catch {
                              // Keep the text value even if invalid JSON for user to fix
                              setNewModel({ ...newModel, task: e.target.value || null });
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
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      System Message
                    </label>
                    <textarea
                      value={newModel.system_message}
                      onChange={(e) => setNewModel({ ...newModel, system_message: e.target.value })}
                      placeholder="System Message"
                      className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 resize-y min-h-[100px] max-h-[300px] overflow-y-auto"
                      style={{
                        '--tw-ring-color': primary.base
                      } as React.CSSProperties}
                    />
                  </div>
                  <Button
                    onClick={addDefaultModel}
                    disabled={loading || !newModel.name || !newModel.api_key || !newModel.endpoint}
                    variant="primary"
                    size="lg"
                    loading={loading}
                    loadingText="Adding..."
                    className="w-full mt-4 sm:mt-6 group"
                  >
                    <svg
                      className="h-5 w-5 transition-transform group-hover:rotate-90"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Model</span>
                  </Button>
                </div>
              )}

            {/* Edit Tab */}
            {activeTab === 'edit' && selectedEditModel && editModel && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    value={editModel.name}
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
                  {fieldErrors.name && touchedFields.name && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={editModel.api_key}
                    onChange={(e) => handleFieldChange('api_key', e.target.value, true)}
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
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    API Endpoint *
                  </label>
                  <input
                    type="text"
                    value={editModel.endpoint}
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
                  {fieldErrors.endpoint && touchedFields.endpoint && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.endpoint}</p>
                  )}
                </div>
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={editModel.max_tokens}
                    onChange={(e) => handleFieldChange('max_tokens', e.target.value, true)}
                    onBlur={(e) => handleFieldBlur('max_tokens', e.target.value)}
                    placeholder="Max Tokens"
                    className={`border rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 ${
                      fieldErrors.max_tokens && touchedFields.max_tokens 
                        ? 'border-red-300' 
                        : 'border-gray-200'
                    }`}
                    style={{
                      '--tw-ring-color': fieldErrors.max_tokens && touchedFields.max_tokens ? '#ef4444' : primary.base
                    } as React.CSSProperties}
                  />
                  {fieldErrors.max_tokens && touchedFields.max_tokens && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1">{fieldErrors.max_tokens}</p>
                  )}
                </div>
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    User Role
                  </label>
                  <select
                    value={editModel.user_role_to_access}
                    onChange={(e) => {
                      setEditModel({ ...editModel, user_role_to_access: e.target.value })
                      setHasUnsavedChanges(true)
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
                        <div className="mb-3 sm:mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Icon URL (optional)
                          </label>
                          <input
                            type="text"
                            value={editModel.icon || ''}
                            onChange={(e) => handleFieldChange('icon', e.target.value, true)}
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
                        <div className="mb-3 sm:mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Role (optional)
                          </label>
                          <input
                            type="text"
                            value={editModel.role || ''}
                            onChange={(e) => {
                              setEditModel({ ...editModel, role: e.target.value || null })
                              setHasUnsavedChanges(true)
                            }}
                            placeholder="e.g., assistant, analyst, translator"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2"
                            style={{
                              '--tw-ring-color': primary.base
                            } as React.CSSProperties}
                          />
                          <p className="text-xs text-gray-500 mt-1">Specify the AI model's role or specialty</p>
                        </div>
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
                              {(editModel.task && Array.isArray(editModel.task) ? editModel.task : []).map((task: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500">Task {index + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentTasks = Array.isArray(editModel.task) ? editModel.task : [];
                                        const newTasks = currentTasks.filter((_: any, i: number) => i !== index);
                                        setEditModel({ ...editModel, task: newTasks.length > 0 ? newTasks : null });
                                        setHasUnsavedChanges(true);
                                      }}
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
                                    onChange={(e) => {
                                      const currentTasks = Array.isArray(editModel.task) ? [...editModel.task] : [];
                                      currentTasks[index] = { ...currentTasks[index], name: e.target.value };
                                      setEditModel({ ...editModel, task: currentTasks });
                                      setHasUnsavedChanges(true);
                                    }}
                                    placeholder="Task name (e.g., Write Full Article)"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded mb-2 focus:outline-none focus:ring-1"
                                    style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                                  />
                                  <textarea
                                    value={task.system_message || ''}
                                    onChange={(e) => {
                                      const currentTasks = Array.isArray(editModel.task) ? [...editModel.task] : [];
                                      currentTasks[index] = { ...currentTasks[index], system_message: e.target.value };
                                      setEditModel({ ...editModel, task: currentTasks });
                                      setHasUnsavedChanges(true);
                                    }}
                                    placeholder="System message for this task..."
                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded resize-y min-h-[60px] focus:outline-none focus:ring-1"
                                    style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                                  />
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentTasks = Array.isArray(editModel.task) ? editModel.task : [];
                                  const newTasks = [...currentTasks, { name: '', system_message: '' }];
                                  setEditModel({ ...editModel, task: newTasks });
                                  setHasUnsavedChanges(true);
                                }}
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
                                value={editModel.task ? JSON.stringify(editModel.task, null, 2) : ''}
                                onChange={(e) => {
                                  try {
                                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                                    setEditModel({ ...editModel, task: parsed });
                                    setHasUnsavedChanges(true);
                                  } catch {
                                    // Keep the text value even if invalid JSON for user to fix
                                    setEditModel({ ...editModel, task: e.target.value || null });
                                    setHasUnsavedChanges(true);
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
                        <div className="mb-3 sm:mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            System Message
                          </label>
                          <textarea
                            value={editModel.system_message}
                            onChange={(e) => {
                              setEditModel({ ...editModel, system_message: e.target.value })
                              setHasUnsavedChanges(true)
                            }}
                            placeholder="System Message"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 resize-y min-h-[100px] max-h-[300px] overflow-y-auto"
                            style={{
                              '--tw-ring-color': primary.base
                            } as React.CSSProperties}
                          />
                        </div>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                            <Button
                              onClick={() => {
                                setSelectedEditModel(null);
                                setEditModel(null);
                                setActiveTab('models');
                              }}
                              variant="light-outline"
                              size="lg"
                              className="w-full sm:flex-1 group"
                            >
                              <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Cancel</span>
                            </Button>
                            <Button
                              onClick={updateModel}
                              disabled={
                                loading ||
                                !editModel.name ||
                                !editModel.api_key ||
                                !editModel.endpoint
                              }
                              variant="primary"
                              size="lg"
                              loading={loading}
                              loadingText="Saving..."
                              className="w-full sm:flex-1 group"
                            >
                              <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Save Changes</span>
                            </Button>
                          </div>
                        </div>
                      )}

            {/* Models Tab */}
            {activeTab === 'models' && (
              <div>
                {/* Filters */}
                <div className="mb-3 sm:mb-4 flex gap-2 sm:gap-3 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <label htmlFor="filterRole" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="filterRole"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value as 'all' | 'user' | 'admin')}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 bg-white"
                      style={{
                        '--tw-ring-color': primary.base
                      } as React.CSSProperties}
                    >
                      <option value="all">All Roles</option>
                      <option value="user">User Only</option>
                      <option value="admin">Admin Only</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label htmlFor="filterActive" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="filterActive"
                      value={filterActive}
                      onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 bg-white"
                      style={{
                        '--tw-ring-color': primary.base
                      } as React.CSSProperties}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label htmlFor="sortBy" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <div className="flex gap-1.5 sm:gap-2">
                      <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'created' | 'role')}
                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 bg-white"
                        style={{
                          '--tw-ring-color': primary.base
                        } as React.CSSProperties}
                      >
                        <option value="name">Name</option>
                        <option value="role">Role</option>
                        <option value="created">Created</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortOrder === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  {(filterRole !== 'all' || filterActive !== 'all') && (
                    <div className="flex items-end">
                      <Button
                        onClick={() => {
                          setFilterRole('all')
                          setFilterActive('all')
                        }}
                        variant="outline"
                        size="default"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="mb-4 sm:mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Search models..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-9 sm:pl-10 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        '--tw-ring-color': primary.base
                      } as React.CSSProperties}
                    />
                    <svg
                      className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {modelSearch && (
                      <button
                        onClick={() => setModelSearch('')}
                        className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {modelSearch && (
                    <p className="mt-2 text-sm text-gray-500">
                      Found {filteredDefaultModels.length} model{filteredDefaultModels.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 sm:space-y-3">
                      {filteredDefaultModels.length === 0 ? (
                        <li className="py-12 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-gray-500 text-base mb-3">
                            {modelSearch || filterRole !== 'all' || filterActive !== 'all' 
                              ? 'No models match your filters'
                              : 'No models available yet'}
                          </p>
                          {(modelSearch || filterRole !== 'all' || filterActive !== 'all') ? (
                            <Button
                              onClick={() => {
                                setModelSearch('')
                                setFilterRole('all')
                                setFilterActive('all')
                              }}
                              variant="outline"
                              size="default"
                            >
                              Clear all filters
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleTabSwitch('add')}
                              variant="primary"
                              size="default"
                            >
                              Add your first model
                            </Button>
                          )}
                        </li>
                      ) : (
                        filteredDefaultModels.map((model) => (
                          <li
                            key={model.id}
                            className="relative bg-white rounded-2xl group overflow-hidden transition-all duration-300 hover:-translate-y-1"
                            style={{ 
                              border: `2px solid ${primary.lighter}`,
                              boxShadow: `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primary.lighter}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = primary.light;
                              e.currentTarget.style.boxShadow = `0 12px 32px -8px ${primary.base}25, 0 0 0 1px ${primary.light}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = primary.lighter;
                              e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primary.lighter}`;
                            }}
                          >
                            {/* Main Content Row */}
                            <div className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-5">
                              {/* Left: Icon + Name */}
                              <div className="flex items-center gap-3 sm:gap-4 flex-grow min-w-0">
                                {model.icon ? (
                                  <div 
                                    className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.08] shadow-lg"
                                    style={{ 
                                      backgroundColor: primary.lighter,
                                      border: `2px solid ${primary.light}`,
                                    }}
                                  >
                                    <img
                                      className="h-7 w-7 sm:h-10 sm:w-10 object-contain relative z-10"
                                      src={model.icon}
                                      alt={`${model.name} icon`}
                                      onError={(e) => {
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `<svg class="h-7 w-7 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${primary.base}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
                                        }
                                      }}
                                    />
                                    {/* Animated background glow */}
                                    <div 
                                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                      style={{ 
                                        background: `radial-gradient(circle at center, ${primary.base} 0%, transparent 70%)`,
                                        filter: 'blur(12px)',
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.08] shadow-lg"
                                    style={{ 
                                      backgroundColor: primary.lighter,
                                      border: `2px solid ${primary.light}`,
                                    }}
                                  >
                                    <svg className="h-7 w-7 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.base }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <div 
                                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                      style={{ 
                                        background: `radial-gradient(circle at center, ${primary.base} 0%, transparent 70%)`,
                                        filter: 'blur(12px)',
                                      }}
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className={`font-bold text-base sm:text-lg truncate tracking-tight ${
                                      model.user_role_to_access === 'admin' ? 'text-sky-600' : 'text-gray-900'
                                    }`}>
                                      {model.name}
                                    </h3>
                                    {model.user_role_to_access === 'admin' && (
                                      <span 
                                        className="px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shadow-sm border"
                                        style={{ 
                                          backgroundColor: '#dbeafe',
                                          color: '#1e40af',
                                          borderColor: '#93c5fd'
                                        }}
                                      >
                                        Admin
                                      </span>
                                    )}
                                    {model.role && (
                                      <button
                                        onClick={() => openRoleModal(model)}
                                        className="group/rolebadge relative px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shadow-md border-2 transition-all duration-300 hover:scale-105 cursor-pointer"
                                        style={{ 
                                          backgroundColor: '#fef3c7',
                                          color: '#92400e',
                                          borderColor: '#fbbf24'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#fde68a';
                                          e.currentTarget.style.borderColor = '#f59e0b';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#fef3c7';
                                          e.currentTarget.style.borderColor = '#fbbf24';
                                        }}
                                        title="Click to edit role"
                                      >
                                        <span className="flex items-center gap-1">
                                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          {model.role}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                                    {model.is_active ? (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                        Inactive
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Action Buttons */}
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                <Tooltip content="Edit Model">
                                  <button
                                    onClick={() => selectModelForEdit(model)}
                                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 shadow-md border-2"
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
                                    aria-label="Edit model"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </Tooltip>
                                <Tooltip content="Delete Model">
                                  <button
                                    onClick={() => deleteModel(model.id)}
                                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 shadow-md border-2"
                                    style={{ 
                                      backgroundColor: '#fee2e2',
                                      borderColor: '#fca5a5',
                                      color: '#dc2626'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fca5a5';
                                      e.currentTarget.style.color = '#991b1b';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fee2e2';
                                      e.currentTarget.style.color = '#dc2626';
                                    }}
                                    aria-label="Delete model"
                                  >
                                    <TrashIcon className="h-5 w-5" strokeWidth={2.5} />
                                  </button>
                                </Tooltip>
                                <Tooltip content={model.is_active ? 'Deactivate' : 'Activate'}>
                                  <button
                                    onClick={() => toggleModelActive(model.id, !model.is_active)}
                                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md border-2"
                                    style={
                                      model.is_active 
                                        ? { 
                                            backgroundColor: '#dcfce7',
                                            borderColor: '#86efac',
                                            color: '#16a34a'
                                          } 
                                        : { 
                                            backgroundColor: '#f3f4f6',
                                            borderColor: '#d1d5db',
                                            color: '#6b7280'
                                          }
                                    }
                                    onMouseEnter={(e) => {
                                      if (model.is_active) {
                                        e.currentTarget.style.backgroundColor = '#bbf7d0';
                                        e.currentTarget.style.color = '#15803d';
                                      } else {
                                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                                        e.currentTarget.style.color = '#374151';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (model.is_active) {
                                        e.currentTarget.style.backgroundColor = '#dcfce7';
                                        e.currentTarget.style.color = '#16a34a';
                                      } else {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                        e.currentTarget.style.color = '#6b7280';
                                      }
                                    }}
                                    aria-label={model.is_active ? 'Deactivate model' : 'Activate model'}
                                  >
                                    {model.is_active ? (
                                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </button>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Tasks Row */}
                            {(model.task && Array.isArray(model.task) && model.task.length > 0) || true ? (
                              <div 
                                className="px-4 sm:px-5 pb-3 sm:pb-4 pt-3 border-t bg-gray-50/50"
                                style={{ 
                                  borderColor: primary.lighter,
                                }}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold" style={{ color: primary.base }}>
                                    Tasks
                                  </span>
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    {model.task && Array.isArray(model.task) && model.task.length > 0 ? (
                                      <>
                                        {model.task.map((task: any, index: number) => (
                                          <button
                                            key={index}
                                            onClick={() => openTaskModal(model, 'view')}
                                            className="px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md border-2"
                                            style={{ 
                                              backgroundColor: primary.lighter,
                                              color: primary.base,
                                              borderColor: primary.light
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
                                            {task.name}
                                          </button>
                                        ))}
                                        <Tooltip content="Add Task">
                                          <button
                                            onClick={() => openTaskModal(model, 'add')}
                                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:rotate-90 shadow-md border-2"
                                            style={{ 
                                              backgroundColor: primary.base,
                                              borderColor: primary.hover,
                                              color: 'white'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = primary.hover;
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = primary.base;
                                            }}
                                            aria-label="Add task"
                                          >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                          </button>
                                        </Tooltip>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => openTaskModal(model, 'add')}
                                        className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-sm hover:shadow-md border-2"
                                        style={{ 
                                          backgroundColor: primary.lighter,
                                          color: primary.base,
                                          borderColor: primary.light,
                                          borderStyle: 'dashed'
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
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add task
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <InfoCards setOpenDialog={setOpenDialog} />
          <DialogModals openDialog={openDialog} setOpenDialog={setOpenDialog} />
        </div>
      </div>

      {/* Task Modal */}
      {taskModalOpen && selectedModelForTasks && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={closeTaskModal}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden border-2"
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              borderColor: primary.lighter,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="relative px-6 sm:px-8 py-5 sm:py-6 border-b bg-gradient-to-r from-gray-50 to-white"
              style={{ 
                borderColor: primary.lighter,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedModelForTasks.icon ? (
                    <div 
                      className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                      style={{ 
                        backgroundColor: primary.lighter,
                        borderColor: primary.light,
                      }}
                    >
                      <img
                        className="h-8 w-8 sm:h-10 sm:w-10 object-contain relative z-10"
                        src={selectedModelForTasks.icon}
                        alt={`${selectedModelForTasks.name} icon`}
                      />
                    </div>
                  ) : (
                    <div 
                      className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                      style={{ 
                        backgroundColor: primary.lighter,
                        borderColor: primary.light,
                      }}
                    >
                      <svg className="h-8 w-8 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.base }} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedModelForTasks.name}</h2>
                    <p className="text-sm sm:text-base font-bold" style={{ color: primary.base }}>Task Management</p>
                  </div>
                </div>
                <Tooltip content="Close">
                  <button
                    onClick={closeTaskModal}
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
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="p-6 sm:p-8">
                {taskModalMode === 'add' ? (
                  <AddTaskForm 
                    onAdd={addTaskToModel} 
                    onCancel={() => setTaskModalMode('view')}
                    primary={primary}
                  />
                ) : (
                  <div className="space-y-4">
                    {selectedModelForTasks.task && Array.isArray(selectedModelForTasks.task) && selectedModelForTasks.task.length > 0 ? (
                      <>
                        {selectedModelForTasks.task.map((task: any, index: number) => (
                          <div 
                            key={index}
                            className="group relative rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg border-2 bg-white"
                            style={{ 
                              borderColor: primary.lighter,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = primary.light;
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = `0 8px 24px -8px ${primary.base}25`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = primary.lighter;
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span 
                                  className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 text-sm sm:text-base font-bold rounded-xl shadow-md border-2"
                                  style={{ 
                                    backgroundColor: primary.base,
                                    borderColor: primary.hover,
                                    color: 'white'
                                  }}
                                >
                                  {index + 1}
                                </span>
                                <h3 className="font-bold text-base sm:text-lg text-gray-900">{task.name}</h3>
                              </div>
                              <Tooltip content="Remove Task">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Remove task "${task.name}"?`)) {
                                      removeTaskFromModel(selectedModelForTasks.id, index);
                                    }
                                  }}
                                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 hover:rotate-12 shadow-md border-2"
                                  style={{ 
                                    backgroundColor: '#fee2e2',
                                    borderColor: '#fca5a5',
                                    color: '#dc2626'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fca5a5';
                                    e.currentTarget.style.color = '#991b1b';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fee2e2';
                                    e.currentTarget.style.color = '#dc2626';
                                  }}
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </Tooltip>
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed pl-12">{task.system_message}</p>
                          </div>
                        ))}
                        <button
                          onClick={() => setTaskModalMode('add')}
                          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-sm hover:shadow-md border-2"
                          style={{ 
                            backgroundColor: primary.lighter,
                            color: primary.base,
                            borderColor: primary.light,
                            borderStyle: 'dashed'
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
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add New Task
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-16 sm:py-20">
                        <div 
                          className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg border-2"
                          style={{ 
                            backgroundColor: primary.lighter,
                            borderColor: primary.light,
                          }}
                        >
                          <svg className="h-12 w-12 sm:h-14 sm:w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.base }} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No tasks yet</h3>
                        <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-md mx-auto">Add your first task to configure this AI model's capabilities</p>
                        <button
                          onClick={() => setTaskModalMode('add')}
                          className="px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 shadow-lg border-2"
                          style={{ 
                            backgroundColor: primary.base,
                            borderColor: primary.hover,
                            color: 'white'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = primary.hover;
                            e.currentTarget.style.boxShadow = `0 20px 40px -12px ${primary.base}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = primary.base;
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          Add First Task
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Edit Modal */}
      {roleModalOpen && selectedModelForRole && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={closeRoleModal}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden border-2"
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              borderColor: '#fbbf24',
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="relative px-6 sm:px-8 py-5 sm:py-6 border-b"
              style={{ 
                borderColor: '#fde68a',
                background: 'linear-gradient(to right, #fef3c7, white)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                    style={{ 
                      backgroundColor: '#fef3c7',
                      borderColor: '#fbbf24',
                    }}
                  >
                    <svg className="h-8 w-8 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#92400e' }} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedModelForRole.name}</h2>
                    <p className="text-sm sm:text-base font-bold" style={{ color: '#92400e' }}>Edit Role & System Message</p>
                  </div>
                </div>
                <Tooltip content="Close">
                  <button
                    onClick={closeRoleModal}
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
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Select Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {predefinedRoles.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => setEditRoleData({ ...editRoleData, role: role.value })}
                        className="text-left p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          backgroundColor: editRoleData.role === role.value ? '#fef3c7' : 'white',
                          borderColor: editRoleData.role === role.value ? '#fbbf24' : '#e5e7eb',
                          boxShadow: editRoleData.role === role.value ? '0 4px 12px rgba(251, 191, 36, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div className="font-bold text-sm" style={{ color: editRoleData.role === role.value ? '#92400e' : '#374151' }}>
                          {role.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {role.description}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => setEditRoleData({ ...editRoleData, role: 'custom' })}
                      className="text-left p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        backgroundColor: editRoleData.role === 'custom' ? '#fef3c7' : 'white',
                        borderColor: editRoleData.role === 'custom' ? '#fbbf24' : '#e5e7eb',
                        borderStyle: editRoleData.role === 'custom' ? 'solid' : 'dashed',
                        boxShadow: editRoleData.role === 'custom' ? '0 4px 12px rgba(251, 191, 36, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: editRoleData.role === 'custom' ? '#92400e' : '#6b7280' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-bold text-sm" style={{ color: editRoleData.role === 'custom' ? '#92400e' : '#374151' }}>
                          Custom Role
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Define your own role
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom Role Input */}
                {editRoleData.role === 'custom' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Custom Role Name *
                    </label>
                    <input
                      type="text"
                      value={editRoleData.customRole}
                      onChange={(e) => setEditRoleData({ ...editRoleData, customRole: e.target.value })}
                      placeholder="e.g., Content Moderator, SEO Expert"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: '#fbbf24',
                        backgroundColor: '#fef3c7',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#f59e0b';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#fbbf24';
                      }}
                    />
                  </div>
                )}

                {/* System Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    System Message *
                  </label>
                  <textarea
                    value={editRoleData.system_message}
                    onChange={(e) => setEditRoleData({ ...editRoleData, system_message: e.target.value })}
                    placeholder="Define the AI's behavior and personality..."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all resize-y min-h-[160px]"
                    style={{
                      borderColor: '#fbbf24',
                      backgroundColor: 'white',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f59e0b';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#fbbf24';
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This message defines how the AI agent will behave and respond to users
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              className="px-6 sm:px-8 py-4 sm:py-5 border-t flex gap-3"
              style={{ 
                borderColor: '#fde68a',
                backgroundColor: '#fefce8'
              }}
            >
              <button
                onClick={closeRoleModal}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.02] border-2"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: '#d1d5db',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveRoleChanges}
                disabled={loading || (editRoleData.role === 'custom' && !editRoleData.customRole.trim())}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.02] shadow-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#fbbf24',
                  borderColor: '#f59e0b',
                  color: '#92400e'
                }}
                onMouseEnter={(e) => {
                  if (!loading && !(editRoleData.role === 'custom' && !editRoleData.customRole.trim())) {
                    e.currentTarget.style.backgroundColor = '#f59e0b';
                    e.currentTarget.style.color = '#78350f';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fbbf24';
                  e.currentTarget.style.color = '#92400e';
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Task Form Component
function AddTaskForm({ onAdd, onCancel, primary }: { 
  onAdd: (name: string, message: string) => void; 
  onCancel: () => void;
  primary: any;
}) {
  const [taskName, setTaskName] = useState('');
  const [systemMessage, setSystemMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() && systemMessage.trim()) {
      onAdd(taskName.trim(), systemMessage.trim());
      setTaskName('');
      setSystemMessage('');
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2.5">
          Task Name *
        </label>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g., Write Full Article"
          className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 text-base"
          style={{ 
            border: `1.5px solid ${primary.light}40`,
            '--tw-ring-color': primary.base,
            background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
          } as React.CSSProperties}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2.5">
          System Message *
        </label>
        <textarea
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          placeholder="Describe what this task should do..."
          className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 resize-y min-h-[140px] text-base"
          style={{ 
            border: `1.5px solid ${primary.light}40`,
            '--tw-ring-color': primary.base,
            background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
          } as React.CSSProperties}
          required
        />
      </div>
      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] shadow-sm"
          style={{ 
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            color: '#4b5563'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${primary.base} 0%, ${primary.hover} 100%)`,
            color: 'white'
          }}
        >
          Add Task
        </button>
      </div>
    </form>
  );
}
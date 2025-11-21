import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import { AIAgent } from './types';
import { supabase } from '@/lib/supabaseClient';

interface AIAgentsSelectProps {
  value: AIAgent[];
  onChange: (agents: AIAgent[]) => void;
  organizationId?: string;
  session?: any;
}

interface AIAgentFormData {
  name: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  system_message: string;
  user_role_to_access: string;
  is_active: boolean;
  icon: string;
  role: string;
  task: any; // JSONB field - can be string, object, array, etc.
}

const defaultFormData: AIAgentFormData = {
  name: '',
  api_key: '',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  max_tokens: 1000,
  system_message: 'You are a helpful assistant.',
  user_role_to_access: 'user',
  is_active: true,
  icon: '🤖',
  role: 'assistant',
  task: ''
};

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

const roleOptions = [
  { value: 'assistant', label: 'Assistant' },
  { value: 'flashcard', label: 'Flashcard' },
];

// Helper component to render icon (emoji or image)
const AgentIcon = ({ icon }: { icon?: string | null }) => {
  if (!icon) {
    return <div className="text-2xl">🤖</div>;
  }

  // Check if icon is a URL (starts with http/https)
  if (icon.startsWith('http://') || icon.startsWith('https://')) {
    return (
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
        <img
          src={icon}
          alt="AI Agent"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to emoji if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.fallback-emoji') as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <div className="text-lg fallback-emoji" style={{ display: 'none' }}>🤖</div>
      </div>
    );
  }

  // Treat as emoji
  return <div className="text-2xl">{icon}</div>;
};

export function AIAgentsSelect({ value = [], onChange, organizationId, session }: AIAgentsSelectProps) {
  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];
  const [agents, setAgents] = useState<AIAgent[]>(safeValue);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIAgentFormData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelQuery, setModelQuery] = useState('');
  const [endpointQuery, setEndpointQuery] = useState('');

  // Debug logging (temporary)
  // console.log('AIAgentsSelect render:', { 
  //   value, 
  //   safeValue, 
  //   valueType: typeof value, 
  //   isArray: Array.isArray(value),
  //   organizationId, 
  //   hasSession: !!session 
  // });
  
  // Only set initial value if agents is empty and safeValue has data
  useEffect(() => {
    if (agents.length === 0 && safeValue.length > 0) {
      // console.log('DEBUG: Setting initial value:', safeValue);
      setAgents(safeValue);
    }
  }, []);

  // Memoized onChange to prevent infinite loops
  const memoizedOnChange = useCallback((newAgents: AIAgent[]) => {
    onChange(newAgents);
  }, [onChange]);

  // Set auth token when session changes
  useEffect(() => {
    if (session?.access_token) {
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token || ''
      });
    }
  }, [session?.access_token]);

  // Fetch AI agents when component mounts
  useEffect(() => {
    const fetchAIAgents = async () => {
      // console.log('AIAgentsSelect: fetchAIAgents called with:', { organizationId, hasSession: !!session?.access_token });
      
      if (!organizationId || !session?.access_token) {
        // console.log('AIAgentsSelect: Missing required data', { organizationId, hasSession: !!session?.access_token });
        return;
      }

      try {
        setLoading(true);
        // console.log('AIAgentsSelect: Starting fetch from ai_models_default...');
        
        const { data, error } = await supabase
          .from('ai_models_default')
          .select('id, organization_id, name, api_key, endpoint, max_tokens, system_message, user_role_to_access, is_active, icon, role, task')
          .eq('organization_id', organizationId);

        // console.log('AIAgentsSelect: Query result:', { data, error });

        if (error) {
          console.error('Error fetching AI agents:', error);
          setError(error.message);
          return;
        }

        const agents = data || [];
        // console.log('DEBUG: Fetched agents:', agents.map(a => ({ name: a.name, is_active: a.is_active, role: a.role, task: a.task })));
        setAgents(agents);
        // Remove onChange call from here to prevent infinite loops
        // onChange(agents);
      } catch (error) {
        console.error('Error fetching AI agents:', error);
        setError('Failed to fetch AI agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAIAgents();
  }, [organizationId, session?.access_token]);

  // Handle add AI agent from header button
  const handleAdd = useCallback(() => {
    setEditForm(defaultFormData);
    setError(null);
    setEditingIndex(null);
    setIsEditing(true);
    setModelQuery('');
    setEndpointQuery('');
  }, []);

  // Listen for custom add AI agent event
  useEffect(() => {
    const handleAddAIAgentEvent = () => {
      handleAdd();
    };
    
    window.addEventListener('addAIAgent', handleAddAIAgentEvent);
    
    return () => {
      window.removeEventListener('addAIAgent', handleAddAIAgentEvent);
    };
  }, [handleAdd]);

  const refreshAIAgents = async () => {
    if (!organizationId || !session?.access_token) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_models_default')
        .select('id, organization_id, name, api_key, endpoint, max_tokens, system_message, user_role_to_access, is_active, icon, role, task')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const fetchedAgents = data || [];
      setAgents(fetchedAgents);
      // Don't call onChange during refresh, only during user actions
    } catch (err) {
      console.error('Error fetching AI agents:', err);
      setError('Failed to fetch AI agents');
    } finally {
      setLoading(false);
    }
  };

    const handleEdit = (index: number) => {
    const agent = agents[index];
    setEditForm({
      name: agent.name,
      api_key: agent.api_key,
      endpoint: agent.endpoint,
      max_tokens: agent.max_tokens,
      system_message: agent.system_message,
      user_role_to_access: agent.user_role_to_access,
      is_active: agent.is_active,
      icon: agent.icon || '🤖',
      role: agent.role || 'assistant',
      task: typeof agent.task === 'object' && agent.task !== null 
        ? JSON.stringify(agent.task, null, 2) 
        : (agent.task || '')
    });
    setEditingIndex(index);
    setIsEditing(true);
    setModelQuery(agent.name || '');
    setEndpointQuery(agent.endpoint || '');
  };

  const handleSave = async () => {
    if (!editForm.name || !organizationId || !session?.access_token) return;

    try {
      setLoading(true);
      setError(null);

      // Parse task JSON if it's a string
      let taskData;
      try {
        taskData = editForm.task && editForm.task.trim() 
          ? JSON.parse(editForm.task) 
          : null;
      } catch (e) {
        // If JSON parsing fails, store as string
        taskData = editForm.task || null;
      }

      const agentData: AIAgentFormData = {
        name: editForm.name!,
        api_key: editForm.api_key || '',
        endpoint: editForm.endpoint || defaultFormData.endpoint,
        max_tokens: editForm.max_tokens || defaultFormData.max_tokens,
        system_message: editForm.system_message || defaultFormData.system_message,
        user_role_to_access: editForm.user_role_to_access || defaultFormData.user_role_to_access,
        is_active: editForm.is_active !== undefined ? editForm.is_active : defaultFormData.is_active,
        icon: editForm.icon || defaultFormData.icon,
        role: editForm.role || defaultFormData.role,
        task: taskData
      };

      let newAgents: AIAgent[];

      if (editingIndex !== null) {
        // Editing existing agent
        const agentId = agents[editingIndex].id;
        if (!agentId) return;

        const { data, error } = await supabase
          .from('ai_models_default')
          .update(agentData)
          .eq('id', agentId)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;

        newAgents = [...agents];
        newAgents[editingIndex] = data;
      } else {
        // Adding new agent
        const { data, error } = await supabase
          .from('ai_models_default')
          .insert([{
            organization_id: organizationId,
            ...agentData
          }])
          .select()
          .single();

        if (error) throw error;

        newAgents = [...agents, data];
      }

      setAgents(newAgents);
      memoizedOnChange(newAgents);
      setIsEditing(false);
      setEditForm({});
      setEditingIndex(null);
    } catch (err) {
      console.error('Error saving AI agent:', err);
      setError('Failed to save AI agent');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditingIndex(null);
    setError(null);
    setModelQuery('');
    setEndpointQuery('');
  };

  const handleToggleActive = async (index: number) => {
    const agent = agents[index];
    if (!agent.id || !organizationId || !session?.access_token) return;

    try {
      const updatedAgent = { ...agent, is_active: !agent.is_active };
      
      const { error } = await supabase
        .from('ai_models_default')
        .update({ is_active: updatedAgent.is_active })
        .eq('id', agent.id)
        .eq('organization_id', organizationId);

      if (error) throw error;

      const newAgents = [...agents];
      newAgents[index] = updatedAgent;
      setAgents(newAgents);
      memoizedOnChange(newAgents);
    } catch (err) {
      console.error('Error toggling agent status:', err);
      setError('Failed to update agent status');
    }
  };

  const handleDelete = async (index: number) => {
    const agent = agents[index];
    if (!agent.id || !organizationId || !session?.access_token) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('ai_models_default')
        .delete()
        .eq('id', agent.id)
        .eq('organization_id', organizationId);

      if (error) throw error;

      const newAgents = agents.filter((_, i) => i !== index);
      setAgents(newAgents);
      memoizedOnChange(newAgents);
    } catch (err) {
      console.error('Error deleting AI agent:', err);
      setError('Failed to delete AI agent');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof AIAgentFormData, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {loading && agents.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Loading AI agents...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Add Form - Shows when adding new agent (appears under subsection header) */}
      {isEditing && editingIndex === null && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-sky-900 mb-3">
            Add AI Agent
          </h4>
          
          <AIAgentEditForm
            editForm={editForm}
            handleFormChange={handleFormChange}
            handleSave={handleSave}
            handleCancel={handleCancel}
            loading={loading}
            isNew={true}
            modelQuery={modelQuery}
            setModelQuery={setModelQuery}
            endpointQuery={endpointQuery}
            setEndpointQuery={setEndpointQuery}
          />
        </div>
      )}

      {/* AI Agents List */}
      {agents.length > 0 && (
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <AIAgentItem
              key={agent.id || `agent-${index}`}
              agent={agent}
              index={index}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              isEditing={isEditing}
              editingIndex={editingIndex}
              editForm={editForm}
              setEditForm={setEditForm}
              handleSave={handleSave}
              handleCancel={handleCancel}
              handleFormChange={handleFormChange}
              loading={loading}
              modelQuery={modelQuery}
              setModelQuery={setModelQuery}
              endpointQuery={endpointQuery}
              setEndpointQuery={setEndpointQuery}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && agents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm">No AI agents configured yet</p>
          <p className="text-xs text-gray-400 mt-1">Use "Add AI Agent" in the section header to get started</p>
        </div>
      )}
    </div>
  );
}

// AI Agent Item Component
interface AIAgentItemProps {
  agent: AIAgent;
  index: number;
  onEdit: (index: number) => void;
  onToggleActive: (index: number) => void;
  onDelete: (index: number) => void;
  isEditing: boolean;
  editingIndex: number | null;
  editForm: Partial<AIAgentFormData>;
  setEditForm: (form: Partial<AIAgentFormData>) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleFormChange: (field: keyof AIAgentFormData, value: any) => void;
  loading: boolean;
  modelQuery: string;
  setModelQuery: (query: string) => void;
  endpointQuery: string;
  setEndpointQuery: (query: string) => void;
}

const AIAgentItem: React.FC<AIAgentItemProps> = ({
  agent,
  index,
  onEdit,
  onToggleActive,
  onDelete,
  isEditing,
  editingIndex,
  editForm,
  handleSave,
  handleCancel,
  handleFormChange,
  loading,
  modelQuery,
  setModelQuery,
  endpointQuery,
  setEndpointQuery
}) => {
  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete "${String(agent.name || 'this agent')}"?`)) {
      onDelete(index);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Main Agent Item */}
      <div className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors rounded-t-xl">
        <div className="flex items-center gap-3 flex-1">
          <AgentIcon icon={agent.icon} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {String(agent.name || 'Unnamed Agent')}
              </span>
              {!agent.is_active && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                  Inactive
                </span>
              )}
              <span className="text-xs text-gray-500">
                {String(agent.role || 'assistant')} • {String(agent.task || 'general')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleActive(index)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              agent.is_active 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={agent.is_active ? 'Deactivate agent' : 'Activate agent'}
          >
            {agent.is_active ? '✓' : '○'}
          </button>
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit agent"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Form - Positioned right under the agent item */}
      {isEditing && editingIndex === index && (
        <div className="border-t border-gray-200/60 bg-sky-50 p-4">
          <h4 className="text-sm font-medium text-sky-900 mb-3">
            Edit AI Agent
          </h4>
          
          <AIAgentEditForm
            editForm={editForm}
            handleFormChange={handleFormChange}
            handleSave={handleSave}
            handleCancel={handleCancel}
            handleDeleteClick={handleDeleteClick}
            loading={loading}
            isNew={false}
            modelQuery={modelQuery}
            setModelQuery={setModelQuery}
            endpointQuery={endpointQuery}
            setEndpointQuery={setEndpointQuery}
          />
        </div>
      )}
    </div>
  );
};

// AI Agent Edit Form Component
interface AIAgentEditFormProps {
  editForm: Partial<AIAgentFormData>;
  handleFormChange: (field: keyof AIAgentFormData, value: any) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleDeleteClick?: () => void;
  loading: boolean;
  isNew: boolean;
  modelQuery: string;
  setModelQuery: (query: string) => void;
  endpointQuery: string;
  setEndpointQuery: (query: string) => void;
}

const AIAgentEditForm: React.FC<AIAgentEditFormProps> = ({
  editForm,
  handleFormChange,
  handleSave,
  handleCancel,
  handleDeleteClick,
  loading,
  isNew,
  modelQuery,
  setModelQuery,
  endpointQuery,
  setEndpointQuery
}) => {
  const roleOptions = [
    { value: 'assistant', label: 'Assistant' },
    { value: 'flashcard', label: 'Flashcard' }
  ];

  const popularEndpoints = [
    'https://api.openai.com/v1/chat/completions',
    'https://api.anthropic.com/v1/messages',
    'https://api.cohere.ai/v1/generate',
    'https://api.ai21.com/studio/v1/chat/completions'
  ];

  const filteredModels = modelQuery
    ? popularModels.filter((model) => model.toLowerCase().includes(modelQuery.toLowerCase()))
    : popularModels;
  const filteredEndpoints = endpointQuery
    ? popularEndpoints.filter((endpoint) => endpoint.toLowerCase().includes(endpointQuery.toLowerCase()))
    : popularEndpoints;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Model Name *
        </label>
        <div className="relative">
          <Combobox
            value={editForm.name || ''}
            onChange={(value: string) => {
              handleFormChange('name', value);
              setModelQuery(value);
            }}
          >
            <Combobox.Input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              onChange={(e) => {
                setModelQuery(e.target.value);
                handleFormChange('name', e.target.value);
              }}
              placeholder="e.g., gpt-4o, claude-3.5-sonnet"
              displayValue={(value: string) => value}
              autoComplete="off"
              type="text"
              spellCheck={false}
            />
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
              {filteredModels.length === 0 && modelQuery !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No models found. Enter a custom model name.
                </div>
              ) : (
                filteredModels.map((model) => (
                  <Combobox.Option
                    key={model}
                    value={model}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {model}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox>
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          API Key *
        </label>
        <input
          type="password"
          value={String(editForm.api_key || '')}
          onChange={(e) => handleFormChange('api_key', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="sk-..."
          autoComplete="new-password"
          spellCheck={false}
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          value={String(editForm.role || 'assistant')}
          onChange={(e) => handleFormChange('role', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        >
          {roleOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Task <span className="text-xs text-gray-500">(JSON format)</span>
        </label>
        <textarea
          value={String(editForm.task || '')}
          onChange={(e) => handleFormChange('task', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder='{"type": "support", "priority": "high"}'
          rows={2}
          spellCheck={false}
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty or enter valid JSON. Examples: {'"general"'}, {'{}'}, {'{"category": "support"}'}</p>
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          API Endpoint
        </label>
        <div className="relative">
          <Combobox
            value={editForm.endpoint || defaultFormData.endpoint}
            onChange={(value: string) => {
              handleFormChange('endpoint', value);
              setEndpointQuery(value);
            }}
          >
            <Combobox.Input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              onChange={(e) => {
                setEndpointQuery(e.target.value);
                handleFormChange('endpoint', e.target.value);
              }}
              placeholder="API Endpoint (e.g., https://api.openai.com/v1/chat/completions)"
              displayValue={(value: string) => value}
              autoComplete="off"
              type="url"
              spellCheck={false}
            />
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
              {filteredEndpoints.length === 0 && endpointQuery !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No endpoints found. Enter a custom endpoint.
                </div>
              ) : (
                filteredEndpoints.map((endpoint) => (
                  <Combobox.Option
                    key={endpoint}
                    value={endpoint}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {endpoint}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox>
        </div>
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          System Message
        </label>
        <textarea
          value={String(editForm.system_message || defaultFormData.system_message)}
          onChange={(e) => handleFormChange('system_message', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="You are a helpful assistant."
        />
      </div>
      
      <div>
        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={editForm.is_active !== undefined ? editForm.is_active : defaultFormData.is_active}
            onChange={(e) => handleFormChange('is_active', e.target.checked)}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <span className="text-xs font-medium text-gray-700">Active</span>
        </label>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4 md:col-span-2">
        {/* Delete button - only show when editing existing agent */}
        <div>
          {!isNew && handleDeleteClick && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 flex items-center gap-2"
              title="Delete this agent"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
        
        {/* Save/Cancel buttons */}
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
            disabled={!editForm.name || loading}
            className="px-3 py-2 text-xs font-medium text-white bg-sky-600 border border-transparent rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNew ? 'Add' : 'Update'} Agent
          </button>
        </div>
      </div>
    </div>
  );
};

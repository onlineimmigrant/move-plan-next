'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Combobox, Disclosure, Transition } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';
import InfoCards from '@/components/ai/InfoCards';
import DialogModals from '@/components/ai/DialogModals';

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
}

export default function AIManagement() {
  const [defaultModels, setDefaultModels] = useState<DefaultModel[]>([]);
  const [selectedEditModel, setSelectedEditModel] = useState<DefaultModel | null>(null);
  const [newModel, setNewModel] = useState({
    name: '',
    api_key: '',
    endpoint: '',
    max_tokens: 200,
    user_role_to_access: 'user',
    system_message: 'You are a helpful assistant for [Your Site’s Purpose].',
    icon: '',
  });
  const [editModel, setEditModel] = useState<DefaultModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelQuery, setModelQuery] = useState('');
  const [endpointQuery, setEndpointQuery] = useState('');
  const [openDialog, setOpenDialog] = useState<string | null>(null);

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
        .select('id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon')
        .eq('organization_id', profile.organization_id);
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
        })
        .select('id, name, api_key, endpoint, max_tokens, user_role_to_access, is_active, system_message, icon')
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
          system_message: 'You are a helpful assistant for [Your Site’s Purpose].',
          icon: '',
        });
        setModelQuery('');
        setEndpointQuery('');
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
    } catch (error: any) {
      setError(error.message || 'Failed to update model.');
      console.error('Update model error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteModel = async (id: number) => {
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
      }
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
  };

  const filteredModels = modelQuery
    ? popularModels.filter((model) => model.toLowerCase().includes(modelQuery.toLowerCase()))
    : popularModels;
  const filteredEndpoints = endpointQuery
    ? popularEndpoints.filter((endpoint) => endpoint.toLowerCase().includes(endpointQuery.toLowerCase()))
    : popularEndpoints;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 mx-auto p-4 rounded-lg min-h-screen gap-8">
      <div className="sm:col-span-3">
        <div className="mt-8 flex flex-col items-center">
          <Tooltip content="AI Management">
            <h1 className="mt-0 sm:mt-2 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
              AI Management
              <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
            </h1>
          </Tooltip>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <Disclosure>
          {({ open }: { open: boolean }) => (
            <div>
              <Disclosure.Button className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors shadow-sm mb-2">
                <span>Add</span>
                <span className="ml-2 text-sky-500 font-bold">{open ? '−' : '+'}</span>
              </Disclosure.Button>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Disclosure.Panel className="border border-gray-200 rounded-xl bg-white p-4">
                  <div className="relative">
                    <Combobox
                      value={newModel.name}
                      onChange={(value: string) => {
                        setNewModel({ ...newModel, name: value });
                        setModelQuery(value);
                      }}
                    >
                      <Combobox.Input
                        className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                        onChange={(e) => {
                          setModelQuery(e.target.value);
                          setNewModel({ ...newModel, name: e.target.value });
                        }}
                        placeholder="Model Name (e.g., grok-3)"
                        displayValue={(value: string) => value}
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
                  <input
                    type="password"
                    value={newModel.api_key}
                    onChange={(e) => setNewModel({ ...newModel, api_key: e.target.value })}
                    placeholder="API Key"
                    className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                    autoComplete="new-password"
                  />
                  <div className="relative">
                    <Combobox
                      value={newModel.endpoint}
                      onChange={(value: string) => {
                        setNewModel({ ...newModel, endpoint: value });
                        setEndpointQuery(value);
                      }}
                    >
                      <Combobox.Input
                        className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                        onChange={(e) => {
                          setEndpointQuery(e.target.value);
                          setNewModel({ ...newModel, endpoint: e.target.value });
                        }}
                        placeholder="API Endpoint (e.g., https://api.x.ai/v1/chat/completions)"
                        displayValue={(value: string) => value}
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
                  <input
                    type="number"
                    value={newModel.max_tokens}
                    onChange={(e) => setNewModel({ ...newModel, max_tokens: parseInt(e.target.value) || 200 })}
                    placeholder="Max Tokens (default: 200)"
                    className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                    autoComplete="off"
                  />
                  <select
                    value={newModel.user_role_to_access}
                    onChange={(e) => setNewModel({ ...newModel, user_role_to_access: e.target.value })}
                    className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input
                    type="text"
                    value={newModel.icon}
                    onChange={(e) => setNewModel({ ...newModel, icon: e.target.value })}
                    placeholder="Icon URL (optional)"
                    className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                  />
                  <textarea
                    value={newModel.system_message}
                    onChange={(e) => setNewModel({ ...newModel, system_message: e.target.value })}
                    placeholder="System Message"
                    className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2 resize-y min-h-[100px] max-h-[300px] overflow-y-auto"
                  />
                  <Tooltip content="Add Model">
                    <button
                      onClick={addDefaultModel}
                      disabled={loading || !newModel.name || !newModel.api_key || !newModel.endpoint}
                      className="bg-teal-500 text-white p-2 rounded-full disabled:bg-gray-200 hover:bg-teal-600 transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </Tooltip>
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>

        {selectedEditModel && (
          <div className="my-8">
            <Disclosure defaultOpen>
              {({ open }: { open: boolean }) => (
                <div>
                  <Disclosure.Button className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors shadow-sm mb-2">
                    <span>Edit: {selectedEditModel.name}</span>
                    <span className="ml-2 text-sky-500 font-bold">{open ? '−' : '+'}</span>
                  </Disclosure.Button>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Disclosure.Panel className="border border-gray-200 rounded-xl bg-white p-4">
                      {editModel && (
                        <>
                          <input
                            type="text"
                            value={editModel.name}
                            onChange={(e) => setEditModel({ ...editModel, name: e.target.value })}
                            placeholder="Model Name"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                          />
                          <input
                            type="password"
                            value={editModel.api_key}
                            onChange={(e) => setEditModel({ ...editModel, api_key: e.target.value })}
                            placeholder="API Key"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                            autoComplete="new-password"
                          />
                          <input
                            type="text"
                            value={editModel.endpoint}
                            onChange={(e) => setEditModel({ ...editModel, endpoint: e.target.value })}
                            placeholder="API Endpoint"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                          />
                          <input
                            type="number"
                            value={editModel.max_tokens}
                            onChange={(e) => setEditModel({ ...editModel, max_tokens: parseInt(e.target.value) || 200 })}
                            placeholder="Max Tokens"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                          />
                          <select
                            value={editModel.user_role_to_access}
                            onChange={(e) => setEditModel({ ...editModel, user_role_to_access: e.target.value })}
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <input
                            type="text"
                            value={editModel.icon || ''}
                            onChange={(e) => setEditModel({ ...editModel, icon: e.target.value })}
                            placeholder="Icon URL (optional)"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                          />
                          <textarea
                            value={editModel.system_message}
                            onChange={(e) => setEditModel({ ...editModel, system_message: e.target.value })}
                            placeholder="System Message"
                            className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2 resize-y min-h-[100px] max-h-[300px] overflow-y-auto"
                          />
                          <div className="flex justify-between space-x-2">
                            <Tooltip content="Cancel">
                              <button
                                onClick={() => {
                                  setSelectedEditModel(null);
                                  setEditModel(null);
                                }}
                                className="cursor-pointer bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </Tooltip>
                            <Tooltip content="Save Changes">
                              <button
                                onClick={updateModel}
                                disabled={
                                  loading ||
                                  !editModel.name ||
                                  !editModel.api_key ||
                                  !editModel.endpoint
                                }
                                className="cursor-pointer bg-teal-500 text-white p-2 rounded-full disabled:bg-gray-200 hover:bg-teal-600 transition-colors"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </Tooltip>
                          </div>
                        </>
                      )}
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </div>
        )}

        <div className="my-8">
          <Disclosure defaultOpen>
            {({ open }: { open: boolean }) => (
              <div>
                <Disclosure.Button className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors shadow-sm mb-2">
                  <span>Models</span>
                  <span className="ml-2 text-sky-500 font-bold">{open ? '−' : '+'}</span>
                </Disclosure.Button>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Disclosure.Panel className="border border-gray-200 rounded-xl py-4 px-4">
                    <ul className="bg-white rounded-md shadow-lg ring-1 ring-gray-200 p-2">
                      {defaultModels.length === 0 ? (
                        <li className="py-2 px-4 text-gray-700">No default models available.</li>
                      ) : (
                        defaultModels.map((model) => (
                          <li
                            key={model.id}
                            className="bg-gray-50 my-1 flex items-center justify-between py-2 px-4 hover:bg-sky-100 hover:text-sky-900 cursor-pointer rounded group"
                          >
                            <span className={model.user_role_to_access === 'admin' ? 'flex-grow text-sky-500 text-xs sm:text-sm font-medium' : 'flex-grow text-xs sm:text-sm font-medium'}>
                              {model.name} <p className='font-thin text-gray-700 italic'>{model.user_role_to_access === 'admin' ? 'admin access' : ''}</p>
                            </span>
                            <div className="flex items-center space-x-2">
                              <Tooltip content="Edit Model">
                                <button
                                  onClick={() => selectModelForEdit(model)}
                                  className="cursor-pointer p-2 rounded-full bg-gray-100 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                                  aria-label="Edit model"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                              </Tooltip>
                              <Tooltip content="Delete Model">
                                <button
                                  onClick={() => deleteModel(model.id)}
                                  className="cursor-pointer p-2 rounded-full bg-gray-300 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                  aria-label="Delete model"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </Tooltip>
                              <Tooltip content={model.is_active ? 'Deactivate' : 'Activate'}>
                                <button
                                  onClick={() => toggleModelActive(model.id, !model.is_active)}
                                  className={`cursor-pointer p-2 rounded-full ${
                                    model.is_active
                                      ? 'bg-gray-300 text-white hover:bg-gray-400'
                                      : 'bg-teal-100 text-white hover:bg-teal-600'
                                  } transition-colors`}
                                >
                                  {model.is_active ? (
                                    <svg
                                      className="h-5 w-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-5 w-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </Tooltip>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        </div>
      </div>

      <div className="sm:col-span-1">
        <InfoCards setOpenDialog={setOpenDialog} />
        <DialogModals openDialog={openDialog} setOpenDialog={setOpenDialog} />
      </div>
    </div>
  );
}
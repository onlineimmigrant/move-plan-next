'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Combobox, Disclosure, Transition } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';
import Link from 'next/link';
import InfoCards from '@/components/ai/InfoCards';
import DialogModals from '@/components/ai/DialogModals';
import ChatWidget from '@/components/ChatWidget';
import Image from 'next/image';
import DisclosureButton from '@/ui/DisclosureButton';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';

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

interface Model {
  id: number;
  name: string;
  user_role_to_access?: string;
  max_tokens?: number;
  icon?: string | null;
  src?: string | undefined;
}

interface SelectedModel {
  id: number;
  type: 'default' | 'user';
}

export default function AISettings() {
  const { t } = useAccountTranslations();
  const [defaultModels, setDefaultModels] = useState<Model[]>([]);
  const [userModels, setUserModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(null);
  const [newModel, setNewModel] = useState({
    name: '',
    api_key: '',
    endpoint: '',
    max_tokens: 200,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelQuery, setModelQuery] = useState('');
  const [endpointQuery, setEndpointQuery] = useState('');
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Please log in to access AI settings.');
        console.error('Auth error:', authError?.message);
        setLoading(false);
        return;
      }

      console.log('User ID:', user.id);

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

      // Fetch default models
      const { data: defaults, error: defaultsError } = await supabase
        .from('ai_models_default')
        .select('id, name, user_role_to_access, max_tokens, icon')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);
      if (defaultsError) {
        setError('Failed to load default models.');
        console.error('Defaults error:', defaultsError.message);
      } else {
        setDefaultModels(defaults || []);
      }

      // Fetch user models
      const { data: userModels, error: userModelsError } = await supabase
        .from('ai_models')
        .select('id, name, max_tokens')
        .eq('user_id', user.id);
      if (userModelsError) {
        setError('Failed to load user models.');
        console.error('User models error:', userModelsError.message);
      } else {
        setUserModels(userModels || []);
      }

      // Fetch selected model
      const { data: settings, error: settingsError } = await supabase
        .from('ai_user_settings')
        .select('default_model_id, user_model_id, selected_model_type')
        .eq('user_id', user.id)
        .single();
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Settings error:', settingsError.message);
        setError('Failed to load settings.');
      } else if (settings) {
        if (settings.selected_model_type === 'user' && settings.user_model_id) {
          setSelectedModel({ id: settings.user_model_id, type: 'user' });
        } else if (settings.selected_model_type === 'default' && settings.default_model_id) {
          setSelectedModel({ id: settings.default_model_id, type: 'default' });
        } else {
          setSelectedModel(null);
        }
      } else {
        await supabase.from('ai_user_settings').insert({
          user_id: user.id,
          default_model_id: null,
          user_model_id: null,
          selected_model_type: null,
          organization_id: profile.organization_id,
        });
        setSelectedModel(null);
      }
      console.log('Selected model initialized:', selectedModel);
      setLoading(false);
    };
    fetchData();
  }, []);

  const addUserModel = async () => {
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
      await supabase
        .from('ai_models')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          name: newModel.name,
          api_key: newModel.api_key,
          endpoint: newModel.endpoint,
          max_tokens: newModel.max_tokens,
          system_message: 'You are a helpful assistant for [Your Site’s Purpose].',
          is_active: true,
        })
        .select('id, name, max_tokens')
        .single();

      if (error) {
        throw new Error('Failed to add model: ' + error.message);
      }

      if (data) {
        setUserModels([...userModels, { id: data.id, name: data.name, max_tokens: data.max_tokens }]);
        const { error: upsertError } = await supabase
          .from('ai_user_settings')
          .upsert(
            {
              user_id: user.id,
              user_model_id: data.id,
              default_model_id: null,
              selected_model_type: 'user',
              organization_id: profile.organization_id,
            },
            { onConflict: 'user_id' }
          );
        if (upsertError) {
          throw new Error('Failed to update settings: ' + upsertError.message);
        }
        setSelectedModel({ id: data.id, type: 'user' });
        // Dispatch modelChanged event
        window.dispatchEvent(
          new CustomEvent('modelChanged', {
            detail: {
              type: 'user',
              id: data.id,
              name: data.name,
              max_tokens: data.max_tokens,
              icon: null, // User models have no icon
            },
          })
        );
        console.log('Dispatched modelChanged event:', { id: data.id, type: 'user', name: data.name });
        setNewModel({ name: '', api_key: '', endpoint: '', max_tokens: 200 });
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

  const selectModel = async (id: number, type: 'default' | 'user') => {
    setLoading(true);
    setError(null);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError('Please log in to select a model.');
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

    try {
      const updateData = {
        user_id: user.id,
        default_model_id: type === 'default' ? id : null,
        user_model_id: type === 'user' ? id : null,
        selected_model_type: type,
        organization_id: profile.organization_id,
      };
      const { error: upsertError } = await supabase
        .from('ai_user_settings')
        .upsert(updateData, { onConflict: 'user_id' });
      if (upsertError) {
        throw new Error('Failed to update selected model: ' + upsertError.message);
      }

      // Fetch model details for event
      let modelDetails: { name: string; max_tokens?: number; icon?: string | null } = {
        name: 'grok-3-latest',
        max_tokens: 4096,
        icon: null,
      };
      if (type === 'default') {
        const { data: defaultModel } = await supabase
          .from('ai_models_default')
          .select('name, max_tokens, icon')
          .eq('id', id)
          .single();
        if (defaultModel) {
          modelDetails = defaultModel;
        }
      } else {
        const { data: userModel } = await supabase
          .from('ai_models')
          .select('name, max_tokens')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        if (userModel) {
          modelDetails = { ...userModel, icon: null };
        }
      }

      setSelectedModel({ id, type });
      // Dispatch modelChanged event
      window.dispatchEvent(
        new CustomEvent('modelChanged', {
          detail: {
            type,
            id,
            name: modelDetails.name,
            max_tokens: modelDetails.max_tokens || 4096,
            icon: modelDetails.icon,
          },
        })
      );
      console.log('Dispatched modelChanged event:', { id, type, name: modelDetails.name });
    } catch (error: any) {
      setError(error.message || 'Failed to select model.');
      console.error('Select model error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUserModel = async (modelId: number) => {
    setLoading(true);
    setError(null);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError('Please log in to delete a model.');
      console.error('Auth error:', authError?.message);
      setLoading(false);
      return;
    }

    console.log('Deleting model ID:', modelId, 'for user:', user.id);

    try {
      const { error: deleteError } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', modelId)
        .eq('user_id', user.id);
      if (deleteError) {
        throw new Error('Failed to delete model: ' + deleteError.message);
      }

      setUserModels(userModels.filter((model) => model.id !== modelId));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      if (selectedModel?.id === modelId && selectedModel.type === 'user') {
        const { data: remainingUserModel } = await supabase
          .from('ai_models')
          .select('id, name, max_tokens')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        if (remainingUserModel) {
          const { error: upsertError } = await supabase
            .from('ai_user_settings')
            .upsert(
              {
                user_id: user.id,
                user_model_id: remainingUserModel.id,
                default_model_id: null,
                selected_model_type: 'user',
                organization_id: profile.organization_id,
              },
              { onConflict: 'user_id' }
            );
          if (upsertError) {
            throw new Error('Failed to update settings: ' + upsertError.message);
          }
          setSelectedModel({ id: remainingUserModel.id, type: 'user' });
          window.dispatchEvent(
            new CustomEvent('modelChanged', {
              detail: {
                type: 'user',
                id: remainingUserModel.id,
                name: remainingUserModel.name,
                max_tokens: remainingUserModel.max_tokens || 4096,
                icon: null,
              },
            })
          );
          console.log('Dispatched modelChanged event:', { id: remainingUserModel.id, type: 'user' });
        } else {
          const { data: defaultModel } = await supabase
            .from('ai_models_default')
            .select('id, name, max_tokens, icon')
            .eq('organization_id', profile.organization_id)
            .eq('is_active', true)
            .limit(1)
            .single();
          if (defaultModel) {
            const { error: upsertError } = await supabase
              .from('ai_user_settings')
              .upsert(
                {
                  user_id: user.id,
                  user_model_id: null,
                  default_model_id: defaultModel.id,
                  selected_model_type: 'default',
                  organization_id: profile.organization_id,
                },
                { onConflict: 'user_id' }
              );
            if (upsertError) {
              throw new Error('Failed to update settings: ' + upsertError.message);
            }
            setSelectedModel({ id: defaultModel.id, type: 'default' });
            window.dispatchEvent(
              new CustomEvent('modelChanged', {
                detail: {
                  type: 'default',
                  id: defaultModel.id,
                  name: defaultModel.name,
                  max_tokens: defaultModel.max_tokens || 4096,
                  icon: defaultModel.icon,
                },
              })
            );
            console.log('Dispatched modelChanged event:', { id: defaultModel.id, type: 'default' });
          } else {
            const { error: upsertError } = await supabase
              .from('ai_user_settings')
              .upsert(
                {
                  user_id: user.id,
                  user_model_id: null,
                  default_model_id: null,
                  selected_model_type: null,
                  organization_id: profile.organization_id,
                },
                { onConflict: 'user_id' }
              );
            if (upsertError) {
              throw new Error('Failed to update settings: ' + upsertError.message);
            }
            setSelectedModel(null);
            window.dispatchEvent(
              new CustomEvent('modelChanged', {
                detail: {
                  type: null,
                  id: null,
                  name: 'grok-3-latest',
                  max_tokens: 4096,
                  icon: null,
                },
              })
            );
            console.log('Dispatched modelChanged event: No models available');
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete model.');
      console.error('Delete error:', error.message);
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

  return (
    <div className="grid sm:grid-cols-5 mx-auto p-4 rounded-lg min-h-screen gap-4">
      <div className="flex justify-center sm:justify-start">
        <Tooltip content={t.account}>
          <Link href="/account">
            <button className="cursor-pointer  text-sky-600 p-2 rounded-full hover:bg-gray-100 transition-colors mt-16">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          </Link>
        </Tooltip>
        <ChatWidget />
      </div>
      <div className="sm:col-span-3">
        <div className="mt-8 flex flex-col items-center">
          <Tooltip content={t.aiTitle} variant='bottom'>
            <h1 className="mt-0 sm:mt-2 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
              {t.ai}
              <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
            </h1>
          </Tooltip>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <Disclosure>
          {({ open }: { open: boolean }) => (
            <div>
              <DisclosureButton>
                            <span>{t.addCustomModel}</span>
                <span className="ml-2 text-sky-300 font-bold">{open ? '−' : '+'}</span>
              </DisclosureButton>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Disclosure.Panel className="mt-2 border border-gray-200 rounded-xl bg-white p-4">
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
                        placeholder={t.modelName + " (e.g., grok-3)"}
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
                    placeholder={t.apiKey}
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
                        placeholder={t.apiEndpoint + " (e.g., https://api.x.ai/v1/chat/completions)"}
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
                    placeholder={t.maxTokens + " (default: 200)"}
                    className="border border-gray-200 rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-2"
                    autoComplete="off"
                  />
                  <Tooltip content={t.addModel}>
                    <button
                      onClick={addUserModel}
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

        <div className="my-8">
          <Disclosure defaultOpen>
            {({ open }: { open: boolean }) => (
              <div>
                <DisclosureButton>     <span>{t.availableModels}</span>
                  <span className="ml-2 text-sky-300 font-bold">{open ? '−' : '+'}</span>
                </DisclosureButton>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Disclosure.Panel className="mt-2 border border-gray-200 rounded-xl py-4 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-800 mb-1">{t.defaultModels}</h3>
                        <ul className="bg-white rounded-md shadow-lg ring-1 ring-gray-200 p-2">
                          {defaultModels.length === 0 ? (
                            <li className="py-2 px-4 text-gray-700">{t.noDefaultModels}</li>
                          ) : (
                            defaultModels.map((model) => (
                              <li
                                key={model.id}
                                className="space-x-4 bg-gray-50 my-1 flex items-center justify-between py-2 px-4 hover:bg-sky-100 hover:text-sky-900 cursor-pointer rounded group"
                                onClick={() => selectModel(model.id, 'default')}
                              >
                                {model.icon && (
                            <img
                                className="h-4 w-4 mr-4"
                                src={model.icon}
                                alt={`${model.name} icon`}
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            )}
                                <span className="flex-grow text-xs sm:text-sm">
                                  {model.name} <span className='sm:ml-4 text-xs font-thin'>{model.user_role_to_access === "admin" ? 'admin' : ''}</span>
                                </span>
                                <Tooltip
                                  content={selectedModel?.id === model.id && selectedModel.type === 'default' ? t.selectedModel : t.selectThisModel}
                                >
                                  <button
                                    className={`p-2 rounded-full ${
                                      selectedModel?.id === model.id && selectedModel.type === 'default'
                                        ? 'bg-sky-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    } transition-colors`}
                                  >
                                    {selectedModel?.id === model.id && selectedModel.type === 'default' ? (
                                      <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path strokeLinecap="round"
                                        strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    )}
                                  </button>
                                </Tooltip>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-800 mb-1">{t.customModels}</h3>
                        <ul className="bg-white rounded-md shadow-lg ring-1 ring-gray-200 p-2">
                          {userModels.length === 0 ? (
                            <li className="py-2 px-4 text-gray-700">{t.noUserModels}</li>
                          ) : (
                            userModels.map((model) => (
                              <li
                                key={model.id}
                                className="bg-gray-50 my-1 flex items-center justify-between py-2 px-4 hover:bg-sky-100 hover:text-sky-900 cursor-pointer rounded group"
                              >
                                <span className="flex-grow text-xs sm:text-sm">{model.name}</span>
                                <div className="flex items-center space-x-2">
                                  <Tooltip content={t.removeModel}>
                                    <button
                                      onClick={() => deleteUserModel(model.id)}
                                      className="p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                      aria-label="Remove model"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </button>
                                  </Tooltip>
                                  <Tooltip
                                    content={selectedModel?.id === model.id && selectedModel.type === 'user' ? t.selectedModel : t.selectThisModel}
                                  >
                                    <button
                                      onClick={() => selectModel(model.id, 'user')}
                                      className={`p-2 rounded-full ${
                                        selectedModel?.id === model.id && selectedModel.type === 'user'
                                          ? 'bg-sky-500 text-white'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      } transition-colors`}
                                    >
                                      {selectedModel?.id === model.id && selectedModel.type === 'user' ? (
                                        <svg
                                          className="h-5 w-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg
                                          className="h-5 w-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      )}
                                    </button>
                                  </Tooltip>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        </div>
      </div>

      <InfoCards setOpenDialog={setOpenDialog} />
      <DialogModals openDialog={openDialog} setOpenDialog={setOpenDialog} />
    </div>
  );
}
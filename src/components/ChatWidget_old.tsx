'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { RocketLaunchIcon, XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, MagnifyingGlassIcon, BookmarkIcon, ArrowUpIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Combobox, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  role: string;
  content: string;
}

interface ChatHistory {
  id: number;
  name: string;
  messages: Message[];
}

interface Model {
  id: number;
  name: string;
  api_key?: string;
  endpoint?: string;
  max_tokens?: number;
  system_message?: string;
  icon?: string | null;
  type: 'default' | 'user';
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [size, setSize] = useState<'default' | 'half' | 'full'>('default');
  const [historyName, setHistoryName] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [query, setQuery] = useState('');
  const [modelName, setModelName] = useState('Grok 3');
  const [fullModelName, setFullModelName] = useState('grok-3-latest');
  const [maxTokens, setMaxTokens] = useState(4096);
  const [modelIcon, setModelIcon] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Listen for addToChat event
  useEffect(() => {
    const handleAddToChat = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        console.log('ChatWidget: Received addToChat event with text:', event.detail);
        setInput((prev) => (prev ? `${prev}\n${event.detail}` : event.detail));
        setIsOpen(true);
      }
    };

    window.addEventListener('addToChat', handleAddToChat);
    return () => window.removeEventListener('addToChat', handleAddToChat);
  }, []);

  // Listen for modelChanged event
  useEffect(() => {
    const handleModelChanged = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        console.log('ChatWidget: Received modelChanged event:', event.detail);
        const { name, max_tokens, icon, id, type } = event.detail;
        setFullModelName(name);
        setModelName(name.split('-').slice(0, -1).join(' '));
        setMaxTokens(max_tokens || 4096);
        setModelIcon(icon);
        setSelectedModel(models.find((m) => m.id === id && m.type === type) || null);
        setError(null);
      }
    };

    window.addEventListener('modelChanged', handleModelChanged);
    return () => window.removeEventListener('modelChanged', handleModelChanged);
  }, [models]);

  // Fetch chat histories and models
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !accessToken) return;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError?.message);
        setError('Please log in to use the chat.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message);
        setError('Profile not found. Please contact support.');
        return;
      }

      // Fetch chat histories
      const { data: histories, error: historiesError } = await supabase
        .from('ai_chat_histories')
        .select('id, name, messages')
        .eq('user_id', profile.id);

      if (historiesError) {
        console.error('Fetch histories error:', historiesError.message);
        setError('Failed to load chat histories');
      } else {
        setChatHistories(histories || []);
      }

      // Fetch default models
      const { data: defaultModels, error: defaultModelsError } = await supabase
        .from('ai_models_default')
        .select('id, name, max_tokens, icon')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (defaultModelsError) {
        console.error('Default models fetch error:', defaultModelsError.message);
        setError('Failed to load default models.');
      }

      // Fetch user models without user_id filter
      const { data: userModels, error: userModelsError } = await supabase
        .from('ai_models')
        .select('id, name, max_tokens, icon, user_id');

      if (userModelsError) {
        console.error('User models fetch error:', userModelsError.message);
        setError('Failed to load user models.');
      }

      // Combine and sort models
      const combinedModels: Model[] = [
        ...(defaultModels || []).map((m) => ({ ...m, type: 'default' as const })),
        ...(userModels || []).map((m) => ({ ...m, type: 'user' as const, icon: m.icon || null })),
      ];
      setModels(combinedModels);

      // Fetch and set initial selected model
      let name = 'grok-3-latest';
      let maxTokensValue = 4096;
      let icon: string | null = null;
      let selectedModelId: number | null = null;
      let selectedModelType: 'default' | 'user' | null = null;

      const { data: settingsData, error: settingsError } = await supabase
        .from('ai_user_settings')
        .select('default_model_id, user_model_id, selected_model_type')
        .eq('user_id', user.id)
        .single();

      if (settingsError || !settingsData) {
        console.error('Settings fetch error:', settingsError?.message);
        setError('User settings not found. Using default model.');
      } else {
        const settings = settingsData;
        if (settings.selected_model_type === 'default' && settings.default_model_id) {
          const { data: defaultModel, error: defaultError } = await supabase
            .from('ai_models_default')
            .select('id, name, max_tokens, icon')
            .eq('id', settings.default_model_id)
            .single();

          if (!defaultError && defaultModel?.name) {
            name = defaultModel.name;
            maxTokensValue = defaultModel.max_tokens || maxTokensValue;
            icon = defaultModel.icon;
            selectedModelId = defaultModel.id;
            selectedModelType = 'default';
          } else {
            console.error('Default model fetch error:', defaultError?.message);
            setError('Default model not found. Using fallback model.');
          }
        } else if (settings.selected_model_type === 'user' && settings.user_model_id) {
          const { data: userModel, error: userModelError } = await supabase
            .from('ai_models')
            .select('id, name, max_tokens, icon')
            .eq('id', settings.user_model_id)
            .single();

          if (!userModelError && userModel?.name) {
            name = userModel.name;
            maxTokensValue = userModel.max_tokens || maxTokensValue;
            icon = userModel.icon || null;
            selectedModelId = userModel.id;
            selectedModelType = 'user';
          } else {
            console.error('User model fetch error:', userModelError?.message);
            setError('User model not found. Switching to default model.');
            // Update settings to fallback to default
            const { data: defaultModel, error: defaultModelError } = await supabase
              .from('ai_models_default')
              .select('id, name, max_tokens, icon')
              .eq('organization_id', profile.organization_id)
              .eq('is_active', true)
              .eq('user_role_to_access', 'user')
              .limit(1);

            if (!defaultModelError && defaultModel?.length) {
              name = defaultModel[0].name;
              maxTokensValue = defaultModel[0].max_tokens || maxTokensValue;
              icon = defaultModel[0].icon;
              selectedModelId = defaultModel[0].id;
              selectedModelType = 'default';
              // Update ai_user_settings
              const { error: updateSettingsError } = await supabase
                .from('ai_user_settings')
                .update({
                  default_model_id: defaultModel[0].id,
                  user_model_id: null,
                  selected_model_type: 'default',
                })
                .eq('user_id', user.id);
              if (updateSettingsError) {
                console.error('Update settings error:', updateSettingsError.message);
              }
            } else {
              console.error('Default model fetch error:', defaultModelError?.message);
              setError('No valid default model available. Please contact an admin.');
            }
          }
        } else {
          console.error('Invalid settings: No valid model ID found');
          setError('No valid model selected. Please configure in settings.');
        }
      }

      setFullModelName(name);
      setModelName(name.split('-').slice(0, -1).join(' '));
      setMaxTokens(maxTokensValue);
      setModelIcon(icon);
      setSelectedModel(
        combinedModels.find((m) => m.id === selectedModelId && m.type === selectedModelType) || null
      );
    };
    fetchData();
  }, [isAuthenticated, accessToken]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        setIsAuthenticated(false);
        setAccessToken(null);
        console.error('Client auth error:', error?.message || 'No session found');
      } else {
        setIsAuthenticated(true);
        setAccessToken(session.access_token);
        console.log('Client access token:', session.access_token);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAccessToken(session?.access_token || null);
      console.log('Auth state changed, access token:', session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!isAuthenticated || !accessToken) {
      setError('Please log in to use the chat.');
      return;
    }
    setError(null);
    const newMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(
        '/api/chat',
        { messages: [...messages, newMessage] },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.message }]);
      setIsTyping(false);
    } catch (error: any) {
      console.error('Chat widget error:', error.message, error.response?.data);
      const errorMsg = error.response?.data?.error || 'Failed to send message';
      if (errorMsg.includes('Model not found')) {
        setError('Selected model is unavailable. Switching to default model.');
      } else if (errorMsg.includes('No default model available')) {
        setError('No AI model available. Please contact your administrator or set up a model.');
      } else if (error.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else {
        setError(errorMsg);
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }]);
      setIsTyping(false);
    }
  };

  const saveChatHistory = async () => {
    if (messages.length === 0) {
      setError('No messages to save.');
      return;
    }
    if (!isAuthenticated || !accessToken) {
      setError('Please log in to save chat history.');
      return;
    }
    setError(null);

    if (!historyName.trim()) {
      setShowSaveInput(false);
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message);
        setError('Profile not found. Please contact support.');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('ai_chat_histories')
        .insert({
          user_id: profile.id,
          name: historyName,
          messages,
        });
      if (error) {
        console.error('Save history error:', error.message);
        setError('Failed to save chat history: ' + error.message);
      } else {
        const { data: newHistories } = await supabase
          .from('ai_chat_histories')
          .select('id, name, messages')
          .eq('user_id', profile.id);
        setChatHistories(newHistories || []);
        setHistoryName('');
        setShowSaveInput(false);
        setError(null);
        alert('Chat history saved successfully!');
      }
    } catch (error: any) {
      console.error('Save history error:', error.message);
      setError('Failed to save chat history');
    } finally {
      setIsSaving(false);
    }
  };

  const loadChatHistory = (history: ChatHistory | null) => {
    if (history) {
      setMessages(history.messages);
      setQuery('');
      setShowSearchInput(false);
      setError(null);
    }
  };

  const toggleSearchInput = () => {
    setShowSearchInput((prev) => !prev);
    setShowSaveInput(false);
    setQuery('');
  };

  const toggleSaveInput = () => {
    setShowSaveInput((prev) => !prev);
    setShowSearchInput(false);
    setHistoryName('');
  };

  const selectModel = async (model: Model | null) => {
    if (!model || !isAuthenticated || !accessToken) return;
    setError(null);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError('Please log in to select a model.');
      console.error('Auth error:', authError?.message);
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
      return;
    }

    try {
      // Validate model
      const { data: modelData, error: modelError } = await supabase
        .from(model.type === 'default' ? 'ai_models_default' : 'ai_models')
        .select('id')
        .eq('id', model.id)
        .single();

      if (modelError || !modelData) {
        throw new Error('Selected model not found.');
      }

      const updateData = {
        user_id: user.id,
        default_model_id: model.type === 'default' ? model.id : null,
        user_model_id: model.type === 'user' ? model.id : null,
        selected_model_type: model.type,
        organization_id: profile.organization_id,
      };
      const { error: upsertError } = await supabase
        .from('ai_user_settings')
        .upsert(updateData, { onConflict: 'user_id' });
      if (upsertError) {
        throw new Error('Failed to update selected model: ' + upsertError.message);
      }

      setSelectedModel(model);
      setFullModelName(model.name);
      setModelName(model.name.split('-').slice(0, -1).join(' '));
      setMaxTokens(model.max_tokens || 4096);
      setModelIcon(model.icon || null);

      // Dispatch modelChanged event
      window.dispatchEvent(
        new CustomEvent('modelChanged', {
          detail: {
            type: model.type,
            id: model.id,
            name: model.name,
            max_tokens: model.max_tokens || 4096,
            icon: model.icon,
          },
        })
      );
      console.log('Dispatched modelChanged event:', { id: model.id, type: model.type, name: model.name });
    } catch (error: any) {
      setError(error.message || 'Failed to select model.');
      console.error('Select model error:', error.message);
    }
  };

  const goToSettings = () => {
    router.push('/account/ai');
  };

  const goToAdmin = () => {
    router.push('/admin/ai/management');
  };

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'default') return 'half';
      if (prev === 'half') return 'full';
      return 'default';
    });
  };

  const sizeClasses = {
    default: 'w-100 max-h-[70vh]',
    half: 'w-1/2 max-h-[80vh]',
    full: 'w-[80vw] max-h-[80vh]',
  };

  const filteredHistories = query
    ? chatHistories.filter((history) =>
        history.name.toLowerCase().includes(query.toLowerCase())
      )
    : chatHistories;

  // Sort models to put selected model at the top
  const sortedModels = selectedModel
    ? [
        selectedModel,
        ...models.filter((m) => m.id !== selectedModel.id || m.type !== selectedModel.type),
      ]
    : models;

  return (
    <div className="z-62">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer fixed bottom-4 right-4 bg-sky-500 text-white p-4 rounded-full shadow-lg z-61 hover:bg-sky-600 transition-colors"
      >
        <RocketLaunchIcon className="h-6 w-6" />
      </button>
      {isOpen && (
        <div
          className={`z-51 fixed min-h-[480px] bottom-24 right-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm flex flex-col transition-all duration-300 ${sizeClasses[size]}`}
        >
          <div className="flex justify-between items-center mb-2 bg-gray-50 px-4 shadow rounded-t-lg">
            <Tooltip variant='left'
              content={
                size === 'default'
                  ? 'Expand'
                  : size === 'half'
                  ? 'Expand Full'
                  : 'Shrink'
              }
            >
              <button
                onClick={toggleSize}
                className="cursor-pointer text-sky-500 hover:text-sky-700 p-1"
              >
                {size === 'full' ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
            </Tooltip>
            <div className="flex items-center space-x-2">
              <Listbox value={selectedModel} onChange={selectModel}>
                {({ open }) => (
                  <div>
                    <Tooltip content="Select Model">
                      <ListboxButton className="cursor-pointer border-2 border-gray-50 rounded-full p-2 relative">
                        {modelIcon ? (
                          <img
                            src={modelIcon}
                            alt="Model Icon"
                            className="h-8 w-8 object-contain"
                            onError={() => setModelIcon(null)}
                          />
                        ) : (
                          <RocketLaunchIcon className="h-6 w-6 text-gray-400 font-bold" />
                        )}
                      </ListboxButton>
                    </Tooltip>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="opacity-0 scale-95"
                      enterTo="opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="opacity-100 scale-100"
                      leaveTo="opacity-0 scale-95"
                    >
                      <ListboxOptions className="absolute z-10 right-0 mt-1 w-48 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
                        {sortedModels.length === 0 ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No models available
                          </div>
                        ) : (
                          sortedModels.map((model) => (
                            <ListboxOption
                              key={`${model.type}-${model.id}`}
                              value={model}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 px-4 ${
                                  active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                                }`
                              }
                            >
                              <div className="flex items-center">
                                <span className="flex-grow">{model.name}</span>
                                {selectedModel?.id === model.id && selectedModel?.type === model.type && (
                                  <CheckIcon className="h-5 w-5 text-sky-500" />
                                )}
                              </div>
                              <p className="text-xs font-thin text-gray-600 capitalize">{model.type}</p>
                            </ListboxOption>
                          ))
                        )}
                        <hr className='text-gray-200' />
                        <div className="p-2">
                          <button
                            onClick={goToSettings}
                            className="cursor-pointer pl-2 w-full text-left text-sm text-sky-500 hover:underline"
                          >
                            Manage Models
                          </button>
                        </div>
                      </ListboxOptions>
                    </Transition>
                  </div>
                )}
              </Listbox>
            </div>
            <Tooltip content="Close">
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer text-sky-500 hover:text-sky-700 p-1"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          {error && (
            <div className="text-red-500 mb-2 px-4">
              {error}
              {error.includes('No AI model selected') && (
                <button
                  onClick={goToSettings}
                  className="ml-2 text-sky-500 underline"
                >
                  Go to Settings
                </button>
              )}
              {error.includes('No default model available') && (
                <button
                  onClick={goToAdmin}
                  className="ml-2 text-sky-500 underline"
                >
                  Go to Admin
                </button>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <div className="text-red-500 mb-2 px-4">Please log in to use the chat.</div>
          )}
          <div className="flex-1 overflow-y-auto mb-4 p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`inline-block p-4 rounded ${
                    msg.role === 'user' ? 'bg-sky-100' : 'bg-gray-50'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.role === 'assistant' ? msg.content : msg.content.replace(/\n/g, '<br>'),
                  }}
                />
              </div>
            ))}
            {isTyping && (
              <div className="text-left mb-2">
                <span className="inline-block p-2 rounded bg-gray-100">
                  <span className="typing-dots">Typing<span>.</span><span>.</span><span>.</span></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex flex-col px-4 pb-4">
            <div className="border border-gray-200 rounded-xl bg-gray-50 p-2">
              <div className="flex items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  className="rounded p-2 flex-grow resize-none focus:outline-none bg-gray-50"
                  placeholder="Ask..."
                  disabled={!isAuthenticated || isTyping}
                  rows={1}
                />
                <Tooltip content="Send">
                  <button
                    onClick={sendMessage}
                    className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full ml-2 disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                    disabled={!isAuthenticated || isTyping || !input.trim()}
                  >
                    <ArrowUpIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
              </div>
              <div className="flex justify-start space-x-2 mt-2">
                <Tooltip content="Search History">
                  <button
                    onClick={toggleSearchInput}
                    className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                    disabled={!isAuthenticated}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
                <Tooltip content="Save History">
                  <button
                    onClick={toggleSaveInput}
                    className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-gray-200 transition-colors"
                    disabled={!isAuthenticated}
                  >
                    <BookmarkIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
            {showSearchInput && (
              <div className="mt-2 relative">
                <Combobox value={null} onChange={loadChatHistory}>
                  <Combobox.Input
                    className="cursor-pointer rounded p-2 w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search history"
                    value={query}
                  />
                  <Combobox.Options className="absolute bottom-full mb-1 max-h-60 w-[calc(100%-2rem)] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none">
                    {filteredHistories.length === 0 && query !== '' ? (
                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                        No chat histories found.
                      </div>
                    ) : (
                      filteredHistories.map((history) => (
                        <Combobox.Option
                          key={history.id}
                          value={history}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 px-4 ${
                              active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                            }`
                          }
                        >
                          {history.name}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Combobox>
              </div>
            )}
            {showSaveInput && (
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={historyName}
                  onChange={(e) => setHistoryName(e.target.value)}
                  className="rounded p-2 flex-grow bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Name your chat history"
                  disabled={!isAuthenticated || isSaving}
                />
                <Tooltip content="Save or Close">
                  <button
                    onClick={saveChatHistory}
                    className="bg-teal-500 text-white p-2 rounded-full disabled:bg-gray-200 hover:bg-teal-600 transition-colors"
                    disabled={!isAuthenticated || isSaving}
                  >
                    {isSaving ? (
                      <span className="text-sm">...</span>
                    ) : (
                      <BookmarkIcon className="h-5 w-5" />
                    )}
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .typing-dots span {
          animation: blink 1s infinite;
        }
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
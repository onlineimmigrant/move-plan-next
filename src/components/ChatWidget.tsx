'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ChatToggleButton from './ChatWidget/ChatToggleButton';
import ChatHeader from './ChatWidget/ChatHeader';
import ChatMessages from './ChatWidget/ChatMessages';
import ChatInput from './ChatWidget/ChatInput';
import { Message, ChatHistory, Model, WidgetSize, Task, Role, UserSettings } from './ChatWidget/types';
import styles from './ChatWidget/ChatWidget.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CHAT_WIDGET_OPEN_KEY = 'chatWidget_isOpen'; // Store open/closed state

interface ChatWidgetProps {
  onReturnToHelpCenter?: () => void;
  initialSize?: WidgetSize;
  initialOpen?: boolean;
}

export default function ChatWidget({ 
  onReturnToHelpCenter, 
  initialSize = 'initial', 
  initialOpen = false 
}: ChatWidgetProps = {}) {
  // Check localStorage for saved open state, fallback to initialOpen
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(CHAT_WIDGET_OPEN_KEY);
      return savedState !== null ? JSON.parse(savedState) : initialOpen;
    }
    return initialOpen;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // Add userId state
  const [isTyping, setIsTyping] = useState(false);
  const [size, setSize] = useState<WidgetSize>(initialSize);
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
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [userRole, setUserRole] = useState<Role>('user');
  const [defaultSettings, setDefaultSettings] = useState<Record<string, any>>({});
  const [selectedSettings, setSelectedSettings] = useState<Record<string, any> | null>(null);
  const router = useRouter();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 640;
      setIsMobile(mobile);
      setSize(mobile ? 'half' : 'initial');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save open state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CHAT_WIDGET_OPEN_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

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
        setSelectedTask(null);
        setSelectedSettings(null);
        setError(null);
      }
    };

    window.addEventListener('modelChanged', handleModelChanged);
    return () => window.removeEventListener('modelChanged', handleModelChanged);
  }, [models]);

  // Fetch chat histories, models, user role, default settings, and userId
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !accessToken) return;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError?.message);
        setError('Please log in to use the chat.');
        return;
      }
      setUserId(user.id); // Set userId

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id, role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message);
        setError('Profile not found. Please contact support.');
        return;
      }

      setUserRole(profile.role as Role);

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
        .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task, organization_id')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (defaultModelsError) {
        console.error('Default models fetch error:', defaultModelsError.message);
        setError('Failed to load default models.');
      }

      // Fetch user models
      const { data: userModels, error: userModelsError } = await supabase
        .from('ai_models')
        .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
        .eq('user_id', user.id);

      if (userModelsError) {
        console.error('User models fetch error:', userModelsError.message);
        setError('Failed to load user models.');
      }

      // Combine and sort models
      const combinedModels: Model[] = [
        ...(defaultModels || []).map((m) => ({ ...m, type: 'default' as const })),
        ...(userModels || []).map((m) => ({ ...m, type: 'user' as const })),
      ];
      setModels(combinedModels);

      // Fetch user settings
      let name = 'grok-3-latest';
      let maxTokensValue = 4096;
      let icon: string | null = null;
      let selectedModelId: number | null = null;
      let selectedModelType: 'default' | 'user' | null = null;

      const { data: settingsData, error: settingsError } = await supabase
        .from('ai_user_settings')
        .select('default_model_id, user_model_id, selected_model_type, default_settings')
        .eq('user_id', user.id)
        .single();

      if (settingsError || !settingsData) {
        console.error('Settings fetch error:', settingsError?.message);
        setError('User settings not found. Using default model.');
      } else {
        const settings = settingsData;
        setDefaultSettings(settings.default_settings || {});
        if (settings.selected_model_type === 'default' && settings.default_model_id) {
          const { data: defaultModel, error: defaultError } = await supabase
            .from('ai_models_default')
            .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task, organization_id')
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
            .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
            .eq('id', settings.user_model_id)
            .eq('user_id', user.id)
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
            const { data: defaultModel, error: defaultModelError } = await supabase
              .from('ai_models_default')
              .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task, organization_id')
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
        setUserId(null);
        console.error('Client auth error:', error?.message || 'No session found');
      } else {
        setIsAuthenticated(true);
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        console.log('Client access token:', session.access_token);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAccessToken(session?.access_token || null);
      setUserId(session?.user?.id || null);
      console.log('Auth state changed, access token:', session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);


const sendMessage = async () => {
  if (!input.trim()) return;
  if (!isAuthenticated || !accessToken) {
    setError('Please log in to use the chat.');
    return;
  }
  setError(null);
  const newMessage: Message = { role: 'user', content: input }; // Explicitly type as Message
  setMessages((prev) => [...prev, newMessage]);
  setInput('');
  setIsTyping(true);

  try {
    let systemMessage = selectedModel?.system_message || '';
    if (selectedTask) {
      systemMessage += systemMessage ? `\nTask: ${selectedTask.system_message}` : `Task: ${selectedTask.system_message}`;
    }
    if (selectedSettings) {
      const settingsText = Object.entries(selectedSettings)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');
      systemMessage += systemMessage ? `\n${settingsText}` : settingsText;
    }

    const messagesToSend: Message[] = systemMessage
      ? [{ role: 'system', content: systemMessage }, ...messages, newMessage]
      : [...messages, newMessage];

    const response = await axios.post(
      '/api/chat',
      {
        messages: messagesToSend,
        useSettings: !!selectedSettings,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: response.data.message, taskName: selectedTask?.name },
    ]);
    setIsTyping(false);
    setSelectedTask(null);
    setSelectedSettings(null);
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
    setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg, taskName: selectedTask?.name }]);
    setIsTyping(false);
    setSelectedTask(null);
    setSelectedSettings(null);
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
      setSelectedTask(null);
      setSelectedSettings(null);
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
    setSelectedTask(null);
    setSelectedSettings(null);

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
      const { data: modelData, error: modelError } = await supabase
        .from(model.type === 'default' ? 'ai_models_default' : 'ai_models')
        .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task, organization_id')
        .eq('id', model.id)
        .eq(model.type === 'user' ? 'user_id' : 'organization_id', model.type === 'user' ? user.id : profile.organization_id)
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
      if (isMobile) {
        return prev === 'half' ? 'fullscreen' : 'half';
      }
      return prev === 'initial' ? 'half' : prev === 'half' ? 'fullscreen' : 'initial';
    });
  };

  const sizeClasses = {
    initial: 'w-[400px] h-[750px] bottom-8 right-4',
    half: isMobile ? styles.mobileHalfContainer : 'w-1/2 h-[750px] bottom-8 right-4',
    fullscreen: styles.fullscreenContainer,
  };

  const handleTasksUpdated = (updatedTasks: Task[]) => {
    if (selectedModel) {
      setSelectedModel({ ...selectedModel, task: updatedTasks });
      setModels((prev) =>
        prev.map((m) =>
          m.id === selectedModel.id && m.type === selectedModel.type
            ? { ...m, task: updatedTasks }
            : m
        )
      );
    }
  };

  const handleSettingsUpdated = (updatedSettings: Record<string, any>) => {
    setDefaultSettings(updatedSettings);
    setSelectedSettings(updatedSettings);
  };

  const tasks: Task[] = selectedModel?.task || [];

  return (
    <div className="z-62">
      <ChatToggleButton isOpen={isOpen} toggleOpen={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div
          className={`z-63 fixed bg-white border-2 border-gray-200 rounded-lg shadow-sm flex flex-col transition-all duration-300 ${sizeClasses[size]}`}
        >
          <ChatHeader
            size={size}
            toggleSize={toggleSize}
            closeWidget={() => setIsOpen(false)}
            selectedModel={selectedModel}
            models={models}
            selectModel={selectModel}
            goToSettings={goToSettings}
            isMobile={isMobile}
            onReturnToHelpCenter={onReturnToHelpCenter}
          />
          {error && (
            <div className="text-red-500 mb-2 px-4">
              {error}
              {error.includes('No AI model selected') && (
                <button onClick={goToSettings} className="ml-2 text-sky-500 underline">
                  Go to Settings
                </button>
              )}
              {error.includes('No default model available') && (
                <button onClick={goToAdmin} className="ml-2 text-sky-500 underline">
                  Go to Admin
                </button>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <div className="text-red-500 mb-2 px-4">Please log in to use the chat.</div>
          )}
<ChatMessages
  messages={messages}
  isTyping={isTyping}
  isFullscreen={size === 'fullscreen'}
  setError={setError}
  accessToken={accessToken}
  userId={userId}
  selectedTask={selectedTask} // Add selectedTask
/>
          <div className={`flex flex-col px-4 pb-4 ${size === 'fullscreen' ? styles.centeredInput : ''}`}>
            <ChatInput
              input={input}
              setInput={setInput}
              sendMessage={sendMessage}
              isAuthenticated={isAuthenticated}
              isTyping={isTyping}
              showSearchInput={showSearchInput}
              toggleSearchInput={toggleSearchInput}
              showSaveInput={showSaveInput}
              toggleSaveInput={toggleSaveInput}
              historyName={historyName}
              setHistoryName={setHistoryName}
              saveChatHistory={saveChatHistory}
              loadChatHistory={loadChatHistory}
              isSaving={isSaving}
              chatHistories={chatHistories}
              query={query}
              setQuery={setQuery}
              tasks={tasks}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
              model={selectedModel}
              userRole={userRole}
              accessToken={accessToken}
              onTasksUpdated={handleTasksUpdated}
              defaultSettings={defaultSettings}
              selectedSettings={selectedSettings}
              setSelectedSettings={setSelectedSettings}
              onSettingsUpdated={handleSettingsUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
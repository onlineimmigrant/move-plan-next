'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { FolderIcon, Cog6ToothIcon, MagnifyingGlassIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import ChatToggleButton from './ChatToggleButton';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import FilesModal from './FilesModal';
import SettingsModal from './SettingsModal';
import SearchHistoryModal from './SearchHistoryModal';
import SaveChatModal from './SaveChatModal';
import { Message, ChatHistory, Model, WidgetSize, Task, Role, UserSettings } from './types';
import styles from './ChatWidget.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CHAT_WIDGET_OPEN_KEY = 'chatWidget_isOpen'; // Store open/closed state

interface ChatWidgetProps {
  onReturnToHelpCenter?: () => void;
  initialSize?: WidgetSize;
  initialOpen?: boolean;
  forceHighZIndex?: boolean;
  inNavbar?: boolean;
}

export default function ChatWidget({ 
  onReturnToHelpCenter, 
  initialSize = 'initial', 
  initialOpen = false,
  forceHighZIndex = false,
  inNavbar = false
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
  const [currentChatId, setCurrentChatId] = useState<number | null>(null); // Track current chat
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
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<Role>('user');
  const [defaultSettings, setDefaultSettings] = useState<Record<string, any>>({});
  const [selectedSettings, setSelectedSettings] = useState<Record<string, any> | null>(null);
  const [attachedFileIds, setAttachedFileIds] = useState<Array<{id: string; name: string; size: number}>>([]);
  const [chatSessionId] = useState(() => {
    // Generate a proper UUID v4
    return crypto.randomUUID();
  });
  const router = useRouter();

  // Detect device type for responsive behavior
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobileDevice = width <= 640;
      const isTabletDevice = width > 640 && width <= 1024;

      setIsMobile(isMobileDevice);

      // Auto-adjust size based on device
      if (isMobileDevice) {
        setSize('half');
      } else if (isTabletDevice && size === 'half') {
        setSize('initial');
      }
      // Keep current size for desktop
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [size]);

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

      // Fetch chat histories with new fields, sorted by updated_at
      const { data: histories, error: historiesError } = await supabase
        .from('ai_chat_histories')
        .select('id, name, messages, bookmarked, created_at, updated_at')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });

      if (historiesError) {
        console.error('Fetch histories error:', historiesError.message);
        setError('Failed to load chat histories');
      } else {
        setChatHistories(histories || []);
      }

      // Fetch default models
      const { data: defaultModels, error: defaultModelsError } = await supabase
        .from('ai_models_default')
        .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task, organization_id')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (defaultModelsError) {
        console.error('Default models fetch error:', defaultModelsError.message);
        setError('Failed to load default models.');
      }

      // Fetch user models
      const { data: userModels, error: userModelsError } = await supabase
        .from('ai_models')
        .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
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
            .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task, organization_id')
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
            .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
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
              .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task, organization_id')
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
        // Only log actual errors, not missing sessions (which is normal for unauthenticated users)
        if (error) {
          console.error('Client auth error:', error.message);
        }
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

  // Load settings for the currently selected model
  const loadModelSettings = async (modelId: number, modelType: 'default' | 'user') => {
    if (!isAuthenticated || !userId) return;

    try {
      const { data: modelSettings, error } = await supabase
        .from('ai_model_settings')
        .select('settings')
        .eq('user_id', userId)
        .eq('model_id', modelId)
        .eq('model_type', modelType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings exist for this model yet
          setDefaultSettings({});
          setSelectedSettings(null);
        } else {
          console.error('Error loading model settings:', error.message);
        }
      } else {
        const loadedSettings = modelSettings.settings || {};
        setDefaultSettings(loadedSettings);
        // Always activate settings if they exist
        if (Object.keys(loadedSettings).length > 0) {
          setSelectedSettings(loadedSettings);
        } else {
          setSelectedSettings(null);
        }
      }
    } catch (error: any) {
      console.error('Error loading model settings:', error.message);
    }
  };

  // Load settings when selected model changes
  useEffect(() => {
    if (selectedModel && isAuthenticated && userId) {
      loadModelSettings(selectedModel.id, selectedModel.type);
    }
  }, [selectedModel?.id, selectedModel?.type, isAuthenticated, userId]);

  // Auto-save chat history
  const autoSaveChatHistory = async (updatedMessages: Message[]) => {
    if (!isAuthenticated || !accessToken || !userId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Generate chat name from first user message (truncated to 20 chars) + date
      const firstUserMessage = updatedMessages.find(m => m.role === 'user');
      if (!firstUserMessage) return;

      const truncatedContent = firstUserMessage.content.substring(0, 20);
      const dateStr = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      const autoGeneratedName = `${truncatedContent}... - ${dateStr}`;

      if (currentChatId) {
        // Update existing chat
        const { error } = await supabase
          .from('ai_chat_histories')
          .update({ 
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentChatId);

        if (error) {
          console.error('Auto-update chat error:', error.message);
        } else {
          console.log('[ChatWidget] Chat auto-updated:', currentChatId);
          // Refresh chat histories
          await refreshChatHistories(profile.id);
        }
      } else {
        // Create new chat
        const { data: newChat, error } = await supabase
          .from('ai_chat_histories')
          .insert({
            user_id: profile.id,
            name: autoGeneratedName,
            messages: updatedMessages,
            bookmarked: false
          })
          .select()
          .single();

        if (error) {
          console.error('Auto-save chat error:', error.message);
        } else if (newChat) {
          setCurrentChatId(newChat.id);
          console.log('[ChatWidget] New chat auto-saved:', newChat.id);
          // Refresh chat histories
          await refreshChatHistories(profile.id);
        }
      }
    } catch (error: any) {
      console.error('Auto-save error:', error.message);
    }
  };

  // Refresh chat histories from database
  const refreshChatHistories = async (profileId: string) => {
    const { data: histories } = await supabase
      .from('ai_chat_histories')
      .select('id, name, messages, bookmarked, created_at, updated_at')
      .eq('user_id', profileId)
      .order('updated_at', { ascending: false });

    if (histories) {
      setChatHistories(histories);
    }
  };

const sendMessage = async () => {
  // Allow sending if either input has text OR a task is selected
  const messageContent = input.trim() || (selectedTask ? selectedTask.name : '');
  if (!messageContent) return;
  
  if (!isAuthenticated || !accessToken) {
    setError('Please log in to use the chat.');
    return;
  }
  setError(null);
  
  // Capture attached files before clearing
  const filesToSend = [...attachedFileIds];
  
  const newMessage: Message = { 
    role: 'user', 
    content: messageContent,
    attachedFileIds: filesToSend.map(f => f.id) // Store file IDs with message
  };
  
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

    console.log('[ChatWidget] Sending message with files:', filesToSend);

    const response = await axios.post(
      '/api/chat',
      {
        messages: messagesToSend,
        useSettings: !!selectedSettings,
        attachedFileIds: filesToSend, // Send file IDs to API
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    // Handle extraction result if present
    if (response.data.extractionResult && response.data.extractionResult.updatedSettings) {
      console.log('[ChatWidget] Extraction result received, updating settings:', response.data.extractionResult.updatedSettings);
      setDefaultSettings(response.data.extractionResult.updatedSettings);
      // Always keep settings active after extraction
      setSelectedSettings(response.data.extractionResult.updatedSettings);
    }
    
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: response.data.message, taskName: selectedTask?.name },
    ]);
    setIsTyping(false);
    setSelectedTask(null);
    setSelectedSettings(null);
    // Clear attached files after successful send
    setAttachedFileIds([]);
    console.log('[ChatWidget] Message sent successfully, files cleared');
    
    // Auto-save chat after first message or update existing chat
    await autoSaveChatHistory([...messages, newMessage, { role: 'assistant', content: response.data.message }]);
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
    // Clear files even on error to avoid confusion
    setAttachedFileIds([]);
  }
};

  const saveChatHistory = async (name: string) => {
    // This function is now used to explicitly bookmark/rename the current chat
    if (!currentChatId) {
      setError('No active chat to save.');
      return;
    }
    if (!isAuthenticated || !accessToken) {
      setError('Please log in to save chat history.');
      return;
    }
    setError(null);

    if (!name.trim()) {
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

      // Update the current chat with new name and bookmark it
      const { error } = await supabase
        .from('ai_chat_histories')
        .update({
          name: name,
          bookmarked: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentChatId);

      if (error) {
        console.error('Save history error:', error.message);
        setError('Failed to save chat history: ' + error.message);
      } else {
        await refreshChatHistories(profile.id);
        setIsSaveModalOpen(false);
        setIsModalOpen(false);
        setError(null);
        alert('Chat bookmarked successfully!');
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
      setCurrentChatId(history.id);
      setError(null);
      setSelectedTask(null);
      setSelectedSettings(null);
    }
  };

  const toggleBookmark = async (historyId: number, bookmarked: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_chat_histories')
        .update({ 
          bookmarked,
          updated_at: new Date().toISOString()
        })
        .eq('id', historyId);

      if (error) {
        console.error('Toggle bookmark error:', error.message);
        setError('Failed to update bookmark');
      } else {
        // Refresh histories
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profile) {
            await refreshChatHistories(profile.id);
          }
        }
      }
    } catch (error: any) {
      console.error('Toggle bookmark error:', error.message);
    }
  };

  const renameHistory = async (historyId: number, newName: string) => {
    try {
      const { error } = await supabase
        .from('ai_chat_histories')
        .update({ 
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', historyId);

      if (error) {
        console.error('Rename history error:', error.message);
        setError('Failed to rename chat');
      } else {
        // Refresh histories
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profile) {
            await refreshChatHistories(profile.id);
          }
        }
      }
    } catch (error: any) {
      console.error('Rename history error:', error.message);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setError(null);
    setSelectedTask(null);
    setSelectedSettings(null);
    setAttachedFileIds([]);
  };

  const toggleSearchInput = () => {
    setIsSearchModalOpen(true);
    setIsModalOpen(true);
  };

  const toggleSaveInput = () => {
    setIsSaveModalOpen(true);
    setIsModalOpen(true);
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

  const openFilesModal = () => {
    setIsFilesModalOpen(true);
  };

  const closeFilesModal = () => {
    setIsFilesModalOpen(false);
  };

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
    setIsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setIsModalOpen(false);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when widget is open
      if (!isOpen) return;

      // Escape to close widget
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }

      // Ctrl/Cmd + Enter to toggle size (only when not typing in input)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'TEXTAREA' ||
                              activeElement?.tagName === 'INPUT';

        if (!isInputFocused) {
          event.preventDefault();
          toggleSize();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSize]);

  const sizeClasses = {
    initial: 'w-[400px] h-[750px] bottom-4 right-4 sm:bottom-8 sm:right-8',
    half: isMobile ? styles.mobileHalfContainer : 'w-1/2 h-[750px] bottom-4 right-4 sm:bottom-8 sm:right-8',
    fullscreen: isMobile ? 'top-6 right-4 bottom-10 left-4' : styles.fullscreenContainer,
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
    <>
      <ChatToggleButton isOpen={isOpen} toggleOpen={() => setIsOpen(!isOpen)} isModalOpen={isModalOpen} inNavbar={inNavbar} />
      {isOpen && (
        <div
          className={`${isModalOpen || forceHighZIndex ? "z-[10000002]" : "z-[9999]"} fixed min-h-[480px] backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 border-0 rounded-2xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-out ${sizeClasses[size]}`}
          role="dialog"
          aria-labelledby="chat-widget-title"
          aria-modal="true"
        >
          <ChatHeader
            size={size}
            toggleSize={toggleSize}
            closeWidget={() => setIsOpen(false)}
            selectedModel={selectedModel}
            models={models}
            selectModel={selectModel}
            goToSettings={goToSettings}
            onOpenFiles={openFilesModal}
            isMobile={isMobile}
            onReturnToHelpCenter={onReturnToHelpCenter}
          />
          
          {/* Floating action buttons - visible only on desktop */}
          <div className="hidden sm:flex absolute top-16 right-4 z-20 gap-2">
            {/* Files button */}
            <Tooltip content="Files">
              <button
                onClick={openFilesModal}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-110 active:scale-95"
                aria-label="Open files"
              >
                <FolderIcon className="h-5 w-5" />
              </button>
            </Tooltip>
            
            {/* Settings button */}
            <Tooltip content="Settings">
              <button
                onClick={openSettingsModal}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-110 active:scale-95"
                aria-label="Settings"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          
          {/* Floating action buttons - left side - visible only on desktop */}
          <div className="hidden sm:flex absolute top-16 left-4 z-20 gap-2">
            {/* Search button */}
            <Tooltip content="Search History">
              <button
                onClick={toggleSearchInput}
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-110 active:scale-95 ${
                  isSearchModalOpen
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                }`}
                aria-label="Search history"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </Tooltip>
            
            {/* Bookmark button */}
            <Tooltip content="Save Chat">
              <button
                onClick={toggleSaveInput}
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-110 active:scale-95 ${
                  isSaveModalOpen
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                }`}
                aria-label="Save chat"
              >
                <BookmarkIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          
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
          <div className="flex-1 overflow-y-auto">
            <ChatMessages
              messages={messages}
              isTyping={isTyping}
              isFullscreen={size === 'fullscreen'}
              setError={setError}
              accessToken={accessToken}
              userId={userId}
              selectedTask={selectedTask}
              onDeleteMessage={(index) => {
                setMessages(prev => prev.filter((_, i) => i !== index));
              }}
            />
          </div>
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
              saveChatHistory={() => saveChatHistory(historyName)}
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
              onModalOpen={() => setIsModalOpen(true)}
              onModalClose={() => setIsModalOpen(false)}
              userId={userId}
              chatSessionId={chatSessionId}
              attachedFiles={attachedFileIds}
              onFilesAttached={(files) => {
                setAttachedFileIds(files);
              }}
              onFileRemoved={(fileId) => {
                setAttachedFileIds(prev => prev.filter(f => f.id !== fileId));
              }}
              onOpenFiles={openFilesModal}
              onOpenSettings={openSettingsModal}
            />
          </div>
        </div>
      )}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        accessToken={accessToken}
        defaultSettings={defaultSettings}
        selectedSettings={selectedSettings}
        setSelectedSettings={setSelectedSettings}
        onSettingsUpdated={handleSettingsUpdated}
        selectedModel={selectedModel}
      />
      <SearchHistoryModal
        isOpen={isSearchModalOpen}
        onClose={() => {
          setIsSearchModalOpen(false);
          setIsModalOpen(false);
        }}
        chatHistories={chatHistories}
        onSelectHistory={loadChatHistory}
        onToggleBookmark={toggleBookmark}
        onRenameHistory={renameHistory}
        onNewChat={startNewChat}
      />
      <SaveChatModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setIsModalOpen(false);
        }}
        onSave={(name) => {
          saveChatHistory(name);
        }}
        isSaving={isSaving}
      />
      <FilesModal
        isOpen={isFilesModalOpen}
        onClose={closeFilesModal}
        userId={userId}
      />
    </>
  );
}
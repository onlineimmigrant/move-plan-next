// components/ChatHelpWidget/ChatWidgetWrapper.tsx
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import ChatMessages from '../ChatWidget/ChatMessages';
import ChatInput from '../ChatWidget/ChatInput';
import ModelSelector from '../ChatWidget/ModelSelector';
import ChatFilesList from '../ChatWidget/ChatFilesList';
import { Message, ChatHistory, Model, WidgetSize, Task, Role, UserSettings } from '../ChatWidget/types';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import styles from '../ChatWidget/ChatWidget.module.css';
import { useThemeColors } from '@/hooks/useThemeColors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatWidgetWrapperProps {
  size: WidgetSize;
  toggleSize: () => void;
  closeWidget: () => void;
  onReturnToHelpCenter: () => void;
  isMobile: boolean;
}

export default function ChatWidgetWrapper({
  size,
  toggleSize,
  closeWidget,
  onReturnToHelpCenter,
  isMobile,
}: ChatWidgetWrapperProps) {
  const themeColors = useThemeColors();
  const { t } = useHelpCenterTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Additional state for ChatInput
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [historyName, setHistoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userRole, setUserRole] = useState<Role>('user');
  const [defaultSettings, setDefaultSettings] = useState<Record<string, any>>({});
  const [selectedSettings, setSelectedSettings] = useState<Record<string, any> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilesList, setShowFilesList] = useState(false);
  const [attachedFileIds, setAttachedFileIds] = useState<Array<{id: string; name: string; size: number}>>([]);
  const [chatSessionId] = useState(() => {
    // Generate a proper UUID v4
    return crypto.randomUUID();
  });

  // Initialize authentication and models
  useEffect(() => {
    const initializeChatWidget = async () => {
      // Check authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        setIsAuthenticated(false);
        setError('Please log in to use AI Agent mode.');
        return;
      }

      setIsAuthenticated(true);
      setAccessToken(session.access_token);
      setUserId(session.user.id);

      // Fetch models and other initialization logic here
      // This is a simplified version - you may want to copy the full initialization from ChatWidget.tsx
    };

    initializeChatWidget();
  }, []);

  const getTooltipContent = () => {
    if (isMobile) {
      return size === 'half' ? 'Full Screen' : 'Shrink';
    }
    switch (size) {
      case 'initial':
        return 'Expand';
      case 'half':
        return 'Full Screen';
      case 'fullscreen':
        return 'Shrink';
      default:
        return 'Expand';
    }
  };

  const showReturnButton = size !== 'initial';

  // Send message function with file attachment support
  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!isAuthenticated || !accessToken) {
      setError('Please log in to use AI Agent mode.');
      return;
    }
    
    setError(null);
    
    // Capture attached files before clearing
    const filesToSend = [...attachedFileIds];
    
    const newMessage: Message = { 
      role: 'user', 
      content: input,
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

      console.log('[ChatWidgetWrapper] Sending message with files:', filesToSend);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messages: messagesToSend,
          useSettings: !!selectedSettings,
          attachedFileIds: filesToSend,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message, taskName: selectedTask?.name },
      ]);
      setIsTyping(false);
      setSelectedTask(null);
      setSelectedSettings(null);
      
      // Clear attached files after successful send
      setAttachedFileIds([]);
      console.log('[ChatWidgetWrapper] Message sent successfully, files cleared');
    } catch (error: any) {
      console.error('Chat widget error:', error.message);
      const errorMsg = error.message || 'Failed to send message';
      setError(errorMsg);
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg, taskName: selectedTask?.name }]);
      setIsTyping(false);
      setSelectedTask(null);
      setSelectedSettings(null);
      
      // Clear files even on error to avoid confusion
      setAttachedFileIds([]);
    }
  };

  const toggleSearchInput = () => setShowSearchInput(!showSearchInput);
  const toggleSaveInput = () => setShowSaveInput(!showSaveInput);
  
  const saveChatHistory = () => {
    setIsSaving(true);
    // TODO: Implement save logic
    setTimeout(() => setIsSaving(false), 1000);
  };

  const loadChatHistory = (history: ChatHistory | null) => {
    if (history) {
      setMessages(history.messages || []);
    }
  };

  const handleTasksUpdated = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  const handleSettingsUpdated = (settings: Record<string, any>) => {
    setSelectedSettings(settings);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Modified Header with Return Button */}
      <div className="flex justify-between items-center mb-2 bg-gray-50 px-4 shadow rounded-t-lg">
        <div className="flex items-center space-x-2">
          {showReturnButton && (
            <button
              onClick={onReturnToHelpCenter}
              className="cursor-pointer text-gray-500 hover:text-gray-700 p-1 flex items-center space-x-1"
              title="Return to Help Center"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Help Center</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <ModelSelector
            selectedModel={selectedModel}
            models={models}
            selectModel={setSelectedModel}
            goToSettings={() => {}}
            onOpenFiles={() => setShowFilesList(true)}
          />
          <button
            onClick={toggleSize}
            className="cursor-pointer p-1 transition-colors duration-200"
            style={{ color: themeColors.cssVars.primary.base }}
            onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
            onMouseLeave={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
            title={getTooltipContent()}
          >
            {size === 'fullscreen' ? (
              <ArrowsPointingInIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={closeWidget}
            className="cursor-pointer text-gray-500 hover:text-gray-700 p-1"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-2 px-4 py-2 bg-red-50 border-b border-red-200">
          {error}
        </div>
      )}

      {/* Chat Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          isFullscreen={size === 'fullscreen'}
          setError={setError}
          accessToken={accessToken}
          userId={userId}
          selectedTask={selectedTask}
        />
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
          onOpenFiles={() => setShowFilesList(true)}
          onOpenSettings={() => {}}
        />
      </div>

      {/* Files List Modal */}
      <ChatFilesList
        isOpen={showFilesList}
        onClose={() => setShowFilesList(false)}
        accessToken={accessToken}
        userId={userId}
        chatSessionId={chatSessionId}
        onFilesSelected={(files) => {
          setAttachedFileIds(files);
          console.log('Files selected for chat:', files);
        }}
      />
    </div>
  );
}

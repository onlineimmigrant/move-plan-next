// components/ChatHelpWidget/ChatWidgetWrapper.tsx
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import ChatMessages from '../modals/ChatWidget/ChatMessages';
import ChatInput from '../modals/ChatWidget/ChatInput';
import ModelSelector from '../modals/ChatWidget/ModelSelector';
import { Message, ChatHistory, Model, WidgetSize, Task, Role, UserSettings } from '../modals/ChatWidget/types';
import { useHelpCenterTranslations } from '../modals/ChatHelpWidget/useHelpCenterTranslations';
import styles from '../modals/ChatWidget/ChatWidget.module.css';

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

  // Required functions for ChatInput
  const sendMessage = () => {
    // TODO: Implement message sending logic
    console.log('Sending message:', input);
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
            onOpenFiles={() => {}}
          />
          <button
            onClick={toggleSize}
            className="cursor-pointer text-sky-500 hover:text-sky-700 p-1"
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
        />
      </div>
    </div>
  );
}

'use client';
import { useRef, useEffect, useState } from 'react';
import { ArrowUpIcon, MagnifyingGlassIcon, BookmarkIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';
import TaskManagerModal from './TaskManagerModal';
import SettingsModal from './SettingsModal';
import { ChatHistory, Task, Role, Model } from './types';
import styles from './ChatWidget.module.css';
import Button from '@/ui/Button';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  isAuthenticated: boolean;
  isTyping: boolean;
  showSearchInput: boolean;
  toggleSearchInput: () => void;
  showSaveInput: boolean;
  toggleSaveInput: () => void;
  historyName: string;
  setHistoryName: (value: string) => void;
  saveChatHistory: () => void;
  loadChatHistory: (history: ChatHistory | null) => void;
  isSaving: boolean;
  chatHistories: ChatHistory[];
  query: string;
  setQuery: (value: string) => void;
  tasks: Task[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  model: Model | null;
  userRole: Role;
  accessToken: string | null;
  onTasksUpdated: (tasks: Task[]) => void;
  defaultSettings: Record<string, any>;
  selectedSettings: Record<string, any> | null;
  setSelectedSettings: (settings: Record<string, any> | null) => void;
  onSettingsUpdated: (settings: Record<string, any>) => void;
  onModalOpen: () => void;
  onModalClose: () => void;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  isAuthenticated,
  isTyping,
  showSearchInput,
  toggleSearchInput,
  showSaveInput,
  toggleSaveInput,
  historyName,
  setHistoryName,
  saveChatHistory,
  loadChatHistory,
  isSaving,
  chatHistories,
  query,
  setQuery,
  tasks,
  selectedTask,
  setSelectedTask,
  model,
  userRole,
  accessToken,
  onTasksUpdated,
  defaultSettings,
  selectedSettings,
  setSelectedSettings,
  onSettingsUpdated,
  onModalOpen,
  onModalClose,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);

  // Initialize selectedSettings to defaultSettings on mount or when defaultSettings changes
  useEffect(() => {
    if (!isSettingsInitialized && defaultSettings && Object.keys(defaultSettings).length > 0) {
      setSelectedSettings(defaultSettings);
      setIsSettingsInitialized(true);
    }
  }, [defaultSettings, isSettingsInitialized, setSelectedSettings]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const filteredHistories = query
    ? chatHistories.filter((history) =>
        history.name.toLowerCase().includes(query.toLowerCase())
      )
    : chatHistories;

  return (
    <div>
      {isAuthenticated && (
        <>
          <div className={styles.taskBadgeContainer}>
            <div className="flex items-center gap-2 px-1">
              <Tooltip content="Manage Tasks">
                <button
                  onClick={() => {
                    setIsTaskModalOpen(true);
                    onModalOpen();
                  }}
                  className={styles.addTaskButton}
                  disabled={!model}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              {tasks.map((task) => (
                <button
                  key={task.name}
                  onClick={() => setSelectedTask(task.name === selectedTask?.name ? null : task)}
                  className={`${styles.taskBadge} ${task.name === selectedTask?.name ? styles.selected : ''} flex-shrink-0 whitespace-nowrap`}
                >
                  {task.name}
                </button>
              ))}
            </div>
          </div>
          <TaskManagerModal
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              onModalClose();
            }}
            model={model}
            userRole={userRole}
            accessToken={accessToken}
            onTasksUpdated={onTasksUpdated}
          />
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => {
              setIsSettingsModalOpen(false);
              onModalClose();
            }}
            accessToken={accessToken}
            defaultSettings={defaultSettings}
            selectedSettings={selectedSettings}
            setSelectedSettings={setSelectedSettings}
            onSettingsUpdated={onSettingsUpdated}
          />
        </>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
              placeholder={selectedTask ? `Ask about "${selectedTask.name}"...` : 'Ask me anything...'}
              disabled={!isAuthenticated || isTyping}
              rows={1}
            />
          </div>

          <Tooltip content="Send message">
            <button
              onClick={sendMessage}
              className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:cursor-not-allowed"
              disabled={!isAuthenticated || isTyping || !input.trim()}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Tooltip content="Search history">
              <button
                onClick={toggleSearchInput}
                className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isAuthenticated}
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Save chat">
              <button
                onClick={toggleSaveInput}
                className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isAuthenticated}
              >
                <BookmarkIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <Tooltip content="Settings">
            <button
              onClick={() => {
                setIsSettingsModalOpen(true);
                onModalOpen();
              }}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedSettings && Object.keys(selectedSettings).length > 0
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              disabled={!isAuthenticated}
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
        {showSearchInput && (
          <div className="mt-3 relative">
            <Combobox value={null} onChange={loadChatHistory}>
              <Combobox.Input
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chat history..."
                value={query}
              />
              <Combobox.Options className="absolute bottom-full mb-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 shadow-xl ring-1 ring-slate-200 focus:outline-none border border-slate-100 z-10">
                {filteredHistories.length === 0 && query !== '' ? (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    No chat histories found.
                  </div>
                ) : (
                  filteredHistories.map((history) => (
                    <Combobox.Option
                      key={history.id}
                      value={history}
                      className={({ active }) =>
                        `relative cursor-pointer select-none px-4 py-3 transition-colors duration-150 ${
                          active ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium truncate">{history.name}</span>
                      </div>
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Combobox>
          </div>
        )}
        {showSaveInput && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={historyName}
                onChange={(e) => setHistoryName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Name your chat..."
                disabled={!isAuthenticated || isSaving}
              />
            </div>
            <Tooltip content="Save chat">
              <button
                onClick={saveChatHistory}
                className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white rounded-lg shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:cursor-not-allowed"
                disabled={!isAuthenticated || isSaving}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <BookmarkIcon className="h-4 w-4" />
                )}
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
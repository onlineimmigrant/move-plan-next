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
            <div className="flex flex-wrap items-center">
              <Tooltip content="Manage Tasks">
                <button
                  onClick={() => setIsTaskModalOpen(true)}
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
                  className={`${styles.taskBadge} ${task.name === selectedTask?.name ? styles.selected : ''}`}
                >
                  {task.name}
                </button>
              ))}
            </div>
          </div>
          <TaskManagerModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            model={model}
            userRole={userRole}
            accessToken={accessToken}
            onTasksUpdated={onTasksUpdated}
          />
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            accessToken={accessToken}
            defaultSettings={defaultSettings}
            selectedSettings={selectedSettings}
            setSelectedSettings={setSelectedSettings}
            onSettingsUpdated={onSettingsUpdated}
          />
        </>
      )}
      <div className="border border-gray-200 rounded-xl bg-gray-50 p-2">
        <div className="flex items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            className="rounded p-2 flex-grow resize-none focus:outline-none bg-gray-50"
            placeholder={selectedTask ? `Enter text for "${selectedTask.name}"...` : 'Ask...'}
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
        <div className="flex justify-between space-x-2 mt-2">
          <div className="flex space-x-2">
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
          <Tooltip content="Manage Settings">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className={`cursor-pointer p-2 rounded-full disabled:bg-gray-200 hover:bg-sky-200 transition-colors ${
                selectedSettings ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'
              }`}
              disabled={!isAuthenticated}
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </Tooltip>
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
  );
}
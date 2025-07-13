// components/ChatWidget/ChatHistoryControls.tsx
'use client';
import { MagnifyingGlassIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import Tooltip from '@/components/Tooltip';
import { ChatHistory } from './types';

interface ChatHistoryControlsProps {
  isAuthenticated: boolean;
  chatHistories: ChatHistory[];
  query: string;
  setQuery: (value: string) => void;
  showSearchInput: boolean;
  toggleSearchInput: () => void;
  showSaveInput: boolean;
  toggleSaveInput: () => void;
  historyName: string;
  setHistoryName: (value: string) => void;
  saveChatHistory: () => void;
  loadChatHistory: (history: ChatHistory | null) => void;
  isSaving: boolean;
}

export default function ChatHistoryControls({
  isAuthenticated,
  chatHistories,
  query,
  setQuery,
  showSearchInput,
  toggleSearchInput,
  showSaveInput,
  toggleSaveInput,
  historyName,
  setHistoryName,
  saveChatHistory,
  loadChatHistory,
  isSaving,
}: ChatHistoryControlsProps) {
  const filteredHistories = query
    ? chatHistories.filter((history) =>
        history.name.toLowerCase().includes(query.toLowerCase())
      )
    : chatHistories;

  return (
    <div>
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
  );
}
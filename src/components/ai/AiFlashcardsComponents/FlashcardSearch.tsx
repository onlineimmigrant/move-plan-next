// AiFlashcardsComponents/FlashcardSearch.tsx
import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';

interface FlashcardSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeStatus: string;
  handleStatusSelect: (status: string) => void;
  activeTopic: string | null;
  handleTopicSelect: (topic: string | null) => void;
  topics: string[];
  getStatusLabel: (status: string) => string;
}

export default function FlashcardSearch({
  searchQuery,
  setSearchQuery,
  activeStatus,
  handleStatusSelect,
  activeTopic,
  handleTopicSelect,
  topics,
  getStatusLabel,
}: FlashcardSearchProps) {
  const statuses = ['status', 'learning', 'review', 'mastered', 'suspended', 'lapsed'];

  return (
    <div className="flex flex-col gap-4 mt-2 mb-4 md:flex-row md:items-center">
      <div className="md:py-0 py-4 relative w-full px-4 transition-all duration-200 md:w-80 md:px-0">
        <span className="absolute inset-y-0 left-0 flex items-center pl-6 md:pl-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search by name or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-4 sm:py-2 pl-10 pr-3 text-base font-light bg-white border-2 border-gray-200 rounded-2xl sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="flex justify-center items-center gap-4 px-4 md:px-0">
        {/* Status Listbox */}
        <Listbox value={activeStatus} onChange={handleStatusSelect}>
          {({ open }) => (
            <div className="relative">
              <Tooltip content="Filter by Status">
                <Listbox.Button className="relative flex items-center border-2 border-gray-50 rounded-full p-2 text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors">
                  <span className="mr-2 bg-gray-50 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </span>
                  <span>{getStatusLabel(activeStatus)}</span>
                </Listbox.Button>
              </Tooltip>
              <Transition
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Listbox.Options className="absolute z-10 right-0 mt-1 w-48 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
                  {statuses.map((status) => (
                    <Listbox.Option
                      key={status}
                      value={status}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 px-4 ${
                          active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                        }`
                      }
                    >
                      <div className="flex items-center">
                        <span className="flex-grow text-sm">{getStatusLabel(status)}</span>
                        {activeStatus === status && <CheckIcon className="h-5 w-5 text-sky-500" />}
                      </div>
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>

        {/* Topic Listbox */}
        <Listbox value={activeTopic} onChange={handleTopicSelect}>
          {({ open }) => (
            <div className="relative">
              <Tooltip content="Filter by Topic">
                <Listbox.Button className="relative flex items-center border-2 border-gray-50 rounded-full p-2 text-sm font-medium text-sky-600 bg-sky-100 hover:bg-gray-200 transition-colors">
                  <span className="mr-2 bg-gray-50 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </span>
                  <span className="line-clamp-1">{activeTopic || 'All Topics'}</span>
                </Listbox.Button>
              </Tooltip>
              <Transition
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Listbox.Options className="absolute z-10 right-0 mt-1 w-48 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
                  <Listbox.Option
                    value={null}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                      }`
                    }
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">All Topics</span>
                      {activeTopic === null && <CheckIcon className="h-5 w-5 text-sky-500" />}
                    </div>
                  </Listbox.Option>
                  {topics.map((topic) => (
                    <Listbox.Option
                      key={topic}
                      value={topic}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 px-4 ${
                          active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                        }`
                      }
                    >
                      <div className="flex items-center">
                        <span className="flex-grow text-sm">{topic}</span>
                        {activeTopic === topic && <CheckIcon className="h-5 w-5 text-sky-500" />}
                      </div>
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>
      </div>
    </div>
  );
}
// AiFlashcardsComponents/FlashcardSearch.tsx
import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import Button from '@/ui/Button';

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
          <MagnifyingGlassIcon className="pl-2 w-8 h-8 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search by name or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 pl-12 pr-3 text-base font-light bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="flex justify-center items-center gap-4 px-4 md:px-0">
        {/* Status Listbox */}
        <Listbox value={activeStatus} onChange={handleStatusSelect}>
          {({ open }) => (
            <div className="relative">
              <Tooltip content="Filter by Status">
                <Listbox.Button className="relative flex items-center   p-2 text-sm font-medium text-gray-800  transition-colors">
                  <Button variant='outline'>
                  <span className="mr-2  rounded-full hover:bg-gray-200 transition-colors">
                    <PencilIcon className="w-3 h-3" />
                  </span>
                  <span>{getStatusLabel(activeStatus)}</span>
                  </Button>
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
                <Listbox.Button className="relative flex items-center  p-2 text-sm font-medium  transition-colors">
                  <Button
                  variant='outline'
                  >
                  <span className="mr-2  transition-colors">
                    <PencilIcon className="w-3 h-3" />
                  </span>
                  <span className="line-clamp-1">{activeTopic || 'All Topics'}</span>
               </Button>
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
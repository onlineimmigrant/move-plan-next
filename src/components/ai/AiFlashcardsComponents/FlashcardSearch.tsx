// AiFlashcardsComponents/FlashcardSearch.tsx
import React from 'react';
import { Listbox, Transition, ListboxOption, ListboxOptions } from '@headlessui/react';
import { MagnifyingGlassIcon, PencilIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import Button from '@/ui/Button';
import ListboxButton from '@/ui/ListboxButton';

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
                <ListboxButton variant='outline' className='flex justify-between'>
       
                  <span>{getStatusLabel(activeStatus)}</span>
                            <span className="ml-2  rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronDownIcon className="w-3 h-3" />
                  </span>
                </ListboxButton>
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
    <ListboxOptions className="absolute w-full mt-1 bg-white border border-gray-200 ring ring-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-10">
                            {statuses.map((status) => (
                    <ListboxOption
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
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          )}
        </Listbox>

        {/* Topic Listbox */}
        <Listbox value={activeTopic} onChange={handleTopicSelect}>
          {({ open }) => (
            <div className="relative">
              <Tooltip content="Filter by Topic">
                <ListboxButton 
                  variant='outline'
                  className='flex justify-between'
                  >
         
                  <span className="line-clamp-1">{activeTopic || 'Topics'}</span>
                           <span className="ml-2  transition-colors">
                    <ChevronDownIcon className="w-3 h-3" />
                  </span>
              
                </ListboxButton>
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
                <ListboxOptions className="absolute w-full mt-1 bg-white border border-gray-200 ring ring-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-10">
                  <ListboxOption
                    value={null}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 border-b border-gray-100 ${
                        active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                      }`
                    }
                  >
                    <div className="flex items-center">
                      <span className="flex-grow text-xs font-medium">Topics</span>
                      {activeTopic === null && <CheckIcon className="h-4 w-4 text-sky-500" />}
                    </div>
                  </ListboxOption>
                  {topics.map((topic) => (
                    <ListboxOption
                      key={topic}
                      value={topic}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 px-4 border-b border-gray-100 ${
                          active ? 'bg-sky-100 text-sky-900 shadow' : 'text-gray-900'
                        }`
                      }
                    >
                      <div className="flex items-center justify-between space-x-2">
                       
                        <span className="flex-grow text-xs font-medium">{topic}</span>
                         {activeTopic === topic && <CheckIcon className="h-4 w-4 text-sky-500" />}
                      </div>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          )}
        </Listbox>
      </div>
    </div>
  );
}
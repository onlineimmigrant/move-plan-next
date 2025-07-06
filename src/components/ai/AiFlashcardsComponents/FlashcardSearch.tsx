'use client';
import React from 'react';
import { Listbox, Transition, ListboxOption, ListboxOptions } from '@headlessui/react';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import ListboxButton from '@/ui/ListboxButton';
import { Flashcard } from '../../../lib/types';

interface FlashcardSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeStatus: string;
  handleStatusSelect: (status: string) => void;
  activeTopic: string | null;
  handleTopicSelect: (topic: string | null) => void;
  topics: string[];
  getStatusLabel: (status: string) => string;
  filteredFlashcards: Flashcard[] | undefined;
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
  filteredFlashcards = [],
}: FlashcardSearchProps) {
  const statuses = ['status', 'learning', 'review', 'mastered', 'suspended', 'lapsed'];

  return (
    <div className="flex flex-col gap-2 sm:my-2 -mt-2 px-0 md:flex-row md:items-center md:px-0">
      {/* Search Input with Integrated Status Filter */}
      <div className="relative w-full">
        <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent transition-all duration-200">
          {/* Filtered Flashcard Count Circle */}
          <span className="absolute inset-y-0 left-0 flex items-center pl-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-sky-50 text-gray-900 text-[10px] font-semibold">
              {filteredFlashcards.length}
            </span>
          </span>
          {/* Magnifying Glass Icon */}
          <span className="absolute inset-y-0 left-0 flex items-center pl-9">
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
          </span>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-16 sm:pl-20 pr-3 text-base font-light bg-transparent border-none focus:outline-none"
          />
          {/* Topic and Status Listboxes */}
          <div className="flex gap-2 items-center justify-end">
            {/* Topic Listbox */}
            <Listbox value={activeTopic} onChange={handleTopicSelect}>
              {({ open }) => (
                <div className="relative">
                  <Tooltip content="Filter by Topic">
                    <ListboxButton
                      variant="outline"
                      className="flex justify-center h-full py-2 sm:px-4 px-0 text-sm font-medium text-gray-900 bg-gray-50 border-none shadow-none rounded-l-lg focus:outline-none hover:bg-gray-100 min-w-[100px]"
                    >
                      <span className="line-clamp-1">{activeTopic || 'All Topics'}</span>
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
                    <ListboxOptions className="absolute w-48 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-20">
                      <ListboxOption
                        value={null}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 px-4 border-gray-100 ${
                            active ? 'bg-sky-100 text-sky-900 font-semibold' : 'text-gray-900'
                          }`
                        }
                      >
                        <div className="flex items-center">
                          <span className="flex-grow text-sm font-medium">All Topics</span>
                          {activeTopic === null && <CheckIcon className="h-5 w-5 text-sky-500" />}
                        </div>
                      </ListboxOption>
                      {topics.map((topic) => (
                        <ListboxOption
                          key={topic}
                          value={topic}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 px-4 border-gray-100 ${
                              active ? 'bg-sky-100 text-sky-900 font-semibold' : 'text-gray-900'
                            }`
                          }
                        >
                          <div className="flex items-center justify-between space-x-2">
                            <span className="flex-grow text-sm font-medium">{topic}</span>
                            {activeTopic === topic && <CheckIcon className="h-5 w-5 text-sky-500" />}
                          </div>
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              )}
            </Listbox>

            {/* Status Listbox */}
            <Listbox value={activeStatus} onChange={handleStatusSelect}>
              {({ open }) => (
                <div className="relative">
                  <Tooltip content="Filter by Status">
                    <ListboxButton
                      variant="outline"
                      className="flex justify-center h-full py-2 sm:px-4 px-0 text-sm font-medium text-gray-900 bg-gray-50 border-none shadow-none rounded-l-lg focus:outline-none hover:bg-gray-100 min-w-[80px]"
                    >
                      <span className="line-clamp-1">{getStatusLabel(activeStatus)}</span>
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
                    <ListboxOptions className="absolute w-48 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-20">
                      {statuses.map((status) => (
                        <ListboxOption
                          key={status}
                          value={status}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 px-4 ${
                              active ? 'bg-sky-100 text-sky-900 font-semibold' : 'text-gray-900'
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
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';
import React, { useRef } from 'react';
import { Listbox, Transition, ListboxOption, ListboxOptions } from '@headlessui/react';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import ListboxButton from '@/ui/ListboxButton';

interface ChatHistorySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDateRange: string;
  setSelectedDateRange: (range: string) => void;
  searchRef: React.RefObject<HTMLDivElement>;
  totalHistories: number; // Added prop
}

export default function ChatHistorySearch({
  searchQuery,
  setSearchQuery,
  selectedDateRange,
  setSelectedDateRange,
  searchRef,
  totalHistories, // Added prop
}: ChatHistorySearchProps) {
  const dateRanges = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'thisweek' },
    { label: 'Last Week', value: 'lastweek' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
  ];

  return (
    <div className="flex flex-col gap-2 mt-2 sm:mb-4 -mb-4 px-0 md:flex-row md:items-center md:px-0">
      <div ref={searchRef} className="relative w-full">
        <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent transition-all duration-200">
          {/* Total Histories Badge */}
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
           <span className="flex items-center justify-center h-6 w-6 rounded-full bg-sky-50 text-gray-900 text-[10px] font-semibold">
            {totalHistories}
            </span>
          </span>
          {/* Magnifying Glass Icon */}
          <span className="absolute inset-y-0 left-0 flex items-center pl-10">
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
          </span>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search chat histories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-16 sm:pl-20 pr-3 text-base font-light bg-transparent border-none focus:outline-none"
          />
          {/* Date Range Listbox */}
          <div className="flex items-center justify-end">
            <Listbox value={selectedDateRange} onChange={setSelectedDateRange}>
              {({ open }) => (
                <div className="relative">
                  <Tooltip content="Filter by Date Range">
                    <ListboxButton
                      variant="outline"
                      className="flex justify-center h-full py-2 sm:px-4 px-0 text-sm font-medium text-gray-900 bg-gray-50 border-none shadow-none rounded-l-lg focus:outline-none hover:bg-gray-100 min-w-[100px]"
                    >
                      <span className="line-clamp-1">
                        {dateRanges.find((range) => range.value === selectedDateRange)?.label || 'All Time'}
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
                    <ListboxOptions className="absolute w-48 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-20">
                      {dateRanges.map((range) => (
                        <ListboxOption
                          key={range.value}
                          value={range.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 px-4 border-gray-100 ${
                              active ? 'bg-sky-100 text-sky-900 font-semibold' : 'text-gray-900'
                            }`
                          }
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex-grow text-sm font-medium">{range.label}</span>
                            {selectedDateRange === range.value && <CheckIcon className="h-5 w-5 text-sky-500" />}
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
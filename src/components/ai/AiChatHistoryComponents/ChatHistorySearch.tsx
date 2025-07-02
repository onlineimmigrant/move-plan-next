// ChatHistorySearch.tsx
import React, { useRef } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';

interface ChatHistorySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDateRange: string;
  setSelectedDateRange: (range: string) => void;
  searchRef: React.RefObject<HTMLDivElement>;
}

export default function ChatHistorySearch({
  searchQuery,
  setSearchQuery,
  selectedDateRange,
  setSelectedDateRange,
  searchRef,
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
    <div className="flex flex-col gap-4 mt-2 mb-4 md:flex-row md:items-center">
      <div
        ref={searchRef}
        className="relative w-full px-4 transition-all duration-200 md:w-80 md:px-0"
      >
        <span className="absolute inset-y-0 left-0 flex items-center pl-6 md:pl-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search chat histories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 pl-10 pr-3 text-base font-light bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="flex items-center gap-2 px-4 md:px-0">
        {/* Date Range Listbox */}
        <Listbox value={selectedDateRange} onChange={setSelectedDateRange}>
          {({ open }) => (
            <div className="relative">
              <Tooltip content="Filter by Date Range">
                <Listbox.Button className="relative flex items-center border-2 border-gray-50 rounded-full p-2 text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors">
                  <span className="mr-2 bg-gray-50 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </span>
                  <span className='line-clamp-1'>{dateRanges.find((range) => range.value === selectedDateRange)?.label || 'All Time'}</span>
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
                  {dateRanges.map((range) => (
                    <Listbox.Option
                      key={range.value}
                      value={range.value}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 px-4 ${
                          active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                        }`
                      }
                    >
                      <div className="flex items-center line-clamp-1">
                        <span className="flex-grow text-sm ">{range.label}</span>
                        {selectedDateRange === range.value && <CheckIcon className="h-5 w-5 text-sky-500" />}
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
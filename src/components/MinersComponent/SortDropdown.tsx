'use client';

import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { SortState, SortKey } from './types';
import { sortOptions } from './constants';

interface SortDropdownProps {
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}

export default function SortDropdown({ sort, onSortChange }: SortDropdownProps) {
  const handleSortChange = (value: string) => {
    const [key, direction] = value.split('-') as [SortKey, 'asc' | 'desc'];
    onSortChange({ key, direction });
  };

  return (
    <div className="min-w-0 sm:min-w-72">
      <Listbox 
        value={`${sort.key}-${sort.direction}`} 
        onChange={handleSortChange}
      >
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-4 pr-10 text-left border border-white/30 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300">
            <span className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                <span className="text-base sm:text-lg">
                  {sortOptions.find(option => option.value === `${sort.key}-${sort.direction}`)?.icon}
                </span>
              </div>
              <span className="block truncate font-semibold text-slate-900">
                {sortOptions.find(option => option.value === `${sort.key}-${sort.direction}`)?.label}
              </span>
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-4">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-2xl py-2 shadow-2xl ring-1 ring-white/20 focus:outline-none border border-white/30">
              {sortOptions.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                      active ? 'bg-blue-50/80 text-blue-900' : 'text-slate-900'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                          <span className="text-base">{option.icon}</span>
                        </div>
                        <span className={`block truncate ${selected ? 'font-bold' : 'font-semibold'}`}>
                          {option.label}
                        </span>
                      </div>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

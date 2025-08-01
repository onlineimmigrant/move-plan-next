import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { colorOptions } from './colorOptions';

interface ColorSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

export const ColorSelect: React.FC<ColorSelectProps> = ({ 
  label, 
  name, 
  value, 
  onChange 
}) => {
  const selectedColor = colorOptions.find(c => c.value === value) || colorOptions[0];
  
  const handleSelectionChange = (newValue: string) => {
    onChange(name, newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Listbox value={value} onChange={handleSelectionChange}>
          <div className="relative">
            <Listbox.Button 
              className="relative w-full cursor-pointer rounded-xl bg-white border border-gray-200 py-2.5 pl-3 pr-8 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full border border-white shadow-sm ${selectedColor.color}`}></div>
                <span className="block truncate text-sm font-medium text-gray-900">{selectedColor.name}</span>
              </div>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            
            <Transition
              as={React.Fragment}
              leave="transition ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                {colorOptions.map((color) => (
                  <Listbox.Option
                    key={color.value}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-2 pl-3 pr-8 transition-colors duration-200 ${
                        active ? 'bg-sky-50 text-sky-900' : 'text-gray-900'
                      } ${selected ? 'bg-sky-100/60' : ''}`
                    }
                    value={color.value}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full border border-white shadow-sm ${color.color} ${
                            selected ? 'ring-2 ring-sky-400 ring-offset-1' : ''
                          }`}></div>
                          <span className={`block truncate text-sm ${
                            selected ? 'font-semibold text-sky-900' : 'font-medium text-gray-900'
                          }`}>
                            {color.name}
                          </span>
                        </div>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-sky-600">
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
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
    </div>
  );
};

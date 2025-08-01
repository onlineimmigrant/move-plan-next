import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { organizationTypes } from './types';

interface OrganizationType {
  value: string;
  label: string;
  icon: string;
}

interface OrganizationTypeSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

export const OrganizationTypeSelect: React.FC<OrganizationTypeSelectProps> = ({ 
  label, 
  name, 
  value = 'services',
  onChange 
}) => {
  const selectedType = organizationTypes.find(type => type.value === value) || organizationTypes[0];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Listbox value={value} onChange={(newValue) => onChange(name, newValue)}>
          <div className="relative">
            <Listbox.Button 
              className="relative w-full cursor-pointer rounded-xl bg-white border border-gray-200 py-2.5 pl-3 pr-8 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{selectedType?.icon}</span>
                <span className="block truncate text-sm font-medium text-gray-900">
                  {selectedType?.label}
                </span>
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
              <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-xl ring-1 ring-gray-200 ring-opacity-5 focus:outline-none border border-gray-200">
                {organizationTypes.map((type) => (
                  <Listbox.Option
                    key={type.value}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-2 pl-3 pr-8 transition-colors duration-200 ${
                        active ? 'bg-sky-50 text-sky-900' : 'text-gray-900'
                      } ${selected ? 'bg-sky-100/60' : ''}`
                    }
                    value={type.value}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{type.icon}</span>
                          <span className={`block truncate text-sm ${
                            selected ? 'font-semibold text-sky-900' : 'font-medium text-gray-900'
                          }`}>
                            {type.label}
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

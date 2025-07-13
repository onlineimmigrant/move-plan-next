'use client';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { CheckIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { Model } from './types';
import Link from 'next/link';

interface ModelSelectorProps {
  selectedModel: Model | null;
  models: Model[];
  selectModel: (model: Model | null) => void;
  goToSettings: () => void;
}

export default function ModelSelector({
  selectedModel,
  models,
  selectModel,
  goToSettings,
}: ModelSelectorProps) {
  const sortedModels = selectedModel
    ? [
        selectedModel,
        ...models.filter((m) => m.id !== selectedModel.id || m.type !== selectedModel.type),
      ]
    : models;

  return (
    <Listbox value={selectedModel} onChange={selectModel}>
      {({ open }) => (
        <div>
          <Tooltip content="Select Model">
            <ListboxButton className="cursor-pointer border-2 border-gray-50 rounded-full p-2 relative">
              {selectedModel?.icon ? (
                <img
                  src={selectedModel.icon}
                  alt="Model Icon"
                  className="h-8 w-8 object-contain"
                  onError={() => selectedModel && selectModel({ ...selectedModel, icon: null })}
                />
              ) : (
                <RocketLaunchIcon className="h-6 w-6 text-gray-400 font-bold" />
              )}
            </ListboxButton>
          </Tooltip>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <ListboxOptions className="absolute z-10 right-0 mt-1 w-48 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-200 focus:outline-none">
              {sortedModels.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No models available
                </div>
              ) : (
                sortedModels.map((model) => (
                  <ListboxOption
                    key={`${model.type}-${model.id}`}
                    value={model}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 ${
                        active ? 'bg-sky-100 text-sky-900' : 'text-gray-900'
                      }`
                    }
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">{model.name}</span>
                      {selectedModel?.id === model.id && selectedModel?.type === model.type && (
                        <CheckIcon className="h-5 w-5 text-sky-500" />
                      )}
                    </div>
                    <p className="text-xs font-thin text-gray-600 capitalize">{model.type}</p>
                  </ListboxOption>
                ))
              )}
              <hr className="text-gray-200" />
              <div className="p-2">
                <button
                  onClick={goToSettings}
                  className="cursor-pointer pl-2 w-full text-left text-sm text-sky-500 hover:underline"
                >
                  Manage Models
                </button>
                <Link
                  href="/account/files"
                  className="cursor-pointer pl-2 w-full text-left text-sm text-sky-500 hover:underline"
                >
                  Manage Files
                </Link>
              </div>
            </ListboxOptions>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
'use client';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { CheckIcon, RocketLaunchIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
            <ListboxButton className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 min-w-[120px]">
              <div className="flex items-center gap-2 flex-1">
                {selectedModel?.icon ? (
                  <img
                    src={selectedModel.icon}
                    alt="Model Icon"
                    className="h-5 w-5 object-contain rounded"
                    onError={() => selectedModel && selectModel({ ...selectedModel, icon: null })}
                  />
                ) : (
                  <RocketLaunchIcon className="h-5 w-5 text-slate-400" />
                )}
                <span className="text-sm font-medium text-slate-700 truncate">
                  {selectedModel ? selectedModel.name.split('-')[0] : 'Select Model'}
                </span>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
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
            <ListboxOptions className="absolute z-50 right-0 mt-2 w-64 max-h-80 overflow-auto rounded-xl bg-white py-2 shadow-xl ring-1 ring-slate-200 focus:outline-none border border-slate-100">
              {sortedModels.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  No models available
                </div>
              ) : (
                sortedModels.map((model) => (
                  <ListboxOption
                    key={`${model.type}-${model.id}`}
                    value={model}
                    className={({ active }) =>
                      `relative cursor-pointer select-none px-4 py-3 transition-colors duration-150 ${
                        active ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {model.icon ? (
                          <img
                            src={model.icon}
                            alt="Model Icon"
                            className="h-6 w-6 object-contain rounded"
                          />
                        ) : (
                          <RocketLaunchIcon className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                          <div className="text-sm font-medium">{model.name}</div>
                          <div className="text-xs text-slate-500 capitalize">{model.type}</div>
                        </div>
                      </div>
                      {selectedModel?.id === model.id && selectedModel?.type === model.type && (
                        <CheckIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </ListboxOption>
                ))
              )}

              <div className="border-t border-slate-200 mt-2 pt-2">
                <button
                  onClick={goToSettings}
                  className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
                >
                  Manage Models
                </button>
                <Link
                  href="/account/files"
                  className="block px-4 py-2 text-left text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
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
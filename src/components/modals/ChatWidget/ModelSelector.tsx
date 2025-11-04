'use client';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { CheckIcon, RocketLaunchIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { Model } from './types';

interface ModelSelectorProps {
  selectedModel: Model | null;
  models: Model[];
  selectModel: (model: Model | null) => void;
  goToSettings: () => void;
  onOpenFiles: () => void;
}

export default function ModelSelector({
  selectedModel,
  models,
  selectModel,
  goToSettings,
  onOpenFiles,
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
        <div className="relative">
          <Tooltip content="Select Model">
            <ListboxButton className="flex items-center gap-2 px-2 py-1 transition-all duration-200 focus:outline-none hover:opacity-70">
              <div className="flex items-center gap-2">
                {selectedModel?.icon ? (
                  <img
                    src={selectedModel.icon}
                    alt="Model Icon"
                    className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                    onError={() => selectedModel && selectModel({ ...selectedModel, icon: null })}
                  />
                ) : (
                  <RocketLaunchIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 dark:text-slate-500" />
                )}
                <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {selectedModel ? selectedModel.name : 'AI Assistant'}
                </span>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
            <ListboxOptions className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-64 max-h-80 overflow-auto rounded-xl backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 py-2 shadow-lg border-0 focus:outline-none">
              {sortedModels.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                  No models available
                </div>
              ) : (
                sortedModels.map((model) => (
                  <ListboxOption
                    key={`${model.type}-${model.id}`}
                    value={model}
                    className={({ active }) =>
                      `relative cursor-pointer select-none px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                        active 
                          ? 'bg-blue-500/20 dark:bg-blue-400/20 backdrop-blur-xl scale-[1.02]' 
                          : 'hover:bg-white/30 dark:hover:bg-gray-800/30'
                      }`
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {model.icon ? (
                          <img
                            src={model.icon}
                            alt="Model Icon"
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <RocketLaunchIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{model.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{model.type}</div>
                        </div>
                      </div>
                      {selectedModel?.id === model.id && selectedModel?.type === model.type && (
                        <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </ListboxOption>
                ))
              )}

              <div className="border-t border-slate-300/50 dark:border-slate-600/50 mt-2 pt-2 mx-2">
                <button
                  onClick={goToSettings}
                  className="w-full px-4 py-2 rounded-lg text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/20 backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  Manage Models
                </button>
                <button
                  onClick={onOpenFiles}
                  className="w-full px-4 py-2 rounded-lg text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/20 backdrop-blur-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  Manage Files
                </button>
              </div>
            </ListboxOptions>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
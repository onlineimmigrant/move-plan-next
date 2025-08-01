import React, { useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Common languages with their codes and flag emojis
export const availableLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },

  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },

  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  ];

interface MultiLanguageSelectProps {
  label: string;
  name: string;
  value: string[];
  onChange: (name: string, value: string[]) => void;
}

export const MultiLanguageSelect: React.FC<MultiLanguageSelectProps> = ({ 
  label, 
  name, 
  value = ['en'], // Default to English
  onChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedLanguages = value.map(code => 
    availableLanguages.find(lang => lang.code === code)
  ).filter(Boolean) as Language[];

  const handleLanguageToggle = (language: Language) => {
    const isSelected = value.includes(language.code);
    let newValue: string[];
    
    if (isSelected) {
      // Don't allow removing the last language
      if (value.length === 1) return;
      newValue = value.filter(code => code !== language.code);
    } else {
      newValue = [...value, language.code];
    }
    
    onChange(name, newValue);
  };

  const removeLanguage = (languageCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't allow removing the last language
    if (value.length === 1) return;
    const newValue = value.filter(code => code !== languageCode);
    onChange(name, newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Listbox value={value} onChange={(newValue) => onChange(name, newValue)} multiple>
          <div className="relative">
            <Listbox.Button 
              className="relative w-full cursor-pointer rounded-xl bg-white border border-gray-200 py-2.5 pl-3 pr-8 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 min-h-[42px]"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="flex flex-wrap gap-1">
                {selectedLanguages.length > 0 ? (
                  selectedLanguages.map((language) => (
                    <span
                      key={language.code}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-medium"
                    >
                      <span>{language.flag}</span>
                      <span>{language.name}</span>
                      {value.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => removeLanguage(language.code, e)}
                          className="ml-1 text-sky-600 hover:text-sky-800 transition-colors"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">Select languages...</span>
                )}
              </div>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            
            <Transition
              show={isOpen}
              as={React.Fragment}
              leave="transition ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setIsOpen(false)}
            >
              <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-xl ring-1 ring-gray-200ring-opacity-5 focus:outline-none border border-gray-200">
                {availableLanguages.map((language) => {
                  const isSelected = value.includes(language.code);
                  return (
                    <Listbox.Option
                      key={language.code}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-3 pr-8 transition-colors duration-200 ${
                          active ? 'bg-sky-50 text-sky-900' : 'text-gray-900'
                        } ${isSelected ? 'bg-sky-100/60' : ''}`
                      }
                      value={language.code}
                      onClick={() => handleLanguageToggle(language)}
                    >
                      {({ active }) => (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{language.flag}</span>
                            <span className={`block truncate text-sm ${
                              isSelected ? 'font-semibold text-sky-900' : 'font-medium text-gray-900'
                            }`}>
                              {language.name}
                            </span>
                            <span className="text-xs text-gray-500">({language.code})</span>
                          </div>
                          {isSelected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-sky-600">
                              <CheckIcon className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  );
                })}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
    </div>
  );
};

interface SingleLanguageSelectProps {
  label: string;
  name: string;
  value: string;
  supportedLanguages: string[]; // Available options based on supported languages
  onChange: (name: string, value: string) => void;
}

export const SingleLanguageSelect: React.FC<SingleLanguageSelectProps> = ({ 
  label, 
  name, 
  value = 'en',
  supportedLanguages = ['en'],
  onChange 
}) => {
  const availableOptions = supportedLanguages.map(code => 
    availableLanguages.find(lang => lang.code === code)
  ).filter(Boolean) as Language[];
  
  const selectedLanguage = availableLanguages.find(lang => lang.code === value) || availableOptions[0];

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
                <span className="text-lg">{selectedLanguage?.flag}</span>
                <span className="block truncate text-sm font-medium text-gray-900">
                  {selectedLanguage?.name}
                </span>
                <span className="text-xs text-gray-500">({selectedLanguage?.code})</span>
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
                {availableOptions.map((language) => (
                  <Listbox.Option
                    key={language.code}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-2 pl-3 pr-8 transition-colors duration-200 ${
                        active ? 'bg-sky-50 text-sky-900' : 'text-gray-900'
                      } ${selected ? 'bg-sky-100/60' : ''}`
                    }
                    value={language.code}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{language.flag}</span>
                          <span className={`block truncate text-sm ${
                            selected ? 'font-semibold text-sky-900' : 'font-medium text-gray-900'
                          }`}>
                            {language.name}
                          </span>
                          <span className="text-xs text-gray-500">({language.code})</span>
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
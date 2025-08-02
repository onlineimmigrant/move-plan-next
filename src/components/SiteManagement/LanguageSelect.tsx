import React, { useState, useRef, useEffect } from 'react';
import { ChevronUpDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  
  const selectedLanguages = value.map(code => 
    availableLanguages.find(lang => lang.code === code)
  ).filter(Boolean) as Language[];

  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateButtonRect();
      const handleScroll = () => updateButtonRect();
      const handleResize = () => updateButtonRect();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

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

  const handleRemoveLanguage = (e: React.MouseEvent | React.KeyboardEvent, languageCode: string) => {
    e.stopPropagation();
    if (value.length === 1) return; // Don't allow removing the last language
    const newValue = value.filter(code => code !== languageCode);
    onChange(name, newValue);
  };

  const dropdownContent = isOpen && buttonRect && createPortal(
    <div
      className="fixed z-[99999] mt-2 max-h-60 overflow-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl py-2 text-sm focus:outline-none border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: buttonRect.width,
      }}
    >
      {availableLanguages.map((language) => {
        const isSelected = value.includes(language.code);
        return (
          <button
            key={language.code}
            onClick={() => handleLanguageToggle(language)}
            className={`relative cursor-pointer select-none py-3 pl-4 pr-10 w-full text-left transition-colors duration-200 hover:bg-sky-50/80 hover:text-sky-900 ${
              isSelected ? 'bg-sky-100/60 text-sky-900' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{language.flag}</span>
              <span className="block truncate text-sm font-light">{language.name}</span>
            </div>
            {isSelected && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <CheckIcon className="h-4 w-4 text-sky-600" aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-light text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-pointer rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200/60 py-3 pl-4 pr-10 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
        >
          <div className="flex flex-wrap gap-2 items-center">
            {selectedLanguages.length > 0 ? (
              selectedLanguages.map((language) => (
                <span
                  key={language.code}
                  className="inline-flex items-center space-x-1 bg-sky-100/80 text-sky-800 text-xs font-light px-2 py-1 rounded-lg border border-sky-200/60"
                >
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                  {selectedLanguages.length > 1 && (
                    <span
                      onClick={(e) => handleRemoveLanguage(e, language.code)}
                      className="ml-1 text-sky-600 hover:text-sky-800 transition-colors duration-200 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleRemoveLanguage(e, language.code);
                        }
                      }}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="text-sm font-light text-gray-500">Select languages...</span>
            )}
          </div>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>
        
        {dropdownContent}
        
        {/* Click outside handler */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

interface SingleLanguageSelectProps {
  label: string;
  name: string;
  value: string;
  supportedLanguages: string[];
  onChange: (name: string, value: string) => void;
}

export const SingleLanguageSelect: React.FC<SingleLanguageSelectProps> = ({ 
  label, 
  name, 
  value, 
  supportedLanguages,
  onChange 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // Filter available languages to only show supported ones
  const filteredLanguages = availableLanguages.filter(lang => 
    supportedLanguages.includes(lang.code)
  );

  const selectedLanguage = filteredLanguages.find(lang => lang.code === value) || filteredLanguages[0];

  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateButtonRect();
      const handleScroll = () => updateButtonRect();
      const handleResize = () => updateButtonRect();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const handleChange = (newValue: string) => {
    onChange(name, newValue);
    setIsOpen(false);
  };

  const dropdownContent = isOpen && buttonRect && createPortal(
    <div
      className="fixed z-[99999] mt-2 max-h-60 overflow-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl py-2 text-sm focus:outline-none border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: buttonRect.width,
      }}
    >
      {filteredLanguages.map((language) => (
        <button
          key={language.code}
          onClick={() => handleChange(language.code)}
          className={`relative cursor-pointer select-none py-3 pl-4 pr-10 w-full text-left transition-colors duration-200 hover:bg-sky-50/80 hover:text-sky-900 ${
            language.code === value ? 'bg-sky-100/60 text-sky-900' : 'text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{language.flag}</span>
            <span className="block truncate text-sm font-light">{language.name}</span>
          </div>
          {language.code === value && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <CheckIcon className="h-4 w-4 text-sky-600" aria-hidden="true" />
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-light text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-pointer rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200/60 py-3 pl-4 pr-10 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{selectedLanguage?.flag}</span>
            <span className="block truncate text-sm font-light text-gray-900">
              {selectedLanguage?.name || 'Select language...'}
            </span>
          </div>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>
        
        {dropdownContent}
        
        {/* Click outside handler */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

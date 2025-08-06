import React, { useState, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Use the same language data as LanguageSelect but exclude NL as requested
const availableLanguages: Language[] = [
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

interface TranslationsFieldProps {
  field: {
    name: string;
    label: string;
    placeholder?: string;
  };
  value: Record<string, string>;
  onChange: (name: string, value: Record<string, string>) => void;
  supportedLanguages?: string[]; // Array of language codes from Language & Localization
}

export const TranslationsField: React.FC<TranslationsFieldProps> = ({
  field,
  value = {},
  onChange,
  supportedLanguages = ['en'] // Default to English if no supported languages provided
}) => {
  const [activeLocale, setActiveLocale] = useState<string>(supportedLanguages[0] || 'en');

  // Filter available languages to only show supported ones
  const displayLanguages = availableLanguages.filter(lang => 
    supportedLanguages.includes(lang.code)
  );

  // Ensure activeLocale is valid for the current supported languages
  useEffect(() => {
    if (!supportedLanguages.includes(activeLocale)) {
      setActiveLocale(supportedLanguages[0] || 'en');
    }
  }, [supportedLanguages, activeLocale]);

  const handleTranslationChange = (locale: string, translation: string) => {
    const newTranslations = {
      ...value,
      [locale]: translation
    };
    
    // Remove empty translations
    if (translation.trim() === '') {
      delete newTranslations[locale];
    }
    
    onChange(field.name, newTranslations);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-light text-gray-600 mb-1">
        {field.label}
      </label>
      
      {/* Language tabs with flags and icons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {displayLanguages.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => setActiveLocale(language.code)}
            className={`flex items-center space-x-2 px-3 py-2 text-xs rounded-lg transition-all duration-200 border ${
              activeLocale === language.code
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
            }`}
          >
            <span className="text-base">{language.flag}</span>
            <span className="font-medium">{language.code.toUpperCase()}</span>
            {value[language.code] && (
              <span className="text-green-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Translation input with language name indicator */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            {displayLanguages.find(lang => lang.code === activeLocale)?.name} translation
          </span>
          {value[activeLocale] && (
            <span className="text-xs text-green-600 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Translated
            </span>
          )}
        </div>
        <textarea
          value={value[activeLocale] || ''}
          onChange={(e) => handleTranslationChange(activeLocale, e.target.value)}
          placeholder={field.placeholder ? `${field.placeholder} (${displayLanguages.find(lang => lang.code === activeLocale)?.name})` : ''}
          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
          rows={3}
        />
      </div>
    </div>
  );
};

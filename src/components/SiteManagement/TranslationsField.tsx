import React, { useState } from 'react';

interface TranslationsFieldProps {
  field: {
    name: string;
    label: string;
    placeholder?: string;
  };
  value: Record<string, string>;
  onChange: (name: string, value: Record<string, string>) => void;
}

const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];

export const TranslationsField: React.FC<TranslationsFieldProps> = ({
  field,
  value = {},
  onChange
}) => {
  const [activeLocale, setActiveLocale] = useState<string>('en');

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
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      
      {/* Locale tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {supportedLocales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              activeLocale === locale
                ? 'bg-sky-500 text-white'
                : value[locale]
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {locale.toUpperCase()}
            {value[locale] && <span className="ml-1">✓</span>}
          </button>
        ))}
      </div>

      {/* Translation input for active locale */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Translation for {activeLocale.toUpperCase()}
        </label>
        {field.name.includes('description') ? (
          <textarea
            value={value[activeLocale] || ''}
            onChange={(e) => handleTranslationChange(activeLocale, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} in ${activeLocale.toUpperCase()}`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none text-sm"
          />
        ) : (
          <input
            type="text"
            value={value[activeLocale] || ''}
            onChange={(e) => handleTranslationChange(activeLocale, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} in ${activeLocale.toUpperCase()}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
          />
        )}
      </div>

      {/* Summary of existing translations */}
      {Object.keys(value).length > 0 && (
        <div className="text-xs text-gray-500">
          <span>Translations available: </span>
          {Object.keys(value).map(locale => (
            <span key={locale} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1">
              {locale.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

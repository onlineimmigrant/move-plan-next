'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

interface Language {
  language_code: string;
}

interface LanguageSwitcherHorizontalProps {
  activeLanguages: Language[];
}

const LanguageSwitcherHorizontal: React.FC<LanguageSwitcherHorizontalProps> = ({ activeLanguages }) => {
  const { i18n } = useTranslation();
  const [languages, setLanguages] = useState<Language[]>(activeLanguages || []);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isLanguageSwitcherEnabled] = useState(true);

  useEffect(() => {
    if (activeLanguages && activeLanguages.length > 0) {
      setLanguages(activeLanguages);

      // Set initial language from localStorage or first active language
      const savedLanguage = localStorage.getItem('language') || activeLanguages[0]?.language_code;
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
        setSelectedLanguage(activeLanguages.find((lang) => lang.language_code === savedLanguage) || null);
      }
    }
  }, [activeLanguages, i18n]);

  const changeLanguage = (language: Language) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language.language_code);
    localStorage.setItem('language', language.language_code);
  };

  if (!isLanguageSwitcherEnabled || languages.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <div className="flex space-x-1 p-1.5 bg-gray-100/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
        {languages.map((language) => (
          <button
            key={language.language_code}
            onClick={() => changeLanguage(language)}
            className={`relative px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 focus:ring-offset-transparent antialiased ${
              language.language_code === selectedLanguage?.language_code
                ? 'bg-white text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-semibold'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
            }`}
          >
            <span className="relative z-10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              {language.language_code.toUpperCase()}
            </span>
            {language.language_code === selectedLanguage?.language_code && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-xl pointer-events-none"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcherHorizontal;
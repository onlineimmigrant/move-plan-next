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
  const [isLanguageSwitcherEnabled, setIsLanguageSwitcherEnabled] = useState(true);

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
    <div className="flex justify-center space-x-2">
      {languages.map((language) => (
        <button
          key={language.language_code}
          onClick={() => changeLanguage(language)}
          className={`px-0.5 py-0.5 font-light text-xs ${
            language.language_code === selectedLanguage?.language_code
              ? 'bg-gray-700 text-white'
              : 'bg-transparent text-gray-700'
          } hover:bg-gray-200 hover:text-white rounded-sm`}
        >
          {language.language_code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcherHorizontal;
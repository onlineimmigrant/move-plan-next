/**
 * TranslationsSection - Manage translations for Hero Section
 * 
 * Table-based layout showing translations for all supported languages
 * Fetches original language and supported locales from organization settings
 */

'use client';

import React, { useState } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { HeroFormData } from '../types';
import { useHeroSectionEdit } from '../context';
import { useOrganizationSettings, useAITranslation } from '../hooks';
import { getLanguageName } from '../utils/languages';

interface TranslationsSectionProps {
  formData: HeroFormData;
  setFormData: (data: HeroFormData) => void;
  primaryColor: string;
}

export function TranslationsSection({ formData, setFormData, primaryColor }: TranslationsSectionProps) {
  const { organizationId } = useHeroSectionEdit();
  const { settings, loading } = useOrganizationSettings(organizationId);
  const { translateAll, isTranslating, progress, error: translationError } = useAITranslation();

  const originalLanguage = settings.language || 'en';
  const supportedLocales = settings.supported_locales || [];

  // JSONB Modal state
  const [jsonbModal, setJsonbModal] = useState<{
    isOpen: boolean;
    field: 'title_translation' | 'description_translation' | 'button_translation' | null;
    value: string;
  }>({
    isOpen: false,
    field: null,
    value: '',
  });

  // Get all unique language codes from translation fields
  const getAllLanguageCodes = (): string[] => {
    const codes = new Set<string>();
    
    Object.keys(formData.title_translation || {}).forEach(code => codes.add(code));
    Object.keys(formData.description_translation || {}).forEach(code => codes.add(code));
    Object.keys(formData.button_translation || {}).forEach(code => codes.add(code));
    
    return Array.from(codes).sort();
  };

  const languageCodes = getAllLanguageCodes();

  // Update translation for a specific field and language
  const updateTranslation = (
    field: 'title_translation' | 'description_translation' | 'button_translation',
    languageCode: string,
    value: string
  ) => {
    setFormData({
      ...formData,
      [field]: {
        ...formData[field],
        [languageCode]: value,
      },
    });
  };

  // Update original content fields
  const updateOriginalField = (field: 'title' | 'description' | 'button', value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Add all missing languages from supported_locales
  const addMissingLanguages = () => {
    console.log('[TranslationsSection] Add Missing Languages clicked');
    console.log('[TranslationsSection] Current language codes:', languageCodes);
    console.log('[TranslationsSection] Supported locales:', supportedLocales);
    
    const missing = supportedLocales.filter(locale => !languageCodes.includes(locale));
    console.log('[TranslationsSection] Missing languages:', missing);
    
    if (missing.length === 0) {
      console.log('[TranslationsSection] No missing languages to add');
      alert('All supported languages are already added!');
      return;
    }

    const newTitleTranslation = { ...formData.title_translation };
    const newDescriptionTranslation = { ...formData.description_translation };
    const newButtonTranslation = { ...formData.button_translation };

    missing.forEach(code => {
      newTitleTranslation[code] = '';
      newDescriptionTranslation[code] = '';
      newButtonTranslation[code] = '';
    });

    console.log('[TranslationsSection] Adding languages to form data');
    setFormData({
      ...formData,
      title_translation: newTitleTranslation,
      description_translation: newDescriptionTranslation,
      button_translation: newButtonTranslation,
    });
  };

  // Remove a language
  const removeLanguage = (code: string) => {
    const newTitleTranslation = { ...formData.title_translation };
    const newDescriptionTranslation = { ...formData.description_translation };
    const newButtonTranslation = { ...formData.button_translation };

    delete newTitleTranslation[code];
    delete newDescriptionTranslation[code];
    delete newButtonTranslation[code];

    setFormData({
      ...formData,
      title_translation: newTitleTranslation,
      description_translation: newDescriptionTranslation,
      button_translation: newButtonTranslation,
    });
  };

  // Open JSONB modal
  const openJsonbModal = (field: 'title_translation' | 'description_translation' | 'button_translation') => {
    const currentValue = formData[field] || {};
    setJsonbModal({
      isOpen: true,
      field,
      value: JSON.stringify(currentValue, null, 2),
    });
  };

  // Close JSONB modal
  const closeJsonbModal = () => {
    setJsonbModal({
      isOpen: false,
      field: null,
      value: '',
    });
  };

  // Apply JSONB data
  const applyJsonbData = () => {
    if (!jsonbModal.field) return;

    try {
      const parsed = JSON.parse(jsonbModal.value);
      
      // Validate it's an object
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        alert('Invalid JSON format. Please provide a valid object.');
        return;
      }

      setFormData({
        ...formData,
        [jsonbModal.field]: parsed,
      });

      closeJsonbModal();
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  // AI Translate All
  const handleAITranslateAll = async () => {
    if (!formData.title && !formData.description && !formData.button) {
      alert('Please fill in at least one field (title, description, or button) before translating.');
      return;
    }

    if (supportedLocales.length === 0) {
      alert('No supported languages configured in organization settings.');
      return;
    }

    const fields = [
      { name: 'title', content: formData.title || '' },
      { name: 'description', content: formData.description || '' },
      { name: 'button', content: formData.button || '' },
    ].filter(f => f.content.trim());

    console.log('[TranslationsSection] Starting AI translation for', fields.length, 'fields');

    const result = await translateAll({
      tableName: 'website_hero',
      fields,
      sourceLanguage: originalLanguage,
      targetLanguages: supportedLocales,
    });

    if (result.success && result.translations) {
      console.log('[TranslationsSection] Translation successful:', result.translations);

      setFormData({
        ...formData,
        title_translation: result.translations.title || formData.title_translation || {},
        description_translation: result.translations.description || formData.description_translation || {},
        button_translation: result.translations.button || formData.button_translation || {},
      });

      if (result.errors && result.errors.length > 0) {
        console.warn('[TranslationsSection] Partial errors:', result.errors);
        alert(`Translation completed with some errors:\n${result.errors.join('\n')}`);
      } else {
        alert('All translations completed successfully!');
      }
    } else {
      console.error('[TranslationsSection] Translation failed:', result.errors);
      alert(`Translation failed:\n${result.errors?.join('\n') || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  return (
    <>
      {/* Header with language information */}
      <div className="flex items-center gap-2 mb-4 px-2 sm:px-6">
        <GlobeAltIcon className="w-5 h-5" style={{ color: primaryColor }} />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Original: <span className="font-medium">{getLanguageName(originalLanguage)}</span>
          {supportedLocales.length > 0 && (
            <span className="ml-2">
              • Supported: {supportedLocales.length} {supportedLocales.length === 1 ? 'language' : 'languages'}
            </span>
          )}
        </p>
      </div>

      {/* Table - Scrollable */}
      <div className="overflow-x-auto border-t border-b border-gray-200 dark:border-gray-700 -mx-2 sm:-mx-6">
        <table className="w-full text-sm min-w-[600px]">
          {/* Table Header */}
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-20 border-r border-gray-200 dark:border-gray-700">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-32">
                Language
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                <div className="flex items-center justify-between gap-2">
                  <span>Title</span>
                  <button
                    onClick={() => openJsonbModal('title_translation')}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80"
                    style={{
                      borderColor: `${primaryColor}40`,
                      color: primaryColor,
                      backgroundColor: `${primaryColor}10`,
                    }}
                    title="Edit as JSONB"
                  >
                    {'{}'}
                  </button>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                <div className="flex items-center justify-between gap-2">
                  <span>Description</span>
                  <button
                    onClick={() => openJsonbModal('description_translation')}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80"
                    style={{
                      borderColor: `${primaryColor}40`,
                      color: primaryColor,
                      backgroundColor: `${primaryColor}10`,
                    }}
                    title="Edit as JSONB"
                  >
                    {'{}'}
                  </button>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                <div className="flex items-center justify-between gap-2">
                  <span>Button</span>
                  <button
                    onClick={() => openJsonbModal('button_translation')}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80"
                    style={{
                      borderColor: `${primaryColor}40`,
                      color: primaryColor,
                      backgroundColor: `${primaryColor}10`,
                    }}
                    title="Edit as JSONB"
                  >
                    {'{}'}
                  </button>
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Original Language Row - Highlighted */}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10">
              {/* Language Code - Fixed */}
              <td className="sticky left-0 z-[5] bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                <span 
                  className="text-xs font-bold px-2 py-1 rounded" 
                  style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                >
                  {originalLanguage.toUpperCase()}
                </span>
              </td>

              {/* Language Name */}
              <td className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {getLanguageName(originalLanguage)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">(Original)</span>
                </div>
              </td>

              {/* Title - Original */}
              <td className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10">
                <textarea
                  value={formData.title || ''}
                  onChange={(e) => updateOriginalField('title', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </td>

              {/* Description - Original */}
              <td className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10">
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateOriginalField('description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </td>

              {/* Button - Original */}
              <td className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10">
                <textarea
                  value={formData.button || ''}
                  onChange={(e) => updateOriginalField('button', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />
              </td>
            </tr>

            {/* Translation Rows */}
            {languageCodes.map((languageCode) => (
              <tr key={languageCode} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                {/* Language Code - Fixed */}
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/30 px-4 py-3 border-r border-gray-200 dark:border-gray-700 transition-colors">
                  <span 
                    className="text-xs font-bold px-2 py-1 rounded" 
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {languageCode.toUpperCase()}
                  </span>
                </td>

                {/* Language Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getLanguageName(languageCode)}
                    </span>
                    <button
                      onClick={() => removeLanguage(languageCode)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove language"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </td>

                {/* Title Translation */}
                <td className="px-4 py-3">
                  <textarea
                    value={formData.title_translation?.[languageCode] || ''}
                    onChange={(e) => updateTranslation('title_translation', languageCode, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </td>

                {/* Description Translation */}
                <td className="px-4 py-3">
                  <textarea
                    value={formData.description_translation?.[languageCode] || ''}
                    onChange={(e) => updateTranslation('description_translation', languageCode, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </td>

                {/* Button Translation */}
                <td className="px-4 py-3">
                  <textarea
                    value={formData.button_translation?.[languageCode] || ''}
                    onChange={(e) => updateTranslation('button_translation', languageCode, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 z-30">
        <button
          onClick={addMissingLanguages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:opacity-80 active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
          style={{
            borderColor: `${primaryColor}40`,
            color: primaryColor,
            backgroundColor: `${primaryColor}10`,
          }}
          title="Add languages from supported locales that are not yet in translations"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Missing Languages</span>
          <span className="sm:hidden">Add Missing</span>
        </button>
        
        <button
          onClick={handleAITranslateAll}
          disabled={isTranslating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:opacity-80 active:scale-95 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: isTranslating ? '#94a3b8' : `${primaryColor}40`,
            color: isTranslating ? '#64748b' : primaryColor,
            backgroundColor: isTranslating ? '#f1f5f9' : `${primaryColor}10`,
          }}
          title={isTranslating ? "Translating..." : "Translate all fields using AI"}
        >
          {isTranslating ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
              <span className="hidden sm:inline">
                {progress ? `Translating ${progress.current}... (${progress.completed}/${progress.total})` : 'Translating...'}
              </span>
              <span className="sm:hidden">Translating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden sm:inline">AI Translate All</span>
              <span className="sm:hidden">AI Translate</span>
            </>
          )}
        </button>
      </div>

      {/* JSONB Modal */}
      {jsonbModal.isOpen && jsonbModal.field && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit JSONB - {jsonbModal.field === 'title_translation' ? 'Title' : jsonbModal.field === 'description_translation' ? 'Description' : 'Button'}
              </h3>
              <button
                onClick={closeJsonbModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <textarea
                value={jsonbModal.value}
                onChange={(e) => setJsonbModal({ ...jsonbModal, value: e.target.value })}
                placeholder={`{\n  "de": "German translation",\n  "en": "English translation",\n  "es": "Spanish translation",\n  "fr": "French translation",\n  "it": "Italian translation",\n  "ja": "Japanese translation",\n  "nl": "Dutch translation",\n  "pl": "Polish translation",\n  "pt": "Portuguese translation",\n  "ru": "Russian translation",\n  "zh": "Chinese translation"\n}`}
                rows={15}
                className="w-full px-4 py-3 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-none"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Paste JSONB object with language codes as keys. Example: {`{"en": "Hello", "de": "Hallo"}`}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeJsonbModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyJsonbData}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

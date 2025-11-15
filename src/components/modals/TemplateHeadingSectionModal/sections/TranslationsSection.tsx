/**
 * TranslationsSection - Manage translations for Template Heading Section
 * 
 * Table-based layout showing translations for name, description, and button text
 * Fetches original language and supported locales from organization settings
 */

'use client';

import React, { useState } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { HeadingFormData } from '../types';
import { useSettings } from '@/context/SettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useTemplateHeadingSectionEdit } from '../context';
import { useToast } from '@/components/Shared/ToastContainer';
import Button from '@/ui/Button';

interface TranslationsSectionProps {
  formData: HeadingFormData;
  setFormData: (data: HeadingFormData) => void;
  primaryColor: string;
}

// Helper to get language name
const getLanguageName = (code: string): string => {
  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    nl: 'Dutch',
    pl: 'Polish',
    tr: 'Turkish',
    vi: 'Vietnamese',
    th: 'Thai',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
  };
  return languageNames[code] || code.toUpperCase();
};

export function TranslationsSection({ formData, setFormData, primaryColor }: TranslationsSectionProps) {
  const { settings } = useSettings();
  const { translateAll, isTranslating, progress } = useTranslation();
  const { updateSection, editingSection } = useTemplateHeadingSectionEdit();
  const toast = useToast();

  const originalLanguage = settings?.language || 'en';
  const supportedLocales = settings?.supported_locales || [];

  // Track if translations have been modified
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // JSONB Modal state
  const [jsonbModal, setJsonbModal] = useState<{
    isOpen: boolean;
    field: 'name_translation' | 'description_text_translation' | 'button_text_translation' | null;
    value: string;
  }>({
    isOpen: false,
    field: null,
    value: '',
  });

  // Get all unique language codes from all translation fields
  const getAllLanguageCodes = (): string[] => {
    const codes = new Set<string>();
    
    Object.keys(formData.name_translation || {}).forEach(code => codes.add(code));
    Object.keys(formData.description_text_translation || {}).forEach(code => codes.add(code));
    Object.keys(formData.button_text_translation || {}).forEach(code => codes.add(code));
    
    return Array.from(codes).sort();
  };

  const languageCodes = getAllLanguageCodes();

  // Update translation
  const updateTranslation = (
    field: 'name_translation' | 'description_text_translation' | 'button_text_translation',
    languageCode: string,
    value: string
  ) => {
    setFormData({
      ...formData,
      [field]: {
        ...(formData[field] || {}),
        [languageCode]: value,
      },
    });
    setHasUnsavedChanges(true);
  };

  // Update original field
  const updateOriginalField = (field: 'name' | 'description_text' | 'button_text', value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    setHasUnsavedChanges(true);
  };

  // Add all missing languages
  const addMissingLanguages = () => {
    const missing = supportedLocales.filter(locale => !languageCodes.includes(locale));
    
    if (missing.length === 0) {
      alert('All supported languages are already added!');
      return;
    }

    const newNameTranslation = { ...formData.name_translation };
    const newDescriptionTranslation = { ...formData.description_text_translation };
    const newButtonTranslation = { ...formData.button_text_translation };
    
    missing.forEach(code => {
      newNameTranslation[code] = '';
      newDescriptionTranslation[code] = '';
      newButtonTranslation[code] = '';
    });

    setFormData({
      ...formData,
      name_translation: newNameTranslation,
      description_text_translation: newDescriptionTranslation,
      button_text_translation: newButtonTranslation,
    });
    setHasUnsavedChanges(true);
  };

  // Remove a language
  const removeLanguage = (code: string) => {
    const newNameTranslation = { ...formData.name_translation };
    const newDescriptionTranslation = { ...formData.description_text_translation };
    const newButtonTranslation = { ...formData.button_text_translation };
    
    delete newNameTranslation[code];
    delete newDescriptionTranslation[code];
    delete newButtonTranslation[code];

    setFormData({
      ...formData,
      name_translation: newNameTranslation,
      description_text_translation: newDescriptionTranslation,
      button_text_translation: newButtonTranslation,
    });
    setHasUnsavedChanges(true);
  };

  // Open JSONB modal
  const openJsonbModal = (
    field: 'name_translation' | 'description_text_translation' | 'button_text_translation'
  ) => {
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
      
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        alert('Invalid JSON format. Please provide a valid object.');
        return;
      }

      setFormData({
        ...formData,
        [jsonbModal.field]: parsed,
      });

      setHasUnsavedChanges(true);
      closeJsonbModal();
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  // AI Translate All
  const handleAITranslateAll = async () => {
    if (!formData.name && !formData.description_text && !formData.button_text) {
      alert('No content to translate.');
      return;
    }

    let translatedCount = 0;
    let skippedCount = 0;

    // Helper function to check if a translation already exists for all target languages
    const needsTranslation = (
      existingTranslations: Record<string, string> | undefined,
      targetLanguages: string[]
    ): string[] => {
      if (!existingTranslations) return targetLanguages;
      
      // Return only languages that don't have translations yet
      return targetLanguages.filter(lang => {
        const translation = existingTranslations[lang];
        return !translation || (typeof translation === 'string' && !translation.trim());
      });
    };

    // Translate name
    const nameMissingLangs = formData.name?.trim() 
      ? needsTranslation(formData.name_translation, supportedLocales)
      : [];

    // Track current state to avoid stale closures
    let currentFormData = formData;

    if (nameMissingLangs.length > 0) {
      const result = await translateAll({
        tableName: 'website_templatesectionheading',
        fields: [{ name: 'name', content: currentFormData.name }],
        sourceLanguage: originalLanguage,
        targetLanguages: nameMissingLangs,
      });

      if (result.success && result.translations?.name) {
        // Update formData immediately to show translations in real-time
        currentFormData = {
          ...currentFormData,
          name_translation: {
            ...(currentFormData.name_translation || {}),
            ...result.translations.name,
          },
        };
        setFormData(currentFormData);
        translatedCount++;
      }
    } else if (currentFormData.name?.trim()) {
      skippedCount++;
    }

    // Translate description_text
    const descriptionMissingLangs = currentFormData.description_text?.trim()
      ? needsTranslation(currentFormData.description_text_translation, supportedLocales)
      : [];

    if (descriptionMissingLangs.length > 0) {
      const result = await translateAll({
        tableName: 'website_templatesectionheading',
        fields: [{ name: 'description_text', content: currentFormData.description_text }],
        sourceLanguage: originalLanguage,
        targetLanguages: descriptionMissingLangs,
      });

      if (result.success && result.translations?.description_text) {
        // Update formData immediately to show translations in real-time
        currentFormData = {
          ...currentFormData,
          description_text_translation: {
            ...(currentFormData.description_text_translation || {}),
            ...result.translations.description_text,
          },
        };
        setFormData(currentFormData);
        translatedCount++;
      }
    } else if (currentFormData.description_text?.trim()) {
      skippedCount++;
    }

    // Translate button_text
    const buttonMissingLangs = currentFormData.button_text?.trim()
      ? needsTranslation(currentFormData.button_text_translation, supportedLocales)
      : [];

    if (buttonMissingLangs.length > 0) {
      const result = await translateAll({
        tableName: 'website_templatesectionheading',
        fields: [{ name: 'button_text', content: currentFormData.button_text || '' }],
        sourceLanguage: originalLanguage,
        targetLanguages: buttonMissingLangs,
      });

      if (result.success && result.translations?.button_text) {
        // Update formData immediately to show translations in real-time
        currentFormData = {
          ...currentFormData,
          button_text_translation: {
            ...(currentFormData.button_text_translation || {}),
            ...result.translations.button_text,
          },
        };
        setFormData(currentFormData);
        translatedCount++;
      }
    } else if (currentFormData.button_text?.trim()) {
      skippedCount++;
    }

    // Mark as having unsaved changes if any translations were made
    if (translatedCount > 0) {
      setHasUnsavedChanges(true);
    }

    // Show summary via toast
    if (translatedCount > 0) {
      const message = skippedCount > 0 
        ? `Translated ${translatedCount} field(s), skipped ${skippedCount} (already translated)`
        : `Successfully translated ${translatedCount} field(s)`;
      toast.success(message);
    } else if (skippedCount > 0) {
      toast.info('All translations are up to date!');
    } else {
      toast.info('No translations needed');
    }
  };

  // Save translations
  const handleSave = async () => {
    if (!editingSection?.id) return;

    setIsSaving(true);
    try {
      await updateSection({
        ...formData, // Include all formData fields
        name_translation: formData.name_translation || {},
        description_text_translation: formData.description_text_translation || {},
        button_text_translation: formData.button_text_translation || {},
      });
      setHasUnsavedChanges(false);
      toast.success('Translations saved successfully!');
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error('Failed to save translations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* Translation Table */}
      <div className="mb-6 px-2 sm:px-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-20">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-32">
                    Language
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[250px]">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]">
                    Button Text
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Original Language Row */}
                <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                  <td className="px-4 py-3">
                    <span 
                      className="text-xs font-bold px-2 py-1 rounded" 
                      style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                    >
                      {originalLanguage.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {getLanguageName(originalLanguage)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">(Original)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={formData.name || ''}
                      onChange={(e) => updateOriginalField('name', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={formData.description_text || ''}
                      onChange={(e) => updateOriginalField('description_text', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={formData.button_text || ''}
                      onChange={(e) => updateOriginalField('button_text', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    />
                  </td>
                </tr>

                {/* Translation Rows */}
                {languageCodes.map((languageCode) => (
                  <tr key={languageCode} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span 
                        className="text-xs font-bold px-2 py-1 rounded" 
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                      >
                        {languageCode.toUpperCase()}
                      </span>
                    </td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <textarea
                          value={formData.name_translation?.[languageCode] || ''}
                          onChange={(e) => updateTranslation('name_translation', languageCode, e.target.value)}
                          rows={2}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        />
                        <button
                          onClick={() => openJsonbModal('name_translation')}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80 opacity-0 group-hover:opacity-100"
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <textarea
                          value={formData.description_text_translation?.[languageCode] || ''}
                          onChange={(e) => updateTranslation('description_text_translation', languageCode, e.target.value)}
                          rows={2}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        />
                        <button
                          onClick={() => openJsonbModal('description_text_translation')}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80 opacity-0 group-hover:opacity-100"
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <textarea
                          value={formData.button_text_translation?.[languageCode] || ''}
                          onChange={(e) => updateTranslation('button_text_translation', languageCode, e.target.value)}
                          rows={2}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        />
                        <button
                          onClick={() => openJsonbModal('button_text_translation')}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80 opacity-0 group-hover:opacity-100"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 z-30 rounded-b-2xl">
        <button
          onClick={addMissingLanguages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:opacity-80 active:scale-95 cursor-pointer"
          style={{
            borderColor: `${primaryColor}40`,
            color: primaryColor,
            backgroundColor: `${primaryColor}10`,
          }}
          title="Add languages from supported locales"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Missing Languages</span>
          <span className="sm:hidden">Add Languages</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAITranslateAll}
            disabled={isTranslating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {progress ? `Translating... (${progress.completed}/${progress.total})` : 'Translating...'}
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

          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-1.5 text-xs"
          >
            Save
          </Button>
        </div>
      </div>

      {/* JSONB Modal */}
      {jsonbModal.isOpen && jsonbModal.field && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit JSONB - {jsonbModal.field.replace('_translation', '').replace(/_/g, ' ')}
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

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <textarea
                value={jsonbModal.value}
                onChange={(e) => setJsonbModal({ ...jsonbModal, value: e.target.value })}
                placeholder={`{\n  "de": "German translation",\n  "es": "Spanish translation",\n  "fr": "French translation"\n}`}
                rows={15}
                className="w-full px-4 py-3 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-none"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Paste JSONB object with language codes as keys. Example: {`{"en": "Hello", "de": "Hallo"}`}
              </p>
            </div>

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

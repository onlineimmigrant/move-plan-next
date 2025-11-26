/**
 * TranslationsSection - Manage translations for Blog Posts
 * 
 * Follows the exact pattern from TemplateSectionModal/TranslationsSection.tsx
 * Table-based layout showing translations for all supported languages
 * Uses AI translation with role='translator'
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/components/Shared/ToastContainer';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import type { PostFormData } from '../types';

// Interfaces
interface JSONBModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: Record<string, any>;
  onSave: (value: Record<string, any>) => void;
  title: string;
}

const JSONBModal: React.FC<JSONBModalProps> = ({ isOpen, onClose, value, onSave, title }) => {
  const [editValue, setEditValue] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editValue);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('Must be a valid JSON object');
        return;
      }
      onSave(parsed);
      setError('');
      onClose();
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-900"
          spellCheck={false}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
};

interface TranslationsSectionProps {
  formData: PostFormData & { 
    translations?: Record<string, { title?: string; description?: string; content?: string }>;
  };
  updateField: <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => void;
  primaryColor: string;
  hasUnsavedChanges?: boolean;
  setHasUnsavedChanges?: (value: boolean) => void;
}

export const TranslationsSection: React.FC<TranslationsSectionProps> = ({
  formData,
  updateField,
  primaryColor,
  hasUnsavedChanges = false,
  setHasUnsavedChanges,
}) => {
  const { translateAll } = useTranslation();
  const toast = useToast();
  const { settings } = useSettings();

  const supportedLocales = settings?.supported_locales || [];

  // Available languages with code and name
  const availableLanguages = useMemo(() => {
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

    return supportedLocales.map((code: string) => ({
      code,
      name: languageNames[code] || code.toUpperCase()
    }));
  }, [supportedLocales]);

  // State
  const [expanded, setExpanded] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [jsonbModal, setJsonbModal] = useState<{
    isOpen: boolean;
    value: Record<string, any>;
    onSave: (value: Record<string, any>) => void;
    title: string;
  }>({ isOpen: false, value: {}, onSave: () => {}, title: '' });

  // Get all languages from translations
  const allLanguages = useMemo(() => {
    const langSet = new Set<string>();
    
    // Post translations
    Object.keys(formData.translations || {}).forEach(lang => langSet.add(lang));
    
    return Array.from(langSet).sort();
  }, [formData.translations]);

  // Get missing languages
  const missingLanguages = useMemo(() => {
    return availableLanguages
      .filter((lang: { code: string; name: string }) => lang.code !== 'en' && !allLanguages.includes(lang.code))
      .sort((a: { code: string; name: string }, b: { code: string; name: string }) => a.name.localeCompare(b.name));
  }, [availableLanguages, allLanguages]);

  // Add missing languages
  const handleAddMissingLanguages = useCallback(() => {
    if (missingLanguages.length === 0) {
      toast.info('All languages already added!');
      return;
    }

    const updatedTranslations = { ...(formData.translations || {}) };
    
    missingLanguages.forEach((lang: { code: string; name: string }) => {
      updatedTranslations[lang.code] = {
        title: '',
        description: '',
        content: ''
      };
    });

    (updateField as (field: string, value: any) => void)('translations', updatedTranslations);
    setHasUnsavedChanges?.(true);
    toast.success(`Added ${missingLanguages.length} language(s)`);
  }, [missingLanguages, formData.translations, updateField, setHasUnsavedChanges, toast]);

  // Remove language
  const handleRemoveLanguage = useCallback((langCode: string) => {
    const updatedTranslations = { ...(formData.translations || {}) };
    delete updatedTranslations[langCode];

    (updateField as (field: string, value: any) => void)('translations', updatedTranslations);
    setHasUnsavedChanges?.(true);
  }, [formData.translations, updateField, setHasUnsavedChanges]);

  // Update translation
  const handleTranslationChange = useCallback((langCode: string, field: 'title' | 'description' | 'content', value: string) => {
    const updatedTranslations = {
      ...(formData.translations || {}),
      [langCode]: {
        ...(formData.translations?.[langCode] || {}),
        [field]: value
      }
    };
    (updateField as (field: string, value: any) => void)('translations', updatedTranslations);
    setHasUnsavedChanges?.(true);
  }, [formData.translations, updateField, setHasUnsavedChanges]);

  // AI Translate All
  const handleAITranslateAll = useCallback(async () => {
    if (isTranslating) return;

    const targetLanguages = allLanguages.filter(lang => lang !== 'en');
    if (targetLanguages.length === 0) {
      toast.info('Please add languages first!');
      return;
    }

    // Check if any content exists
    if (!formData.title && !formData.description && !formData.content) {
      toast.error('Please add title, description, or content first!');
      return;
    }

    setIsTranslating(true);
    let totalTranslated = 0;

    try {
      const updatedTranslations = { ...(formData.translations || {}) };

      // Translate title for missing languages only
      const missingTitleLangs = targetLanguages.filter(
        lang => !formData.translations?.[lang]?.title?.trim()
      );

      if (missingTitleLangs.length > 0 && formData.title) {
        try {
          const titleResult = await translateAll({
            tableName: 'blog_post',
            fields: [{ name: 'title', content: formData.title }],
            sourceLanguage: 'en',
            targetLanguages: missingTitleLangs,
          });

          if (titleResult.success && titleResult.translations?.title) {
            missingTitleLangs.forEach(lang => {
              if (!updatedTranslations[lang]) {
                updatedTranslations[lang] = {};
              }
              updatedTranslations[lang].title = titleResult.translations!.title[lang];
            });
            totalTranslated += missingTitleLangs.length;
          }
        } catch (error) {
          console.error('Title translation error:', error);
        }
      }

      // Translate description for missing languages only
      const missingDescLangs = targetLanguages.filter(
        lang => !formData.translations?.[lang]?.description?.trim()
      );

      if (missingDescLangs.length > 0 && formData.description) {
        try {
          const descResult = await translateAll({
            tableName: 'blog_post',
            fields: [{ name: 'description', content: formData.description }],
            sourceLanguage: 'en',
            targetLanguages: missingDescLangs,
          });

          if (descResult.success && descResult.translations?.description) {
            missingDescLangs.forEach(lang => {
              if (!updatedTranslations[lang]) {
                updatedTranslations[lang] = {};
              }
              updatedTranslations[lang].description = descResult.translations!.description[lang];
            });
            totalTranslated += missingDescLangs.length;
          }
        } catch (error) {
          console.error('Description translation error:', error);
        }
      }

      // Translate content for missing languages only
      const missingContentLangs = targetLanguages.filter(
        lang => !formData.translations?.[lang]?.content?.trim()
      );

      if (missingContentLangs.length > 0 && formData.content) {
        try {
          const contentResult = await translateAll({
            tableName: 'blog_post',
            fields: [{ name: 'content', content: formData.content }],
            sourceLanguage: 'en',
            targetLanguages: missingContentLangs,
          });

          if (contentResult.success && contentResult.translations?.content) {
            missingContentLangs.forEach(lang => {
              if (!updatedTranslations[lang]) {
                updatedTranslations[lang] = {};
              }
              updatedTranslations[lang].content = contentResult.translations!.content[lang];
            });
            totalTranslated += missingContentLangs.length;
          }
        } catch (error) {
          console.error('Content translation error:', error);
        }
      }

      (updateField as (field: string, value: any) => void)('translations', updatedTranslations);

      if (totalTranslated > 0) {
        setHasUnsavedChanges?.(true);
        toast.success(`All translations completed! Translated ${totalTranslated} field(s).`);
      } else {
        toast.info('All content already translated to all languages!');
      }
    } catch (error) {
      console.error('Translate all error:', error);
      toast.error('Failed to complete all translations');
    } finally {
      setIsTranslating(false);
    }
  }, [formData, allLanguages, translateAll, isTranslating, updateField, setHasUnsavedChanges, toast]);

  // Open JSONB modal
  const openJsonbModal = useCallback((value: Record<string, any>, onSave: (value: Record<string, any>) => void, title: string) => {
    setJsonbModal({ isOpen: true, value, onSave, title });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Translations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Original: English • {allLanguages.length > 0 ? `${allLanguages.length} language(s)` : 'No translations yet'}
          </p>
        </div>
      </div>

      {/* Post Accordion */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ backgroundColor: expanded ? primaryColor + '15' : undefined }}
        >
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              Post: "{formData.title || 'Untitled'}"
            </span>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Language</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Original (English) */}
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">EN</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      English
                      <div className="text-xs text-gray-500">(Original)</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formData.title || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formData.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formData.content ? `${formData.content.substring(0, 100)}...` : '-'}
                    </td>
                  </tr>

                  {/* Translations */}
                  {allLanguages.map(langCode => {
                    const lang = availableLanguages.find((l: { code: string; name: string }) => l.code === langCode);
                    if (!lang) return null;

                    const translation = formData.translations?.[langCode] || {};

                    return (
                      <tr key={langCode} className="group hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {langCode.toUpperCase()}
                            <button
                              onClick={() => handleRemoveLanguage(langCode)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                              title="Remove language"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{lang.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <textarea
                              value={translation.title || ''}
                              onChange={(e) => handleTranslationChange(langCode, 'title', e.target.value)}
                              rows={1}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 resize-none overflow-hidden"
                              placeholder={`${lang.name} title`}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <textarea
                              value={translation.description || ''}
                              onChange={(e) => handleTranslationChange(langCode, 'description', e.target.value)}
                              rows={2}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 resize-none overflow-hidden"
                              placeholder={`${lang.name} description`}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <textarea
                              value={translation.content || ''}
                              onChange={(e) => handleTranslationChange(langCode, 'content', e.target.value)}
                              rows={3}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 resize-none overflow-hidden font-mono"
                              placeholder={`${lang.name} content (HTML/Markdown)`}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button
                              onClick={() => openJsonbModal(
                                formData.translations || {},
                                (value) => (updateField as (field: string, value: any) => void)('translations', value),
                                'Edit All Translations (JSONB)'
                              )}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Edit as JSONB"
                            >
                              <span className="text-lg font-mono">{'{}'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* JSONB Modal */}
      <JSONBModal
        isOpen={jsonbModal.isOpen}
        onClose={() => setJsonbModal({ ...jsonbModal, isOpen: false })}
        value={jsonbModal.value}
        onSave={jsonbModal.onSave}
        title={jsonbModal.title}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {missingLanguages.length > 0 && (
            <Button
              onClick={handleAddMissingLanguages}
              variant="outline"
              disabled={isTranslating}
            >
              Add Missing Languages ({missingLanguages.length})
            </Button>
          )}
        </div>
        
        <Button
          onClick={handleAITranslateAll}
          disabled={isTranslating || allLanguages.length === 0}
          style={{
            backgroundColor: !isTranslating && allLanguages.length > 0 ? primaryColor : undefined
          }}
        >
          {isTranslating ? 'Translating...' : 'AI Translate All'}
        </Button>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/components/Shared/ToastContainer';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import type { TemplateSectionFormData } from '../hooks/useSectionOperations';

// Interfaces
interface Metric {
  id: number;
  title: string;
  title_translation?: Record<string, string>;
  description: string;
  description_translation?: Record<string, string>;
  [key: string]: any;
}

interface TranslationsSectionProps {
  formData: TemplateSectionFormData;
  setFormData: React.Dispatch<React.SetStateAction<TemplateSectionFormData>>;
  metrics: Metric[];
  setMetrics: (metrics: Metric[] | ((prev: Metric[]) => Metric[])) => void;
  primaryColor: string;
  onSave: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}

interface JSONBModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: Record<string, string>;
  onSave: (value: Record<string, string>) => void;
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

export const TranslationsSection: React.FC<TranslationsSectionProps> = ({
  formData,
  setFormData,
  metrics,
  setMetrics,
  primaryColor,
  onSave,
  isSaving,
  hasUnsavedChanges,
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
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [expandedMetrics, setExpandedMetrics] = useState<Set<number>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [jsonbModal, setJsonbModal] = useState<{
    isOpen: boolean;
    value: Record<string, string>;
    onSave: (value: Record<string, string>) => void;
    title: string;
  }>({ isOpen: false, value: {}, onSave: () => {}, title: '' });

  // Get all languages from section and metrics
  const allLanguages = useMemo(() => {
    const langSet = new Set<string>();
    
    // Section translations
    Object.keys(formData.section_title_translation || {}).forEach(lang => langSet.add(lang));
    Object.keys(formData.section_description_translation || {}).forEach(lang => langSet.add(lang));
    
    // Metric translations
    metrics.forEach(metric => {
      Object.keys(metric.title_translation || {}).forEach(lang => langSet.add(lang));
      Object.keys(metric.description_translation || {}).forEach(lang => langSet.add(lang));
    });
    
    return Array.from(langSet).sort();
  }, [
    formData.section_title_translation,
    formData.section_description_translation,
    metrics
  ]);

  // Get missing languages
  const missingLanguages = useMemo(() => {
    return availableLanguages
      .filter((lang: { code: string; name: string }) => lang.code !== 'en' && !allLanguages.includes(lang.code))
      .sort((a: { code: string; name: string }, b: { code: string; name: string }) => a.name.localeCompare(b.name));
  }, [availableLanguages, allLanguages]);

  // Toggle metric expansion
  const toggleMetric = useCallback((metricId: number) => {
    setExpandedMetrics(prev => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  }, []);

  // Add missing languages
  const handleAddMissingLanguages = useCallback(() => {
    if (missingLanguages.length === 0) {
      toast.info('All languages already added!');
      return;
    }

    // Add to section
    setFormData(prevFormData => {
      const updatedSectionTitleTranslation = { ...(prevFormData.section_title_translation || {}) };
      const updatedSectionDescTranslation = { ...(prevFormData.section_description_translation || {}) };
      
      missingLanguages.forEach((lang: { code: string; name: string }) => {
        updatedSectionTitleTranslation[lang.code] = '';
        updatedSectionDescTranslation[lang.code] = '';
      });

      return {
        ...prevFormData,
        section_title_translation: updatedSectionTitleTranslation,
        section_description_translation: updatedSectionDescTranslation,
      };
    });

    // Add to all metrics
    setMetrics((prevMetrics: Metric[]) => prevMetrics.map(metric => ({
      ...metric,
      title_translation: {
        ...(metric.title_translation || {}),
        ...Object.fromEntries(missingLanguages.map((lang: { code: string; name: string }) => [lang.code, '']))
      },
      description_translation: {
        ...(metric.description_translation || {}),
        ...Object.fromEntries(missingLanguages.map((lang: { code: string; name: string }) => [lang.code, '']))
      }
    })) as any);

    setHasUnsavedChanges(true);
    toast.success(`Added ${missingLanguages.length} language(s)`);
  }, [missingLanguages, setFormData, setMetrics, setHasUnsavedChanges, toast]);

  // Remove language
  const handleRemoveLanguage = useCallback((langCode: string) => {
    // Remove from section
    setFormData(prevFormData => {
      const updatedSectionTitleTranslation = { ...(prevFormData.section_title_translation || {}) };
      const updatedSectionDescTranslation = { ...(prevFormData.section_description_translation || {}) };
      delete updatedSectionTitleTranslation[langCode];
      delete updatedSectionDescTranslation[langCode];

      return {
        ...prevFormData,
        section_title_translation: updatedSectionTitleTranslation,
        section_description_translation: updatedSectionDescTranslation,
      };
    });

    // Remove from all metrics
    setMetrics((prevMetrics: Metric[]) => prevMetrics.map(metric => {
      const updatedTitleTranslation = { ...(metric.title_translation || {}) };
      const updatedDescTranslation = { ...(metric.description_translation || {}) };
      delete updatedTitleTranslation[langCode];
      delete updatedDescTranslation[langCode];

      return {
        ...metric,
        title_translation: updatedTitleTranslation,
        description_translation: updatedDescTranslation,
      };
    }) as any);

    setHasUnsavedChanges(true);
  }, [setFormData, setMetrics, setHasUnsavedChanges]);

  // Update section translation
  const handleSectionTranslationChange = useCallback((langCode: string, field: 'section_title' | 'section_description', value: string) => {
    const translationField = field === 'section_title' ? 'section_title_translation' : 'section_description_translation';
    setFormData(prevFormData => ({
      ...prevFormData,
      [translationField]: {
        ...(prevFormData[translationField] || {}),
        [langCode]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Update metric translation
  const handleMetricTranslationChange = useCallback((metricId: number, langCode: string, field: 'title' | 'description', value: string) => {
    setMetrics((prevMetrics: Metric[]) => prevMetrics.map(metric => {
      if (metric.id !== metricId) return metric;
      
      const translationField = field === 'title' ? 'title_translation' : 'description_translation';
      return {
        ...metric,
        [translationField]: {
          ...(metric[translationField] || {}),
          [langCode]: value
        }
      };
    }) as any);
    setHasUnsavedChanges(true);
  }, [setMetrics, setHasUnsavedChanges]);

  // AI Translate Section
  const handleAITranslateSection = useCallback(async () => {
    if (isTranslating) return;

    const targetLanguages = allLanguages.filter(lang => lang !== 'en');
    if (targetLanguages.length === 0) {
      toast.info('Please add languages first!');
      return;
    }

    setIsTranslating(true);
    let currentFormData = formData;

    try {
      // Filter languages that need translation for section_title (only empty/missing ones)
      const missingTitleLanguages = targetLanguages.filter(
        lang => !formData.section_title_translation?.[lang]?.trim()
      );

      // Translate section_title only for missing languages
      if (missingTitleLanguages.length > 0) {
        const titleResult = await translateAll({
          tableName: 'website_templatesection',
          fields: [{ name: 'section_title', content: formData.section_title }],
          sourceLanguage: 'en',
          targetLanguages: missingTitleLanguages,
        });

        if (titleResult.success && titleResult.translations?.section_title) {
          currentFormData = {
            ...currentFormData,
            section_title_translation: {
              ...(currentFormData.section_title_translation || {}),
              ...titleResult.translations.section_title
            }
          };
          setFormData(currentFormData);
        }
      }

      // Filter languages that need translation for section_description (only empty/missing ones)
      if (formData.section_description) {
        const missingDescLanguages = targetLanguages.filter(
          lang => !formData.section_description_translation?.[lang]?.trim()
        );

        if (missingDescLanguages.length > 0) {
          const descResult = await translateAll({
            tableName: 'website_templatesection',
            fields: [{ name: 'section_description', content: formData.section_description }],
            sourceLanguage: 'en',
            targetLanguages: missingDescLanguages,
          });

          if (descResult.success && descResult.translations?.section_description) {
            currentFormData = {
              ...currentFormData,
              section_description_translation: {
                ...(currentFormData.section_description_translation || {}),
                ...descResult.translations.section_description
              }
            };
            setFormData(currentFormData);
          }
        }
      }

      setHasUnsavedChanges(true);
      const translatedCount = Math.max(
        missingTitleLanguages?.length || 0,
        formData.section_description ? (targetLanguages.filter(
          lang => !formData.section_description_translation?.[lang]?.trim()
        ).length) : 0
      );
      
      if (translatedCount === 0) {
        toast.info('Section already translated to all languages!');
      } else {
        toast.success(`Section translations completed for ${translatedCount} language(s)!`);
      }
    } catch (error) {
      console.error('Section translation error:', error);
      toast.error('Failed to translate section');
    } finally {
      setIsTranslating(false);
    }
  }, [formData, setFormData, allLanguages, translateAll, isTranslating, setHasUnsavedChanges, toast]);

  // AI Translate Metric
  const handleAITranslateMetric = useCallback(async (metricId: number) => {
    if (isTranslating) return;

    const metric = metrics.find(m => m.id === metricId);
    if (!metric) return;

    const targetLanguages = allLanguages.filter(lang => lang !== 'en');
    if (targetLanguages.length === 0) {
      toast.info('Please add languages first!');
      return;
    }

    setIsTranslating(true);
    let currentMetrics = metrics;

    try {
      // Filter languages that need translation for title (only empty/missing ones)
      const missingTitleLanguages = targetLanguages.filter(
        lang => !metric.title_translation?.[lang]?.trim()
      );

      // Translate title only for missing languages
      if (missingTitleLanguages.length > 0) {
        const titleResult = await translateAll({
          tableName: 'website_metric',
          fields: [{ name: 'title', content: metric.title }],
          sourceLanguage: 'en',
          targetLanguages: missingTitleLanguages,
        });

        if (titleResult.success && titleResult.translations?.title) {
          currentMetrics = currentMetrics.map(m =>
            m.id === metricId
              ? {
                  ...m,
                  title_translation: {
                    ...(m.title_translation || {}),
                    ...titleResult.translations!.title
                  }
                }
              : m
          );
          setMetrics(currentMetrics);
        }
      }

      // Filter languages that need translation for description (only empty/missing ones)
      if (metric.description) {
        const missingDescLanguages = targetLanguages.filter(
          lang => !metric.description_translation?.[lang]?.trim()
        );

        if (missingDescLanguages.length > 0) {
          const descResult = await translateAll({
            tableName: 'website_metric',
            fields: [{ name: 'description', content: metric.description }],
            sourceLanguage: 'en',
            targetLanguages: missingDescLanguages,
          });

          if (descResult.success && descResult.translations?.description) {
            currentMetrics = currentMetrics.map(m =>
              m.id === metricId
                ? {
                    ...m,
                    description_translation: {
                      ...(m.description_translation || {}),
                      ...descResult.translations!.description
                    }
                  }
                : m
            );
            setMetrics(currentMetrics);
          }
        }
      }

      setHasUnsavedChanges(true);
      const translatedCount = Math.max(
        missingTitleLanguages?.length || 0,
        metric.description ? (targetLanguages.filter(
          lang => !metric.description_translation?.[lang]?.trim()
        ).length) : 0
      );
      
      if (translatedCount === 0) {
        toast.info(`Card "${metric.title}" already translated to all languages!`);
      } else {
        toast.success(`Card "${metric.title}" translations completed for ${translatedCount} language(s)!`);
      }
    } catch (error) {
      console.error('Metric translation error:', error);
      toast.error('Failed to translate card');
    } finally {
      setIsTranslating(false);
    }
  }, [metrics, setMetrics, allLanguages, translateAll, isTranslating, setHasUnsavedChanges, toast]);

  // AI Translate All
  const handleAITranslateAll = useCallback(async () => {
    if (isTranslating) return;

    const targetLanguages = allLanguages.filter(lang => lang !== 'en');
    if (targetLanguages.length === 0) {
      toast.info('Please add languages first!');
      return;
    }

    setIsTranslating(true);
    let totalTranslated = 0;

    try {
      // Count missing translations for section
      const missingSectionTitleLangs = targetLanguages.filter(
        lang => !formData.section_title_translation?.[lang]?.trim()
      );
      const missingSectionDescLangs = formData.section_description 
        ? targetLanguages.filter(lang => !formData.section_description_translation?.[lang]?.trim())
        : [];
      
      // Translate section fields if needed
      let currentFormData = formData;
      
      if (missingSectionTitleLangs.length > 0) {
        const titleResult = await translateAll({
          tableName: 'website_templatesection',
          fields: [{ name: 'section_title', content: formData.section_title }],
          sourceLanguage: 'en',
          targetLanguages: missingSectionTitleLangs,
        });

        if (titleResult.success && titleResult.translations?.section_title) {
          currentFormData = {
            ...currentFormData,
            section_title_translation: {
              ...(currentFormData.section_title_translation || {}),
              ...titleResult.translations.section_title
            }
          };
          setFormData(currentFormData);
          totalTranslated += missingSectionTitleLangs.length;
        }
      }

      if (missingSectionDescLangs.length > 0 && formData.section_description) {
        const descResult = await translateAll({
          tableName: 'website_templatesection',
          fields: [{ name: 'section_description', content: formData.section_description }],
          sourceLanguage: 'en',
          targetLanguages: missingSectionDescLangs,
        });

        if (descResult.success && descResult.translations?.section_description) {
          currentFormData = {
            ...currentFormData,
            section_description_translation: {
              ...(currentFormData.section_description_translation || {}),
              ...descResult.translations.section_description
            }
          };
          setFormData(currentFormData);
          totalTranslated += missingSectionDescLangs.length;
        }
      }

      // Translate each metric
      let currentMetrics = metrics;
      for (const metric of metrics) {
        const missingTitleLangs = targetLanguages.filter(
          lang => !metric.title_translation?.[lang]?.trim()
        );
        const missingDescLangs = metric.description 
          ? targetLanguages.filter(lang => !metric.description_translation?.[lang]?.trim())
          : [];

        if (missingTitleLangs.length > 0) {
          const titleResult = await translateAll({
            tableName: 'website_metric',
            fields: [{ name: 'title', content: metric.title }],
            sourceLanguage: 'en',
            targetLanguages: missingTitleLangs,
          });

          if (titleResult.success && titleResult.translations?.title) {
            currentMetrics = currentMetrics.map(m =>
              m.id === metric.id
                ? {
                    ...m,
                    title_translation: {
                      ...(m.title_translation || {}),
                      ...titleResult.translations!.title
                    }
                  }
                : m
            );
            setMetrics(currentMetrics);
            totalTranslated += missingTitleLangs.length;
          }
        }

        if (missingDescLangs.length > 0 && metric.description) {
          const descResult = await translateAll({
            tableName: 'website_metric',
            fields: [{ name: 'description', content: metric.description }],
            sourceLanguage: 'en',
            targetLanguages: missingDescLangs,
          });

          if (descResult.success && descResult.translations?.description) {
            currentMetrics = currentMetrics.map(m =>
              m.id === metric.id
                ? {
                    ...m,
                    description_translation: {
                      ...(m.description_translation || {}),
                      ...descResult.translations!.description
                    }
                  }
                : m
            );
            setMetrics(currentMetrics);
            totalTranslated += missingDescLangs.length;
          }
        }
      }

      if (totalTranslated > 0) {
        setHasUnsavedChanges(true);
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
  }, [metrics, formData, allLanguages, translateAll, isTranslating, setFormData, setMetrics, setHasUnsavedChanges, toast]);

  // Open JSONB modal
  const openJsonbModal = useCallback((value: Record<string, string>, onSave: (value: Record<string, string>) => void, title: string) => {
    setJsonbModal({ isOpen: true, value, onSave, title });
  }, []);

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Translations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Original: English • {allLanguages.length > 0 ? `${allLanguages.length} language(s)` : 'No translations yet'}
          </p>
        </div>
      </div>

      {/* Section Accordion */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setSectionExpanded(!sectionExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ backgroundColor: sectionExpanded ? primaryColor + '15' : undefined }}
        >
          <div className="flex items-center gap-2">
            {sectionExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              Section: "{formData.section_title || 'Untitled'}"
            </span>
          </div>
        </button>

        {sectionExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Language</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section Description</th>
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
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formData.section_title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formData.section_description || '-'}</td>
                  </tr>

                  {/* Translations */}
                  {allLanguages.map(langCode => {
                    const lang = availableLanguages.find((l: { code: string; name: string }) => l.code === langCode);
                    if (!lang) return null;

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
                              value={formData.section_title_translation?.[langCode] || ''}
                              onChange={(e) => handleSectionTranslationChange(langCode, 'section_title', e.target.value)}
                              rows={1}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 resize-none overflow-hidden"
                              placeholder={`${lang.name} translation`}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button
                              onClick={() => openJsonbModal(
                                formData.section_title_translation || {},
                                (value) => setFormData({ ...formData, section_title_translation: value }),
                                'Edit Section Title Translations (JSONB)'
                              )}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Edit as JSONB"
                            >
                              <span className="text-lg font-mono">{'{}'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <textarea
                              value={formData.section_description_translation?.[langCode] || ''}
                              onChange={(e) => handleSectionTranslationChange(langCode, 'section_description', e.target.value)}
                              rows={1}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 resize-none overflow-hidden"
                              placeholder={`${lang.name} translation`}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                            <button
                              onClick={() => openJsonbModal(
                                formData.section_description_translation || {},
                                (value) => setFormData({ ...formData, section_description_translation: value }),
                                'Edit Section Description Translations (JSONB)'
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

      {/* Metrics Accordions */}
      {metrics.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No cards to translate
        </div>
      ) : (
        <div className="space-y-3">
          {metrics.map((metric, index) => {
            const isExpanded = expandedMetrics.has(metric.id);

            return (
              <div key={metric.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleMetric(metric.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  style={{ backgroundColor: isExpanded ? primaryColor + '10' : undefined }}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      Card {index + 1}: "{metric.title || 'Untitled'}"
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Code</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Language</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
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
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{metric.title}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{metric.description || '-'}</td>
                          </tr>

                          {/* Translations */}
                          {allLanguages.map(langCode => {
                            const lang = availableLanguages.find((l: { code: string; name: string }) => l.code === langCode);
                            if (!lang) return null;

                            return (
                              <tr key={langCode} className="group hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                  {langCode.toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{lang.name}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <textarea
                                      value={metric.title_translation?.[langCode] || ''}
                                      onChange={(e) => handleMetricTranslationChange(metric.id, langCode, 'title', e.target.value)}
                                      rows={1}
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 resize-none overflow-hidden"
                                      placeholder={`${lang.name} translation`}
                                      onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = target.scrollHeight + 'px';
                                      }}
                                    />
                                    <button
                                      onClick={() => openJsonbModal(
                                        metric.title_translation || {},
                                        (value) => {
                                          const updatedMetrics = metrics.map(m =>
                                            m.id === metric.id ? { ...m, title_translation: value } : m
                                          );
                                          setMetrics(updatedMetrics);
                                        },
                                        `Edit "${metric.title}" Title Translations (JSONB)`
                                      )}
                                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                      title="Edit as JSONB"
                                    >
                                      <span className="text-lg font-mono">{'{}'}</span>
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <textarea
                                      value={metric.description_translation?.[langCode] || ''}
                                      onChange={(e) => handleMetricTranslationChange(metric.id, langCode, 'description', e.target.value)}
                                      rows={1}
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 resize-none overflow-hidden"
                                      placeholder={`${lang.name} translation`}
                                      onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = target.scrollHeight + 'px';
                                      }}
                                    />
                                    <button
                                      onClick={() => openJsonbModal(
                                        metric.description_translation || {},
                                        (value) => {
                                          const updatedMetrics = metrics.map(m =>
                                            m.id === metric.id ? { ...m, description_translation: value } : m
                                          );
                                          setMetrics(updatedMetrics);
                                        },
                                        `Edit "${metric.title}" Description Translations (JSONB)`
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
            );
          })}
        </div>
      )}

      {/* JSONB Modal */}
      <JSONBModal
        isOpen={jsonbModal.isOpen}
        onClose={() => setJsonbModal({ ...jsonbModal, isOpen: false })}
        value={jsonbModal.value}
        onSave={jsonbModal.onSave}
        title={jsonbModal.title}
      />

      {/* Footer Panel - Matching Header/Footer Modal Pattern */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
            <Button
              onClick={handleAITranslateAll}
              disabled={isTranslating || allLanguages.length === 0}
              variant="outline"
            >
              {isTranslating ? 'Translating...' : 'AI Translate All'}
            </Button>
          </div>
          
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving || isTranslating}
            style={{
              backgroundColor: hasUnsavedChanges && !isSaving && !isTranslating ? primaryColor : undefined
            }}
          >
            {isSaving ? 'Saving...' : 'Save Translations'}
          </Button>
        </div>
      </div>
    </div>
  );
};

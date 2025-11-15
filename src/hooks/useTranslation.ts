/**
 * useTranslation Hook - Reusable AI Translation
 * 
 * Generic hook for translating content across any table with _translation JSONB fields
 * Uses the System Translator agent (role='translator') via /api/ai/translate
 * 
 * @example
 * ```tsx
 * const { translateField, translateAll, isTranslating, progress } = useTranslation();
 * 
 * // Translate a single field
 * const result = await translateField({
 *   tableName: 'blog_posts',
 *   field: 'title',
 *   content: 'My Blog Post',
 *   sourceLanguage: 'en',
 *   targetLanguages: ['es', 'fr', 'de'],
 * });
 * 
 * // Translate multiple fields
 * const result = await translateAll({
 *   tableName: 'blog_posts',
 *   fields: [
 *     { name: 'title', content: 'My Blog Post' },
 *     { name: 'excerpt', content: 'This is a blog post about...' },
 *   ],
 *   sourceLanguage: 'en',
 *   targetLanguages: ['es', 'fr', 'de'],
 * });
 * ```
 */

'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

interface TranslationProgress {
  total: number;
  completed: number;
  current: string;
}

interface TranslateFieldParams {
  tableName: string;
  field: string;
  content: string;
  sourceLanguage: string;
  targetLanguages: string[];
}

interface TranslateAllParams {
  tableName: string;
  fields: {
    name: string;
    content: string;
  }[];
  sourceLanguage: string;
  targetLanguages: string[];
}

interface TranslationResult {
  success: boolean;
  translations?: {
    [field: string]: {
      [languageCode: string]: string;
    };
  };
  errors?: string[];
}

interface UseTranslationReturn {
  translateField: (params: TranslateFieldParams) => Promise<{ [languageCode: string]: string } | null>;
  translateAll: (params: TranslateAllParams) => Promise<TranslationResult>;
  isTranslating: boolean;
  progress: TranslationProgress | null;
  error: string | null;
}

export function useTranslation(): UseTranslationReturn {
  const { supabase, session: currentSession } = useSupabaseClient();
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Translate a single field to multiple languages
   */
  const translateField = async ({
    tableName,
    field,
    content,
    sourceLanguage,
    targetLanguages,
  }: TranslateFieldParams): Promise<{ [languageCode: string]: string } | null> => {
    if (!currentSession) {
      console.error('[useTranslation] Not authenticated');
      return null;
    }

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          tableName,
          field,
          content,
          sourceLanguage,
          targetLanguages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      return data.translations || null;
    } catch (err: any) {
      console.error('[useTranslation] Error:', err.message);
      return null;
    }
  };

  /**
   * Translate multiple fields to multiple languages
   */
  const translateAll = async ({
    tableName,
    fields,
    sourceLanguage,
    targetLanguages,
  }: TranslateAllParams): Promise<TranslationResult> => {
    setIsTranslating(true);
    setError(null);
    setProgress({
      total: fields.length,
      completed: 0,
      current: fields[0]?.name || '',
    });

    const translations: Record<string, Record<string, string>> = {};
    const errors: string[] = [];

    try {
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      // Translate each field
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        
        setProgress({
          total: fields.length,
          completed: i,
          current: field.name,
        });

        console.log(`[useTranslation] Translating ${tableName}.${field.name}`);

        try {
          const response = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentSession.access_token}`,
            },
            body: JSON.stringify({
              tableName,
              field: field.name,
              content: field.content,
              sourceLanguage,
              targetLanguages,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Translation failed for ${field.name}`);
          }

          if (data.success && data.translations) {
            translations[field.name] = data.translations;
            console.log(`[useTranslation] ✓ ${field.name}:`, Object.keys(data.translations).length, 'languages');
          }

          if (data.errors?.length > 0) {
            errors.push(...data.errors.map((e: string) => `${field.name}: ${e}`));
          }
        } catch (fieldError: any) {
          console.error(`[useTranslation] Error translating ${field.name}:`, fieldError.message);
          errors.push(`${field.name}: ${fieldError.message}`);
        }
      }

      setProgress({
        total: fields.length,
        completed: fields.length,
        current: 'Complete',
      });

      return {
        success: Object.keys(translations).length > 0,
        translations,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (err: any) {
      console.error('[useTranslation] Translation error:', err.message);
      setError(err.message);
      return {
        success: false,
        errors: [err.message],
      };
    } finally {
      setIsTranslating(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  return {
    translateField,
    translateAll,
    isTranslating,
    progress,
    error,
  };
}

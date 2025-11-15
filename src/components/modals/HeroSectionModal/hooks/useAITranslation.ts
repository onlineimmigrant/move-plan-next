/**
 * useAITranslation Hook
 * 
 * Provides AI-powered translation functionality for Hero sections and other translatable content
 * Uses the System Translator agent (role='translator') via /api/ai/translate
 */

'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

interface TranslationProgress {
  total: number;
  completed: number;
  current: string;
}

interface UseAITranslationReturn {
  translateAll: (params: TranslateAllParams) => Promise<TranslationResult>;
  isTranslating: boolean;
  progress: TranslationProgress | null;
  error: string | null;
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

export function useAITranslation(): UseAITranslationReturn {
  const { supabase, session: currentSession } = useSupabaseClient();
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      // Check authentication
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

        console.log(`[useAITranslation] Translating field: ${field.name}`);

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
            console.log(`[useAITranslation] ✓ ${field.name}:`, Object.keys(data.translations).length, 'languages');
          }

          if (data.errors?.length > 0) {
            errors.push(...data.errors.map((e: string) => `${field.name}: ${e}`));
          }
        } catch (fieldError: any) {
          console.error(`[useAITranslation] Error translating ${field.name}:`, fieldError.message);
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
      console.error('[useAITranslation] Translation error:', err.message);
      setError(err.message);
      return {
        success: false,
        errors: [err.message],
      };
    } finally {
      setIsTranslating(false);
      setTimeout(() => setProgress(null), 2000); // Clear progress after 2s
    }
  };

  return {
    translateAll,
    isTranslating,
    progress,
    error,
  };
}

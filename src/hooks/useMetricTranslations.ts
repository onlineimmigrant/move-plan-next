/**
 * useMetricTranslations Hook
 * 
 * Handles metric content translation with memoization
 * Centralizes translation logic to avoid duplication
 */
'use client';

import { useMemo } from 'react';
import { getTranslatedContent } from '@/utils/translationHelpers';
import type { Metric, TranslatedMetric } from '@/types/templateSection';

/**
 * Translate a single metric's content
 * 
 * @param metric - Metric object with translations
 * @param locale - Current locale (null for default)
 * @returns Object with translated title and description
 * 
 * @example
 * ```tsx
 * const { title, description } = useMetricTranslation(metric, 'es');
 * ```
 */
export function useMetricTranslation(
  metric: Metric,
  locale: string | null
): TranslatedMetric {
  return useMemo(() => {
    const title = metric.title
      ? getTranslatedContent(metric.title, metric.title_translation, locale)
      : '';

    const description = metric.description
      ? getTranslatedContent(metric.description, metric.description_translation, locale)
      : '';

    return { title, description };
  }, [metric.title, metric.title_translation, metric.description, metric.description_translation, locale]);
}

/**
 * Translate multiple metrics at once
 * 
 * @param metrics - Array of metrics
 * @param locale - Current locale (null for default)
 * @returns Array of translated metrics
 * 
 * @example
 * ```tsx
 * const translatedMetrics = useMetricTranslations(section.website_metric, locale);
 * ```
 */
export function useMetricTranslations(
  metrics: Metric[],
  locale: string | null
): TranslatedMetric[] {
  return useMemo(() => {
    return metrics.map(metric => ({
      title: metric.title
        ? getTranslatedContent(metric.title, metric.title_translation, locale)
        : '',
      description: metric.description
        ? getTranslatedContent(metric.description, metric.description_translation, locale)
        : '',
    }));
  }, [metrics, locale]);
}

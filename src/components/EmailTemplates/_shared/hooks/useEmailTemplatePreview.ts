/**
 * Email Template Preview Hook
 * Handles preview functionality with placeholder replacement
 */

import { useState, useCallback } from 'react';
import { 
  getDefaultPlaceholderValues, 
  replacePlaceholders 
} from '../utils/emailTemplate.utils';

export const useEmailTemplatePreview = () => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewPlain, setPreviewPlain] = useState<string>('');
  const [customPlaceholders, setCustomPlaceholders] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate preview with default or custom placeholders
   */
  const generatePreview = useCallback(
    (htmlBody: string, plainBody: string, placeholders?: Record<string, string>) => {
      try {
        setIsLoading(true);
        setError(null);

        const values = {
          ...getDefaultPlaceholderValues(),
          ...(placeholders || customPlaceholders),
        };

        const previewHtmlContent = replacePlaceholders(htmlBody, values);
        const previewPlainContent = replacePlaceholders(plainBody, values);

        setPreviewHtml(previewHtmlContent);
        setPreviewPlain(previewPlainContent);
      } catch (err) {
        setError('Failed to generate preview');
        console.error('Preview generation error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [customPlaceholders]
  );

  /**
   * Fetch preview from API
   */
  const fetchPreviewFromApi = useCallback(
    async (templateId?: number, htmlBody?: string, plainBody?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const body: any = {
          placeholders: customPlaceholders,
        };

        if (templateId) {
          body.template_id = templateId;
        } else {
          body.html_body = htmlBody;
          body.plain_body = plainBody;
        }

        const response = await fetch('/api/email-templates/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch preview');
        }

        const data = await response.json();
        setPreviewHtml(data.html);
        setPreviewPlain(data.plain);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch preview');
        console.error('Preview API error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [customPlaceholders]
  );

  /**
   * Update a custom placeholder value
   */
  const updatePlaceholder = useCallback((key: string, value: string) => {
    setCustomPlaceholders((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Reset custom placeholders to defaults
   */
  const resetPlaceholders = useCallback(() => {
    setCustomPlaceholders({});
  }, []);

  /**
   * Clear preview
   */
  const clearPreview = useCallback(() => {
    setPreviewHtml('');
    setPreviewPlain('');
    setError(null);
  }, []);

  return {
    previewHtml,
    previewPlain,
    customPlaceholders,
    isLoading,
    error,
    generatePreview,
    fetchPreviewFromApi,
    updatePlaceholder,
    resetPlaceholders,
    clearPreview,
  };
};

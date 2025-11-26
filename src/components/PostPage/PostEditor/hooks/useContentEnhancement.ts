/**
 * useContentEnhancement Hook
 * 
 * Handles AI content enhancement for blog posts
 * Similar pattern to useTranslation hook
 */

import { useState } from 'react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

export type EnhancementType = 
  | 'improve'      // Improve writing (grammar, clarity)
  | 'engaging'     // Make more engaging
  | 'professional' // Make more professional
  | 'expand'       // Expand content
  | 'shorten'      // Shorten content
  | 'assessment'   // Content quality assessment
  | 'custom';      // Custom instructions

export type EnhancementScope = 
  | 'selection'    // Just highlighted text
  | 'title'        // Blog post title
  | 'description'  // Blog post description
  | 'content'      // Blog post content (HTML/Markdown)
  | 'full';        // All three fields (title + description + content)

interface EnhanceContentParams {
  content: string;
  enhancementType: EnhancementType;
  scope: EnhancementScope;
  customInstructions?: string;
  editorMode?: 'visual' | 'html' | 'markdown';
  // For full scope enhancement
  title?: string;
  description?: string;
}

export interface EnhanceContentResponse {
  original: string;
  enhanced: string;
  type: EnhancementType;
  scope: EnhancementScope;
  // For split results (when scope='full')
  splitResults?: {
    title?: { original: string; enhanced: string };
    description?: { original: string; enhanced: string };
    content?: { original: string; enhanced: string };
  };
  // For assessment type
  assessment?: {
    total: number; // 0-100
    categories: {
      seo: { score: number; comment: string };
      grammar: { score: number; comment: string };
      engagement: { score: number; comment: string };
      readability: { score: number; comment: string };
      structure: { score: number; comment: string };
      tone: { score: number; comment: string };
    };
  };
}

export const useContentEnhancement = () => {
  const { session: currentSession } = useSupabaseClient();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<EnhanceContentResponse | null>(null);

  const enhanceContent = async ({
    content,
    enhancementType,
    scope,
    customInstructions,
    title,
    description,
    editorMode,
  }: EnhanceContentParams): Promise<EnhanceContentResponse | null> => {
    if (!currentSession) {
      setError('Not authenticated');
      console.error('[useContentEnhancement] Not authenticated');
      return null;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/enhance-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          content,
          enhancementType,
          scope,
          customInstructions,
          title,
          description,
          role: 'blog_content_writer',
          editorMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance content');
      }

      const result = await response.json();
      console.log('[useContentEnhancement] Setting result:', result);
      setEnhancementResult(result);
      console.log('[useContentEnhancement] Result set, returning');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Content enhancement error:', err);
      return null;
    } finally {
      setIsEnhancing(false);
    }
  };

  const clearResult = () => {
    setEnhancementResult(null);
    setError(null);
  };

  return {
    enhanceContent,
    isEnhancing,
    error,
    enhancementResult,
    clearResult,
  };
};

/**
 * useTranslationWorker Hook
 * Uses Web Worker for translation processing in background
 * Offloads computation from main thread for better performance
 */

import { useEffect, useRef, useState } from 'react';

interface TranslationWorkerResult {
  id: number | string;
  title: string;
  description: string;
}

interface UseTranslationWorkerReturn {
  translateBatch: (items: any[], locale: string | null) => Promise<TranslationWorkerResult[]>;
  isProcessing: boolean;
}

export function useTranslationWorker(): UseTranslationWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Only create worker in browser environment
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        workerRef.current = new Worker(new URL('/workers/translation.worker.ts', import.meta.url), {
          type: 'module'
        });
      } catch (error) {
        console.warn('[TranslationWorker] Failed to create worker:', error);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const translateBatch = async (items: any[], locale: string | null): Promise<TranslationWorkerResult[]> => {
    // Fallback to main thread if worker not available or items < 10
    if (!workerRef.current || items.length < 10) {
      // Import and use main thread translation
      const { getTranslatedContent } = await import('@/utils/translationHelpers');
      return items.map(item => ({
        id: item.id,
        title: getTranslatedContent(item.title || '', item.title_translation, locale),
        description: getTranslatedContent(item.description || '', item.description_translation, locale),
      }));
    }

    setIsProcessing(true);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Translation worker timeout'));
      }, 5000);

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'TRANSLATE_BATCH_COMPLETE') {
          clearTimeout(timeoutId);
          setIsProcessing(false);
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(event.data.data);
        } else if (event.data.type === 'ERROR') {
          clearTimeout(timeoutId);
          setIsProcessing(false);
          workerRef.current?.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error));
        }
      };

      workerRef.current?.addEventListener('message', handleMessage);
      workerRef.current?.postMessage({
        type: 'TRANSLATE_BATCH',
        data: { items, locale },
      });
    });
  };

  return {
    translateBatch,
    isProcessing,
  };
}

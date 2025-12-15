/**
 * Translation Web Worker
 * Offloads translation processing to background thread
 * Improves main thread performance for large datasets
 */

// Translation logic (moved from utils)
const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];

function getTranslatedContent(
  defaultContent: string,
  translations?: Record<string, string>,
  locale?: string | null
): string {
  const safeDefaultContent = defaultContent || '';
  
  if (!locale || !translations || typeof translations !== 'object') {
    return safeDefaultContent;
  }

  const translatedContent = translations[locale];
  
  if (translatedContent && typeof translatedContent === 'string' && translatedContent.trim() !== '') {
    return translatedContent;
  }

  return safeDefaultContent;
}

// Message handler
self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'TRANSLATE_BATCH': {
      const { items, locale } = data;
      
      // Process translations for array of items
      const translated = items.map((item: any) => ({
        id: item.id,
        title: getTranslatedContent(item.title || '', item.title_translation, locale),
        description: getTranslatedContent(item.description || '', item.description_translation, locale),
      }));

      self.postMessage({
        type: 'TRANSLATE_BATCH_COMPLETE',
        data: translated,
      });
      break;
    }

    case 'TRANSLATE_SINGLE': {
      const { content, translations, locale } = data;
      
      const translated = getTranslatedContent(content, translations, locale);

      self.postMessage({
        type: 'TRANSLATE_SINGLE_COMPLETE',
        data: translated,
      });
      break;
    }

    default:
      self.postMessage({
        type: 'ERROR',
        error: `Unknown message type: ${type}`,
      });
  }
};

export {};

/**
 * Translation Service Utilities
 * 
 * Helper functions for managing translations across different tables
 */

/**
 * Get translation field names for a given source field
 * Follows the pattern: field_name -> field_name_translation
 */
export function getTranslationFieldName(sourceField: string): string {
  return `${sourceField}_translation`;
}

/**
 * Extract translation fields from a data object
 * Returns an object with only the _translation fields
 */
export function extractTranslationFields(data: Record<string, any>): Record<string, Record<string, string>> {
  const translationFields: Record<string, Record<string, string>> = {};
  
  Object.keys(data).forEach(key => {
    if (key.endsWith('_translation') && typeof data[key] === 'object') {
      translationFields[key] = data[key];
    }
  });
  
  return translationFields;
}

/**
 * Merge translation results into form data
 * Updates the _translation fields with new translations
 */
export function mergeTranslations<T extends Record<string, any>>(
  formData: T,
  translations: Record<string, Record<string, string>>
): T {
  const updated = { ...formData } as any;
  
  Object.entries(translations).forEach(([fieldName, langMap]) => {
    const translationKey = getTranslationFieldName(fieldName);
    updated[translationKey] = {
      ...(updated[translationKey] || {}),
      ...langMap,
    };
  });
  
  return updated as T;
}

/**
 * Get all supported languages from translation fields
 * Returns unique list of language codes across all translation fields
 */
export function getAllTranslationLanguages(data: Record<string, any>): string[] {
  const languages = new Set<string>();
  
  Object.keys(data).forEach(key => {
    if (key.endsWith('_translation') && typeof data[key] === 'object') {
      Object.keys(data[key]).forEach(lang => languages.add(lang));
    }
  });
  
  return Array.from(languages).sort();
}

/**
 * Check if translations exist for a given language
 */
export function hasTranslation(
  data: Record<string, any>,
  field: string,
  languageCode: string
): boolean {
  const translationKey = getTranslationFieldName(field);
  return !!(data[translationKey]?.[languageCode]);
}

/**
 * Get missing languages for translation
 * Compares existing translations with supported locales
 */
export function getMissingLanguages(
  data: Record<string, any>,
  supportedLocales: string[]
): string[] {
  const existingLanguages = getAllTranslationLanguages(data);
  return supportedLocales.filter(locale => !existingLanguages.includes(locale));
}

/**
 * Validate translation data structure
 * Ensures _translation fields are properly formatted JSONB
 */
export function validateTranslationData(data: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (key.endsWith('_translation')) {
      if (typeof value !== 'object' || value === null) {
        errors.push(`${key} must be an object`);
      } else if (Array.isArray(value)) {
        errors.push(`${key} must be an object, not an array`);
      } else {
        // Check that all values are strings
        Object.entries(value).forEach(([lang, text]) => {
          if (typeof text !== 'string') {
            errors.push(`${key}.${lang} must be a string`);
          }
        });
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Prepare fields for translation
 * Extracts content from source fields and formats for API
 */
export function prepareFieldsForTranslation(
  data: Record<string, any>,
  fieldNames: string[]
): Array<{ name: string; content: string }> {
  return fieldNames
    .map(fieldName => ({
      name: fieldName,
      content: String(data[fieldName] || ''),
    }))
    .filter(field => field.content.trim().length > 0);
}

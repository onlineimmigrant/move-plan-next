/**
 * Validation utilities for ProductCreditEditModal
 * 
 * Provides URL validation, JSON validation, and image sanitization
 * to ensure data integrity before submission.
 */

/**
 * Validates if a string is a valid URL
 * 
 * @param url - The URL string to validate
 * @returns true if valid URL, false otherwise
 * 
 * @example
 * ```ts
 * validateURL('https://example.com/image.jpg') // true
 * validateURL('not-a-url') // false
 * ```
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is valid JSON
 * 
 * @param json - The JSON string to validate
 * @returns true if valid JSON, false otherwise
 * 
 * @example
 * ```ts
 * validateJSON('{"key": "value"}') // true
 * validateJSON('{invalid}') // false
 * ```
 */
export function validateJSON(json: string): boolean {
  if (!json || typeof json !== 'string') {
    return false;
  }
  
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates an image URL
 * Returns undefined if invalid or doesn't start with http(s)://
 * 
 * @param url - The image URL to sanitize
 * @returns Sanitized URL or undefined if invalid
 * 
 * @example
 * ```ts
 * sanitizeImageUrl('https://example.com/image.jpg') 
 * // 'https://example.com/image.jpg'
 * 
 * sanitizeImageUrl('file:///local/image.jpg') 
 * // undefined
 * 
 * sanitizeImageUrl('') 
 * // undefined
 * ```
 */
export function sanitizeImageUrl(url: string): string | undefined {
  if (!url || typeof url !== 'string') {
    return undefined;
  }
  
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parses JSON safely, returning null if invalid
 * 
 * @param json - The JSON string to parse
 * @returns Parsed object or null if invalid
 * 
 * @example
 * ```ts
 * safeJSONParse('{"key": "value"}') // { key: 'value' }
 * safeJSONParse('{invalid}') // null
 * ```
 */
export function safeJSONParse<T = any>(json: string): T | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Validates if a product name is acceptable
 * Must be non-empty and within character limits
 * 
 * @param name - The product name to validate
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns true if valid, false otherwise
 * 
 * @example
 * ```ts
 * validateProductName('My Product') // true
 * validateProductName('') // false
 * validateProductName('a'.repeat(600)) // false
 * ```
 */
export function validateProductName(name: string, maxLength: number = 500): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}

/**
 * Validates a tax code format
 * Tax codes should start with 'txcd_' followed by digits
 * 
 * @param taxCode - The tax code to validate
 * @returns true if valid format, false otherwise
 * 
 * @example
 * ```ts
 * validateTaxCode('txcd_10000000') // true
 * validateTaxCode('invalid') // false
 * validateTaxCode('') // true (empty is allowed)
 * ```
 */
export function validateTaxCode(taxCode: string): boolean {
  if (!taxCode) {
    return true; // Empty is allowed
  }
  
  // Tax codes should match format: txcd_XXXXXXXX
  const taxCodeRegex = /^txcd_\d{8}$/;
  return taxCodeRegex.test(taxCode);
}

/**
 * Sanitizes form data before submission
 * Trims strings and removes empty values
 * 
 * @param formData - The form data to sanitize
 * @returns Sanitized form data
 */
export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        sanitized[key] = trimmed;
      }
    } else if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

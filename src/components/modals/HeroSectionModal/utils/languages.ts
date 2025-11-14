/**
 * Language Utilities
 * 
 * Common language codes and their display names
 */

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  it: 'Italian (Italiano)',
  pt: 'Portuguese (Português)',
  ja: 'Japanese (日本語)',
  zh: 'Chinese (中文)',
  ru: 'Russian (Русский)',
  ar: 'Arabic (العربية)',
  hi: 'Hindi (हिन्दी)',
  ko: 'Korean (한국어)',
  nl: 'Dutch (Nederlands)',
  pl: 'Polish (Polski)',
  tr: 'Turkish (Türkçe)',
  vi: 'Vietnamese (Tiếng Việt)',
  sv: 'Swedish (Svenska)',
  da: 'Danish (Dansk)',
  fi: 'Finnish (Suomi)',
  no: 'Norwegian (Norsk)',
  cs: 'Czech (Čeština)',
  el: 'Greek (Ελληνικά)',
  he: 'Hebrew (עברית)',
  id: 'Indonesian (Bahasa Indonesia)',
  ms: 'Malay (Bahasa Melayu)',
  th: 'Thai (ไทย)',
  uk: 'Ukrainian (Українська)',
  ro: 'Romanian (Română)',
  hu: 'Hungarian (Magyar)',
  sk: 'Slovak (Slovenčina)',
  bg: 'Bulgarian (Български)',
  hr: 'Croatian (Hrvatski)',
  sr: 'Serbian (Српски)',
  ca: 'Catalan (Català)',
};

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

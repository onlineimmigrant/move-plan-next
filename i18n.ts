import { getRequestConfig } from 'next-intl/server';
import { getValidLocale, DEFAULT_LOCALE } from './src/lib/language-utils';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale = getValidLocale(locale || DEFAULT_LOCALE);
  
  return {
    locale: validLocale,
    messages: (await import(`./src/locales/${validLocale}.json`)).default
  };
});

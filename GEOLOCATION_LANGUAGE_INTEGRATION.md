# Geolocation-Based Language Detection Integration

This document explains how the geolocation-based language detection system integrates with your existing language switchers.

## Overview

The system automatically detects users' preferred languages based on:
1. **Geolocation (Country)** - Primary detection method in production
2. **Browser Accept-Language header** - Secondary detection method
3. **Existing database settings** - Respects your configured supported languages

## Key Components

### 1. Enhanced Middleware (`src/middleware.ts`)
- Detects user location using Vercel Edge Runtime geolocation
- Maps countries to appropriate languages using comprehensive mapping
- Only suggests languages that are in your `supported_locales` settings
- Sets `detectedLanguage` cookie for client-side access
- Handles local development fallback to database default language

### 2. Language Detection Library (`src/lib/language.ts`)
- `COUNTRY_LANGUAGE_MAP`: Maps 100+ countries to appropriate languages
- `detectLanguageFromSources()`: Smart detection with fallback priority
- Integrates with existing `getSupportedLocales()` from `language-utils.ts`
- Validates all suggestions against your supported language list

### 3. Client-Side Hooks (`src/hooks/useLanguage.ts`)
- `useGeolocationLanguage()`: Hook for language suggestions in components
- Provides suggestion state and dismissal functionality
- Integrates with existing language preference system

### 4. Suggestion Banner (`src/components/LanguageSuggestionBanner.tsx`)
- Optional banner component for language suggestions
- Uses existing routing logic (same as ModernLanguageSwitcher and LanguageSwitcher)
- Respects user dismissals with cookie persistence
- Validates suggestions against supported locales

## Integration with Existing System

### Language Switchers (No Changes Required)
Your existing language switchers continue to work exactly as before:
- `ModernLanguageSwitcher.tsx` - Header dropdown (modern UI)
- `LanguageSwitcher.tsx` - Footer select (simple UI)

Both already use:
- `getSupportedLocales(settings)` - Respects database configuration
- Proper URL routing with/without locale prefixes
- Default language handling

### Settings Integration
The system integrates with your existing settings:
- `supported_locales` from database settings
- Default language from `settings.language`
- Language switcher enable/disable via `with_language_switch`

## How It Works

### Production Flow
1. User visits site from Spain (ES) → Middleware detects country "ES"
2. Maps ES → "es" (Spanish) if Spanish is in supported_locales
3. Sets cookie: `detectedLanguage=es`
4. Banner suggests: "Switch to Español?" (if current locale ≠ es)
5. User clicks → Routes to `/es/current-path` (same as manual language switch)

### Local Development Flow
1. No geolocation data available → Uses database default language
2. No language suggestions shown (avoids false positives)
3. Manual language switching still works normally

## Usage Examples

### Add Language Suggestion Banner
Add to your layout or page component:

```tsx
import LanguageSuggestionBanner from '@/components/LanguageSuggestionBanner';
import { getLocale } from 'next-intl/server';

export default async function Layout({ children }) {
  const locale = await getLocale();
  
  return (
    <html lang={locale}>
      <body>
        {/* Show suggestion banner at top */}
        <LanguageSuggestionBanner currentLocale={locale} />
        
        {/* Your existing header with language switcher */}
        <Header />
        
        {/* Page content */}
        {children}
        
        {/* Your existing footer with language switcher */}
        <Footer />
      </body>
    </html>
  );
}
```

### Custom Language Suggestion Hook
Use the hook for custom implementations:

```tsx
'use client';

import { useGeolocationLanguage } from '@/hooks/useLanguage';

export default function MyComponent({ currentLocale }) {
  const { shouldSuggest, suggestedLanguage, languageName, dismissSuggestion } = 
    useGeolocationLanguage(currentLocale);
  
  if (shouldSuggest) {
    return (
      <div className="language-suggestion">
        <p>Prefer {languageName}?</p>
        <button onClick={() => /* navigate to suggestedLanguage */}>
          Switch
        </button>
        <button onClick={dismissSuggestion}>Dismiss</button>
      </div>
    );
  }
  
  return null;
}
```

## Configuration

### Supported Languages
The system respects your existing supported languages configuration:
- Database: `organization_settings.supported_locales`
- Code: `DEFAULT_SUPPORTED_LOCALES` in `language-utils.ts`
- Currently: `['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl']`

### Country-to-Language Mapping
The mapping prioritizes:
1. **Official/primary languages** - e.g., ES→es, FR→fr, DE→de
2. **Common business languages** - e.g., Most countries→en as fallback
3. **Regional preferences** - e.g., LatAm countries→es, Europe→local languages

### Customization
To modify language suggestions:
1. Edit `COUNTRY_LANGUAGE_MAP` in `src/lib/language.ts`
2. Add/remove languages in `supported_locales` database settings
3. Update country mappings for specific regions

## Testing

### Local Development
- Language detection uses database default (no geolocation suggestions)
- Manual language switching works normally
- Test with different `settings.language` values

### Production Testing
- Use VPN to test different countries
- Check browser developer tools for `detectedLanguage` cookie
- Verify suggestions only appear for supported languages
- Test dismissal persistence (7-day cookie)

## Benefits

1. **Seamless Integration** - Works with existing language switchers
2. **Respects Configuration** - Only suggests supported languages
3. **Smart Fallbacks** - Handles development and production environments
4. **User-Friendly** - Non-intrusive suggestions with dismissal options
5. **Performance** - Edge Runtime for fast geolocation detection

## Notes

- The system enhances rather than replaces existing language functionality
- Users can always manually change languages using existing switchers
- Geolocation suggestions are optional and can be dismissed
- No breaking changes to existing language switcher components
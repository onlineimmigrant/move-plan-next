# Contact Components

This folder contains all contact-related components and their translation system, following the same pattern as the product components.

## Structure

```
src/components/contact/
├── ContactForm.tsx          # Main contact form component
├── ContactModal.tsx         # Modal wrapper for contact form
├── translations.ts          # Translation strings for all supported languages
├── useContactTranslations.ts # Hook for accessing translations
├── index.ts                 # Exports for easy importing
└── README.md               # This file
```

## Usage

### Using the Contact Form
```tsx
import { ContactForm } from '@/components/contact';

function MyPage() {
  return <ContactForm onSuccess={() => console.log('Message sent!')} />;
}
```

### Using the Contact Modal
```tsx
import { ContactModal } from '@/components/contact';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <ContactModal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
    />
  );
}
```

### Using Translations
```tsx
import { useContactTranslations } from '@/components/contact';

function MyContactComponent() {
  const { t, locale } = useContactTranslations();
  
  return (
    <div>
      <h1>{t.contactUs}</h1>
      <p>{t.modalSubtitle}</p>
    </div>
  );
}
```

## Supported Languages

The contact translation system supports the following languages:
- English (en) - Default
- Russian (ru)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Polish (pl)
- Chinese (zh)
- Japanese (ja)

## Adding New Translations

To add a new language:

1. Add the new language to the `Locale` type in `useContactTranslations.ts`
2. Add the translation object to `contactTranslations` in `translations.ts`
3. Follow the same structure as existing translations

## Translation Keys

The translation system includes keys for:

### Form Fields
- `name`, `fullName`, `email`, `emailAddress`, `phone`, `phoneNumber`
- `subject`, `message`
- Form placeholders and validation messages

### Contact Preferences
- `preferredContact`, `contactByEmail`, `contactByPhone`
- `contactByTelegram`, `contactByWhatsapp`

### Scheduling
- `scheduling`, `preferredTime`, `selectDate`, `selectTime`
- `availableAnytime`, `specificDateTime`

### Security & Validation
- `securityCheck`, `mathChallenge`, `mathChallengeLabel`
- All form validation error messages

### Actions & States
- `submit`, `submitting`, `cancel`, `close`
- `loading`, `sending`, `tryAgain`

### Messages
- Success and error messages
- Modal-specific content

## Features

- **Locale Detection**: Automatically detects locale from URL path
- **Fallback Support**: Falls back to app settings language, then English
- **Helper Functions**: Provides utility functions for common operations
- **Type Safety**: Full TypeScript support with proper typing
- **Consistent API**: Same pattern as product translations for maintainability

## Integration

The contact components are integrated with:
- Header component (ContactModal)
- Contact page (/contact route)
- HistoryDescription component
- Settings context for locale detection
- Supabase for form submissions

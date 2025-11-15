# Translation Service - Usage Guide

## Overview
The translation service provides AI-powered translation capabilities for any table with `_translation` JSONB fields.

## Quick Start

### 1. Add Table to Translator Agent Configuration

Update the translator agent's task JSONB to include your table:

```sql
UPDATE public.ai_models_system
SET task = task || '[
  {
    "table": "your_table_name",
    "fields": ["field1", "field2"],
    "name": "Translate Your Content",
    "system_message": "Translate the provided text from {source_lang} to {target_lang}. Preserve formatting and return only the translation."
  }
]'::jsonb
WHERE role = 'translator';
```

### 2. Use in Your Component

```tsx
import { useTranslation } from '@/hooks/useTranslation';
import { mergeTranslations, prepareFieldsForTranslation } from '@/lib/services/translation-utils';

function YourComponent() {
  const { translateAll, isTranslating, progress } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    title_translation: {},
    description_translation: {},
  });

  const handleTranslate = async () => {
    const fields = prepareFieldsForTranslation(formData, ['title', 'description']);
    
    const result = await translateAll({
      tableName: 'your_table_name',
      fields,
      sourceLanguage: 'en',
      targetLanguages: ['es', 'fr', 'de'],
    });

    if (result.success && result.translations) {
      const updated = mergeTranslations(formData, result.translations);
      setFormData(updated);
    }
  };

  return (
    <button onClick={handleTranslate} disabled={isTranslating}>
      {isTranslating ? `Translating ${progress?.current}...` : 'Translate All'}
    </button>
  );
}
```

## API Reference

### `useTranslation` Hook

```tsx
const {
  translateField,  // Translate single field
  translateAll,    // Translate multiple fields
  isTranslating,   // Loading state
  progress,        // Translation progress
  error,          // Error message
} = useTranslation();
```

#### `translateField(params)`

Translate a single field to multiple languages.

**Parameters:**
- `tableName` (string): Table name (must be in translator agent's task config)
- `field` (string): Field name to translate
- `content` (string): Text content to translate
- `sourceLanguage` (string): Source language code (e.g., 'en')
- `targetLanguages` (string[]): Array of target language codes

**Returns:** `Promise<{ [languageCode: string]: string } | null>`

**Example:**
```tsx
const translations = await translateField({
  tableName: 'blog_posts',
  field: 'title',
  content: 'My Blog Post',
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr', 'de'],
});
// Result: { es: 'Mi Publicación', fr: 'Mon Article', de: 'Mein Blogbeitrag' }
```

#### `translateAll(params)`

Translate multiple fields to multiple languages.

**Parameters:**
- `tableName` (string): Table name
- `fields` (array): Array of `{ name: string, content: string }`
- `sourceLanguage` (string): Source language code
- `targetLanguages` (string[]): Array of target language codes

**Returns:** `Promise<TranslationResult>`

```tsx
interface TranslationResult {
  success: boolean;
  translations?: {
    [field: string]: {
      [languageCode: string]: string;
    };
  };
  errors?: string[];
}
```

**Example:**
```tsx
const result = await translateAll({
  tableName: 'blog_posts',
  fields: [
    { name: 'title', content: 'My Blog Post' },
    { name: 'excerpt', content: 'This is an excerpt...' },
  ],
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr', 'de'],
});
```

### Translation Utilities

#### `mergeTranslations(formData, translations)`

Merge translation results into your form data.

```tsx
const updated = mergeTranslations(formData, result.translations);
setFormData(updated);
```

#### `prepareFieldsForTranslation(data, fieldNames)`

Extract and prepare fields for translation.

```tsx
const fields = prepareFieldsForTranslation(formData, ['title', 'description', 'excerpt']);
// Result: [
//   { name: 'title', content: 'My Title' },
//   { name: 'description', content: 'My Description' },
// ]
```

#### `getAllTranslationLanguages(data)`

Get all language codes that have translations.

```tsx
const languages = getAllTranslationLanguages(formData);
// Result: ['es', 'fr', 'de', 'it']
```

#### `getMissingLanguages(data, supportedLocales)`

Find languages that haven't been translated yet.

```tsx
const missing = getMissingLanguages(formData, ['es', 'fr', 'de', 'it', 'pt']);
// Result: ['pt']
```

## Database Schema Requirements

### 1. Translation Fields Pattern

For each translatable field, create a corresponding `_translation` JSONB field:

```sql
ALTER TABLE your_table
ADD COLUMN title_translation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN description_translation JSONB DEFAULT '{}'::jsonb;
```

### 2. Translation Data Structure

```json
{
  "en": "English text",
  "es": "Texto en español",
  "fr": "Texte en français",
  "de": "Deutscher Text"
}
```

## Extending to New Tables

### Example: Blog Posts

**1. Update translator agent:**

```sql
UPDATE public.ai_models_system
SET task = task || '[
  {
    "table": "blog_posts",
    "fields": ["title", "excerpt", "content"],
    "name": "Translate Blog Post",
    "system_message": "Translate the blog content from {source_lang} to {target_lang}. Maintain the tone, formatting, and any markdown or HTML tags. Return only the translation."
  }
]'::jsonb
WHERE role = 'translator';
```

**2. Create translation component:**

```tsx
// components/BlogPostTranslations.tsx
import { useTranslation } from '@/hooks/useTranslation';

export function BlogPostTranslations({ post, onUpdate, supportedLocales }) {
  const { translateAll, isTranslating } = useTranslation();

  const handleTranslate = async () => {
    const result = await translateAll({
      tableName: 'blog_posts',
      fields: [
        { name: 'title', content: post.title },
        { name: 'excerpt', content: post.excerpt },
        { name: 'content', content: post.content },
      ],
      sourceLanguage: 'en',
      targetLanguages: supportedLocales,
    });

    if (result.success) {
      onUpdate({
        ...post,
        title_translation: result.translations.title,
        excerpt_translation: result.translations.excerpt,
        content_translation: result.translations.content,
      });
    }
  };

  return (
    <button onClick={handleTranslate} disabled={isTranslating}>
      AI Translate All
    </button>
  );
}
```

## Supported Tables (Examples)

### Current Implementation
- ✅ `website_hero` (title, description, button)

### Easy to Add
- `blog_posts` (title, excerpt, content)
- `services` (name, description)
- `faqs` (question, answer)
- `testimonials` (content, author)
- `features` (title, description)

## Best Practices

### 1. Batch Translations
Translate all fields at once to minimize API calls:
```tsx
// ✅ Good - One API call per language
translateAll({ fields: [title, description, button] })

// ❌ Bad - Three API calls per language
await translateField({ field: 'title' })
await translateField({ field: 'description' })
await translateField({ field: 'button' })
```

### 2. Error Handling
Always check for partial success:
```tsx
const result = await translateAll({...});

if (result.success && result.translations) {
  // Update with successful translations
  setFormData(mergeTranslations(formData, result.translations));
  
  if (result.errors) {
    // Show warnings for failed languages
    console.warn('Some translations failed:', result.errors);
  }
}
```

### 3. Progress Indication
Show users what's happening:
```tsx
{isTranslating && progress && (
  <div>
    Translating {progress.current}... ({progress.completed}/{progress.total})
  </div>
)}
```

## Troubleshooting

### "Translation not configured for table.field"
- Ensure the table and field are in the translator agent's task configuration
- Check the SQL UPDATE was successful
- Verify the JSONB structure is correct

### "AI credentials not configured"
- Set API key in the translator agent OR
- Add to organization settings OR
- Set `OPENAI_API_KEY` environment variable

### Translations incomplete
- Check `result.errors` for specific failure reasons
- Some languages may succeed while others fail
- Use partial results and retry failed languages

## Performance Considerations

- Each field translation makes one API call per target language
- For 3 fields and 10 languages = 30 API calls
- Consider rate limits and costs
- Use progress indicators for user feedback
- Implement retry logic for failed translations

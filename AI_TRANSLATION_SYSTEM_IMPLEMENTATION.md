# AI Translation System Implementation

## Overview
Implementation of an AI-powered translation system for the Move Plan Next application, leveraging existing AI infrastructure to automatically translate content across multiple languages.

## Architecture Decision

### Approach: JSONB Task Field in `ai_models_system`
- Use existing `task` JSONB field to define translation configurations
- Table-based mapping for scalability
- Simple initial structure with room for expansion

### Task JSONB Structure
```json
[
  {
    "table": "website_hero",
    "fields": ["title", "description", "button"],
    "name": "Translate Hero Section",
    "system_message": "Translate the provided text from {source_lang} to {target_lang}. Preserve formatting, placeholders, and HTML tags. Return only the translation, no explanations or additional text."
  },
  {
    "table": "blog_posts",
    "fields": ["title", "excerpt", "content"],
    "name": "Translate Blog Post",
    "system_message": "Translate the blog content from {source_lang} to {target_lang}. Maintain the tone, formatting, and any markdown or HTML tags. Return only the translation."
  },
  {
    "table": "services",
    "fields": ["name", "description"],
    "name": "Translate Service",
    "system_message": "Translate the service information from {source_lang} to {target_lang}. Keep the professional tone and formatting. Return only the translation."
  }
]
```

### System Message Template
```
Defined per table in the task array above. Each translation task includes placeholders for {source_lang} and {target_lang}.
```

---

## Implementation Steps

### Step 1: Create AI Agent Row in `ai_models_system` Table

**Goal:** Insert a new system AI agent specifically for translations

**SQL to Execute:**
```sql
INSERT INTO public.ai_models_system (
  name,
  display_name,
  role,
  task,
  system_message,
  api_key,
  endpoint,
  max_tokens,
  icon,
  organization_types,
  required_plan,
  is_active,
  is_featured,
  description,
  tags,
  sort_order
) VALUES (
  'system-translator',
  'System Translator',
  'translator',
  '[
    {
      "table": "website_hero",
      "fields": ["title", "description", "button"],
      "name": "Translate Hero Section",
      "system_message": "Translate the provided text from {source_lang} to {target_lang}. Preserve formatting, placeholders, and HTML tags. Return only the translation, no explanations or additional text."
    }
  ]'::jsonb,
  'You are a professional translator specializing in website content localization.',
  '', -- Will use organization's default API key
  '', -- Will use organization's default endpoint
  500,
  '🌐',
  ARRAY['moving', 'immigration', 'relocation', 'education', 'healthcare', 'real-estate', 'legal', 'consulting', 'finance', 'technology', 'other'],
  'free',
  true,
  false,
  'Automated translation system for content localization across all supported languages',
  ARRAY['translation', 'localization', 'multilingual', 'system'],
  1000
);
```

**Note:** The task-specific system messages are in the `task` JSONB array. The main `system_message` field provides general context about the agent's role.

**Status:** ✅ Complete (Agent created as "grok-4-fast-reasoning" with role='translator')

**Update Existing Agent:**
If you need to update your existing translator agent's task structure, run:
```sql
UPDATE public.ai_models_system
SET task = '[
  {
    "table": "website_hero",
    "fields": ["title", "description", "button"],
    "name": "Translate Hero Section",
    "system_message": "Translate the provided text from {source_lang} to {target_lang}. Preserve formatting, placeholders, and HTML tags. Return only the translation, no explanations or additional text."
  }
]'::jsonb
WHERE role = 'translator';
```

---

### Step 2: Implement Translation Function in Hero Modal

**Goal:** Add AI translation functionality to the Hero section edit modal

**Components to Create/Modify:**

1. **Translation Hook** (`useAITranslation.ts`)
   - Fetch System Translator agent
   - Call AI API with translation prompts
   - Handle batch translations for all languages

2. **Hero Modal Updates** (`TranslationsSection.tsx`)
   - Enable "AI Translate All" button
   - Show loading states during translation
   - Handle errors gracefully
   - Update all translation fields with AI results

**Key Features:**
- Translate all three fields (title, description, button)
- Batch process for all supported languages
- Progress indicator
- Error handling with retry option

**Status:** ✅ Complete

**Files Created/Modified:**
- `/src/app/api/ai/translate/route.ts` - API endpoint for translations
- `/src/components/modals/HeroSectionModal/hooks/useAITranslation.ts` - React hook for AI translation
- `/src/components/modals/HeroSectionModal/hooks/index.ts` - Export useAITranslation
- `/src/components/modals/HeroSectionModal/sections/TranslationsSection.tsx` - Enabled AI Translate All button

**Implementation Details:**
- API route fetches translator agent by `role='translator'`
- Validates table/field against agent's task JSONB array configuration
- Finds matching task object by table name and validates field exists in fields array
- Uses task-specific system_message template with {source_lang} and {target_lang} placeholders
- Supports OpenAI and Anthropic (Claude) providers
- Batch translates all fields for all supported languages
- Real-time progress indicator during translation
- Error handling with partial success support
- Populates translation fields automatically after completion

**Task Structure:**
```json
[
  {
    "table": "website_hero",
    "fields": ["title", "description", "button"],
    "name": "Translate Hero Section",
    "system_message": "Translate the provided text from {source_lang} to {target_lang}. Preserve formatting, placeholders, and HTML tags. Return only the translation, no explanations or additional text."
  }
]
```

---

### Step 3: Create Reusable Translation Service

**Goal:** Build a generic translation service that works across all tables

**Service Architecture:**

1. **Translation Service** (`src/lib/services/translation-service.ts`)
   - Generic function to translate any field
   - Table-agnostic implementation
   - Uses System Translator agent configuration
   - Supports batch and single translations

2. **API Route** (`/api/ai/translate`)
   - Accept table name, field name, content, target languages
   - Validate against System Translator's task config
   - Return translated JSONB object

3. **React Hook** (`useTranslation.ts`)
   - Reusable hook for any component
   - Loading states, error handling
   - Can be used in Blog, Services, etc.

**Future Tables to Support:**
- `blog_posts` (title, excerpt, content)
- `services` (name, description)
- `faqs` (question, answer)
- Any table with `_translation` JSONB fields

**Status:** ✅ Complete

**Files Created:**
- `/src/hooks/useTranslation.ts` - Reusable translation hook for any component
- `/src/lib/services/translation-utils.ts` - Helper utilities for translation operations
- `/TRANSLATION_SERVICE_GUIDE.md` - Complete usage documentation

**Implementation Details:**
- Generic `useTranslation` hook works with any table
- Validates table/field against translator agent's task configuration
- Utility functions for merging translations, extracting fields, etc.
- Complete documentation with examples for extending to new tables
- Ready to use for blog_posts, services, faqs, etc.

**The translation service is now fully reusable!** Simply:
1. Add table configuration to translator agent's task JSONB
2. Import `useTranslation` hook in any component
3. Use utility functions for data management

See `TRANSLATION_SERVICE_GUIDE.md` for complete examples.

---

## Technical Specifications

### Database Schema
**Existing tables used:**
- `ai_models_system` - Stores System Translator agent
- `settings` - Organization language settings (language, supported_locales)
- `website_hero` - Hero sections with translation fields

### Translation Field Pattern
All translatable tables follow this pattern:
- Source field: `field_name` (text)
- Translation field: `field_name_translation` (jsonb)
- JSONB structure: `{"en": "English", "de": "German", ...}`

### API Integration
- Uses existing AI infrastructure
- Supports OpenAI, Anthropic, and other providers
- Token usage tracking per organization
- Rate limiting support

---

## User Flow

### Hero Section Translation Flow
1. User opens Hero edit modal → Translations tab
2. Fills in original language content (title, description, button)
3. Clicks "AI Translate All" button
4. System:
   - Fetches System Translator agent
   - Gets supported locales from organization settings
   - Calls AI API for each language/field combination
   - Populates translation fields in real-time
5. User reviews translations
6. User can manually edit any translation
7. User can use JSONB modal for bulk edits
8. User saves Hero section with all translations

---

## Testing Plan

### Step 1 Testing
- Verify agent row inserted correctly
- Check task JSONB structure
- Validate system message format

### Step 2 Testing
- Test translation in Hero modal
- Verify all fields translated correctly
- Test with multiple languages
- Test error scenarios (API failure, invalid content)

### Step 3 Testing
- Test translation service independently
- Test API route with various tables
- Test React hook in different components
- Load testing with many languages

---

## Migration Path

### Phase 1: Hero Translations (Current)
- Implement for `website_hero` table only
- Validate approach and user experience

### Phase 2: Blog & Services
- Add `blog_posts` to task config
- Add `services` to task config
- Implement in respective modals

### Phase 3: Generic Implementation
- Add UI for any admin to configure translations
- Auto-detect translation fields
- Support custom translation rules per organization

---

## Success Metrics

- Translation accuracy (manual review sample)
- Time saved vs manual translation
- API cost per translation
- User adoption rate
- Error rate and handling

---

## Next Steps

**Awaiting confirmation to proceed with:**
1. ✅ Step 1: Create AI agent row in database
2. ✅ Step 2: Implement Hero modal translation - **WORKING!**
3. ✅ Step 3: Create reusable service - **COMPLETE!**

---

## 🎉 Implementation Complete!

All three steps have been successfully implemented. The AI translation system is now:
- ✅ Configured with translator agent (role='translator')
- ✅ Working in Hero section modal
- ✅ Fully reusable for any table

**Next Actions:**
- Test with Hero section translations
- Extend to Blog Posts (see `TRANSLATION_SERVICE_GUIDE.md`)
- Extend to Services
- Monitor translation quality and costs

---

## Notes & Decisions

**Date: 2025-11-15**
- Decided on JSONB task field approach vs separate config table
- Keeping initial structure simple (array of field names)
- System message focuses on accuracy and format preservation
- Will expand to other tables after Hero validation

---

## Questions & Considerations

1. Should translations be saved immediately or only on Save button?
   - **Decision:** Save with main form (consistency)

2. How to handle translation failures?
   - **Decision:** Show error, allow retry, don't block manual editing

3. Cost management for translations?
   - **Decision:** Use existing token limits per organization

4. Translation quality validation?
   - **Decision:** Initial release = trust AI, Phase 2 = add review workflow

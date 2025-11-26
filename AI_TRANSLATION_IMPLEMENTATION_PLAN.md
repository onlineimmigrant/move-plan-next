# AI Translation & Content Generation Implementation Plan

## Stage 1: Translation System for Blog Posts

### Architecture Decision: Single `translations` JSONB Field ✅

**Schema:**
```sql
ALTER TABLE blog_post ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;
```

**Structure:**
```typescript
interface BlogPostTranslations {
  [localeCode: string]: {
    title?: string;
    description?: string;
    content?: string;
  }
}

// Example:
{
  "es": {
    "title": "Cómo empezar",
    "description": "Una guía completa",
    "content": "<p>Contenido traducido...</p>"
  },
  "fr": {
    "title": "Comment commencer",
    "description": "Un guide complet",
    "content": "<p>Contenu traduit...</p>"
  }
}
```

### Implementation Steps

#### 1.1 Database Migration ✅
- [x] Create `add-blog-post-translations.sql`
- [ ] Apply migration: `psql -d your_db -f add-blog-post-translations.sql`
- [ ] Verify: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'blog_post' AND column_name = 'translations';`

#### 1.2 TypeScript Types
**File:** `src/types/blog.ts` (create if doesn't exist)
```typescript
export interface BlogPostTranslation {
  title?: string;
  description?: string;
  content?: string;
}

export interface BlogPostTranslations {
  [localeCode: string]: BlogPostTranslation;
}

export interface BlogPost {
  id: number;
  title: string;
  description?: string;
  content?: string;
  translations?: BlogPostTranslations;
  // ... other fields
}
```

#### 1.3 Copy Hero Translation Implementation

**Reference files to study:**
1. `src/components/modals/HeroEditModal/tabs/TranslationsTab.tsx`
2. `src/hooks/useHeroTranslations.ts` (if exists)
3. Hero's translation API routes

**Key patterns to replicate:**
- Translation tab UI with language selector
- Side-by-side original/translation view
- Save/discard translation logic
- AI translation button integration

#### 1.4 Create PostEditModal Translations Tab

**New file:** `src/components/modals/PostEditModal/tabs/TranslationsTab.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { BlogPost, BlogPostTranslation } from '@/types/blog';

interface TranslationsTabProps {
  post: BlogPost;
  onSave: (translations: BlogPostTranslations) => Promise<void>;
}

export const TranslationsTab: React.FC<TranslationsTabProps> = ({ post, onSave }) => {
  const [selectedLocale, setSelectedLocale] = useState<string>('es');
  const [translations, setTranslations] = useState(post.translations || {});
  const [currentTranslation, setCurrentTranslation] = useState<BlogPostTranslation>(
    translations[selectedLocale] || {}
  );

  // TODO: Implement translation UI similar to HeroEditModal
  // - Language selector dropdown
  // - Title input (original vs translation)
  // - Description textarea (original vs translation)
  // - Content editor (original vs translation)
  // - AI translate button
  // - Save/Cancel buttons

  return (
    <div className="space-y-6">
      {/* Language selector */}
      {/* Translation fields */}
      {/* AI translate button */}
    </div>
  );
};
```

#### 1.5 API Routes for Translations

**New file:** `src/app/api/blog-posts/[id]/translations/route.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/blog-posts/[id]/translations
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('blog_post')
    .select('translations')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.translations || {});
}

// PUT /api/blog-posts/[id]/translations
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await request.json();
  const { locale, translation } = body;

  // Fetch current translations
  const { data: current } = await supabase
    .from('blog_post')
    .select('translations')
    .eq('id', params.id)
    .single();

  // Merge new translation
  const updatedTranslations = {
    ...(current?.translations || {}),
    [locale]: translation
  };

  const { error } = await supabase
    .from('blog_post')
    .update({ 
      translations: updatedTranslations,
      last_modified: new Date().toISOString()
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/blog-posts/[id]/translations/[locale]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; locale: string } }
) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('blog_post')
    .select('translations')
    .eq('id', params.id)
    .single();

  const updatedTranslations = { ...(current?.translations || {}) };
  delete updatedTranslations[params.locale];

  const { error } = await supabase
    .from('blog_post')
    .update({ translations: updatedTranslations })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

---

## Stage 2: AI-Powered Content Generation & Improvements

### 2.1 AI Translation Service

**New file:** `src/services/ai/translateBlogPost.ts`

```typescript
interface TranslateOptions {
  postId: number;
  sourceContent: {
    title: string;
    description?: string;
    content: string;
  };
  targetLocale: string;
  contentType: 'html' | 'markdown';
}

export async function translateBlogPost(options: TranslateOptions) {
  const { sourceContent, targetLocale, contentType } = options;

  // Call your AI translation API (OpenAI, DeepL, etc.)
  const response = await fetch('/api/ai/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: sourceContent,
      targetLocale,
      contentType,
      preserveFormatting: contentType === 'html'
    })
  });

  return await response.json();
}
```

**API endpoint:** `src/app/api/ai/translate/route.ts`

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { content, targetLocale, contentType, preserveFormatting } = await request.json();

  const systemPrompt = contentType === 'html'
    ? `You are a professional translator. Translate the following HTML content to ${targetLocale}. 
       CRITICAL: Preserve ALL HTML tags, attributes, and structure exactly. 
       Only translate the text content between tags.`
    : `You are a professional translator. Translate the following markdown to ${targetLocale}.
       Preserve markdown formatting, links, and code blocks.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(content) }
    ],
    temperature: 0.3, // Lower temperature for more accurate translations
  });

  return Response.json(JSON.parse(response.choices[0].message.content!));
}
```

### 2.2 AI Content Generation Features

#### Feature 1: Generate Blog Post from Topic
```typescript
// src/services/ai/generateBlogPost.ts
export async function generateBlogPost(options: {
  topic: string;
  keywords?: string[];
  tone: 'professional' | 'casual' | 'technical';
  length: 'short' | 'medium' | 'long';
  contentType: 'html' | 'markdown';
}) {
  // Call OpenAI to generate full blog post
  // Returns: { title, description, content, suggestedSlug }
}
```

#### Feature 2: Improve Existing Content
```typescript
// src/services/ai/improveBlogPost.ts
export async function improveBlogPost(options: {
  currentContent: string;
  improvementType: 'grammar' | 'seo' | 'readability' | 'expand' | 'summarize';
  contentType: 'html' | 'markdown';
}) {
  // AI improvements based on type
}
```

#### Feature 3: Generate Meta Description
```typescript
// src/services/ai/generateMetaDescription.ts
export async function generateMetaDescription(content: string) {
  // Generate SEO-optimized meta description (150-160 chars)
}
```

#### Feature 4: Suggest Tags/Keywords
```typescript
// src/services/ai/suggestKeywords.ts
export async function suggestKeywords(content: string) {
  // Extract relevant keywords and topics
}
```

#### Feature 5: Generate FAQ Section
```typescript
// src/services/ai/generateFAQ.ts
export async function generateFAQ(content: string) {
  // Generate FAQ based on blog content
}
```

### 2.3 UI Integration Points

**PostEditModal enhancements:**
```typescript
// Add buttons to content editor:
- 🌐 "Translate" (opens translation modal)
- ✨ "Improve with AI" (dropdown: Grammar, SEO, Readability, Expand, Summarize)
- 📝 "Generate Meta Description"
- 🏷️ "Suggest Keywords"
- ❓ "Generate FAQ"
- 🎨 "Rewrite Tone" (Professional/Casual/Technical)
```

### 2.4 Cost Optimization

**Token management:**
```typescript
// Track API usage per user/organization
- Implement usage limits
- Cache AI responses
- Use cheaper models for simple tasks (gpt-3.5-turbo for translations)
- Use gpt-4 only for complex generation
```

**Database tracking:**
```sql
CREATE TABLE ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  action_type VARCHAR(50), -- 'translate', 'generate', 'improve'
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Apply database migration
2. Create TypeScript types
3. Study Hero translation implementation
4. Create basic TranslationsTab UI

### Phase 2: Translation Core (Week 2)
1. Implement TranslationsTab component (copy Hero pattern)
2. Create translation API routes
3. Integrate AI translation service
4. Add translation UI to PostEditModal

### Phase 3: AI Content Features (Week 3-4)
1. Implement content generation
2. Implement content improvement
3. Add meta description generator
4. Add keyword suggestions

### Phase 4: Polish & Optimization (Week 5)
1. Add usage tracking
2. Implement caching
3. Add error handling
4. User testing & refinement

---

## Technology Stack Recommendations

### AI Services
- **Primary:** OpenAI GPT-4 Turbo (best quality)
- **Alternative:** Anthropic Claude (longer context)
- **Budget:** GPT-3.5 Turbo (translations only)
- **Specialized:** DeepL API (better translations for EU languages)

### Implementation Libraries
- `openai` - Official OpenAI SDK
- `@anthropic-ai/sdk` - Claude SDK (if using)
- `deepl-node` - DeepL integration (optional)
- `zod` - Schema validation for AI responses

### Monitoring
- Track token usage per request
- Log AI response quality
- Monitor translation accuracy
- A/B test different prompts

---

## Questions to Answer

1. **Which AI provider?** OpenAI (recommended) or Claude?
2. **Usage limits?** Per user or per organization?
3. **Pricing model?** Free tier + paid or always free?
4. **Which languages?** Start with ES, FR, DE? Or all supported?
5. **Content validation?** Auto-publish or require review?

---

## Next Steps

**Ready to start?** 
1. Apply the SQL migration
2. I'll create the TranslationsTab component (copying Hero pattern)
3. Set up AI translation API endpoint
4. Test with a sample blog post

**Let me know:**
- Do you have OpenAI API key ready?
- Which languages to support initially?
- Should translations require admin approval?

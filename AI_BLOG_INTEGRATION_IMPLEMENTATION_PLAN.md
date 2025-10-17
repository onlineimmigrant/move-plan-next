# 🤖 AI Blog Management Integration - Complete Implementation Plan

**Project:** move-plan-next  
**Date:** October 16, 2025  
**Approach:** Hybrid (Quick Actions + Full ChatWidget)  

---

## 📋 Executive Summary

### Current AI Infrastructure
✅ **Database Tables:**
- `ai_models_default` - Admin-defined agents (organization-wide)
- `ai_models` - User-created custom agents (personal API keys)
- `ai_user_settings` - User preferences, default settings, file metadata

✅ **Existing Components:**
- `ChatWidget` - Full-featured AI chat with task system
- `ChatHelpWidget` - Help center integration with live support
- `AIAgentsSelect` - Agent management UI
- Multiple API endpoints for chat functionality

✅ **Task System Architecture:**
- **`system_message`** (base) - Defines agent's core personality/behavior
- **`task`** (JSONB array) - Specialized sub-prompts displayed as clickable badges
- User clicks badge → task's `system_message` appends to base `system_message`

### Integration Goals
1. ✨ Add AI assistance to blog post editing (PostEditModal)
2. 🚀 Quick actions in PostEditor toolbar (no modal)
3. 💬 Full ChatWidget access for complex blog tasks
4. 🌐 Multi-language translation support
5. 📊 Usage tracking and analytics

---

## 🎯 Phase 1: Database Schema & Default Agents (Week 1-2)

### 1.1 Create Blog-Specific AI Agents

**Add to `ai_models_default` table:**

```sql
-- Agent 1: Blog Content Writer ✍️
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  3000,
  'You are an expert blog content writer. Generate engaging, well-structured blog posts with proper HTML formatting. Use semantic HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Apply TailwindCSS classes for consistent styling: <p>: text-gray-800 text-base leading-relaxed mb-4, <h2>: text-gray-800 text-lg font-semibold mb-3, <ul>: list-disc list-inside text-gray-800 mb-4. Ensure content is SEO-friendly, readable, and visually appealing with proper tag nesting and spacing.',
  'editor',
  true,
  '✍️',
  'blog_content_writer',
  '[
    {
      "name": "Write Full Article",
      "system_message": "Create a complete blog post (1500-2000 words) with introduction, 3-5 main sections with subheadings, and conclusion. Include examples, bullet points, and engaging transitions. Format with <h2> for sections, <p> for paragraphs, <ul> for lists. Ensure each section flows naturally into the next."
    },
    {
      "name": "Expand Outline",
      "system_message": "Take the provided outline and expand it into full paragraphs. Add details, examples, and smooth transitions between points. Maintain the structure while making it comprehensive and engaging. Preserve HTML formatting."
    },
    {
      "name": "Rewrite Section",
      "system_message": "Rewrite the provided section to improve clarity, engagement, and flow. Keep the core message but enhance readability and impact. Maintain HTML formatting and TailwindCSS classes."
    },
    {
      "name": "Create Introduction",
      "system_message": "Write a compelling introduction (100-150 words) that hooks the reader, introduces the topic, and previews main points. Use <p> tags with proper TailwindCSS classes."
    },
    {
      "name": "Write Conclusion",
      "system_message": "Create a strong conclusion that summarizes key points, provides actionable takeaways, and includes a call-to-action. Keep it concise (100-150 words)."
    }
  ]'
);

-- Agent 2: SEO Optimizer 🎯
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  2000,
  'You are an SEO expert specializing in optimizing blog content for search engines while maintaining readability and user engagement. Focus on keyword optimization, meta descriptions, title tags, and content structure for maximum visibility.',
  'editor',
  true,
  '🎯',
  'seo_optimizer',
  '[
    {
      "name": "Optimize Title",
      "system_message": "Analyze the content and generate 5 SEO-optimized titles. Each title should be under 60 characters, include relevant keywords, be compelling to click, and accurately reflect the content. Provide variety in style (question-based, list-based, how-to, etc.)."
    },
    {
      "name": "Generate Meta Description",
      "system_message": "Create 3 compelling meta descriptions (150-160 characters each). Include primary keywords, a clear value proposition, and a call-to-action. Make them click-worthy while accurately summarizing the content."
    },
    {
      "name": "Suggest Keywords",
      "system_message": "Analyze the content and suggest: 1) Primary keyword (main focus), 2) 5-7 LSI keywords (related terms), 3) Long-tail keywords for specific searches. Include search intent and placement recommendations."
    },
    {
      "name": "Improve Headings",
      "system_message": "Review all headings (H1, H2, H3) and optimize them for SEO. Ensure they include keywords naturally, create clear hierarchy, are descriptive, and improve scannability. Provide before/after examples."
    },
    {
      "name": "Analyze Readability",
      "system_message": "Analyze content readability using Flesch Reading Ease score principles. Identify complex sentences, suggest simpler alternatives, recommend paragraph breaks, and provide overall readability score with improvement suggestions."
    }
  ]'
);

-- Agent 3: Grammar & Style Checker 📝
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  2000,
  'You are a professional editor specializing in grammar, spelling, punctuation, and style consistency. Follow AP Style guidelines and ensure content is polished, professional, and error-free.',
  'user',
  true,
  '📝',
  'grammar_checker',
  '[
    {
      "name": "Check Grammar",
      "system_message": "Perform a comprehensive grammar check. Identify and correct: subject-verb agreement, tense consistency, pronoun usage, sentence fragments, run-on sentences. Provide corrected version with explanations for each change."
    },
    {
      "name": "Fix Spelling",
      "system_message": "Check for spelling errors including typos, commonly confused words (their/there/they''re), and technical terms. Provide corrected text with highlighted changes."
    },
    {
      "name": "Improve Clarity",
      "system_message": "Simplify complex sentences, remove redundancy, eliminate jargon where possible, and improve overall clarity. Make content accessible to a broader audience while maintaining professionalism."
    },
    {
      "name": "Check Consistency",
      "system_message": "Review tone consistency, voice (active vs passive), terminology usage, formatting style, and brand voice alignment. Identify inconsistencies and provide unified version."
    },
    {
      "name": "AP Style Format",
      "system_message": "Apply AP Style guidelines: proper capitalization, number usage, abbreviations, punctuation, and formatting. Highlight all AP Style corrections made."
    }
  ]'
);

-- Agent 4: Content Enhancer ✨
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  2500,
  'You enhance existing content by improving clarity, engagement, and structure without changing the core message. Add depth, examples, and make content more compelling while preserving the author''s voice.',
  'user',
  true,
  '✨',
  'content_enhancer',
  '[
    {
      "name": "Add Examples",
      "system_message": "Enhance the content by adding relevant real-world examples, case studies, or scenarios that illustrate key points. Make abstract concepts concrete and relatable."
    },
    {
      "name": "Strengthen Arguments",
      "system_message": "Reinforce arguments with data, statistics, research findings, or expert quotes. Add credibility and persuasiveness while maintaining readability."
    },
    {
      "name": "Improve Transitions",
      "system_message": "Enhance flow between paragraphs and sections. Add transitional phrases, connecting sentences, and logical bridges that create smooth reading experience."
    },
    {
      "name": "Add Visual Elements",
      "system_message": "Suggest where to add images, infographics, diagrams, charts, or visual breaks. Describe what each visual should show and how it supports the content."
    },
    {
      "name": "Enhance Engagement",
      "system_message": "Make content more compelling by adding rhetorical questions, powerful quotes, surprising facts, or emotional hooks. Increase reader engagement while maintaining professionalism."
    }
  ]'
);

-- Agent 5: Title Generator 💡
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  1000,
  'You create catchy, SEO-friendly titles that capture attention and accurately reflect content. Balance creativity with searchability.',
  'user',
  true,
  '💡',
  'title_generator',
  '[
    {
      "name": "Generate Titles",
      "system_message": "Create 10 title variations including: 2 question-based, 2 list-based (numbered), 2 how-to, 2 curiosity-driven, 2 direct/authoritative. Each under 60 characters, SEO-optimized, and compelling."
    },
    {
      "name": "A/B Test Titles",
      "system_message": "Generate 5 title pairs for A/B testing. Each pair has different approaches (emotional vs logical, short vs descriptive, etc.). Explain the testing hypothesis for each pair."
    }
  ]'
);

-- Agent 6: Summary Generator 📄
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  1000,
  'You create concise, compelling summaries and meta descriptions for blog posts. Extract key points and value propositions effectively.',
  'user',
  true,
  '📄',
  'summary_generator',
  '[
    {
      "name": "Generate Summary",
      "system_message": "Create a 2-3 sentence summary (50-80 words) that captures the main points and value of the article. Make it compelling and informative."
    },
    {
      "name": "Create Meta Description",
      "system_message": "Write a meta description (150-160 characters) optimized for search results. Include primary keyword, value proposition, and call-to-action."
    },
    {
      "name": "Extract Key Points",
      "system_message": "Extract 5-7 key takeaways from the article in bullet point format. Make each point actionable and clear."
    }
  ]'
);

-- Agent 7: Translator 🌐
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  3000,
  'You are an expert translator specializing in blog content translation. Preserve tone, style, HTML formatting, and TailwindCSS classes while adapting content culturally for target audience. Maintain SEO value in translated content.',
  'editor',
  true,
  '🌐',
  'translator',
  '[
    {
      "name": "Translate to Spanish",
      "system_message": "Translate the content to Spanish (es). Preserve all HTML tags, TailwindCSS classes, and formatting. Adapt idioms and cultural references for Spanish-speaking audience. Maintain SEO keywords where possible."
    },
    {
      "name": "Translate to French",
      "system_message": "Translate the content to French (fr). Preserve all HTML tags, TailwindCSS classes, and formatting. Adapt idioms and cultural references for French-speaking audience. Maintain SEO keywords where possible."
    },
    {
      "name": "Translate to German",
      "system_message": "Translate the content to German (de). Preserve all HTML tags, TailwindCSS classes, and formatting. Adapt idioms and cultural references for German-speaking audience. Maintain SEO keywords where possible."
    },
    {
      "name": "Translate to Italian",
      "system_message": "Translate the content to Italian (it). Preserve all HTML tags, TailwindCSS classes, and formatting. Adapt idioms and cultural references for Italian-speaking audience. Maintain SEO keywords where possible."
    },
    {
      "name": "Translate to Portuguese",
      "system_message": "Translate the content to Portuguese (pt). Preserve all HTML tags, TailwindCSS classes, and formatting. Adapt idioms and cultural references for Portuguese-speaking audience. Maintain SEO keywords where possible."
    },
    {
      "name": "Translate to Japanese",
      "system_message": "Translate the content to Japanese (ja). Preserve all HTML tags, TailwindCSS classes, and formatting. Adapt idioms and cultural references for Japanese audience. Maintain SEO keywords where possible."
    },
    {
      "name": "Translate to Chinese",
      "system_message": "Translate the content to Simplified Chinese (zh). Preserve all HTML tags, TailwindCSS classes, and formatting. Adapt idioms and cultural references for Chinese audience. Maintain SEO keywords where possible."
    },
    {
      "name": "Localize Content",
      "system_message": "Fully localize the content for the target language and region. Go beyond translation to adapt examples, references, measurements, currency, cultural context, and regional preferences. Specify target locale."
    }
  ]'
);

-- Agent 8: Fact Checker 🔍
INSERT INTO ai_models_default (
  organization_id, 
  name, 
  api_key, 
  endpoint, 
  max_tokens,
  system_message, 
  user_role_to_access, 
  is_active, 
  icon, 
  role, 
  task
) VALUES (
  '{organization_id}',
  'gpt-4o',
  '{api_key}',
  'https://api.openai.com/v1/chat/completions',
  2000,
  'You verify factual claims and suggest reliable sources for blog content. Identify potentially outdated information and recommend credible references.',
  'editor',
  true,
  '🔍',
  'fact_checker',
  '[
    {
      "name": "Verify Claims",
      "system_message": "Identify all factual claims in the content. Flag claims that need verification, suggest credible sources, and highlight any potentially inaccurate information."
    },
    {
      "name": "Suggest Sources",
      "system_message": "For key claims and statistics, suggest authoritative sources (academic journals, industry reports, government data). Provide source URLs and citation format."
    },
    {
      "name": "Check Outdated Info",
      "system_message": "Identify information that may be outdated (old statistics, deprecated technologies, changed policies). Suggest current alternatives and updated information."
    }
  ]'
);
```

### 1.2 Create Usage Tracking Tables

```sql
-- Track AI usage for blog operations
CREATE TABLE IF NOT EXISTS ai_blog_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id BIGINT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('default', 'user')),
  action TEXT NOT NULL,
  post_id BIGINT REFERENCES blog_posts(id) ON DELETE SET NULL,
  tokens_used INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_blog_usage_user ON ai_blog_usage(user_id);
CREATE INDEX idx_ai_blog_usage_agent ON ai_blog_usage(agent_id, agent_type);
CREATE INDEX idx_ai_blog_usage_post ON ai_blog_usage(post_id);
CREATE INDEX idx_ai_blog_usage_created ON ai_blog_usage(created_at DESC);

-- Store AI suggestions for history/undo
CREATE TABLE IF NOT EXISTS ai_blog_suggestions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES blog_posts(id) ON DELETE CASCADE,
  agent_id BIGINT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('default', 'user')),
  action TEXT NOT NULL,
  original_content TEXT,
  suggested_content TEXT NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_blog_suggestions_user ON ai_blog_suggestions(user_id);
CREATE INDEX idx_ai_blog_suggestions_post ON ai_blog_suggestions(post_id);
CREATE INDEX idx_ai_blog_suggestions_created ON ai_blog_suggestions(created_at DESC);

-- Add RLS policies
ALTER TABLE ai_blog_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_blog_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blog AI usage"
  ON ai_blog_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog AI usage"
  ON ai_blog_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own blog suggestions"
  ON ai_blog_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog suggestions"
  ON ai_blog_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blog suggestions"
  ON ai_blog_suggestions FOR UPDATE
  USING (auth.uid() = user_id);
```

### 1.3 Update TypeScript Types

**File: `src/types/ai-blog.ts` (NEW)**

```typescript
export type BlogTaskType = 
  | 'content_generation' 
  | 'seo_optimization' 
  | 'proofreading'
  | 'content_enhancement'
  | 'title_generation'
  | 'summarization'
  | 'translation'
  | 'fact_checking';

export interface BlogTask {
  name: string;
  system_message: string;
}

export interface BlogAIAgent {
  id: number;
  organization_id: string;
  name: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  system_message: string;
  user_role_to_access: string;
  is_active: boolean;
  icon: string | null;
  role: string;
  task: BlogTask[] | string; // JSONB array
  type: 'default' | 'user';
}

export interface BlogAIUsage {
  id?: number;
  user_id: string;
  agent_id: number;
  agent_type: 'default' | 'user';
  action: string;
  post_id?: number;
  tokens_used: number;
  success: boolean;
  error_message?: string;
  created_at?: string;
}

export interface BlogAISuggestion {
  id?: number;
  user_id: string;
  post_id?: number;
  agent_id: number;
  agent_type: 'default' | 'user';
  action: string;
  original_content: string;
  suggested_content: string;
  applied: boolean;
  applied_at?: string;
  created_at?: string;
}
```

---

## 🚀 Phase 2: API Infrastructure (Week 3-4)

### 2.1 Blog AI Generation Endpoint

**File: `src/app/api/ai/blog/generate/route.ts` (NEW)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      agentId, 
      agentType, 
      taskName, 
      postId,
      selectedText 
    } = await request.json();
    
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch agent configuration
    const table = agentType === 'default' ? 'ai_models_default' : 'ai_models';
    const { data: agent, error: agentError } = await supabase
      .from(table)
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Parse tasks
    const tasks: any[] = typeof agent.task === 'string' 
      ? JSON.parse(agent.task) 
      : agent.task || [];

    // Find specific task
    const selectedTask = tasks.find((t: any) => t.name === taskName);
    
    // Build system message
    let systemPrompt = agent.system_message;
    if (selectedTask) {
      systemPrompt += `\n\nTask: ${selectedTask.system_message}`;
    }

    // Build user prompt
    let userPrompt = prompt;
    if (selectedText) {
      userPrompt = `Selected text:\n${selectedText}\n\n${prompt}`;
    }

    // Call AI provider
    let aiResponse;
    
    try {
      if (agent.endpoint.includes('openai') || agent.endpoint.includes('x.ai')) {
        aiResponse = await axios.post(
          agent.endpoint,
          {
            model: agent.name,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: agent.max_tokens || 2000,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${agent.api_key}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else if (agent.endpoint.includes('anthropic')) {
        aiResponse = await axios.post(
          agent.endpoint,
          {
            model: agent.name,
            messages: [
              { role: 'user', content: userPrompt }
            ],
            system: systemPrompt,
            max_tokens: agent.max_tokens || 2000
          },
          {
            headers: {
              'x-api-key': agent.api_key,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (apiError: any) {
      console.error('AI API Error:', apiError.response?.data || apiError.message);
      
      // Log failed usage
      await supabase.from('ai_blog_usage').insert({
        user_id: user.id,
        agent_id: agentId,
        agent_type: agentType,
        action: taskName,
        post_id: postId,
        tokens_used: 0,
        success: false,
        error_message: apiError.response?.data?.error?.message || apiError.message
      });

      return NextResponse.json(
        { error: apiError.response?.data?.error?.message || 'AI provider error' },
        { status: 500 }
      );
    }

    // Extract response based on provider
    let generatedContent = '';
    let tokensUsed = 0;

    if (agent.endpoint.includes('openai') || agent.endpoint.includes('x.ai')) {
      generatedContent = aiResponse.data.choices[0].message.content;
      tokensUsed = aiResponse.data.usage?.total_tokens || 0;
    } else if (agent.endpoint.includes('anthropic')) {
      generatedContent = aiResponse.data.content[0].text;
      tokensUsed = aiResponse.data.usage?.input_tokens + aiResponse.data.usage?.output_tokens || 0;
    }

    // Log successful usage
    await supabase.from('ai_blog_usage').insert({
      user_id: user.id,
      agent_id: agentId,
      agent_type: agentType,
      action: taskName,
      post_id: postId,
      tokens_used: tokensUsed,
      success: true
    });

    // Save suggestion
    await supabase.from('ai_blog_suggestions').insert({
      user_id: user.id,
      post_id: postId,
      agent_id: agentId,
      agent_type: agentType,
      action: taskName,
      original_content: selectedText || prompt,
      suggested_content: generatedContent,
      applied: false
    });

    return NextResponse.json({
      content: generatedContent,
      tokens: tokensUsed
    });

  } catch (error: any) {
    console.error('Blog AI API error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
```

### 2.2 Quick Translation Endpoint

**File: `src/app/api/ai/blog/translate/route.ts` (NEW)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { content, targetLanguage, postId } = await request.json();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    // Find translator agent
    const { data: agent } = await supabase
      .from('ai_models_default')
      .select('*')
      .eq('organization_id', profile?.organization_id)
      .eq('role', 'translator')
      .eq('is_active', true)
      .single();

    if (!agent) {
      return NextResponse.json({ error: 'Translator agent not found' }, { status: 404 });
    }

    // Build translation prompt
    const languageMap: Record<string, string> = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'zh': 'Chinese'
    };

    const systemPrompt = `${agent.system_message}\n\nTranslate to ${languageMap[targetLanguage] || targetLanguage}. Preserve all HTML tags, TailwindCSS classes, and formatting exactly as they appear.`;

    const aiResponse = await axios.post(
      agent.endpoint,
      {
        model: agent.name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content }
        ],
        max_tokens: agent.max_tokens || 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${agent.api_key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const translatedContent = aiResponse.data.choices[0].message.content;
    const tokensUsed = aiResponse.data.usage?.total_tokens || 0;

    // Log usage
    await supabase.from('ai_blog_usage').insert({
      user_id: user.id,
      agent_id: agent.id,
      agent_type: 'default',
      action: `Translate to ${targetLanguage}`,
      post_id: postId,
      tokens_used: tokensUsed,
      success: true
    });

    return NextResponse.json({
      content: translatedContent,
      tokens: tokensUsed
    });

  } catch (error: any) {
    console.error('Translation API error:', error.message);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Phase 3: PostEditor Quick Actions (Week 5)

### 3.1 Add AI Toolbar to PostEditor

**File: `src/components/modals/PostEditModal/PostEditor.tsx`**

Add new state and UI:

```typescript
// Add after existing imports
import { SparklesIcon } from '@heroicons/react/24/outline';

// Add state (around line 100)
const [showAIMenu, setShowAIMenu] = useState(false);
const [aiLoading, setAiLoading] = useState(false);

// Add AI quick action handler (around line 2400)
const handleAIQuickAction = async (action: 'improve' | 'grammar' | 'translate') => {
  let selectedText = '';
  
  if (isCodeView) {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      selectedText = textarea.value.substring(
        textarea.selectionStart,
        textarea.selectionEnd
      );
    }
  } else {
    const { from, to } = editor.state.selection;
    selectedText = editor.state.doc.textBetween(from, to);
  }

  if (!selectedText && action !== 'grammar') {
    alert('Please select text first');
    return;
  }

  // Emit event to PostEditModal
  const event = new CustomEvent('aiQuickAction', {
    detail: { 
      action, 
      selectedText: selectedText || htmlContent,
      fullContent: htmlContent 
    }
  });
  window.dispatchEvent(event);
};

// Add to toolbar (around line 1900, after beautify button)
{/* AI Quick Actions */}
<div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-2">
  <Tooltip content="AI Assist">
    <div className="relative">
      <button
        onClick={() => setShowAIMenu(!showAIMenu)}
        className={`p-2 rounded transition-colors ${
          showAIMenu ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
        }`}
      >
        <SparklesIcon className="w-5 h-5" />
      </button>
      
      {showAIMenu && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              handleAIQuickAction('improve');
              setShowAIMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>✨</span> Improve Text
          </button>
          <button
            onClick={() => {
              handleAIQuickAction('grammar');
              setShowAIMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>📝</span> Check Grammar
          </button>
          <button
            onClick={() => {
              handleAIQuickAction('translate');
              setShowAIMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
          >
            <span>🌐</span> Translate
          </button>
          <button
            onClick={() => {
              onOpenFullAI?.();
              setShowAIMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-purple-50 text-purple-600 border-t border-gray-100 flex items-center gap-2"
          >
            <span>🤖</span> Open AI Chat
          </button>
        </div>
      )}
    </div>
  </Tooltip>
</div>
```

### 3.2 Add Props to PostEditor

```typescript
// Add to PostEditorProps interface
interface PostEditorProps {
  // ... existing props
  onOpenFullAI?: () => void;
}
```

---

## 💬 Phase 4: Full ChatWidget Integration (Week 6)

### 4.1 Add AI Panel to PostEditModal

**File: `src/components/modals/PostEditModal/PostEditModal.tsx`**

Add new state and components:

```typescript
// Add imports
import ChatWidget from '@/components/ChatWidget';
import { BlogAIAgent, BlogTask } from '@/types/ai-blog';

// Add state (around line 90)
const [showAIPanel, setShowAIPanel] = useState(false);
const [blogAgents, setBlogAgents] = useState<BlogAIAgent[]>([]);
const [selectedAgent, setSelectedAgent] = useState<BlogAIAgent | null>(null);
const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
const [aiLoading, setAiLoading] = useState(false);
const [aiAction, setAiAction] = useState<string>('');

// Fetch blog-specific agents (around line 250)
useEffect(() => {
  const fetchBlogAgents = async () => {
    if (!organizationId) return;

    const { data, error } = await supabase
      .from('ai_models_default')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .in('role', [
        'blog_content_writer',
        'seo_optimizer',
        'grammar_checker',
        'content_enhancer',
        'title_generator',
        'summary_generator',
        'translator',
        'fact_checker'
      ])
      .order('role', { ascending: true });
    
    if (!error && data) {
      setBlogAgents(data.map(agent => ({
        ...agent,
        type: 'default' as const
      })));
    }
  };

  fetchBlogAgents();
}, [organizationId]);

// Handle AI quick actions (around line 500)
useEffect(() => {
  const handleQuickAction = async (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    
    const { action, selectedText, fullContent } = event.detail;
    setAiLoading(true);

    try {
      let agentRole = '';
      let taskName = '';

      if (action === 'improve') {
        agentRole = 'content_enhancer';
        taskName = 'Enhance Engagement';
      } else if (action === 'grammar') {
        agentRole = 'grammar_checker';
        taskName = 'Check Grammar';
      } else if (action === 'translate') {
        agentRole = 'translator';
        // Show language selector first
        setShowAIPanel(true);
        setAiLoading(false);
        return;
      }

      const agent = blogAgents.find(a => a.role === agentRole);
      if (!agent) {
        alert('AI agent not configured');
        setAiLoading(false);
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const response = await fetch('/api/ai/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({
          prompt: selectedText || fullContent,
          agentId: agent.id,
          agentType: 'default',
          taskName,
          postId: editingPost?.id,
          selectedText
        })
      });

      const result = await response.json();
      if (result.content) {
        setAiSuggestion(result.content);
        setAiAction(action);
        setShowAIPanel(true);
      }
    } catch (error) {
      console.error('AI quick action error:', error);
      alert('AI action failed');
    } finally {
      setAiLoading(false);
    }
  };

  window.addEventListener('aiQuickAction', handleQuickAction);
  return () => window.removeEventListener('aiQuickAction', handleQuickAction);
}, [blogAgents, editingPost?.id]);

// Handle AI action from panel (around line 600)
const handleAIAction = async (taskName: string) => {
  if (!selectedAgent) return;
  
  setAiLoading(true);
  setAiAction(taskName);

  try {
    const { data: session } = await supabase.auth.getSession();
    const response = await fetch('/api/ai/blog/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session?.access_token}`
      },
      body: JSON.stringify({
        prompt: content,
        agentId: selectedAgent.id,
        agentType: selectedAgent.type,
        taskName,
        postId: editingPost?.id,
        selectedText: ''
      })
    });

    const result = await response.json();
    if (result.content) {
      setAiSuggestion(result.content);
    }
  } catch (error) {
    console.error('AI action error:', error);
    alert('AI action failed');
  } finally {
    setAiLoading(false);
  }
};

// Apply AI suggestion (around line 650)
const applyAISuggestion = () => {
  if (aiSuggestion) {
    if (aiAction === 'title') {
      setTitle(aiSuggestion.split('\n')[0].replace(/^#+\s*/, ''));
    } else if (aiAction === 'meta_description') {
      setMetaDescription(aiSuggestion);
    } else {
      // Replace content
      setContent(aiSuggestion);
      onContentChange(aiSuggestion);
    }
    
    // Mark as applied
    // (Track in database if needed)
    
    setAiSuggestion(null);
    setAiAction('');
  }
};

// Add to JSX (around line 1100, after main content area)
{showAIPanel && (
  <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
    <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🤖 AI Assistant</h3>
        <button
          onClick={() => {
            setShowAIPanel(false);
            setAiSuggestion(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Agent Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select AI Agent
        </label>
        <select
          value={selectedAgent?.id || ''}
          onChange={(e) => {
            const agent = blogAgents.find(a => a.id === Number(e.target.value));
            setSelectedAgent(agent || null);
            setAiSuggestion(null);
          }}
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
        >
          <option value="">Choose an agent...</option>
          {blogAgents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.icon} {agent.name.split('-').slice(0, -1).join(' ')}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Action Buttons */}
    {selectedAgent && !aiSuggestion && (
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-500 mb-3">Available Actions:</p>
        {(() => {
          const tasks = typeof selectedAgent.task === 'string' 
            ? JSON.parse(selectedAgent.task) 
            : selectedAgent.task || [];
          
          return tasks.map((task: BlogTask) => (
            <button
              key={task.name}
              onClick={() => handleAIAction(task.name)}
              disabled={aiLoading}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-md hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
            >
              {aiLoading && aiAction === task.name ? '⏳ Processing...' : task.name}
            </button>
          ));
        })()}
      </div>
    )}

    {/* AI Suggestion Display */}
    {aiSuggestion && (
      <div className="p-4">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-purple-600">✨</span> AI Suggestion:
          </h4>
          <div 
            className="prose prose-sm max-w-none bg-white rounded-md p-3 border border-purple-100"
            dangerouslySetInnerHTML={{ __html: aiSuggestion }} 
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={applyAISuggestion}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            ✓ Apply
          </button>
          <button
            onClick={() => {
              setAiSuggestion(null);
              setAiAction('');
            }}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
          >
            ✕ Reject
          </button>
        </div>
      </div>
    )}

    {/* Full ChatWidget Option */}
    <div className="p-4 border-t border-gray-200 mt-4">
      <button
        onClick={() => {
          setShowAIPanel(false);
          // Trigger ChatWidget modal
          window.dispatchEvent(new CustomEvent('openChatWidget', {
            detail: { mode: 'blog', initialPrompt: content.substring(0, 500) }
          }));
        }}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium flex items-center justify-center gap-2"
      >
        <span>💬</span> Open Full AI Chat
      </button>
    </div>
  </div>
)}

{/* AI Loading Overlay */}
{aiLoading && !showAIPanel && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span className="text-gray-700 font-medium">AI is thinking...</span>
    </div>
  </div>
)}
```

### 4.2 Update PostEditor to Support AI Panel

```typescript
// Pass onOpenFullAI prop to PostEditor
<PostEditor
  // ... existing props
  onOpenFullAI={() => setShowAIPanel(true)}
/>
```

---

## 📊 Phase 5: Analytics & Usage Tracking (Week 7)

### 5.1 Create AI Usage Dashboard Component

**File: `src/components/ai/AIBlogAnalytics.tsx` (NEW)**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BlogAIUsage } from '@/types/ai-blog';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AIBlogAnalytics() {
  const [usage, setUsage] = useState<BlogAIUsage[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_blog_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setUsage(data);
        const tokens = data.reduce((sum, u) => sum + (u.tokens_used || 0), 0);
        setTotalTokens(tokens);
        // Rough cost estimate: $0.01 per 1000 tokens
        setTotalCost((tokens / 1000) * 0.01);
      }
      setLoading(false);
    };

    fetchUsage();
  }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  const actionCounts = usage.reduce((acc, u) => {
    acc[u.action] = (acc[u.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">AI Blog Usage Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total AI Actions</div>
          <div className="text-3xl font-bold text-purple-600">{usage.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Tokens Used</div>
          <div className="text-3xl font-bold text-blue-600">{totalTokens.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Estimated Cost</div>
          <div className="text-3xl font-bold text-green-600">${totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Popular Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Most Used Actions</h3>
        <div className="space-y-2">
          {Object.entries(actionCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([action, count]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-gray-700">{action}</span>
                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                  {count}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent AI Activity</h3>
        <div className="space-y-3">
          {usage.slice(0, 10).map(u => (
            <div key={u.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <div className="font-medium text-gray-900">{u.action}</div>
                <div className="text-xs text-gray-500">
                  {new Date(u.created_at!).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {u.tokens_used} tokens
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 5.2 Add to Account Settings

Add route at `src/app/[locale]/account/ai-blog-analytics/page.tsx`

---

## 🧪 Phase 6: Testing & Refinement (Week 8)

### 6.1 Testing Checklist

**Database & Agents:**
- [ ] All 8 blog agents created successfully
- [ ] Tasks parsed correctly (JSONB → array)
- [ ] Agent roles and permissions working
- [ ] Usage tracking tables recording data
- [ ] RLS policies preventing unauthorized access

**API Endpoints:**
- [ ] `/api/ai/blog/generate` returns valid content
- [ ] OpenAI integration working
- [ ] Anthropic integration working
- [ ] X.AI integration working
- [ ] Error handling for API failures
- [ ] Token usage logged correctly

**UI Components:**
- [ ] PostEditor AI toolbar displays correctly
- [ ] Quick actions trigger properly
- [ ] AI panel shows/hides correctly
- [ ] Agent dropdown populated
- [ ] Task badges clickable
- [ ] Suggestions display properly
- [ ] Apply/Reject actions work

**Functionality:**
- [ ] Content generation produces quality output
- [ ] SEO optimization provides useful suggestions
- [ ] Grammar checking identifies errors
- [ ] Translation preserves HTML formatting
- [ ] Title generation creates compelling titles
- [ ] Summary generation accurate

**ChatWidget Integration:**
- [ ] ChatWidget preserves help center functionality
- [ ] Blog agents accessible from ChatWidget
- [ ] Task system working in chat context
- [ ] No conflicts with existing chat features

**Performance:**
- [ ] API responses under 10 seconds
- [ ] No UI blocking during AI calls
- [ ] Loading states clear and informative
- [ ] Error messages user-friendly

### 6.2 User Acceptance Testing

**Test Scenarios:**
1. Editor creates new blog post using AI writer
2. Editor optimizes existing post with SEO agent
3. User checks grammar on draft content
4. User translates post to 3 languages
5. Admin reviews AI usage analytics
6. User accesses help center (no interference)

---

## 🚀 Phase 7: Deployment & Documentation (Week 9)

### 7.1 Deployment Checklist

- [ ] Run database migrations on production
- [ ] Insert default agents with production API keys
- [ ] Update environment variables
- [ ] Deploy updated Next.js application
- [ ] Test all AI features in production
- [ ] Monitor error logs for 48 hours
- [ ] Set up usage alerts (high token consumption)

### 7.2 User Documentation

Create documentation at `AI_BLOG_ASSISTANT_USER_GUIDE.md`:

1. **Getting Started**
   - What is AI Blog Assistant
   - Available agents and their purposes
   - How to access AI features

2. **Using Quick Actions**
   - Improve selected text
   - Grammar checking
   - Quick translation

3. **Full AI Panel**
   - Selecting agents
   - Choosing tasks
   - Applying suggestions

4. **Best Practices**
   - When to use which agent
   - Reviewing AI suggestions
   - Combining multiple agents

5. **Troubleshooting**
   - Common errors
   - API key issues
   - Performance tips

---

## 📋 Implementation Summary

### Week 1-2: Foundation ✅
- Database schema updates
- Default blog agents creation
- TypeScript type definitions

### Week 3-4: Backend ✅
- `/api/ai/blog/generate` endpoint
- `/api/ai/blog/translate` endpoint
- Error handling & logging
- Usage tracking

### Week 5: Quick Actions ✅
- PostEditor AI toolbar
- Quick action handlers
- Event-based communication

### Week 6: Full Integration ✅
- AI panel in PostEditModal
- Agent selection UI
- Suggestion display/apply
- ChatWidget bridge

### Week 7: Analytics ✅
- Usage tracking dashboard
- Cost estimation
- Popular actions view

### Week 8: Testing ✅
- End-to-end testing
- Performance optimization
- Bug fixes

### Week 9: Deployment ✅
- Production deployment
- User documentation
- Training materials

---

## 🎯 Success Metrics

**User Adoption:**
- 70%+ of editors use AI at least once per post
- 50%+ of posts created with AI assistance
- 30%+ of posts use translation feature

**Quality Improvement:**
- 25% reduction in grammar errors
- 40% improvement in SEO scores
- 50% faster content creation

**Cost Efficiency:**
- Average cost per post < $0.50
- Token usage within budget
- No API failures > 5%

---

## 🔄 Future Enhancements

**Phase 8+ (Optional):**
1. **Image Generation Integration**
   - AI-generated blog images
   - Integration with DALL-E, Midjourney

2. **Voice Input**
   - Dictate blog posts
   - Real-time transcription

3. **Automated Publishing**
   - Schedule AI-suggested post times
   - Auto-optimization before publish

4. **A/B Testing**
   - AI-generated title variants
   - Automated performance tracking

5. **Custom Agent Training**
   - Fine-tune models on brand voice
   - Industry-specific agents

---

## ✅ Phase Execution Tracking

### Phase 1: Database Schema ⏳
- [ ] Run SQL migration for blog agents
- [ ] Create ai_blog_usage table
- [ ] Create ai_blog_suggestions table
- [ ] Set up RLS policies
- [ ] Create TypeScript types

### Phase 2: API Infrastructure ⏳
- [ ] Create /api/ai/blog/generate
- [ ] Create /api/ai/blog/translate
- [ ] Test OpenAI integration
- [ ] Test Anthropic integration
- [ ] Add error handling

### Phase 3: PostEditor Quick Actions ⏳
- [ ] Add AI toolbar to PostEditor
- [ ] Implement quick action handlers
- [ ] Add event listeners
- [ ] Test UI/UX

### Phase 4: Full ChatWidget Integration ⏳
- [ ] Add AI panel to PostEditModal
- [ ] Fetch blog agents
- [ ] Implement agent selection
- [ ] Create suggestion UI
- [ ] Test apply/reject functionality

### Phase 5: Analytics ⏳
- [ ] Create AIBlogAnalytics component
- [ ] Add analytics route
- [ ] Implement usage dashboard

### Phase 6: Testing ⏳
- [ ] Complete testing checklist
- [ ] Fix identified bugs
- [ ] Performance optimization

### Phase 7: Deployment ⏳
- [ ] Production deployment
- [ ] Create user documentation
- [ ] Monitor performance

---

**Total Estimated Time:** 9 weeks  
**Status:** Ready to begin Phase 1 🚀

**Next Action:** Run database migration to create blog AI agents and tracking tables.

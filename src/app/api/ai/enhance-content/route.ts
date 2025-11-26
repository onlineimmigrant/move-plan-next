import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface EnhanceContentRequest {
  content: string;
  enhancementType: 'improve' | 'engaging' | 'professional' | 'expand' | 'shorten' | 'assessment' | 'custom';
  scope: 'selection' | 'title' | 'description' | 'content' | 'full';
  customInstructions?: string;
  role: string; // 'blog_content_writer'
  editorMode?: 'visual' | 'html' | 'markdown';
  // For full scope
  title?: string;
  description?: string;
}

/**
 * Utility to strip HTML tags and preserve structure for enhancement
 */
function stripHtmlTags(html: string): { text: string; structure: any } {
  // Simple HTML tag removal for now
  // In production, you'd want a proper HTML parser
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return { text, structure: null };
}

/**
 * Utility to rebuild HTML structure after text enhancement
 */
function rebuildHtml(enhancedText: string, originalHtml: string, structure: any): string {
  // For now, wrap in paragraph if original had HTML
  if (originalHtml.includes('<')) {
    return `<p>${enhancedText}</p>`;
  }
  return enhancedText;
}

/**
 * AI Content Enhancement API Route
 * 
 * Enhances content using the Blog Content Writer agent (role='blog_content_writer')
 * Applies different enhancement strategies based on type
 * Returns enhanced content
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Enhance] Missing authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client with anon key and set session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[Enhance] Auth error:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Enhance] Authenticated user:', user.id);

    // Get user's organization
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('[Enhance] Profile error:', profileError?.message);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body: EnhanceContentRequest = await request.json();
    const { content, enhancementType, scope, customInstructions, role, title, description, editorMode } = body;

    console.log('[Enhance] Request:', {
      enhancementType,
      scope,
      contentLength: content.length,
      organizationId: profile.organization_id,
      role,
      editorMode,
    });

    // Validate request
    if (!content || !enhancementType || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (enhancementType === 'custom' && !customInstructions?.trim()) {
      return NextResponse.json({ error: 'Custom instructions required for custom enhancement type' }, { status: 400 });
    }

    // Get Blog Content Writer agent by role
    const { data: writerAgent, error: agentError } = await supabaseService
      .from('ai_models_system')
      .select('id, name, display_name, role, task, system_message, api_key, endpoint, max_tokens')
      .eq('role', role)
      .eq('is_active', true)
      .single();

    if (agentError || !writerAgent) {
      console.error('[Enhance] Writer agent not found:', agentError?.message);
      return NextResponse.json({ error: 'Content enhancement service not available' }, { status: 503 });
    }

    console.log('[Enhance] Using writer agent:', writerAgent.name);

    // Build enhancement instructions based on type
    let enhancementInstructions = '';
    
    switch (enhancementType) {
      case 'improve':
        enhancementInstructions = 'Improve the writing quality by fixing grammar, enhancing clarity, and improving flow. Maintain the original meaning and tone.';
        break;
      case 'engaging':
        enhancementInstructions = 'Make the content more engaging by adding hooks, compelling language, and vivid descriptions. Keep it readable and interesting.';
        break;
      case 'professional':
        enhancementInstructions = 'Rewrite in a more professional tone with formal language and proper structure. Maintain clarity while elevating the sophistication.';
        break;
      case 'expand':
        enhancementInstructions = 'Expand the content by adding relevant details, examples, and explanations. Make it more comprehensive and informative.';
        break;
      case 'shorten':
        enhancementInstructions = 'Shorten the content by removing redundancy and making it more concise. Keep the key points and main message.';
        break;
      case 'assessment':
        enhancementInstructions = 'Analyze the content quality and provide a comprehensive assessment with scores and specific feedback.';
        break;
      case 'custom':
        enhancementInstructions = customInstructions || '';
        break;
    }

    // Handle different scopes
    let userPrompt = '';
    let processedContent = content;
    let htmlStructure = null;

    if (enhancementType === 'assessment') {
      // Special handling for assessment
      const contentText = scope === 'content' ? stripHtmlTags(content).text : content;
      const titleText = title || '';
      const descriptionText = description || '';
      
      userPrompt = `Analyze this blog post content and provide a comprehensive quality assessment. Score each category from 0-100 and provide specific, actionable feedback.

${scope === 'full' ? `TITLE: ${titleText}

DESCRIPTION: ${descriptionText}

CONTENT: ${contentText}` : `CONTENT: ${contentText}`}

Please respond with a JSON object in this exact format (no additional text):
{
  "total": [overall score 0-100],
  "categories": {
    "seo": { "score": [0-100], "comment": "specific feedback on SEO optimization, keywords, meta-friendliness" },
    "grammar": { "score": [0-100], "comment": "feedback on grammar, spelling, punctuation" },
    "engagement": { "score": [0-100], "comment": "feedback on hooks, readability, audience appeal" },
    "readability": { "score": [0-100], "comment": "feedback on clarity, sentence structure, flow" },
    "structure": { "score": [0-100], "comment": "feedback on organization, headings, logical flow" },
    "tone": { "score": [0-100], "comment": "feedback on tone consistency, voice, professionalism" }
  }
}`;
    } else if (scope === 'content') {
      // Strip HTML tags for content enhancement
      const { text, structure } = stripHtmlTags(content);
      processedContent = text;
      htmlStructure = structure;
      const formatInstructions = editorMode === 'markdown' 
        ? `CRITICAL MARKDOWN FORMATTING RULES:
           1. You MUST return ONLY plain markdown text. Do NOT use ANY HTML tags (<p>, <h2>, <ul>, <li>, etc.).
           2. Use proper markdown syntax: ## for h2 headings, ### for h3 headings, ** for bold, - for lists
           3. IMPORTANT: Add blank lines (double newlines) between different sections/paragraphs
           4. IMPORTANT: Add blank lines before and after headings
           5. IMPORTANT: Add blank lines before and after lists
           6. Even if the input contains HTML, convert it to clean markdown
           
           Example format:
           First paragraph text here.
           
           ## Heading
           
           Second paragraph text here.
           
           ### Subheading
           
           - List item 1
           - List item 2
           - List item 3
           
           Another paragraph text.`
        : 'IMPORTANT: If the content contains Markdown formatting (headings with #, bold with **, lists with -, etc.), preserve and maintain the Markdown syntax in your enhanced version.';
      
      userPrompt = `${enhancementInstructions}

Original content (HTML tags removed, please enhance the text only):
${processedContent}

${formatInstructions}

Please provide only the enhanced text content without any explanations or metadata.`;
    } else if (scope === 'full') {
      // Enhance all three fields together
      const contentText = stripHtmlTags(content).text;
      userPrompt = `${enhancementInstructions}

I need you to enhance a blog post with three parts. Please enhance each part and return them in this exact format:

TITLE:
[enhanced title here]

DESCRIPTION:
[enhanced description here]

CONTENT:
[enhanced content here]

Here are the original parts:

TITLE:
${title || ''}

DESCRIPTION:
${description || ''}

CONTENT:
${contentText}

Please provide only the enhanced versions in the format above, without any additional explanations.`;
    } else {
      // selection, title, description - simple enhancement
      const formatInstructions = editorMode === 'markdown'
        ? `CRITICAL MARKDOWN FORMATTING RULES:
           1. You MUST return ONLY plain markdown text. Do NOT use ANY HTML tags.
           2. Use proper markdown syntax: ## for h2, ### for h3, ** for bold, - for lists
           3. IMPORTANT: Preserve blank lines between paragraphs and sections
           4. IMPORTANT: Add blank lines before and after headings
           5. Even if the input contains HTML, convert it to clean markdown
           
           Example:
           First paragraph.
           
           ## Heading
           
           Second paragraph.`
        : 'IMPORTANT: If the content contains Markdown formatting (headings with #, bold with **, lists with -, etc.), preserve and maintain the Markdown syntax in your enhanced version. Keep the same formatting structure.';
      
      userPrompt = `${enhancementInstructions}

Original content:
${content}

${formatInstructions}

Please provide only the enhanced content without any explanations or metadata.`;
    }

    console.log('[Enhance] Enhancement type:', enhancementType);
    console.log('[Enhance] Scope:', scope);
    console.log('[Enhance] Using system message:', writerAgent.system_message.substring(0, 100) + '...');

    // Extract model name from endpoint or use name field
    const endpoint = writerAgent.endpoint;
    const modelName = writerAgent.name; // Use the name field from ai_models_system

    // Call AI service based on endpoint
    let enhancedContent = '';

    if (endpoint.includes('openai.com')) {
      // OpenAI API
      const openai = new OpenAI({ apiKey: writerAgent.api_key });
      
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: writerAgent.system_message },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: writerAgent.max_tokens,
        temperature: 0.7,
      });

      enhancedContent = completion.choices[0]?.message?.content || '';
      console.log('[Enhance] OpenAI response received');
      console.log('[Enhance] EditorMode:', editorMode);
      console.log('[Enhance] Enhanced content length:', enhancedContent.length);
      console.log('[Enhance] Enhanced content preview (first 500 chars):', enhancedContent.substring(0, 500));
      console.log('[Enhance] Newline count in response:', (enhancedContent.match(/\n/g) || []).length);

    } else if (endpoint.includes('anthropic.com')) {
      // Anthropic API
      const anthropic = new Anthropic({ apiKey: writerAgent.api_key });
      
      const completion = await anthropic.messages.create({
        model: modelName,
        max_tokens: writerAgent.max_tokens,
        system: writerAgent.system_message,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      const contentBlock = completion.content[0];
      enhancedContent = contentBlock.type === 'text' ? contentBlock.text : '';
      console.log('[Enhance] Anthropic response received');

    } else {
      // OpenAI-compatible endpoints (X.AI/Grok, etc.)
      const baseURL = endpoint.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
      
      console.log('[Enhance] Using OpenAI-compatible endpoint:', { baseURL, modelName });
      
      const openai = new OpenAI({ 
        apiKey: writerAgent.api_key,
        baseURL,
      });
      
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: writerAgent.system_message },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: writerAgent.max_tokens,
        temperature: 0.7,
      });

      enhancedContent = completion.choices[0]?.message?.content || '';
      console.log('[Enhance] OpenAI-compatible response received');
    }

    if (!enhancedContent) {
      console.error('[Enhance] No enhanced content received from AI');
      return NextResponse.json({ error: 'Failed to generate enhanced content' }, { status: 500 });
    }

    console.log('[Enhance] Success! Enhanced content length:', enhancedContent.length);

    // Handle assessment type specially
    if (enhancementType === 'assessment') {
      try {
        // Parse assessment JSON response
        const assessmentMatch = enhancedContent.match(/\{[\s\S]*\}/);
        if (assessmentMatch) {
          const assessmentData = JSON.parse(assessmentMatch[0]);
          
          return NextResponse.json({
            original: content,
            enhanced: '', // No enhanced content for assessment
            type: enhancementType,
            scope,
            assessment: assessmentData
          });
        } else {
          // Fallback: create a default assessment structure
          return NextResponse.json({
            original: content,
            enhanced: '',
            type: enhancementType,
            scope,
            assessment: {
              total: 75,
              categories: {
                seo: { score: 75, comment: 'Assessment parsing failed. Using default scores.' },
                grammar: { score: 75, comment: 'Please try again.' },
                engagement: { score: 75, comment: 'Assessment data not available.' },
                readability: { score: 75, comment: 'Unable to parse AI response.' },
                structure: { score: 75, comment: 'Please retry the assessment.' },
                tone: { score: 75, comment: 'Default score applied.' }
              }
            }
          });
        }
      } catch (parseError) {
        console.error('[Enhance] Assessment parse error:', parseError);
        // Return default assessment on parse failure
        return NextResponse.json({
          original: content,
          enhanced: '',
          type: enhancementType,
          scope,
          assessment: {
            total: 70,
            categories: {
              seo: { score: 70, comment: 'Unable to complete full assessment.' },
              grammar: { score: 70, comment: 'Content appears acceptable.' },
              engagement: { score: 70, comment: 'Average engagement level.' },
              readability: { score: 70, comment: 'Reasonably readable content.' },
              structure: { score: 70, comment: 'Basic structure present.' },
              tone: { score: 70, comment: 'Tone is adequate.' }
            }
          }
        });
      }
    }

    // Process response based on scope
    if (scope === 'full') {
      // Parse split results
      const titleMatch = enhancedContent.match(/TITLE:\s*\n([\s\S]*?)\n\nDESCRIPTION:/);
      const descMatch = enhancedContent.match(/DESCRIPTION:\s*\n([\s\S]*?)\n\nCONTENT:/);
      const contentMatch = enhancedContent.match(/CONTENT:\s*\n([\s\S]*?)$/);

      const enhancedTitle = titleMatch?.[1]?.trim() || title || '';
      const enhancedDescription = descMatch?.[1]?.trim() || description || '';
      const enhancedContentText = contentMatch?.[1]?.trim() || '';

      // Rebuild HTML for content
      const rebuiltContent = rebuildHtml(enhancedContentText, content, htmlStructure);

      return NextResponse.json({
        original: `${title}\n${description}\n${content}`,
        enhanced: `${enhancedTitle}\n${enhancedDescription}\n${rebuiltContent}`,
        type: enhancementType,
        scope,
        splitResults: {
          title: { original: title || '', enhanced: enhancedTitle },
          description: { original: description || '', enhanced: enhancedDescription },
          content: { original: content, enhanced: rebuiltContent },
        },
      });
    } else if (scope === 'content') {
      // Rebuild HTML structure
      const rebuiltContent = rebuildHtml(enhancedContent, content, htmlStructure);
      
      return NextResponse.json({
        original: content,
        enhanced: rebuiltContent,
        type: enhancementType,
        scope,
      });
    } else {
      // selection, title, description - return as-is
      return NextResponse.json({
        original: content,
        enhanced: enhancedContent,
        type: enhancementType,
        scope,
      });
    }

  } catch (error) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

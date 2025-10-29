/**
 * AI Management Types
 * Centralized type definitions for the AI Management system
 * Shared between admin and account contexts
 */

// ============================================================================
// Core Model Types
// ============================================================================

export interface DefaultModel {
  id: number;
  name: string;
  api_key: string;
  endpoint: string;
  max_tokens: number;
  user_role_to_access: string;
  is_active: boolean;
  system_message: string;
  icon: string | null;
  role: string | null;
  task: TaskItem[] | null;
  organization_id?: string;
  src?: string;
  created_at?: string;
  type?: 'default' | 'user' | 'system'; // Added for account context (default/user/system models)
}

export interface TaskItem {
  name: string;
  system_message: string;
}

// ============================================================================
// Form State Types
// ============================================================================

export interface NewModelForm {
  name: string;
  api_key: string;
  endpoint: string;
  model?: string; // Optional model ID field
  max_tokens: number;
  user_role_to_access: string;
  system_message: string;
  icon: string;
  role: string | null;
  task: TaskItem[] | null;
  is_active?: boolean; // Optional active status
}

export interface RoleFormData {
  role: string;
  customRole: string;
  systemMessage: string;
  isCustomRole: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

export type TabType = 'models' | 'add' | 'edit' | 'system';
export type FilterRoleType = 'all' | 'user' | 'admin' | 'system';
export type FilterActiveType = 'all' | 'active' | 'inactive';
export type SortByType = 'name' | 'created' | 'role';
export type SortOrderType = 'asc' | 'desc';
export type TaskInputMode = 'json' | 'builder';
export type TaskModalMode = 'view' | 'add';

// ============================================================================
// Validation Types
// ============================================================================

export interface FieldErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

// ============================================================================
// Predefined Data Types
// ============================================================================

export interface PredefinedRole {
  value: string;
  label: string;
  description: string;
  systemMessage: string;
  tasks?: TaskItem[]; // Optional predefined tasks for this role
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ThemeColors {
  base: string;
  light: string;
  lighter: string;
  dark?: string;
  darker?: string;
  hover?: string;
  active?: string;
  disabled?: string;
  border?: string;
}

export interface PrimaryColors {
  primary: ThemeColors;
}

// ============================================================================
// Constant Arrays
// ============================================================================

export const POPULAR_MODELS = [
  'grok-3',
  'grok-3-mini',
  'grok-3-mini-fast',
  'gpt-4o',
  'o1',
  'o3-mini',
  'claude-3.5-sonnet',
  'claude-4-sonnet',
  'claude-3.7-sonnet',
  'deepseek-r1',
  'deepseek-v3',
  'deepseek-r1-0528',
  'mistral-large-2',
  'mistral-small-3.1',
  'mixtral-8x7b',
  'llama-4-scout',
  'llama-4-maverick',
  'llama-3.3',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemma-2',
  'llama-3-70b',
  'vicuna-13b',
  'mistral-7b',
] as const;

export const POPULAR_ENDPOINTS = [
  'https://api.x.ai/v1/chat/completions',
  'https://api.openai.com/v1/chat/completions',
  'https://api.anthropic.com/v1/messages',
  'https://api.together.ai/v1/completions',
  'https://generativelanguage.googleapis.com/v1',
  'https://api.deepseek.com/v1',
  'https://api.mixtral.ai/v1',
  'https://api-inference.huggingface.co/v1',
] as const;

export const PREDEFINED_ROLES: PredefinedRole[] = [
  { 
    value: 'assistant', 
    label: 'Assistant', 
    description: 'General purpose helpful assistant',
    systemMessage: 'You are a helpful AI assistant. Provide clear, accurate, and concise responses to user queries. Be friendly, professional, and adaptive to the user\'s needs.',
    tasks: [
      {
        name: 'Answer Question',
        system_message: 'Provide a clear, accurate answer to the user\'s question. Break down complex topics into understandable explanations. Include relevant examples or context when helpful.',
      },
      {
        name: 'Explain Concept',
        system_message: 'Explain the given concept in simple, accessible language. Use analogies, examples, and step-by-step breakdowns. Ensure the explanation is comprehensive yet easy to understand.',
      },
      {
        name: 'Provide Suggestions',
        system_message: 'Offer practical, actionable suggestions based on the user\'s needs. Consider multiple perspectives and present options with pros and cons. Be specific and helpful.',
      },
      {
        name: 'Summarize Information',
        system_message: 'Create a concise summary of the provided information. Capture key points and main ideas while maintaining accuracy. Keep it brief but comprehensive.',
      },
      {
        name: 'Create List',
        system_message: 'Generate a well-organized list based on the user\'s request. Use clear formatting with bullet points or numbers. Ensure items are relevant, specific, and actionable.',
      },
    ],
  },
  { 
    value: 'analyst', 
    label: 'Analyst', 
    description: 'Data analysis and insights specialist',
    systemMessage: 'You are a data analyst specializing in information analysis and insights. Break down complex data, identify patterns and trends, and present findings clearly. Use logical reasoning and evidence-based conclusions.',
    tasks: [
      {
        name: 'Analyze Data',
        system_message: 'Examine the provided data systematically. Identify patterns, anomalies, and significant findings. Present your analysis with clear explanations and supporting evidence.',
      },
      {
        name: 'Identify Trends',
        system_message: 'Detect and describe trends in the data or information provided. Explain their significance, potential causes, and implications. Use data-driven reasoning.',
      },
      {
        name: 'Compare Options',
        system_message: 'Conduct a thorough comparison of the given options. Create a structured analysis highlighting strengths, weaknesses, costs, benefits, and trade-offs for each option.',
      },
      {
        name: 'Generate Report',
        system_message: 'Create a comprehensive analytical report with clear sections: Executive Summary, Key Findings, Analysis, and Recommendations. Use professional formatting and data visualization descriptions.',
      },
      {
        name: 'Extract Insights',
        system_message: 'Identify and articulate meaningful insights from the information provided. Connect data points to reveal deeper understanding and actionable intelligence.',
      },
    ],
  },
  { 
    value: 'translator', 
    label: 'Translator', 
    description: 'Multi-language translation expert',
    systemMessage: 'You are a professional translator fluent in multiple languages. Provide accurate translations while preserving context, tone, and cultural nuances. Maintain the original meaning and intent.',
    tasks: [
      {
        name: 'Translate Text',
        system_message: 'Translate the provided text accurately from the source language to the target language. Preserve meaning, tone, and style. Maintain formatting and structure.',
      },
      {
        name: 'Localize Content',
        system_message: 'Adapt the content for the target culture and locale. Adjust idioms, cultural references, and expressions to resonate with the target audience while maintaining the original message.',
      },
      {
        name: 'Preserve Context',
        system_message: 'Translate with special attention to context and nuance. Ensure technical terms, industry jargon, and specialized vocabulary are translated appropriately for the domain.',
      },
      {
        name: 'Check Translation',
        system_message: 'Review the translation for accuracy, fluency, and cultural appropriateness. Identify any errors, awkward phrasing, or mistranslations. Suggest improvements.',
      },
      {
        name: 'Adapt Tone',
        system_message: 'Translate while carefully matching the tone of the original (formal, casual, technical, persuasive, etc.). Ensure the translated text has the same emotional impact as the source.',
      },
    ],
  },
  { 
    value: 'writer', 
    label: 'Writer', 
    description: 'Content creation and copywriting',
    systemMessage: 'You are a professional writer and content creator. Craft engaging, well-structured content with proper grammar and style. Adapt your tone and format to suit the intended audience and purpose.',
    tasks: [
      {
        name: 'Write Content',
        system_message: 'Create original, engaging content based on the given topic and requirements. Structure it logically with clear introduction, body, and conclusion. Use compelling language and proper formatting.',
      },
      {
        name: 'Edit Draft',
        system_message: 'Review and edit the provided draft. Improve clarity, flow, and impact while maintaining the author\'s voice. Correct grammar, punctuation, and style issues. Suggest structural improvements.',
      },
      {
        name: 'Improve Clarity',
        system_message: 'Rewrite the content to enhance clarity and readability. Simplify complex sentences, remove ambiguity, and strengthen weak phrasing. Make the message crystal clear.',
      },
      {
        name: 'Adjust Tone',
        system_message: 'Rewrite the content to match the specified tone (professional, casual, friendly, authoritative, etc.). Maintain the core message while adapting language, word choice, and style.',
      },
      {
        name: 'Proofread',
        system_message: 'Carefully proofread for spelling, grammar, punctuation, and formatting errors. Check consistency in style, voice, and terminology. Ensure professional polish.',
      },
    ],
  },
  { 
    value: 'blog_content_writer', 
    label: 'Blog Content Writer', 
    description: 'Specialized blog post and article writing',
    systemMessage: 'You are a skilled blog writer specializing in engaging online content. Create SEO-friendly, informative blog posts with catchy headlines and natural flow. Write in a conversational yet professional tone.',
    tasks: [
      {
        name: 'Write Full Article',
        system_message: 'Create a complete blog post (1500-2000 words) with introduction, 3-5 main sections with subheadings, and conclusion. Include examples, bullet points, and engaging transitions. Format with <h2> for sections, <p> for paragraphs, <ul> for lists. Ensure each section flows naturally into the next.',
      },
      {
        name: 'Expand Outline',
        system_message: 'Take the provided outline and expand it into full paragraphs. Add details, examples, and smooth transitions between points. Maintain the structure while making it comprehensive and engaging. Preserve HTML formatting.',
      },
      {
        name: 'Rewrite Section',
        system_message: 'Rewrite the provided section to improve clarity, engagement, and flow. Keep the core message but enhance readability and impact. Maintain HTML formatting and TailwindCSS classes.',
      },
      {
        name: 'Create Introduction',
        system_message: 'Write a compelling introduction (100-150 words) that hooks the reader, introduces the topic, and previews main points. Use <p> tags with proper TailwindCSS classes.',
      },
      {
        name: 'Write Conclusion',
        system_message: 'Create a strong conclusion that summarizes key points, provides actionable takeaways, and includes a call-to-action. Keep it concise (100-150 words).',
      },
    ],
  },
  { 
    value: 'flashcard', 
    label: 'Flashcard', 
    description: 'Educational flashcard creator',
    systemMessage: 'You are an educational content specialist focused on creating effective flashcards. Present information in concise, memorable formats. Use clear questions and answers that facilitate active recall.',
    tasks: [
      {
        name: 'Create Flashcard Set',
        system_message: 'Generate a set of flashcards on the given topic. Each card should have a clear question on one side and a concise, accurate answer on the other. Include 10-15 cards covering key concepts.',
      },
      {
        name: 'Generate Q&A',
        system_message: 'Create question-and-answer pairs for study purposes. Questions should test understanding, not just memorization. Answers should be clear, complete, and educational.',
      },
      {
        name: 'Make Study Cards',
        system_message: 'Design study cards with front (term/concept) and back (definition/explanation). Keep information concise and memorable. Use mnemonic devices or memory aids when helpful.',
      },
      {
        name: 'Create Definitions',
        system_message: 'Write clear, concise definitions for key terms and concepts. Each definition should be accurate, easy to understand, and include context or examples when needed.',
      },
      {
        name: 'Build Quiz',
        system_message: 'Create a quiz with multiple-choice, true/false, or short-answer questions. Include answer key with explanations. Ensure questions test genuine understanding of the material.',
      },
    ],
  },
  { 
    value: 'tutor', 
    label: 'Tutor', 
    description: 'Educational guidance and tutoring',
    systemMessage: 'You are a patient and knowledgeable tutor. Break down complex concepts into simple, understandable explanations. Use examples, practice problems, and encouragement to help students learn effectively.',
    tasks: [
      {
        name: 'Explain Topic',
        system_message: 'Teach the given topic step-by-step. Start with fundamentals, build complexity gradually, and check for understanding. Use clear examples and analogies. Encourage questions.',
      },
      {
        name: 'Provide Examples',
        system_message: 'Create detailed, relevant examples that illustrate the concept clearly. Walk through each example step-by-step, explaining the reasoning behind each step.',
      },
      {
        name: 'Create Exercise',
        system_message: 'Design practice exercises appropriate for the student\'s level. Include problems of varying difficulty. Provide hints and step-by-step solutions with explanations.',
      },
      {
        name: 'Check Understanding',
        system_message: 'Assess the student\'s comprehension by asking probing questions. Identify gaps in understanding and address them with targeted explanations. Provide constructive feedback.',
      },
      {
        name: 'Guide Practice',
        system_message: 'Guide the student through practice problems. Don\'t give direct answers - instead, ask leading questions and provide hints. Help them develop problem-solving skills.',
      },
    ],
  },
  { 
    value: 'researcher', 
    label: 'Researcher', 
    description: 'Research and information gathering',
    systemMessage: 'You are a research specialist focused on thorough investigation and fact-finding. Gather comprehensive information, verify sources, present balanced viewpoints, and maintain academic rigor in your responses.',
    tasks: [
      {
        name: 'Research Topic',
        system_message: 'Conduct comprehensive research on the given topic. Present findings in an organized manner with key facts, different perspectives, and relevant context. Cite important points.',
      },
      {
        name: 'Gather Sources',
        system_message: 'Identify and compile reliable sources of information on the topic. Provide a diverse range of perspectives including academic, professional, and authoritative sources.',
      },
      {
        name: 'Verify Facts',
        system_message: 'Fact-check the provided information. Verify claims against reliable sources. Identify any inaccuracies, biases, or unsupported statements. Present findings objectively.',
      },
      {
        name: 'Compare Studies',
        system_message: 'Analyze and compare research studies or findings on the topic. Identify similarities, differences, methodological strengths/weaknesses, and consensus or disagreement in the field.',
      },
      {
        name: 'Synthesize Findings',
        system_message: 'Integrate information from multiple sources into a coherent overview. Identify patterns, draw connections, and present a comprehensive picture of the current state of knowledge.',
      },
    ],
  },
  { 
    value: 'coder', 
    label: 'Coder', 
    description: 'Programming and code assistance',
    systemMessage: 'You are an expert software developer and programmer. Write clean, efficient, and well-documented code. Follow best practices, explain technical concepts clearly, and help debug issues systematically.',
    tasks: [
      {
        name: 'Write Code',
        system_message: 'Write clean, efficient code based on the requirements. Follow best practices and coding standards. Include comments explaining complex logic. Ensure code is production-ready.',
      },
      {
        name: 'Debug Issue',
        system_message: 'Analyze the code to identify and fix bugs. Explain what was causing the issue and why your solution works. Suggest ways to prevent similar issues in the future.',
      },
      {
        name: 'Review Code',
        system_message: 'Conduct a thorough code review. Check for bugs, performance issues, security vulnerabilities, and code quality. Suggest improvements and best practices. Be constructive and specific.',
      },
      {
        name: 'Explain Logic',
        system_message: 'Explain how the code works in clear, understandable terms. Break down complex logic step-by-step. Use analogies or diagrams descriptions when helpful.',
      },
      {
        name: 'Optimize Performance',
        system_message: 'Analyze the code for performance bottlenecks. Suggest optimizations with explanations of time/space complexity improvements. Provide refactored code with better performance.',
      },
    ],
  },
  { 
    value: 'reviewer', 
    label: 'Reviewer', 
    description: 'Content review and feedback',
    systemMessage: 'You are a constructive content reviewer. Provide detailed, balanced feedback on written work. Highlight strengths, identify areas for improvement, and offer specific suggestions while maintaining a supportive tone.',
    tasks: [
      {
        name: 'Review Content',
        system_message: 'Provide comprehensive feedback on the content. Assess clarity, structure, argumentation, and overall effectiveness. Highlight both strengths and areas for improvement.',
      },
      {
        name: 'Provide Feedback',
        system_message: 'Give constructive, actionable feedback. Be specific about what works well and what needs improvement. Suggest concrete ways to enhance the content. Maintain an encouraging tone.',
      },
      {
        name: 'Suggest Improvements',
        system_message: 'Identify specific areas that could be strengthened. Provide detailed suggestions for improvement with examples. Prioritize the most impactful changes.',
      },
      {
        name: 'Check Quality',
        system_message: 'Evaluate overall quality including accuracy, completeness, coherence, and professionalism. Check for errors, inconsistencies, or weaknesses. Provide a quality assessment.',
      },
      {
        name: 'Evaluate Structure',
        system_message: 'Analyze the organizational structure and flow. Assess whether ideas are logically arranged and well-connected. Suggest structural improvements for better coherence and impact.',
      },
    ],
  },
  { 
    value: 'summarizer', 
    label: 'Summarizer', 
    description: 'Text summarization specialist',
    systemMessage: 'You are a text summarization expert. Distill complex information into clear, concise summaries. Capture key points, main ideas, and essential details while maintaining accuracy and context.',
    tasks: [
      {
        name: 'Summarize Article',
        system_message: 'Create a concise summary of the article capturing the main points, key arguments, and conclusions. Keep it brief while maintaining accuracy and completeness.',
      },
      {
        name: 'Create Brief',
        system_message: 'Write an executive brief highlighting the most important information. Include key takeaways, critical facts, and actionable insights. Keep it under 200 words.',
      },
      {
        name: 'Extract Key Points',
        system_message: 'Identify and list the key points from the content. Present them as clear, concise bullet points. Focus on the most important and actionable information.',
      },
      {
        name: 'Condense Content',
        system_message: 'Reduce the content to its essential elements without losing meaning. Remove redundancy and verbosity. Maintain all critical information in a more compact form.',
      },
      {
        name: 'Make Synopsis',
        system_message: 'Write a brief synopsis that captures the essence of the content. Include main topic, key themes, and primary conclusions. Aim for a quick, comprehensive overview.',
      },
    ],
  },
];

// ============================================================================
// Animation Styles
// ============================================================================

export const MODAL_ANIMATION_STYLES = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

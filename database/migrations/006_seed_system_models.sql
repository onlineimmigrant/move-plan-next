-- Migration: Seed initial system AI models
-- Description: Create sample system models for testing and initial deployment
-- Date: 2025-10-29
-- Phase: 1.6 - Database Foundation

-- ============================================================================
-- PRE-CHECK: Ensure table is empty or truncate if needed
-- ============================================================================

DO $$
DECLARE
  model_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO model_count FROM ai_models_system;
  
  IF model_count > 0 THEN
    RAISE NOTICE '⚠️ Warning: ai_models_system already contains % rows', model_count;
    RAISE NOTICE 'Skipping seed to avoid duplicates.';
    RAISE NOTICE 'If you want to re-seed, run: TRUNCATE ai_models_system CASCADE;';
    -- Uncomment next line to auto-truncate:
    -- TRUNCATE ai_models_system CASCADE;
  ELSE
    RAISE NOTICE '✅ Table is empty, proceeding with seed...';
  END IF;
END $$;

-- ============================================================================
-- SEED SYSTEM MODELS (Only if table is empty)
-- ============================================================================

DO $$
DECLARE
  model_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO model_count FROM ai_models_system;
  
  -- Only insert if table is empty
  IF model_count = 0 THEN

-- Model 1: Blog Content Writer (Marketing, Software, Retail)
INSERT INTO ai_models_system (
  name,
  role,
  system_message,
  api_key,
  endpoint,
  max_tokens,
  icon,
  organization_types,
  required_plan,
  token_limit_period,
  token_limit_amount,
  is_free,
  is_trial,
  is_active,
  is_featured,
  description,
  tags,
  sort_order,
  task
) VALUES (
  'Blog Content Writer Pro',
  'blog_content_writer',
  'You are a skilled blog writer specializing in engaging online content. Create SEO-friendly, informative blog posts with catchy headlines and natural flow. Write in a conversational yet professional tone.',
  'PLACEHOLDER_API_KEY', -- Replace with actual API key
  'https://api.openai.com/v1/chat/completions',
  2000,
  '📝',
  ARRAY['marketing', 'software', 'retail', 'consulting'],
  'pro',
  'monthly',
  50000,
  false,
  false,
  true,
  true,
  'Professional blog writing assistant for marketing teams and content creators. Includes 5 specialized writing tasks.',
  ARRAY['blog', 'content', 'writing', 'seo', 'marketing'],
  10,
  '[
    {
      "name": "Write Full Article",
      "system_message": "Create a complete blog post (1500-2000 words) with introduction, 3-5 main sections with subheadings, and conclusion. Include examples, bullet points, and engaging transitions."
    },
    {
      "name": "Expand Outline",
      "system_message": "Take the provided outline and expand it into full paragraphs. Add details, examples, and smooth transitions between points."
    },
    {
      "name": "Rewrite Section",
      "system_message": "Rewrite the provided section to improve clarity, engagement, and flow. Keep the core message but enhance readability and impact."
    },
    {
      "name": "Create Introduction",
      "system_message": "Write a compelling introduction (100-150 words) that hooks the reader, introduces the topic, and previews main points."
    },
    {
      "name": "Write Conclusion",
      "system_message": "Create a strong conclusion that summarizes key points, provides actionable takeaways, and includes a call-to-action."
    }
  ]'::jsonb
);

-- Model 2: Legal Document Analyst (Legal Services, Finance)
INSERT INTO ai_models_system (
  name,
  role,
  system_message,
  api_key,
  endpoint,
  max_tokens,
  icon,
  organization_types,
  required_plan,
  token_limit_period,
  token_limit_amount,
  is_free,
  is_trial,
  is_active,
  is_featured,
  description,
  tags,
  sort_order,
  task
) VALUES (
  'Legal Document Analyst',
  'analyst',
  'You are a legal document analyst specializing in reviewing and analyzing legal texts. Provide clear, thorough analysis while maintaining accuracy and attention to detail.',
  'PLACEHOLDER_API_KEY',
  'https://api.anthropic.com/v1/messages',
  4000,
  '⚖️',
  ARRAY['solicitor', 'finance', 'immigration'],
  'enterprise',
  'monthly',
  100000,
  false,
  false,
  true,
  true,
  'Specialized legal document analysis for law firms and immigration services. High token limit for complex documents.',
  ARRAY['legal', 'documents', 'analysis', 'contracts'],
  20,
  '[
    {
      "name": "Analyze Document",
      "system_message": "Review the legal document and provide a comprehensive analysis including key terms, obligations, risks, and recommendations."
    },
    {
      "name": "Compare Contracts",
      "system_message": "Compare two contracts side-by-side and highlight differences, similarities, and potential concerns."
    },
    {
      "name": "Summarize Agreement",
      "system_message": "Create a plain-language summary of the legal agreement, highlighting key rights, obligations, and important clauses."
    }
  ]'::jsonb
);

-- Model 3: Healthcare Assistant (Medical, Healthcare)
INSERT INTO ai_models_system (
  name,
  role,
  system_message,
  api_key,
  endpoint,
  max_tokens,
  icon,
  organization_types,
  required_plan,
  token_limit_period,
  token_limit_amount,
  is_free,
  is_trial,
  is_active,
  is_featured,
  description,
  tags,
  sort_order,
  task
) VALUES (
  'Healthcare Information Assistant',
  'assistant',
  'You are a healthcare information assistant. Provide accurate, helpful information about health topics in clear, accessible language. Always remind users to consult healthcare professionals for medical advice.',
  'PLACEHOLDER_API_KEY',
  'https://api.openai.com/v1/chat/completions',
  1500,
  '🏥',
  ARRAY['doctor', 'healthcare', 'beauty'],
  'pro',
  'monthly',
  30000,
  false,
  false,
  true,
  false,
  'Healthcare information assistant for medical practices. Helps with patient education and general health information.',
  ARRAY['healthcare', 'medical', 'patient-education'],
  30,
  '[
    {
      "name": "Explain Condition",
      "system_message": "Explain the medical condition in simple terms that patients can understand. Include causes, symptoms, and general treatment approaches."
    },
    {
      "name": "Treatment Info",
      "system_message": "Provide information about treatment options, their benefits, risks, and what patients should know."
    }
  ]'::jsonb
);

-- Model 4: Real Estate Content Creator (Real Estate)
INSERT INTO ai_models_system (
  name,
  role,
  system_message,
  api_key,
  endpoint,
  max_tokens,
  icon,
  organization_types,
  required_plan,
  token_limit_period,
  token_limit_amount,
  is_free,
  is_trial,
  is_active,
  is_featured,
  description,
  tags,
  sort_order,
  task
) VALUES (
  'Property Listing Writer',
  'writer',
  'You are a real estate copywriter specializing in compelling property listings. Create engaging, accurate descriptions that highlight key features and appeal to potential buyers.',
  'PLACEHOLDER_API_KEY',
  'https://api.openai.com/v1/chat/completions',
  1000,
  '🏘️',
  ARRAY['realestate'],
  'starter',
  'monthly',
  20000,
  false,
  false,
  true,
  false,
  'Specialized writer for property listings and real estate marketing content.',
  ARRAY['real-estate', 'property', 'listings', 'marketing'],
  40,
  '[
    {
      "name": "Write Listing",
      "system_message": "Create a compelling property listing description highlighting key features, location benefits, and unique selling points."
    },
    {
      "name": "Enhance Description",
      "system_message": "Take the basic property details and transform them into an engaging, professional listing that attracts buyers."
    }
  ]'::jsonb
);

-- Model 5: Free General Assistant (All organization types)
INSERT INTO ai_models_system (
  name,
  role,
  system_message,
  api_key,
  endpoint,
  max_tokens,
  icon,
  organization_types,
  required_plan,
  token_limit_period,
  token_limit_amount,
  is_free,
  is_trial,
  is_active,
  is_featured,
  description,
  tags,
  sort_order,
  task
) VALUES (
  'Basic Assistant',
  'assistant',
  'You are a helpful AI assistant. Provide clear, accurate, and concise responses to user queries. Be friendly, professional, and adaptive to the user''s needs.',
  'PLACEHOLDER_API_KEY',
  'https://api.openai.com/v1/chat/completions',
  500,
  '🤖',
  '{}', -- Available to all organization types
  'free',
  NULL, -- No token limit
  NULL,
  true, -- Free model
  false,
  true,
  false,
  'Free basic assistant available to all organizations. Perfect for getting started with AI.',
  ARRAY['general', 'assistant', 'free'],
  5,
  '[
    {
      "name": "Answer Question",
      "system_message": "Provide a clear, accurate answer to the user''s question. Break down complex topics into understandable explanations."
    },
    {
      "name": "Summarize Information",
      "system_message": "Create a concise summary of the provided information. Capture key points and main ideas."
    }
  ]'::jsonb
);

-- Model 6: Trial Education Tutor (Education)
INSERT INTO ai_models_system (
  name,
  role,
  system_message,
  api_key,
  endpoint,
  max_tokens,
  icon,
  organization_types,
  required_plan,
  token_limit_period,
  token_limit_amount,
  is_free,
  is_trial,
  trial_expires_days,
  is_active,
  is_featured,
  description,
  tags,
  sort_order,
  task
) VALUES (
  'Education Tutor (Trial)',
  'tutor',
  'You are a patient and knowledgeable tutor. Break down complex concepts into simple, understandable explanations. Use examples, practice problems, and encouragement to help students learn effectively.',
  'PLACEHOLDER_API_KEY',
  'https://api.openai.com/v1/chat/completions',
  1500,
  '🎓',
  ARRAY['education'],
  'free',
  'monthly',
  10000,
  false,
  true, -- Trial model
  30, -- 30 day trial
  true,
  true,
  'Try our education tutor free for 30 days. Perfect for schools and training organizations.',
  ARRAY['education', 'tutoring', 'learning', 'trial'],
  15,
  '[
    {
      "name": "Explain Topic",
      "system_message": "Teach the given topic step-by-step. Start with fundamentals, build complexity gradually, and check for understanding."
    },
    {
      "name": "Create Exercise",
      "system_message": "Design practice exercises appropriate for the learning level. Include problems of varying difficulty with explanations."
    }
  ]'::jsonb
);

    RAISE NOTICE '✅ Successfully seeded 6 system models';
  ELSE
    RAISE NOTICE '⚠️ Skipping seed - table already has % models', model_count;
  END IF;
END $$;

-- ============================================================================
-- Verification query
-- ============================================================================

-- Count inserted models
DO $$
DECLARE
  model_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO model_count FROM ai_models_system;
  RAISE NOTICE 'Successfully inserted % system models', model_count;
END $$;

-- Display summary
SELECT 
  name,
  role,
  required_plan,
  CASE 
    WHEN organization_types = '{}' THEN 'All types'
    ELSE array_to_string(organization_types, ', ')
  END as target_org_types,
  is_free,
  is_trial,
  is_featured,
  token_limit_amount,
  token_limit_period
FROM ai_models_system
ORDER BY sort_order;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Replace 'PLACEHOLDER_API_KEY' with actual API keys before deployment
-- 2. These are sample models - customize based on your actual needs
-- 3. Adjust token limits based on your cost structure
-- 4. Add more models specific to your organization types
-- 5. Consider creating models for: construction, hospitality, automotive, etc.

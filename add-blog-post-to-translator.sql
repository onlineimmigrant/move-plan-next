-- Add blog_post translation configuration to AI Translator System
-- Run this in Supabase SQL Editor or via psql

-- First, let's check current configuration
SELECT 
  name,
  role,
  jsonb_pretty(task) as current_task
FROM ai_models_system
WHERE role = 'translator';

-- Add blog_post to translator task configuration
UPDATE ai_models_system
SET task = task || jsonb_build_array(
  jsonb_build_object(
    'table', 'blog_post',
    'fields', jsonb_build_array('title', 'description', 'content'),
    'name', 'Blog Post Translation',
    'system_message', 'You are a professional translator. Translate the following blog post content from {source_lang} to {target_lang}. Preserve all HTML tags, markdown formatting, links, and code blocks exactly. Only translate the text content.'
  )
)
WHERE role = 'translator'
AND NOT EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(task) AS t 
  WHERE t->>'table' = 'blog_post'
);

-- Verify the update
SELECT 
  name,
  role,
  jsonb_pretty(task) as updated_task
FROM ai_models_system
WHERE role = 'translator';

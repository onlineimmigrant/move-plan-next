-- Migration: Add visible_for_others to question_library
-- Description: Allow question library items to be private (form-specific) or shared
-- Date: 2025-11-30
-- Feature: Question Library Visibility Control

-- ============================================================================
-- 1. Add visible_for_others column
-- ============================================================================

ALTER TABLE question_library
ADD COLUMN IF NOT EXISTS visible_for_others BOOLEAN DEFAULT true;

-- Comment
COMMENT ON COLUMN question_library.visible_for_others IS 'Whether this question is visible in autocomplete/library for other forms. False = private to original form only.';

-- ============================================================================
-- 2. Create index for filtering
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_question_library_visible_for_others 
  ON question_library(organization_id, visible_for_others) 
  WHERE visible_for_others = true AND deleted_at IS NULL;

-- ============================================================================
-- 3. Update existing records (default to shared/visible)
-- ============================================================================

-- Set all existing questions to visible (backward compatible)
UPDATE question_library 
SET visible_for_others = true 
WHERE visible_for_others IS NULL;

-- ============================================================================
-- 4. Update the form_questions_complete view to include visibility
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS form_questions_complete;

-- Recreate view with visible_for_others column
CREATE VIEW form_questions_complete AS
SELECT 
  fq.id,
  fq.form_id,
  fq.question_library_id,
  
  -- Combine library data with overrides
  COALESCE(ql.type, 'text') AS type,
  COALESCE(fq.label_override, ql.label, '') AS label,
  COALESCE(fq.description_override, ql.description) AS description,
  COALESCE(fq.placeholder_override, ql.placeholder) AS placeholder,
  COALESCE(fq.options_override, ql.options, '[]'::jsonb) AS options,
  COALESCE(fq.validation_override, ql.validation, '{}'::jsonb) AS validation,
  
  -- Form-specific fields
  fq.required,
  fq.logic_show_if,
  fq.logic_value,
  fq.order_index,
  
  -- Metadata
  fq.created_at,
  fq.updated_at,
  
  -- Library metadata (helpful for UI)
  ql.tags AS library_tags,
  ql.category AS library_category,
  ql.visible_for_others AS library_visible_for_others,
  
  -- Indicator flags
  (fq.question_library_id IS NOT NULL) AS is_from_library,
  (fq.label_override IS NOT NULL 
   OR fq.description_override IS NOT NULL 
   OR fq.placeholder_override IS NOT NULL
   OR fq.options_override IS NOT NULL
   OR fq.validation_override IS NOT NULL) AS has_overrides
   
FROM form_questions fq
LEFT JOIN question_library ql ON fq.question_library_id = ql.id;

-- Comment on view
COMMENT ON VIEW form_questions_complete IS 'Complete question data with library defaults merged with form-specific overrides, including visibility status';

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Question library visibility control added successfully!';
  RAISE NOTICE '📋 Added column: visible_for_others (default: true)';
  RAISE NOTICE '🔍 Created index for visibility filtering';
  RAISE NOTICE '👁️ Updated form_questions_complete view';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update API to filter by visible_for_others when fetching suggestions';
  RAISE NOTICE '2. Create Library Management UI tab in form editor';
  RAISE NOTICE '3. Add toggle for visibility control';
END $$;

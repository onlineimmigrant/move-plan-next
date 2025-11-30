-- Migration: Migrate Backup Questions to Question Library System
-- Description: Migrates existing questions from form_questions_backup_20251130 to question_library and form_questions
-- Date: 2025-11-30
-- Run this AFTER: create_question_library_system.sql

-- ============================================================================
-- IMPORTANT: Review this migration before running
-- ============================================================================
-- This migration will:
-- 1. Create reusable question templates in question_library (deduplicated)
-- 2. Recreate form_question entries linking to library or as custom questions
-- 3. Preserve all relationships and conditional logic
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Migrate unique questions to question_library
-- ============================================================================

-- Create library entries for each unique question pattern
-- Groups by: type, label, description, placeholder, options, validation
INSERT INTO question_library (
  organization_id,
  type,
  label,
  description,
  placeholder,
  options,
  validation,
  category,
  created_at,
  updated_at
)
SELECT DISTINCT ON (
  f.organization_id,
  bq.type,
  bq.label,
  COALESCE(bq.description, ''),
  COALESCE(bq.placeholder, ''),
  bq.options::text,
  bq.validation::text
)
  f.organization_id,
  bq.type,
  bq.label,
  bq.description,
  bq.placeholder,
  bq.options,
  bq.validation,
  -- Auto-categorize based on type
  CASE 
    WHEN bq.type IN ('email', 'tel', 'text') THEN 'Contact Information'
    WHEN bq.type IN ('date', 'number') THEN 'Data Fields'
    WHEN bq.type IN ('yesno', 'multiple', 'checkbox', 'dropdown') THEN 'Selection Fields'
    WHEN bq.type = 'rating' THEN 'Feedback'
    WHEN bq.type IN ('textarea', 'file') THEN 'Content Fields'
    ELSE 'General'
  END as category,
  bq.created_at,
  NOW() as updated_at
FROM form_questions_backup_20251130 bq
INNER JOIN forms f ON bq.form_id = f.id
ORDER BY 
  f.organization_id,
  bq.type,
  bq.label,
  COALESCE(bq.description, ''),
  COALESCE(bq.placeholder, ''),
  bq.options::text,
  bq.validation::text,
  bq.created_at;

-- Log the number of library questions created
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM question_library;
  RAISE NOTICE 'Created % question library entries', v_count;
END $$;

-- ============================================================================
-- Step 2: Create temporary mapping table for question matching
-- ============================================================================

-- Create temporary table to map old question IDs to library IDs
CREATE TEMP TABLE question_id_mapping AS
SELECT 
  bq.id as old_question_id,
  bq.form_id,
  ql.id as library_id,
  bq.required,
  bq.logic_show_if,
  bq.logic_value,
  bq.order_index,
  bq.created_at,
  -- Detect if this instance differs from library (needs overrides)
  CASE WHEN bq.label != ql.label THEN bq.label ELSE NULL END as label_override,
  CASE WHEN COALESCE(bq.description, '') != COALESCE(ql.description, '') THEN bq.description ELSE NULL END as description_override,
  CASE WHEN COALESCE(bq.placeholder, '') != COALESCE(ql.placeholder, '') THEN bq.placeholder ELSE NULL END as placeholder_override,
  CASE WHEN bq.options::text != ql.options::text THEN bq.options ELSE NULL END as options_override,
  CASE WHEN bq.validation::text != ql.validation::text THEN bq.validation ELSE NULL END as validation_override
FROM form_questions_backup_20251130 bq
INNER JOIN forms f ON bq.form_id = f.id
INNER JOIN question_library ql ON (
  ql.organization_id = f.organization_id
  AND ql.type = bq.type
  AND ql.label = bq.label
  AND COALESCE(ql.description, '') = COALESCE(bq.description, '')
  AND COALESCE(ql.placeholder, '') = COALESCE(bq.placeholder, '')
  AND ql.options::text = bq.options::text
  AND ql.validation::text = bq.validation::text
);

-- Log mapping results
DO $$
DECLARE
  v_mapped INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mapped FROM question_id_mapping;
  SELECT COUNT(*) INTO v_total FROM form_questions_backup_20251130;
  RAISE NOTICE 'Mapped % out of % questions to library entries', v_mapped, v_total;
END $$;

-- ============================================================================
-- Step 3: Restore form_questions with library references
-- ============================================================================

-- Insert form questions that match library entries
INSERT INTO form_questions (
  id,  -- Preserve original IDs to maintain relationships
  form_id,
  question_library_id,
  label_override,
  description_override,
  placeholder_override,
  options_override,
  validation_override,
  required,
  logic_show_if,
  logic_value,
  order_index,
  created_at,
  updated_at
)
SELECT 
  m.old_question_id as id,
  m.form_id,
  m.library_id as question_library_id,
  m.label_override,
  m.description_override,
  m.placeholder_override,
  m.options_override,
  m.validation_override,
  m.required,
  m.logic_show_if,
  m.logic_value,
  m.order_index,
  m.created_at,
  NOW() as updated_at
FROM question_id_mapping m;

-- Log library-linked questions
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM form_questions WHERE question_library_id IS NOT NULL;
  RAISE NOTICE 'Restored % form questions linked to library', v_count;
END $$;

-- ============================================================================
-- Step 4: Handle unmapped questions (custom one-off questions)
-- ============================================================================

-- Insert questions that couldn't be mapped to library as custom questions
-- These are questions that might have unique combinations not in the library
INSERT INTO form_questions (
  id,
  form_id,
  question_library_id,  -- NULL = custom question
  label_override,
  description_override,
  placeholder_override,
  options_override,
  validation_override,
  required,
  logic_show_if,
  logic_value,
  order_index,
  created_at,
  updated_at
)
SELECT 
  bq.id,
  bq.form_id,
  NULL as question_library_id,  -- Mark as custom
  bq.label as label_override,  -- Store all data in overrides for custom questions
  bq.description as description_override,
  bq.placeholder as placeholder_override,
  bq.options as options_override,
  bq.validation as validation_override,
  bq.required,
  bq.logic_show_if,
  bq.logic_value,
  bq.order_index,
  bq.created_at,
  NOW() as updated_at
FROM form_questions_backup_20251130 bq
WHERE bq.id NOT IN (SELECT old_question_id FROM question_id_mapping)
  AND EXISTS (SELECT 1 FROM forms WHERE id = bq.form_id);  -- Only if form still exists

-- Log custom questions
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM form_questions WHERE question_library_id IS NULL;
  RAISE NOTICE 'Restored % custom form questions (not linked to library)', v_count;
END $$;

-- ============================================================================
-- Step 5: Verify migration integrity
-- ============================================================================

DO $$
DECLARE
  v_backup_count INTEGER;
  v_new_count INTEGER;
  v_form_count INTEGER;
BEGIN
  -- Count questions in backup
  SELECT COUNT(*) INTO v_backup_count FROM form_questions_backup_20251130;
  
  -- Count questions in new table
  SELECT COUNT(*) INTO v_new_count FROM form_questions;
  
  -- Count forms
  SELECT COUNT(*) INTO v_form_count FROM forms;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration Verification:';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Backup questions: %', v_backup_count;
  RAISE NOTICE 'Migrated questions: %', v_new_count;
  RAISE NOTICE 'Active forms: %', v_form_count;
  RAISE NOTICE '============================================';
  
  -- Warn if counts don't match
  IF v_backup_count != v_new_count THEN
    RAISE WARNING 'Question count mismatch! Backup: %, New: %', v_backup_count, v_new_count;
    RAISE WARNING 'This may be expected if some questions belonged to deleted forms';
  ELSE
    RAISE NOTICE '✓ All questions migrated successfully';
  END IF;
END $$;

-- ============================================================================
-- Step 6: Verify conditional logic relationships
-- ============================================================================

DO $$
DECLARE
  v_broken_logic INTEGER;
BEGIN
  -- Check for broken logic_show_if references
  SELECT COUNT(*) INTO v_broken_logic
  FROM form_questions
  WHERE logic_show_if IS NOT NULL
    AND logic_show_if NOT IN (SELECT id FROM form_questions);
  
  IF v_broken_logic > 0 THEN
    RAISE WARNING '% questions have broken conditional logic references', v_broken_logic;
    RAISE WARNING 'Run the following to see details:';
    RAISE WARNING 'SELECT id, form_id, logic_show_if FROM form_questions WHERE logic_show_if IS NOT NULL AND logic_show_if NOT IN (SELECT id FROM form_questions);';
  ELSE
    RAISE NOTICE '✓ All conditional logic relationships intact';
  END IF;
END $$;

-- ============================================================================
-- Step 7: Update usage counts in question_library
-- ============================================================================

-- Recalculate usage counts based on actual usage
UPDATE question_library ql
SET usage_count = (
  SELECT COUNT(*)
  FROM form_questions fq
  WHERE fq.question_library_id = ql.id
);

-- Log usage statistics
DO $$
DECLARE
  v_max_usage INTEGER;
  v_avg_usage NUMERIC;
BEGIN
  SELECT MAX(usage_count), ROUND(AVG(usage_count), 2) 
  INTO v_max_usage, v_avg_usage
  FROM question_library;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Question Library Usage Statistics:';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Max usage: % forms', v_max_usage;
  RAISE NOTICE 'Avg usage: % forms', v_avg_usage;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- Step 8: Generate migration report
-- ============================================================================

DO $$
DECLARE
  v_total_library INTEGER;
  v_total_questions INTEGER;
  v_library_linked INTEGER;
  v_custom_questions INTEGER;
  v_with_overrides INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_library FROM question_library;
  SELECT COUNT(*) INTO v_total_questions FROM form_questions;
  SELECT COUNT(*) INTO v_library_linked FROM form_questions WHERE question_library_id IS NOT NULL;
  SELECT COUNT(*) INTO v_custom_questions FROM form_questions WHERE question_library_id IS NULL;
  SELECT COUNT(*) INTO v_with_overrides FROM form_questions 
  WHERE question_library_id IS NOT NULL 
    AND (label_override IS NOT NULL 
      OR description_override IS NOT NULL 
      OR placeholder_override IS NOT NULL
      OR options_override IS NOT NULL
      OR validation_override IS NOT NULL);
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║        QUESTION LIBRARY MIGRATION COMPLETE             ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Question Library Entries: %', v_total_library;
  RAISE NOTICE '  • Total Form Questions: %', v_total_questions;
  RAISE NOTICE '  • Linked to Library: %', v_library_linked;
  RAISE NOTICE '  • Custom Questions: %', v_custom_questions;
  RAISE NOTICE '  • With Overrides: %', v_with_overrides;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Review migrated data in question_library table';
  RAISE NOTICE '  2. Test form functionality with new structure';
  RAISE NOTICE '  3. Update application code to use form_questions_complete view';
  RAISE NOTICE '  4. If satisfied, you can drop form_questions_backup_20251130';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- Optional: Cleanup queries (run manually after verification)
-- ============================================================================

-- To view migration details:
-- SELECT 
--   ql.id,
--   ql.label,
--   ql.type,
--   ql.category,
--   ql.usage_count,
--   ql.organization_id
-- FROM question_library ql
-- ORDER BY ql.usage_count DESC, ql.label;

-- To view questions with overrides:
-- SELECT 
--   fq.id,
--   f.title as form_title,
--   ql.label as library_label,
--   fq.label_override,
--   fq.description_override,
--   fq.placeholder_override
-- FROM form_questions fq
-- LEFT JOIN question_library ql ON fq.question_library_id = ql.id
-- LEFT JOIN forms f ON fq.form_id = f.id
-- WHERE fq.question_library_id IS NOT NULL
--   AND (fq.label_override IS NOT NULL 
--     OR fq.description_override IS NOT NULL 
--     OR fq.placeholder_override IS NOT NULL);

-- To drop backup table (only after thorough verification):
-- DROP TABLE IF EXISTS form_questions_backup_20251130;

-- Migration: Cleanup Question Library Migration Backup
-- Description: Remove temporary backup table created during question library migration
-- Date: 2025-11-30 (Created - DO NOT RUN YET)
-- ⚠️ SAFETY: Wait 2-4 weeks after migration before running this cleanup
--
-- This migration safely removes the backup table once you've verified:
-- 1. All questions migrated correctly
-- 2. Question library is working in production
-- 3. No data integrity issues reported
-- 4. Forms and questions functioning normally
--
-- ============================================================================
-- VERIFICATION QUERIES (Run these BEFORE cleanup)
-- ============================================================================

-- 1. Compare backup vs current question counts
DO $$
DECLARE
  v_backup_count INTEGER;
  v_current_count INTEGER;
  v_library_count INTEGER;
  v_custom_count INTEGER;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_backup_count FROM form_questions_backup_20251130;
  SELECT COUNT(*) INTO v_current_count FROM form_questions;
  SELECT COUNT(*) INTO v_library_count FROM form_questions WHERE question_library_id IS NOT NULL;
  SELECT COUNT(*) INTO v_custom_count FROM form_questions WHERE question_library_id IS NULL;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'MIGRATION VERIFICATION REPORT';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Backup table questions:     %', v_backup_count;
  RAISE NOTICE 'Current questions:          %', v_current_count;
  RAISE NOTICE '  ├─ Linked to library:     %', v_library_count;
  RAISE NOTICE '  └─ Custom questions:      %', v_custom_count;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  
  -- Warning if counts don't match
  IF v_backup_count != v_current_count THEN
    RAISE WARNING 'Question count mismatch! Review before cleanup.';
    RAISE WARNING 'Some questions may belong to deleted forms (this is OK)';
  ELSE
    RAISE NOTICE '✓ All questions accounted for - SAFE TO CLEANUP';
  END IF;
END $$;

-- 2. Check for broken library references
DO $$
DECLARE
  v_broken_refs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_broken_refs
  FROM form_questions
  WHERE question_library_id IS NOT NULL
    AND question_library_id NOT IN (SELECT id FROM question_library);
  
  IF v_broken_refs > 0 THEN
    RAISE WARNING 'Found % questions with broken library references!', v_broken_refs;
    RAISE WARNING 'DO NOT PROCEED WITH CLEANUP - Fix references first!';
  ELSE
    RAISE NOTICE '✓ No broken library references';
  END IF;
END $$;

-- 3. Check for forms with missing questions
DO $$
DECLARE
  v_forms_with_questions INTEGER;
  v_forms_without_questions INTEGER;
BEGIN
  SELECT COUNT(DISTINCT form_id) INTO v_forms_with_questions FROM form_questions;
  SELECT COUNT(*) INTO v_forms_without_questions 
  FROM forms 
  WHERE id NOT IN (SELECT DISTINCT form_id FROM form_questions)
    AND deleted_at IS NULL;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Forms with questions:       %', v_forms_with_questions;
  RAISE NOTICE 'Forms without questions:    %', v_forms_without_questions;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- CLEANUP (Run ONLY after verification passes)
-- ============================================================================

-- Uncomment the following line ONLY when ready to cleanup:
-- DROP TABLE IF EXISTS form_questions_backup_20251130;

-- Verification that cleanup completed
DO $$
BEGIN
  -- Check if backup table still exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'form_questions_backup_20251130'
  ) THEN
    RAISE WARNING 'Backup table still exists. Uncomment DROP statement above to remove it.';
  ELSE
    RAISE NOTICE '✓ Backup table successfully removed';
  END IF;
END $$;

-- ============================================================================
-- Post-Cleanup Summary
-- ============================================================================

DO $$
DECLARE
  v_library_templates INTEGER;
  v_total_questions INTEGER;
  v_library_linked INTEGER;
  v_custom_questions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_library_templates FROM question_library WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_total_questions FROM form_questions;
  SELECT COUNT(*) INTO v_library_linked FROM form_questions WHERE question_library_id IS NOT NULL;
  SELECT COUNT(*) INTO v_custom_questions FROM form_questions WHERE question_library_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         QUESTION LIBRARY CLEANUP COMPLETE              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Current System Status:';
  RAISE NOTICE '  • Question Library Templates: %', v_library_templates;
  RAISE NOTICE '  • Total Form Questions: %', v_total_questions;
  RAISE NOTICE '    ├─ Linked to Library: %', v_library_linked;
  RAISE NOTICE '    └─ Custom Questions: %', v_custom_questions;
  RAISE NOTICE '';
  RAISE NOTICE 'System is now using the new question library architecture.';
  RAISE NOTICE '';
END $$;

-- Migration: Add FormHarmony to website_templatesection section_type enum
-- Description: Add 'form_harmony' as a valid section type for embedding forms
-- Date: 2025-11-23
-- Feature: FormHarmony integration with Template Sections

-- ============================================================================
-- Update section_type CHECK constraint
-- ============================================================================

ALTER TABLE website_templatesection 
DROP CONSTRAINT IF EXISTS website_templatesection_section_type_check;

ALTER TABLE website_templatesection 
ADD CONSTRAINT website_templatesection_section_type_check 
CHECK (section_type IN (
  'general', 
  'brand', 
  'article_slider', 
  'contact', 
  'faq', 
  'reviews', 
  'help_center', 
  'real_estate', 
  'pricing_plans', 
  'team', 
  'testimonials', 
  'appointment',
  'form_harmony'
));

-- ============================================================================
-- Update column comment
-- ============================================================================

COMMENT ON COLUMN website_templatesection.section_type IS 'Type of template section: general (default), brand (logos), article_slider (blog posts), contact (form), faq, reviews, help_center, real_estate, pricing_plans, team, testimonials, appointment (booking system), form_harmony (embedded forms)';

-- ============================================================================
-- Add optional form_id column to link sections to forms
-- ============================================================================

ALTER TABLE website_templatesection 
ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES forms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_website_templatesection_form_id 
  ON website_templatesection(form_id) 
  WHERE form_id IS NOT NULL;

COMMENT ON COLUMN website_templatesection.form_id IS 'Reference to forms table for form_harmony section type';

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FormHarmony section type added successfully!';
  RAISE NOTICE '📝 Updated section_type CHECK constraint';
  RAISE NOTICE '🔗 Added form_id column to website_templatesection';
  RAISE NOTICE '';
  RAISE NOTICE 'Available section types:';
  RAISE NOTICE '  - general, brand, article_slider, contact, faq, reviews';
  RAISE NOTICE '  - help_center, real_estate, pricing_plans';
  RAISE NOTICE '  - team, testimonials, appointment';
  RAISE NOTICE '  - form_harmony (NEW)';
END $$;

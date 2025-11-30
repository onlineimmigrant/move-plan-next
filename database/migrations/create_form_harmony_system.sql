-- Migration: Create FormHarmony System
-- Description: Add forms, form_questions, and form_responses tables for Tally/Typeform-style form builder
-- Date: 2025-11-23
-- Feature: FormHarmony - Multi-tenant form builder with conditional logic
--
-- ⚠️ DEPRECATION NOTICE - 2025-11-30
-- This migration has been SUPERSEDED by create_question_library_system.sql
-- DO NOT RUN this migration on new databases.
-- This file is kept for historical reference only.
-- 
-- The new question library system provides:
-- - Reusable question templates
-- - Question library management
-- - Per-form question overrides
-- 
-- For new installations, use:
-- 1. create_question_library_system.sql
-- 2. (optional) migrate_backup_questions_to_library.sql if migrating existing data
-- ⚠️ END DEPRECATION NOTICE
--

-- ============================================================================
-- 1. Create forms table
-- ============================================================================

CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Form metadata
  title TEXT NOT NULL,
  description TEXT,
  
  -- Form settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example settings structure:
  -- {
  --   "theme": "purple",
  --   "font_family": "inter",
  --   "show_progress": true,
  --   "allow_multiple_submissions": false,
  --   "require_authentication": false,
  --   "close_after_date": "2025-12-31T23:59:59Z",
  --   "custom_thank_you_message": "Thanks for your response!",
  --   "redirect_url": "https://example.com/thank-you"
  -- }
  
  -- Publishing
  published BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for forms table
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_forms_published ON forms(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_forms_deleted_at ON forms(deleted_at) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE forms IS 'FormHarmony: Tally/Typeform-style forms with multi-tenancy support';
COMMENT ON COLUMN forms.settings IS 'JSONB: theme, font_family, show_progress, allow_multiple_submissions, require_authentication, close_after_date, custom_thank_you_message, redirect_url';
COMMENT ON COLUMN forms.published IS 'Only published forms are accessible via public URL';

-- ============================================================================
-- 2. Create form_questions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  
  -- Question type and content
  type TEXT NOT NULL CHECK (type IN ('text', 'email', 'textarea', 'tel', 'url', 'number', 'date', 'yesno', 'multiple', 'checkbox', 'dropdown', 'rating', 'file')),
  label TEXT NOT NULL,
  description TEXT,
  placeholder TEXT,
  
  -- Validation
  required BOOLEAN DEFAULT false,
  
  -- Options for multiple choice, checkbox, dropdown (JSON array)
  options JSONB DEFAULT '[]'::jsonb,
  -- Example: ["Option 1", "Option 2", "Option 3"]
  
  -- Conditional logic
  logic_show_if UUID REFERENCES form_questions(id) ON DELETE SET NULL,
  logic_value TEXT,
  -- Example: Show this question only if question X has value "Yes"
  
  -- Validation rules (JSONB for flexibility)
  validation JSONB DEFAULT '{}'::jsonb,
  -- Example: { "min": 1, "max": 100, "pattern": "^[A-Z]", "minLength": 10, "maxLength": 500 }
  
  -- Display order
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for form_questions table
CREATE INDEX IF NOT EXISTS idx_form_questions_form_id ON form_questions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_questions_order ON form_questions(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_form_questions_logic_show_if ON form_questions(logic_show_if) WHERE logic_show_if IS NOT NULL;

-- Comments
COMMENT ON TABLE form_questions IS 'Questions/fields for FormHarmony forms with conditional logic support';
COMMENT ON COLUMN form_questions.type IS 'Field type: text, email, textarea, tel, url, number, date, yesno, multiple, checkbox, dropdown, rating, file';
COMMENT ON COLUMN form_questions.options IS 'JSONB array of options for multiple, checkbox, dropdown, rating types';
COMMENT ON COLUMN form_questions.logic_show_if IS 'Show this question only if the referenced question has specific value';
COMMENT ON COLUMN form_questions.logic_value IS 'The value that triggers showing this question';
COMMENT ON COLUMN form_questions.validation IS 'JSONB: min, max, pattern, minLength, maxLength, etc.';

-- ============================================================================
-- 3. Create form_responses table
-- ============================================================================

CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  
  -- Response data
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "question_id_1": "John Doe",
  --   "question_id_2": "john@example.com",
  --   "question_id_3": "Yes"
  -- }
  
  -- Optional user association (if form requires authentication)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Submission metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Completion tracking
  completed BOOLEAN DEFAULT true,
  completion_time_seconds INTEGER,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for form_responses table
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_form_responses_customer_id ON form_responses(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON form_responses(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_responses_completed ON form_responses(completed) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_form_responses_deleted_at ON form_responses(deleted_at) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE form_responses IS 'Form submission responses with optional user/customer association';
COMMENT ON COLUMN form_responses.answers IS 'JSONB object mapping question_id to answer value';
COMMENT ON COLUMN form_responses.completion_time_seconds IS 'Time taken to complete form in seconds';

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for forms table
-- ============================================================================

-- Policy: Users can view published forms from their organization
CREATE POLICY "forms_select_published_own_org" 
  ON forms FOR SELECT 
  USING (
    published = true 
    AND (
      organization_id IN (
        SELECT id FROM organizations WHERE id = organization_id
      )
    )
  );

-- Policy: Admins can view all forms in their organization
CREATE POLICY "forms_select_own_org_admin" 
  ON forms FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert forms in their organization
CREATE POLICY "forms_insert_own_org_admin" 
  ON forms FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update forms in their organization
CREATE POLICY "forms_update_own_org_admin" 
  ON forms FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete forms in their organization
CREATE POLICY "forms_delete_own_org_admin" 
  ON forms FOR DELETE 
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS Policies for form_questions table
-- ============================================================================

-- Policy: Anyone can view questions for published forms
CREATE POLICY "form_questions_select_published" 
  ON form_questions FOR SELECT 
  USING (
    form_id IN (
      SELECT id FROM forms WHERE published = true
    )
  );

-- Policy: Admins can view all questions for their org's forms
CREATE POLICY "form_questions_select_own_org_admin" 
  ON form_questions FOR SELECT 
  USING (
    form_id IN (
      SELECT id FROM forms WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Policy: Admins can insert questions for their org's forms
CREATE POLICY "form_questions_insert_own_org_admin" 
  ON form_questions FOR INSERT 
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Policy: Admins can update questions for their org's forms
CREATE POLICY "form_questions_update_own_org_admin" 
  ON form_questions FOR UPDATE 
  USING (
    form_id IN (
      SELECT id FROM forms WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Policy: Admins can delete questions for their org's forms
CREATE POLICY "form_questions_delete_own_org_admin" 
  ON form_questions FOR DELETE 
  USING (
    form_id IN (
      SELECT id FROM forms WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================================================
-- RLS Policies for form_responses table
-- ============================================================================

-- Policy: Anyone can insert responses for published forms (anonymous submissions)
CREATE POLICY "form_responses_insert_published" 
  ON form_responses FOR INSERT 
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE published = true
    )
  );

-- Policy: Users can view their own responses
CREATE POLICY "form_responses_select_own" 
  ON form_responses FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all responses for their org's forms
CREATE POLICY "form_responses_select_own_org_admin" 
  ON form_responses FOR SELECT 
  USING (
    form_id IN (
      SELECT id FROM forms WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Policy: Admins can delete responses for their org's forms
CREATE POLICY "form_responses_delete_own_org_admin" 
  ON form_responses FOR DELETE 
  USING (
    form_id IN (
      SELECT id FROM forms WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================================================
-- 5. Triggers for updated_at timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for forms table
DROP TRIGGER IF EXISTS forms_updated_at ON forms;
CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_forms_updated_at();

-- Trigger for form_questions table
DROP TRIGGER IF EXISTS form_questions_updated_at ON form_questions;
CREATE TRIGGER form_questions_updated_at
  BEFORE UPDATE ON form_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_forms_updated_at();

-- ============================================================================
-- 6. Grant necessary permissions
-- ============================================================================

-- Grant usage on tables to authenticated users
GRANT SELECT, INSERT ON form_responses TO authenticated;
GRANT SELECT ON forms TO authenticated;
GRANT SELECT ON form_questions TO authenticated;

-- Grant full access to service_role for backend operations
GRANT ALL ON forms TO service_role;
GRANT ALL ON form_questions TO service_role;
GRANT ALL ON form_responses TO service_role;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FormHarmony migration completed successfully!';
  RAISE NOTICE '📋 Created tables: forms, form_questions, form_responses';
  RAISE NOTICE '🔒 Enabled RLS with multi-tenant policies';
  RAISE NOTICE '⏰ Added updated_at triggers';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Add FormHarmony to website_templatesection section_type enum';
  RAISE NOTICE '2. Create form builder UI';
  RAISE NOTICE '3. Test form submission flow';
END $$;

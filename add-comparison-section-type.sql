-- Add 'comparison' to the section_type check constraint
ALTER TABLE website_templatesection
DROP CONSTRAINT IF EXISTS website_templatesection_section_type_check;

ALTER TABLE website_templatesection
ADD CONSTRAINT website_templatesection_section_type_check
CHECK (section_type IN ('general', 'brand', 'article_slider', 'contact', 'faq', 'reviews', 'help_center', 'real_estate', 'pricing_plans', 'team', 'testimonials', 'appointment', 'form_harmony', 'comparison'));

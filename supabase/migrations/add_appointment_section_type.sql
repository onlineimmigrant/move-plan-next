-- Add 'appointment' to the section_type check constraint
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
  'appointment'
));

-- Add comment to document the new section type
COMMENT ON COLUMN website_templatesection.section_type IS 'Type of template section: general (default), brand (logos), article_slider (blog posts), contact (form), faq, reviews, help_center, real_estate, pricing_plans, team, testimonials, appointment (booking system)';

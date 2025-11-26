-- Create Website Specification Form
-- This form collects comprehensive information from customers about their desired website

-- Step 1: Insert the form
INSERT INTO public.forms (
  organization_id,
  title,
  description,
  settings,
  published
) VALUES (
  '6695b959-45ef-44b4-a68c-9cd0fe0e25a3',
  'Website Specification Form',
  'Help us understand your vision for your new website. Please provide as much detail as possible.',
  '{
    "theme": "purple",
    "font_family": "inter",
    "designStyle": "large",
    "designType": "card",
    "showCompanyLogo": true,
    "columnLayout": 1,
    "formPosition": "center"
  }'::jsonb,
  true
)
RETURNING id;

-- Step 2: Insert form questions
-- Form ID: 37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc

-- Question 1: Business Name
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'text',
  'What is your business or organization name?',
  'This will help us personalize your website',
  'e.g., Acme Corporation',
  true,
  1
);

-- Question 2: Industry/Business Type
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'dropdown',
  'What industry or sector are you in?',
  'Select the option that best describes your business',
  true,
  '["E-commerce/Retail", "Professional Services", "Healthcare", "Education", "Technology/Software", "Real Estate", "Hospitality/Restaurant", "Non-profit/NGO", "Creative/Agency", "Manufacturing", "Finance/Banking", "Other"]'::jsonb,
  2
);

-- Question 3: Website Purpose
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'checkbox',
  'What is the primary purpose of your website?',
  'Select all that apply',
  true,
  '["Sell products/services online", "Showcase portfolio/work", "Generate leads", "Provide information", "Build brand awareness", "Customer support", "Blog/Content publishing", "Community/Forum", "Booking/Reservations"]'::jsonb,
  3
);

-- Question 4: Have Existing Website
INSERT INTO public.form_questions (form_id, type, label, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'yesno',
  'Do you currently have a website?',
  true,
  4
)
RETURNING id;

-- Question 5: Current Website URL (conditional)
-- Note: Replace <question_4_id> with the UUID from Question 4
INSERT INTO public.form_questions (form_id, type, label, placeholder, required, logic_show_if, logic_value, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'url',
  'What is your current website URL?',
  'https://www.example.com',
  false,
  '<question_4_id>',
  'yes',
  5
);

-- Question 6: What do you like about current site (conditional)
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, logic_show_if, logic_value, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'textarea',
  'What do you like about your current website?',
  'Tell us what works well so we can preserve those elements',
  'e.g., The color scheme, easy navigation, fast loading...',
  false,
  '<question_4_id>',
  'yes',
  6
);

-- Question 7: What needs improvement (conditional)
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, logic_show_if, logic_value, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'textarea',
  'What would you like to improve or change?',
  'Share what frustrates you or what could be better',
  'e.g., Outdated design, difficult to update, not mobile-friendly...',
  false,
  '<question_4_id>',
  'yes',
  7
);

-- Question 8: Target Audience
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'textarea',
  'Who is your target audience?',
  'Describe your ideal website visitors (age, location, interests, profession, etc.)',
  'e.g., Small business owners aged 30-50 in North America looking for software solutions',
  true,
  8
);

-- Question 9: Key Features/Functionality
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'checkbox',
  'What features do you need on your website?',
  'Select all features you want to include',
  true,
  '["Contact form", "Newsletter signup", "E-commerce/Shopping cart", "Blog", "Photo gallery", "Video integration", "Customer testimonials", "Live chat", "Social media integration", "Search functionality", "User accounts/Login", "Booking/Calendar system", "Payment processing", "Maps/Location finder", "Multi-language support", "Forum/Community"]'::jsonb,
  9
);

-- Question 10: Number of Pages
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'dropdown',
  'How many pages do you anticipate needing?',
  'Approximate number is fine',
  true,
  '["1-5 pages", "6-10 pages", "11-20 pages", "21-50 pages", "50+ pages", "Not sure yet"]'::jsonb,
  10
);

-- Question 11: Content Readiness
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'dropdown',
  'Do you have content ready (text, images, videos)?',
  'Let us know if you need help creating content',
  true,
  '["Yes, all content is ready", "Partially ready", "Need help creating content", "No content yet"]'::jsonb,
  11
);

-- Question 12: Design Preferences
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'textarea',
  'Do you have any design preferences or style in mind?',
  'Describe colors, mood, style (modern, classic, minimalist, bold, etc.)',
  'e.g., Clean and modern with blue and white colors, similar to Apple''s website',
  false,
  12
);

-- Question 13: Example Websites
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'textarea',
  'Are there any websites you admire or would like to use as inspiration?',
  'Share URLs or names of websites you like',
  'e.g., https://www.example1.com - I love their layout\nhttps://www.example2.com - Great color scheme',
  false,
  13
);

-- Question 14: Brand Assets
INSERT INTO public.form_questions (form_id, type, label, description, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'yesno',
  'Do you have a logo and brand guidelines?',
  'This includes logo files, fonts, color codes, etc.',
  true,
  14
);

-- Question 15: Timeline
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'dropdown',
  'What is your desired timeline for launch?',
  'When would you like the website to be live?',
  true,
  '["ASAP (within 2 weeks)", "1 month", "2-3 months", "3-6 months", "6+ months", "Flexible/No rush"]'::jsonb,
  15
);

-- Question 16: Budget Range
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'dropdown',
  'What is your approximate budget for this project?',
  'This helps us recommend the best solution for your needs',
  false,
  '["Under $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000 - $25,000", "$25,000 - $50,000", "$50,000+", "Prefer not to say"]'::jsonb,
  16
);

-- Question 17: Ongoing Maintenance
INSERT INTO public.form_questions (form_id, type, label, description, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'yesno',
  'Will you need ongoing maintenance and updates?',
  'After launch, do you need help managing and updating the website?',
  true,
  17
);

-- Question 18: SEO/Marketing
INSERT INTO public.form_questions (form_id, type, label, description, required, options, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'checkbox',
  'Are you interested in any of these additional services?',
  'Select all that apply',
  false,
  '["Search Engine Optimization (SEO)", "Google Analytics setup", "Social media marketing", "Email marketing", "Content creation", "Photography/Videography", "Copywriting", "Hosting setup", "Domain registration"]'::jsonb,
  18
);

-- Question 19: Special Requirements
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'textarea',
  'Any other special requirements or features?',
  'Tell us about any unique needs or integrations you require',
  'e.g., Integration with specific CRM, accessibility compliance, custom animations, etc.',
  false,
  19
);

-- Question 20: Contact Email
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index, validation)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'email',
  'What is the best email to reach you?',
  'We''ll send you a summary and follow up with next steps',
  'your.email@example.com',
  true,
  20,
  '{"pattern": "email"}'::jsonb
);

-- Question 21: Contact Phone
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'tel',
  'Phone number (optional)',
  'In case we need to discuss details',
  '+1 (555) 123-4567',
  false,
  21
);

-- Question 22: Additional Comments
INSERT INTO public.form_questions (form_id, type, label, description, placeholder, required, order_index)
VALUES (
  '37b0fb0c-5f61-483e-9b7b-1e36f17eb4fc',
  'textarea',
  'Anything else you''d like us to know?',
  'Share any additional thoughts, concerns, or questions',
  'Feel free to add anything we haven''t covered...',
  false,
  22
);

-- Verify the form was created
SELECT 
  f.id as form_id,
  f.title,
  COUNT(fq.id) as question_count
FROM public.forms f
LEFT JOIN public.form_questions fq ON fq.form_id = f.id
WHERE f.title = 'Website Specification Form'
GROUP BY f.id, f.title;

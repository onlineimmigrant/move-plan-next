-- Sample data for testing cookie management system

-- First, let's create some cookie services for the test organization
INSERT INTO cookie_service (
  name,
  description,
  active,
  processing_company,
  data_processor_cookie_policy_url,
  data_processor_privacy_policy_url,
  data_protection_officer_contact,
  retention_period,
  category_id,
  organization_id
) VALUES 
-- Essential cookies
(
  'Session Cookie',
  'Keeps users logged in during their session',
  true,
  'Your Organization',
  'https://example.com/cookie-policy',
  'https://example.com/privacy-policy',
  'privacy@yourorg.com',
  'Session duration',
  1,
  'de0d5c21-787f-49c2-a665-7ff8e599c891'
),
-- Analytics cookies
(
  'Google Analytics',
  'Tracks website usage and performance metrics',
  false,
  'Google Inc.',
  'https://policies.google.com/technologies/cookies',
  'https://policies.google.com/privacy',
  'privacy-inquiries@google.com',
  '2 years',
  2,
  'de0d5c21-787f-49c2-a665-7ff8e599c891'
),
-- Marketing cookies
(
  'Facebook Pixel',
  'Tracks conversions and enables targeted advertising',
  false,
  'Meta Platforms Inc.',
  'https://www.facebook.com/policies/cookies/',
  'https://www.facebook.com/about/privacy/',
  'privacy@fb.com',
  '90 days',
  2,
  'de0d5c21-787f-49c2-a665-7ff8e599c891'
);

-- Create some sample consent records (assuming there are users)
-- First, let's create a test user-organization relationship if it doesn't exist
-- INSERT INTO user_organization (user_id, organization_id) VALUES 
-- ('test-user-id', 'de0d5c21-787f-49c2-a665-7ff8e599c891');

-- Then create sample consent records
-- INSERT INTO cookie_consent (
--   created_at,
--   ip_address,
--   consent_given,
--   consent_data,
--   user_id,
--   last_updated,
--   language_auto
-- ) VALUES 
-- (
--   NOW(),
--   '192.168.1.1',
--   true,
--   '{"essential": true, "analytics": false, "marketing": false}',
--   'test-user-id',
--   NOW(),
--   'en'
-- ),
-- (
--   NOW() - INTERVAL '1 day',
--   '192.168.1.2', 
--   false,
--   '{"essential": true, "analytics": false, "marketing": false}',
--   'test-user-id-2',
--   NOW() - INTERVAL '1 day',
--   'en'
-- );

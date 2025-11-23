-- Update profiles to set customer.is_customer = true where is_student = true
-- This marks all students as customers in the system

UPDATE profiles
SET customer = jsonb_set(
  COALESCE(customer, '{}'::jsonb),
  '{is_customer}',
  'true'::jsonb
)
WHERE is_student = true
  AND (customer IS NULL OR (customer->>'is_customer')::boolean IS DISTINCT FROM true);

-- Verify the update
-- SELECT 
--   id,
--   full_name,
--   email,
--   is_student,
--   customer->>'is_customer' as is_customer
-- FROM profiles
-- WHERE is_student = true
-- LIMIT 10;

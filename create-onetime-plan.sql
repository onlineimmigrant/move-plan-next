-- Create a one-time pricing plan to test the difference
-- Run this entire block in Supabase SQL Editor

DO $$
DECLARE
  v_product_id INTEGER;
  v_plan_id UUID;
  v_feature_id_1 UUID;
  v_feature_id_2 UUID;
BEGIN
  -- Create product for one-time service
  INSERT INTO product (
    organization_id,
    product_name,
    slug
  ) VALUES (
    'e534f121-e396-462c-9aab-acd2e66d8837',
    'One-Time Consultation',
    'one-time-consultation-' || floor(random() * 1000)
  ) RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Created product with ID: %', v_product_id;
  
  -- Create ONE-TIME pricing plan (recurring_interval = NULL)
  INSERT INTO pricingplan (
    organization_id,
    product_id,
    package,
    description,
    price,
    currency,
    currency_symbol,
    recurring_interval,
    recurring_interval_count,
    is_active,
    type,
    slug,
    "order"
  ) VALUES (
    'e534f121-e396-462c-9aab-acd2e66d8837',
    v_product_id,
    'One-Time Service',
    'Complete one-time legal consultation package',
    75000, -- £750.00 (stored in pence)
    'gbp',
    '£',
    NULL, -- This makes it one-time instead of recurring
    0,
    true,
    'one_time',
    'one-time-service-' || floor(random() * 1000),
    1
  ) RETURNING id INTO v_plan_id;
  
  RAISE NOTICE 'Created ONE-TIME pricing plan with ID: %', v_plan_id;
  
  -- Create features
  INSERT INTO feature (
    organization_id,
    name,
    content,
    slug,
    type,
    "order"
  ) VALUES (
    'e534f121-e396-462c-9aab-acd2e66d8837',
    'Full Legal Review',
    'Comprehensive review of all documentation',
    'full-legal-review-' || floor(random() * 1000),
    'Service',
    1
  ) RETURNING id INTO v_feature_id_1;
  
  INSERT INTO feature (
    organization_id,
    name,
    content,
    slug,
    type,
    "order"
  ) VALUES (
    'e534f121-e396-462c-9aab-acd2e66d8837',
    '2 Hour Consultation',
    'Two hours of direct consultation time',
    'consultation-time-' || floor(random() * 1000),
    'Time',
    2
  ) RETURNING id INTO v_feature_id_2;
  
  RAISE NOTICE 'Created 2 features';
  
  -- Link features to pricing plan
  INSERT INTO pricingplan_features (pricingplan_id, feature_id) VALUES 
    (v_plan_id, v_feature_id_1),
    (v_plan_id, v_feature_id_2);
  
  RAISE NOTICE 'Linked features to pricing plan';
  
  -- Display summary
  RAISE NOTICE 'SUCCESS! Created ONE-TIME plan:';
  RAISE NOTICE '  Product ID: %', v_product_id;
  RAISE NOTICE '  Pricing Plan ID: %', v_plan_id;
  RAISE NOTICE '  2 Features linked to the plan';
END $$;

-- Verify the created data
SELECT 
  p.id as product_id,
  p.product_name,
  pp.id as plan_id,
  pp.package,
  pp.description,
  pp.price,
  pp.currency_symbol,
  pp.recurring_interval,
  pp.type,
  array_agg(f.name ORDER BY f."order") as features
FROM product p
JOIN pricingplan pp ON pp.product_id = p.id
LEFT JOIN pricingplan_features ppf ON ppf.pricingplan_id = pp.id
LEFT JOIN feature f ON f.id = ppf.feature_id
WHERE p.organization_id = 'e534f121-e396-462c-9aab-acd2e66d8837'
  AND p.product_name = 'One-Time Consultation'
GROUP BY p.id, p.product_name, pp.id, pp.package, pp.description, pp.price, pp.currency_symbol, pp.recurring_interval, pp.type
ORDER BY pp."order";

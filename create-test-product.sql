-- Create a test product and pricing plan for organization e534f121-e396-462c-9aab-acd2e66d8837
-- Run this entire block in your Supabase SQL Editor

DO $$
DECLARE
  v_product_id INTEGER;
  v_plan_id UUID;
  v_feature_id_1 UUID;
  v_feature_id_2 UUID;
  v_feature_id_3 UUID;
BEGIN
  -- Create product
  INSERT INTO product (
    organization_id,
    product_name,
    slug,
    description,
    is_active
  ) VALUES (
    'e534f121-e396-462c-9aab-acd2e66d8837',
    'Test Service Package',
    'test-service-package-' || floor(random() * 1000),
    'A test service package to verify pricing display',
    true
  ) RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Created product with ID: %', v_product_id;
  
  -- Create pricing plan
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
    'Premium Package',
    'Full service package with all features included',
    50000, -- £500.00 (stored in pence)
    'gbp',
    '£',
    'month',
    1,
    true,
    'subscription',
    'premium-package-' || floor(random() * 1000),
    1
  ) RETURNING id INTO v_plan_id;
  
  RAISE NOTICE 'Created pricing plan with ID: %', v_plan_id;
  
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
    'Priority Support',
    '24/7 priority customer support via email and phone',
    'priority-support-' || floor(random() * 1000),
    'Support',
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
    'Unlimited Users',
    'Add unlimited team members to your account',
    'unlimited-users-' || floor(random() * 1000),
    'Access',
    2
  ) RETURNING id INTO v_feature_id_2;
  
  INSERT INTO feature (
    organization_id,
    name,
    content,
    slug,
    type,
    "order"
  ) VALUES (
    'e534f121-e396-462c-9aab-acd2e66d8837',
    'Advanced Analytics',
    'Detailed reports and analytics dashboard',
    'advanced-analytics-' || floor(random() * 1000),
    'Analytics',
    3
  ) RETURNING id INTO v_feature_id_3;
  
  RAISE NOTICE 'Created 3 features';
  
  -- Link features to pricing plan
  INSERT INTO pricingplan_features (pricingplan_id, feature_id) VALUES 
    (v_plan_id, v_feature_id_1),
    (v_plan_id, v_feature_id_2),
    (v_plan_id, v_feature_id_3);
  
  RAISE NOTICE 'Linked features to pricing plan';
  
  -- Display summary
  RAISE NOTICE 'SUCCESS! Created:';
  RAISE NOTICE '  Product ID: %', v_product_id;
  RAISE NOTICE '  Pricing Plan ID: %', v_plan_id;
  RAISE NOTICE '  3 Features linked to the plan';
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
  array_agg(f.name ORDER BY f."order") as features
FROM product p
JOIN pricingplan pp ON pp.product_id = p.id
LEFT JOIN pricingplan_features ppf ON ppf.pricingplan_id = pp.id
LEFT JOIN feature f ON f.id = ppf.feature_id
WHERE p.organization_id = 'e534f121-e396-462c-9aab-acd2e66d8837'
  AND p.product_name = 'Test Service Package'
GROUP BY p.id, p.product_name, pp.id, pp.package, pp.description, pp.price, pp.currency_symbol, pp.recurring_interval
ORDER BY pp."order";

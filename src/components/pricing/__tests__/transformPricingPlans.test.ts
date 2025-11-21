import { transformPricingPlans } from '../transformPricingPlans';
import { PricingPlan } from '@/types/pricingplan';

describe('transformPricingPlans', () => {
  const mockMonthlyPlan: PricingPlan = {
    id: 1,
    package: 'Basic Plan',
    price: 10,
    recurring_interval: 'month',
    recurring_interval_count: 1,
    type: 'recurring',
    description: 'Basic plan description',
    annual_size_discount: 20,
    order_number: 1,
    product_id: 1,
    is_promotion: false,
    organization_id: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    digital_asset_access: false,
    grants_permanent_ownership: false,
    is_active: true,
    currency: 'USD',
  } as PricingPlan;

  const mockFeatures = {
    1: [
      { id: '1', name: 'Feature 1', content: '', slug: 'feature-1', type: 'features' as const, order: 1 },
      { id: '2', name: 'Feature 2', content: '', slug: 'feature-2', type: 'features' as const, order: 2 },
    ],
  };

  it('should transform monthly plan correctly', () => {
    const result = transformPricingPlans([mockMonthlyPlan], mockFeatures, 'USD', '$');
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Basic Plan');
    expect(result[0].monthlyPrice).toBe(10);
    expect(result[0].currencySymbol).toBe('$');
  });

  it('should calculate annual discount correctly', () => {
    const result = transformPricingPlans([mockMonthlyPlan], mockFeatures, 'USD', '$');
    
    expect(result[0].annualSizeDiscount).toBe(20);
    expect(result[0].annualPrice).toBe(8); // 10 * (1 - 20/100) = 8
  });

  it('should handle empty plans array', () => {
    const result = transformPricingPlans([], {}, 'USD', '$');
    
    expect(result).toEqual([]);
  });

  it('should handle promotion pricing', () => {
    const promoPlan = Object.assign({}, mockMonthlyPlan, {
      is_promotion: true,
      promotion_percent: 50,
    }) as PricingPlan;

    const result = transformPricingPlans([promoPlan], mockFeatures, 'USD', '$');
    
    expect(result[0].isPromotion).toBe(true);
    expect(result[0].monthlyPromotionPrice).toBe(5); // 10 * (1 - 50/100) = 5
  });

  it('should sort plans by order_number', () => {
    const plan1 = { ...mockMonthlyPlan, id: 1, order_number: 3, package: 'Plan C' };
    const plan2 = { ...mockMonthlyPlan, id: 2, order_number: 1, package: 'Plan A' };
    const plan3 = { ...mockMonthlyPlan, id: 3, order_number: 2, package: 'Plan B' };

    const result = transformPricingPlans([plan1, plan2, plan3] as PricingPlan[], {}, 'USD', '$');
    
    expect(result[0].name).toBe('Plan A');
    expect(result[1].name).toBe('Plan B');
    expect(result[2].name).toBe('Plan C');
  });
});

import { renderHook } from '@testing-library/react';
import { useCurrencyDetection } from '../useCurrencyDetection';
import { PricingPlan } from '@/types/pricingplan';

describe('useCurrencyDetection', () => {
  const createMockPlan = (currency: string): PricingPlan => ({
    id: 1,
    package: 'Test Plan',
    price: 10,
    recurring_interval: 'month',
    recurring_interval_count: 1,
    type: 'recurring',
    description: 'Test',
    annual_size_discount: 0,
    order_number: 1,
    product_id: 1,
    is_promotion: false,
    organization_id: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    digital_asset_access: false,
    grants_permanent_ownership: false,
    is_active: true,
    currency,
  }) as PricingPlan;

  it('should detect USD currency', () => {
    const plans = [createMockPlan('USD')];
    const { result } = renderHook(() => useCurrencyDetection(plans));

    expect(result.current.userCurrency).toBe('USD');
    expect(result.current.currencySymbol).toBe('$');
  });

  it('should detect EUR currency', () => {
    const plans = [createMockPlan('EUR')];
    const { result } = renderHook(() => useCurrencyDetection(plans));

    expect(result.current.userCurrency).toBe('EUR');
    expect(result.current.currencySymbol).toBe('€');
  });

  it('should detect GBP currency', () => {
    const plans = [createMockPlan('GBP')];
    const { result } = renderHook(() => useCurrencyDetection(plans));

    expect(result.current.userCurrency).toBe('GBP');
    expect(result.current.currencySymbol).toBe('£');
  });

  it('should default to USD for empty plans', () => {
    const { result } = renderHook(() => useCurrencyDetection([]));

    expect(result.current.userCurrency).toBe('USD');
    expect(result.current.currencySymbol).toBe('$');
  });

  it('should default to USD for unknown currency', () => {
    const plans = [createMockPlan('XYZ')];
    const { result } = renderHook(() => useCurrencyDetection(plans));

    expect(result.current.userCurrency).toBe('USD');
    expect(result.current.currencySymbol).toBe('$');
  });

  it('should use first plan currency when multiple currencies present', () => {
    const plans = [
      createMockPlan('EUR'),
      createMockPlan('USD'),
      createMockPlan('GBP'),
    ];
    const { result } = renderHook(() => useCurrencyDetection(plans));

    expect(result.current.userCurrency).toBe('EUR');
    expect(result.current.currencySymbol).toBe('€');
  });

  it('should handle undefined currency property', () => {
    const plan = createMockPlan('USD');
    delete (plan as any).currency;
    
    const { result } = renderHook(() => useCurrencyDetection([plan]));

    expect(result.current.userCurrency).toBe('USD');
    expect(result.current.currencySymbol).toBe('$');
  });
});

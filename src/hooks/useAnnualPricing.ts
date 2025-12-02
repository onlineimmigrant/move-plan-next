/**
 * Hook for computing annual pricing with consistent fallback logic
 * Centralizes annual billing computation across basket, checkout, and product pages
 */

export interface PricingPlan {
  price?: number;
  computed_price?: number;
  recurring_interval?: string;
  recurring_interval_count?: number;
  annual_size_discount?: number;
  is_promotion?: boolean;
  promotion_price?: number;
}

export interface AnnualPricingResult {
  unitPrice: number;
  totalPrice: number;
  annualFactor: number;
  cadenceLabel: string;
}

/**
 * Get annual multiplier based on recurring interval
 */
export function getAnnualFactor(interval: string | undefined, count?: number): number {
  if (typeof count === 'number' && count > 0) {
    return count;
  }
  
  const normalized = String(interval || '').toLowerCase();
  if (normalized === 'month' || normalized === 'monthly') return 12;
  if (normalized === 'week' || normalized === 'weekly') return 52;
  if (normalized === 'day' || normalized === 'daily') return 365;
  if (normalized === 'quarter' || normalized === 'quarterly') return 4;
  if (normalized === 'year' || normalized === 'annually' || normalized === 'annual') return 1;
  return 1;
}

/**
 * Compute unit price for a plan (monthly or annual)
 */
export function computeUnitPrice(
  plan: PricingPlan,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): number {
  // Base price from computed_price or price (in cents)
  const baseUnit =
    typeof plan.computed_price === 'number'
      ? plan.computed_price
      : (plan.price ?? 0) / 100;

  // For monthly, check if promotion applies
  if (billingCycle === 'monthly') {
    if (typeof plan.computed_price !== 'number') {
      const cents =
        plan.is_promotion && typeof plan.promotion_price === 'number'
          ? plan.promotion_price
          : plan.price ?? 0;
      return cents / 100;
    }
    return baseUnit;
  }

  // For annual, apply annual discount
  const isRecurring = Boolean(plan.recurring_interval);
  if (!isRecurring) {
    return baseUnit; // One-time purchase
  }

  const annualFactor = getAnnualFactor(
    plan.recurring_interval,
    plan.recurring_interval_count
  );

  const discountRaw = plan.annual_size_discount;
  let multiplier = 1;
  if (typeof discountRaw === 'number') {
    if (discountRaw > 1) {
      // Percentage (e.g., 20 = 20% off)
      multiplier = (100 - discountRaw) / 100;
    } else if (discountRaw > 0 && discountRaw <= 1) {
      // Decimal multiplier (e.g., 0.8 = 80% of original)
      multiplier = discountRaw;
    }
  }

  return baseUnit * annualFactor * multiplier;
}

/**
 * Main hook for annual pricing computation
 */
export function useAnnualPricing(
  plan: PricingPlan,
  quantity: number = 1,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): AnnualPricingResult {
  const unitPrice = computeUnitPrice(plan, billingCycle);
  const totalPrice = unitPrice * quantity;
  const annualFactor = getAnnualFactor(
    plan.recurring_interval,
    plan.recurring_interval_count
  );

  const cadenceLabel =
    billingCycle === 'annual' ? 'perYear' : 'perMonth'; // i18n key

  return {
    unitPrice,
    totalPrice,
    annualFactor,
    cadenceLabel,
  };
}

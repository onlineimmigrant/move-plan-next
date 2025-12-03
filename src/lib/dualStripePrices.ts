// Utility to create dual Stripe prices for a pricing plan
// Creates both monthly billing and annual prepay options

import Stripe from 'stripe';

export interface DualPriceOptions {
  stripe: Stripe;
  stripeProductId: string;
  monthlyPrice: number; // in cents
  currency: string;
  commitmentMonths: number; // e.g., 12
  annualDiscountPercent?: number; // e.g., 20 for 20% off
  metadata?: Record<string, string>;
}

export interface DualPriceResult {
  monthlyPriceId: string;
  annualPriceId: string | null;
  monthlyAmount: number;
  annualAmount: number | null;
  savings: number | null;
}

/**
 * Creates two Stripe prices for a single plan:
 * 1. Monthly billing: charges monthly_price every month
 * 2. Annual prepay: charges (monthly_price × commitment_months × discount) once per year
 * 
 * @example
 * const result = await createDualStripePrices({
 *   stripe,
 *   stripeProductId: 'prod_XXX',
 *   monthlyPrice: 6200, // £62/month
 *   currency: 'gbp',
 *   commitmentMonths: 12,
 *   annualDiscountPercent: 20 // 20% off
 * });
 * // Returns:
 * // {
 * //   monthlyPriceId: 'price_monthly',
 * //   annualPriceId: 'price_annual',
 * //   monthlyAmount: 6200,
 * //   annualAmount: 59520, // 6200 × 12 × 0.80
 * //   savings: 14880 // £148.80 saved
 * // }
 */
export async function createDualStripePrices(
  options: DualPriceOptions
): Promise<DualPriceResult> {
  const {
    stripe,
    stripeProductId,
    monthlyPrice,
    currency,
    commitmentMonths,
    annualDiscountPercent = 0,
    metadata = {},
  } = options;

  // Create monthly billing price
  const monthlyPriceParams: Stripe.PriceCreateParams = {
    product: stripeProductId,
    unit_amount: monthlyPrice,
    currency: currency.toLowerCase(),
    recurring: {
      interval: 'month',
      interval_count: 1,
    },
    metadata: {
      ...metadata,
      billing_type: 'monthly',
      commitment_months: String(commitmentMonths),
    },
  };

  const monthlyPriceObj = await stripe.prices.create(monthlyPriceParams);
  console.log(`Created monthly price: ${monthlyPriceObj.id}`);

  let annualPriceObj: Stripe.Price | null = null;
  let annualAmount: number | null = null;
  let savings: number | null = null;

  // Create annual prepay price if discount is offered
  if (annualDiscountPercent > 0 && commitmentMonths >= 12) {
    const totalMonthly = monthlyPrice * commitmentMonths;
    annualAmount = Math.round(totalMonthly * (1 - annualDiscountPercent / 100));
    savings = totalMonthly - annualAmount;

    const annualPriceParams: Stripe.PriceCreateParams = {
      product: stripeProductId,
      unit_amount: annualAmount,
      currency: currency.toLowerCase(),
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        ...metadata,
        billing_type: 'annual_prepay',
        commitment_months: String(commitmentMonths),
        discount_percent: String(annualDiscountPercent),
        monthly_equivalent: String(monthlyPrice),
        total_savings: String(savings),
      },
    };

    annualPriceObj = await stripe.prices.create(annualPriceParams);
    console.log(`Created annual prepay price: ${annualPriceObj.id} (saves ${savings} ${currency})`);
  }

  return {
    monthlyPriceId: monthlyPriceObj.id,
    annualPriceId: annualPriceObj?.id || null,
    monthlyAmount: monthlyPrice,
    annualAmount,
    savings,
  };
}

/**
 * Updates a pricing plan in Supabase with dual Stripe price IDs
 */
export async function updatePricingPlanWithDualPrices(
  supabase: any,
  pricingPlanId: string,
  result: DualPriceResult
) {
  const { error } = await supabase
    .from('pricing_plan')
    .update({
      stripe_price_id: result.monthlyPriceId,
      stripe_price_id_annual: result.annualPriceId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pricingPlanId);

  if (error) {
    throw new Error(`Failed to update pricing plan: ${error.message}`);
  }

  console.log(`Updated pricing plan ${pricingPlanId} with dual prices`);
}

/**
 * Format pricing display for UI
 */
export function formatPricingDisplay(
  monthlyPrice: number,
  commitmentMonths: number,
  currency: string,
  annualDiscountPercent?: number
) {
  const currencySymbol = currency === 'gbp' ? '£' : currency === 'usd' ? '$' : currency === 'eur' ? '€' : '';
  const monthlyDisplay = `${currencySymbol}${(monthlyPrice / 100).toFixed(2)}/month`;
  const totalMonthly = monthlyPrice * commitmentMonths;

  if (!annualDiscountPercent || annualDiscountPercent === 0) {
    return {
      monthly: {
        label: 'Pay Monthly',
        price: monthlyDisplay,
        total: `${currencySymbol}${(totalMonthly / 100).toFixed(2)} total`,
        perMonth: null,
      },
      annual: null,
    };
  }

  const annualAmount = Math.round(totalMonthly * (1 - annualDiscountPercent / 100));
  const savings = totalMonthly - annualAmount;
  const perMonthAnnual = annualAmount / commitmentMonths;

  return {
    monthly: {
      label: 'Pay Monthly',
      price: monthlyDisplay,
      total: `${currencySymbol}${(totalMonthly / 100).toFixed(2)} total`,
      perMonth: null,
    },
    annual: {
      label: `Pay Annually (${annualDiscountPercent}% off)`,
      price: `${currencySymbol}${(annualAmount / 100).toFixed(2)}/year`,
      perMonth: `${currencySymbol}${(perMonthAnnual / 100).toFixed(2)}/month`,
      savings: `Save ${currencySymbol}${(savings / 100).toFixed(2)}`,
      total: `${currencySymbol}${(annualAmount / 100).toFixed(2)} total`,
    },
  };
}

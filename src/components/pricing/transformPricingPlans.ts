import { PricingPlan } from '@/types/pricingplan';
import { getPriceForCurrency } from '@/lib/currency';
import { Feature, SamplePricingPlan } from './types';

/**
 * Transform real pricing plans from API into display format
 */
export function transformPricingPlans(
  plans: PricingPlan[],
  planFeatures: Record<string, Feature[]>,
  userCurrency: string,
  currencySymbol: string
): SamplePricingPlan[] {
  if (!plans || plans.length === 0) return []; // Return empty array when no plans available
  
  // Group plans by product and create monthly/annual pairs
  const plansByProduct: { [key: string]: { monthly?: PricingPlan; annual?: PricingPlan } } = {};
  
  plans.forEach(plan => {
    // Skip null or undefined plans
    if (!plan) return;
    
    const productKey = plan.package || `Product ${plan.product_id}`;
    if (!plansByProduct[productKey]) {
      plansByProduct[productKey] = {};
    }
    
    if (plan.recurring_interval === 'month') {
      plansByProduct[productKey].monthly = plan;
    } else if (plan.recurring_interval === 'year') {
      plansByProduct[productKey].annual = plan;
    }
  });
  
  const transformedPlans = Object.entries(plansByProduct).map(([productName, { monthly, annual }]) => {
    // Get currency-aware prices using our utility function
    const monthlyPriceResult = getPriceForCurrency(monthly, userCurrency);
    const annualPriceResult = getPriceForCurrency(annual, userCurrency);
    
    // Use currency-aware prices or fallback to raw price (legacy system uses actual currency units)
    const monthlyPrice = monthlyPriceResult?.price ?? (monthly?.price || 0);
    const monthlyPriceSymbol = monthlyPriceResult?.symbol || currencySymbol;
    
    // Calculate annual price with priority:
    // 1. Use annual plan's monthly_price_calculated if available
    // 2. Calculate from monthly price using annual_size_discount if available
    // 3. Fallback to monthly price
    let annualPrice = monthlyPrice;
    let actualAnnualPrice = undefined;
    let annualPriceSymbol = monthlyPriceSymbol;
    
    if (annual?.monthly_price_calculated) {
      // Direct annual plan exists - use currency-aware pricing
      annualPrice = annualPriceResult?.price ?? (annual?.price || monthlyPrice);
      annualPriceSymbol = annualPriceResult?.symbol || currencySymbol;
      const commitmentMonths = annual.commitment_months || 12;
      actualAnnualPrice = annualPrice ? parseFloat((annualPrice * commitmentMonths).toFixed(2)) : undefined;
    } else if (monthly?.annual_size_discount && monthly.annual_size_discount > 0) {
      // Calculate annual price from monthly using discount
      const discountMultiplier = (100 - monthly.annual_size_discount) / 100;
      annualPrice = parseFloat((monthlyPrice * discountMultiplier).toFixed(2));
      actualAnnualPrice = parseFloat((annualPrice * 12).toFixed(2)); // Calculate actual annual total
      annualPriceSymbol = monthlyPriceSymbol; // Use same symbol
    }
    
    // Get features for this plan - use String() for consistent key lookup
    const planId = monthly?.id || annual?.id;
    const planIdKey = planId ? String(planId) : '';
    const realFeatures = planIdKey ? (planFeatures[planIdKey] || []) : [];

    // Handle promotion pricing with currency awareness
    const monthlyIsPromotion = monthly?.is_promotion && (monthly?.promotion_price !== undefined || monthly?.promotion_percent !== undefined);
    const annualIsPromotion = annual?.is_promotion && (annual?.promotion_price !== undefined || annual?.promotion_percent !== undefined);
    
    let monthlyPromotionPrice = undefined;
    let annualPromotionPrice = undefined;
    
    if (monthlyIsPromotion) {
      if (monthly?.promotion_percent !== undefined) {
        // Calculate promotion price from percentage of the converted price
        monthlyPromotionPrice = parseFloat((monthlyPrice * (1 - monthly.promotion_percent / 100)).toFixed(2));
      } else if (monthly?.promotion_price !== undefined) {
        // Use promotion_price directly (already in correct currency units)
        monthlyPromotionPrice = monthly.promotion_price;
      }
    }
    
    if (annualIsPromotion) {
      if (annual?.promotion_percent !== undefined) {
        // Calculate promotion price from percentage of the converted price
        annualPromotionPrice = parseFloat((annualPrice * (1 - annual.promotion_percent / 100)).toFixed(2));
      } else if (annual?.promotion_price !== undefined) {
        // Use promotion_price directly (already in correct currency units)
        annualPromotionPrice = annual.promotion_price;
      }
    } else if (monthlyIsPromotion && monthlyPromotionPrice !== undefined && monthly?.annual_size_discount && monthly.annual_size_discount > 0) {
      // Calculate annual promotion price from monthly promotion using discount
      const discountMultiplier = (100 - monthly.annual_size_discount) / 100;
      annualPromotionPrice = parseFloat((monthlyPromotionPrice * discountMultiplier).toFixed(2));
    }

    return {
      name: productName,
      monthlyPrice: parseFloat(monthlyPrice.toFixed(2)),
      annualPrice: parseFloat(annualPrice.toFixed(2)),
      period: '/month',
      description: monthly?.description || annual?.description || '',
      features: [], // Will be populated after sorting and filtering
      buttonText: monthly?.type === 'one_time' ? 'Buy Now' : 'Get Started', // Will be translated in render
      // Add currency information
      currencySymbol: monthlyPriceSymbol,
      annualCurrencySymbol: annualPriceSymbol,
      // Add recurring interval data for total calculation
      monthlyRecurringCount: monthly?.recurring_interval_count || 1,
      annualRecurringCount: annual?.commitment_months || monthly?.commitment_months || 12,
      // Add the actual annual plan price for correct total calculation (already converted from cents)
      actualAnnualPrice,
      // Add discount information for display
      annualSizeDiscount: monthly?.annual_size_discount || annual?.annual_size_discount || 0,
      // Store the actual plan ID and features for feature comparison table
      planId: planId || 0,
      realFeatures: realFeatures || [],
      // Add product slug for linking to product page
      productSlug: monthly?.product?.slug || annual?.product?.slug || '',
      // Store the order for sorting
      order: monthly?.order_number || annual?.order_number || 999, // Default to 999 if no order specified
      // Promotion fields
      isPromotion: monthlyIsPromotion || annualIsPromotion,
      promotionPrice: monthlyIsPromotion ? monthlyPromotionPrice : annualIsPromotion ? annualPromotionPrice : undefined,
      monthlyPromotionPrice,
      annualPromotionPrice,
    };
  }).sort((a, b) => a.order - b.order);

  // After sorting, filter features to exclude cheapest plan features from higher tier plans
  const sortedPlans = transformedPlans.map((plan, sortedIndex) => {
    const cheapestPlan = transformedPlans[0]; // First plan after sorting by price
    const cheapestPlanFeatures = cheapestPlan.realFeatures || [];
    
    // For the cheapest plan, show all its features
    // For higher tier plans, exclude features that exist in the cheapest plan
    let filteredFeatures: Feature[] = [];
    if (sortedIndex === 0) {
      // Cheapest plan - show all features
      filteredFeatures = plan.realFeatures || [];
    } else {
      // Higher tier plans - exclude cheapest plan features
      filteredFeatures = (plan.realFeatures || []).filter(feature => 
        !cheapestPlanFeatures.some(cheapFeature => cheapFeature.id === feature.id)
      );
    }

    // Convert to display format with feature names
    const displayFeatures = filteredFeatures.map(feature => feature.name);

    return {
      ...plan,
      features: displayFeatures,
      realFeatures: filteredFeatures, // Update real features to match filtered features
      highlighted: sortedIndex === 1, // Highlight the second plan after sorting
      buttonVariant: (sortedIndex === 1 ? 'primary' : 'secondary') as 'primary' | 'secondary',
    };
  });

  return sortedPlans;
}

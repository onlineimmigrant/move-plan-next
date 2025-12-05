// Feature interface for pricing modal
export interface Feature {
  id: string;
  name: string;
  content: string;
  slug: string;
  type: 'features' | 'modules' | 'support';
  order: number;
}

// Pricing plan display interface
export interface SamplePricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  monthlyRecurringCount: number;
  annualRecurringCount: number;
  actualAnnualPrice?: number; // For real data: the actual annual plan price
  annualSizeDiscount?: number; // New field for annual discount percentage
  planId?: string | number; // Plan ID for feature lookup - can be UUID string or numeric
  realFeatures?: Feature[]; // Real feature objects with full data
  productSlug?: string; // Product slug for linking to product page
  order: number; // Order field for sorting plans
  isPromotion?: boolean; // Promotion flag
  promotionPrice?: number; // Promotional price
  monthlyPromotionPrice?: number; // Monthly promotional price
  annualPromotionPrice?: number; // Annual promotional price
  currencySymbol?: string; // Currency symbol for monthly price
  annualCurrencySymbol?: string; // Currency symbol for annual price
}

// Pricing comparison interface
export interface PricingComparison {
  id: number;
  created_at: string;
  name: string;
  description: string;
  name_translation: Record<string, string>;
  description_translation: Record<string, string>;
  organization_id: number;
}

// Pricing modal props
export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricingComparison?: PricingComparison | null;
}

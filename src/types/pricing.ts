// Types for pricing plan comparison system

export interface PricingComparison {
  id: number;
  created_at: string;
  name: string;
  description: string;
  name_translation: Record<string, string>;
  description_translation: Record<string, string>;
  organization_id: number;
}

export interface PricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
}

export interface PricingTranslations {
  monthly: string;
  annual: string;
  compareAllFeatures: string;
  seeEverythingIncluded: string;
  features: string;
  mostPopular: string;
  currentLocale: string;
  hasTranslations: boolean;
}

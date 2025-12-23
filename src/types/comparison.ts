// Comparison feature types
export type CompetitorFeatureStatus = 'available' | 'partial' | 'unavailable' | 'unknown' | 'amount';
export type CompetitorFeatureAmountUnit = 'users' | 'GB' | 'MB' | 'TB' | 'currency' | 'projects' | 'items' | 'seats' | 'api_calls' | 'integrations' | 'custom';
export type ComparisonMode = 'pricing' | 'features' | 'both';
export type CompetitorDataSource = 'manual' | 'import' | 'api';

export type OurPricingPlanType = 'recurring' | 'one_time';

export interface OurPricingPlan {
  id: string;
  type: OurPricingPlanType;
  product_name: string;
  package?: string | null;
  price?: number; // cents
  annual_size_discount?: number; // percent
}

export interface OurFeature {
  id: string;
  plan_id: string;
  name: string;
  type?: string;
  order?: number;
  description?: string;
  content?: string;
  display_on_product_card?: boolean;
}

export interface CompetitorPlan {
  our_plan_id: string; // References pricingplan.id
  monthly?: number;
  yearly?: number;
  note?: string;
}

export interface CompetitorFeature {
  our_feature_id: string; // References feature.id
  our_plan_id: string; // References pricingplan.id - which plan this feature belongs to
  status: CompetitorFeatureStatus;
  amount?: string; // Optional amount/quantity (e.g., "10", "100")
  unit?: CompetitorFeatureAmountUnit; // Unit type for amount (users, GB, etc.)
  note?: string;
  competitor_label?: string; // Their marketing name for it (optional)
}

export interface CompetitorData {
  plans: CompetitorPlan[]; // Pricing plans
  features: CompetitorFeature[]; // Features with plan_id reference for flexible updates
}

export interface ComparisonCompetitor {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  data: CompetitorData;
  pricing_last_checked?: string;
  features_last_checked?: string;
  data_source: CompetitorDataSource;
  notes?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ComparisonSectionConfig {
  competitor_ids: string[];
  mode: ComparisonMode;
  selected_plan_id?: string; // Single plan selection
  pricing?: {
    show_interval: 'monthly' | 'yearly' | 'both';
  };
  features?: {
    filter?: {
      display_on_product?: boolean;
      types?: string[];
    };
    our_feature_ids?: string[]; // If specified, only show these
  };
  ui?: {
    highlight_ours?: boolean;
    show_disclaimer?: boolean;
    disclaimer_text?: string;
  };
  scoring?: {
    enabled?: boolean;
    weights?: {
      featureCoverage?: number;
      priceCompetitiveness?: number;
      valueRatio?: number;
      transparency?: number;
    };
    show_breakdown?: boolean; // Show detailed score breakdown
  };
}

// For rendering
export interface ComparisonViewModel {
  competitors: ComparisonCompetitor[];
  ourPricingPlans: OurPricingPlan[]; // Single selected plan for the view
  availablePricingPlans?: OurPricingPlan[]; // Optional: list of plans that can be switched to
  availableCompetitors?: ComparisonCompetitor[]; // Optional: competitors that can be added in the UI
  ourFeatures: OurFeature[];
  config: ComparisonSectionConfig;
  currency?: string;
  siteName?: string;
}

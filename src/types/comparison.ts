// Comparison feature types
export type CompetitorFeatureStatus = 'available' | 'partial' | 'unavailable' | 'unknown';
export type ComparisonMode = 'pricing' | 'features' | 'both';
export type CompetitorDataSource = 'manual' | 'import' | 'api';

export interface CompetitorPlan {
  our_plan_id: string; // References pricingplan.id
  monthly?: number;
  yearly?: number;
  note?: string;
}

export interface CompetitorFeature {
  our_feature_id: string; // References feature.id
  status: CompetitorFeatureStatus;
  note?: string;
  competitor_label?: string; // Their marketing name for it (optional)
}

export interface CompetitorData {
  plans: CompetitorPlan[];
  features: CompetitorFeature[];
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
}

// For rendering
export interface ComparisonViewModel {
  competitors: ComparisonCompetitor[];
  ourPricingPlans: any[]; // From your existing pricingplan table
  ourFeatures: any[]; // From your existing feature table
  config: ComparisonSectionConfig;
  currency?: string;
  siteName?: string;
}

/**
 * Comparison Scoring System
 * 
 * Calculates objective scores for products based on features, pricing, and value.
 * Designed to be transparent and configurable.
 */

export interface ScoreWeights {
  featureCoverage: number;  // Default: 40%
  priceCompetitiveness: number;  // Default: 30%
  valueRatio: number;  // Default: 20%
  transparency: number;  // Default: 10%
}

export interface ScoreBreakdown {
  overall: number;
  featureCoverage: number;
  priceCompetitiveness: number;
  valueRatio: number;
  transparency: number;
}

export interface CompetitorScore {
  overall: number;
  breakdown: {
    featureCoverage: number;
    priceCompetitiveness: number;
    valueRatio: number;
    transparency: number;
  };
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  featureCoverage: 0.40,
  priceCompetitiveness: 0.30,
  valueRatio: 0.20,
  transparency: 0.10,
};

/**
 * Calculate feature coverage score (0-100)
 */
function calculateFeatureCoverage(
  includedCount: number,
  partialCount: number,
  paidCount: number,
  customCount: number,
  totalFeatures: number
): number {
  if (totalFeatures === 0) return 0;
  
  const score = (
    (includedCount * 10) +
    (partialCount * 5) +
    (paidCount * 3) +
    (customCount * 2)
  ) / totalFeatures;
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate price competitiveness score (0-100)
 * Lower price = higher score
 */
function calculatePriceCompetitiveness(
  theirPrice: number,
  ourPrice: number
): number {
  if (ourPrice === 0 || theirPrice === 0) return 50; // Neutral if no pricing
  
  if (theirPrice === ourPrice) return 75; // Same price = good
  
  // If they're cheaper, lower score
  if (theirPrice < ourPrice) {
    const percentMore = ((ourPrice - theirPrice) / ourPrice) * 100;
    return Math.max(0, Math.round(75 - percentMore));
  }
  
  // If they're more expensive, higher score
  const percentLess = ((theirPrice - ourPrice) / ourPrice) * 100;
  return Math.min(100, Math.round(75 + (percentLess / 2)));
}

/**
 * Calculate value score (0-100)
 * Features per dollar ratio
 */
function calculateValueRatio(
  includedFeaturesCount: number,
  totalPrice: number
): number {
  if (totalPrice === 0) return 0;
  if (includedFeaturesCount === 0) return 0;
  
  // Features per $100 spent, scaled to 0-100
  const featuresPerHundred = (includedFeaturesCount / totalPrice) * 100;
  const score = Math.min(100, featuresPerHundred * 10);
  
  return Math.round(score);
}

/**
 * Calculate transparency score (0-100)
 * Based on how much pricing information is publicly available
 */
function calculateTransparency(
  hasPricing: boolean,
  hasAllFeaturePricing: boolean,
  contactOnlyCount: number,
  totalItems: number
): number {
  if (!hasPricing) return 0;
  
  if (contactOnlyCount === 0 && hasAllFeaturePricing) return 100;
  
  const transparencyRatio = 1 - (contactOnlyCount / totalItems);
  return Math.round(transparencyRatio * 100);
}

/**
 * Main scoring function
 */
export function calculateCompetitorScore(
  data: {
    includedFeatures: number;
    partialFeatures: number;
    paidFeatures: number;
    customFeatures: number;
    totalFeatures: number;
    competitorPrice: number;
    ourPrice: number;
    pricingTransparency: number; // 0-100 score
  },
  weights: ScoreWeights = DEFAULT_WEIGHTS
): CompetitorScore {
  const featureCoverage = calculateFeatureCoverage(
    data.includedFeatures,
    data.partialFeatures,
    data.paidFeatures,
    data.customFeatures,
    data.totalFeatures
  );
  
  const priceCompetitiveness = calculatePriceCompetitiveness(
    data.competitorPrice,
    data.ourPrice
  );
  
  const valueRatio = calculateValueRatio(
    data.includedFeatures,
    data.competitorPrice
  );
  
  const transparency = data.pricingTransparency;
  
  // Weights should be in decimal form (0-1), not percentages
  const weightSum = weights.featureCoverage + weights.priceCompetitiveness + weights.valueRatio + weights.transparency;
  const normalizedWeights = {
    featureCoverage: weights.featureCoverage / weightSum,
    priceCompetitiveness: weights.priceCompetitiveness / weightSum,
    valueRatio: weights.valueRatio / weightSum,
    transparency: weights.transparency / weightSum,
  };
  
  const overall = Math.round(
    (featureCoverage * normalizedWeights.featureCoverage) +
    (priceCompetitiveness * normalizedWeights.priceCompetitiveness) +
    (valueRatio * normalizedWeights.valueRatio) +
    (transparency * normalizedWeights.transparency)
  );
  
  return {
    overall,
    breakdown: {
      featureCoverage: Math.round(featureCoverage),
      priceCompetitiveness: Math.round(priceCompetitiveness),
      valueRatio: Math.round(valueRatio),
      transparency: Math.round(transparency),
    },
  };
}

/**
 * Get score color class based on score value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-orange-600 dark:text-orange-400';
}

/**
 * Get score badge color
 */
export function getScoreBadgeColor(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: '#10b981', text: '#ffffff' }; // Green
  if (score >= 60) return { bg: '#f59e0b', text: '#ffffff' }; // Yellow/Amber
  return { bg: '#f97316', text: '#ffffff' }; // Orange
}

/**
 * Get methodology explanation
 */
export function getScoringMethodology(): {
  title: string;
  description: string;
  criteria: Array<{ name: string; weight: number; description: string }>;
} {
  return {
    title: 'How Scores Are Calculated',
    description: 'Our comparison scores are calculated using objective, transparent criteria based on publicly available information. Scores are automatically updated when features or pricing change.',
    criteria: [
      {
        name: 'Feature Coverage',
        weight: 40,
        description: 'Measures how many features are included. Fully included features score highest, partial/add-on features score lower. Based on feature status in comparison table.',
      },
      {
        name: 'Price Competitiveness',
        weight: 30,
        description: 'Compares total cost (base price + add-ons). Lower total price relative to others scores higher. Equal pricing scores neutrally.',
      },
      {
        name: 'Value Ratio',
        weight: 20,
        description: 'Calculates features per dollar spent. More included features for the price = higher score. Rewards better value propositions.',
      },
      {
        name: 'Transparency',
        weight: 10,
        description: 'Rewards public pricing. Fully transparent pricing scores 100, "Contact us" pricing reduces score. Encourages price clarity.',
      },
    ],
  };
}

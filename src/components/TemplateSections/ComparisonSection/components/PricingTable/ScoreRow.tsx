import React from 'react';
import { Info, Minus } from 'lucide-react';
import { calculateCompetitorScore, getScoreBadgeColor } from '@/lib/comparison/scoring';
import { TABLE_CELL_PADDING, OURS_COL_BORDER, COMP_COL_BORDER } from '../../constants';

export interface ScoreRowProps {
  plan: any;
  competitors: any[];
  competitorPlanIndex: Map<string, Map<string, any>>;
  filteredFeatures: any[];
  themeColors: any;
  config: any;
  isRecurring: boolean;
  showYearly: boolean;
  showScoringMethodology: boolean;
  setShowScoringMethodology: (show: boolean) => void;
  calculateAddOns: (competitorId: string) => number;
}

export const ScoreRow: React.FC<ScoreRowProps> = ({
  plan,
  competitors,
  competitorPlanIndex,
  filteredFeatures,
  themeColors,
  config,
  isRecurring,
  showYearly,
  showScoringMethodology,
  setShowScoringMethodology,
  calculateAddOns,
}) => {
  if (!config.scoring?.enabled || !(config.ui?.show_scores ?? true)) {
    return null;
  }

  return (
    <>
      {/* Overall Score Row */}
      <tr
        className="border-t-2"
        style={{
          backgroundImage: `linear-gradient(to right, ${
            `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 10%, transparent)`
          }, ${`color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 6%, transparent)`})`,
          borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 35%, transparent)`,
          ['--primary' as any]: themeColors.cssVars.primary.base,
          ['--scoreBtnBg' as any]: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 30%, transparent)`,
          ['--scoreBtnBgHover' as any]: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 45%, transparent)`,
        }}
      >
        <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm font-semibold`}>
          <div className="flex items-center justify-between">
            Overall Score
            <button
              onClick={() => setShowScoringMethodology(!showScoringMethodology)}
              className="shrink-0 mt-0.5 p-1 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none"
              title="Show scoring methodology"
              aria-label="Toggle scoring methodology"
              aria-expanded={showScoringMethodology}
            >
              {showScoringMethodology ? <Minus className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </button>
          </div>
        </td>
        <td
          className={`${TABLE_CELL_PADDING} text-center text-sm sm:text-base font-bold ${OURS_COL_BORDER}`}
          style={{
            backgroundColor: config.ui?.highlight_ours
              ? `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 18%, transparent)`
              : 'transparent',
          }}
        >
          <span
            className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold"
            style={{
              backgroundColor: getScoreBadgeColor(100).bg,
              color: getScoreBadgeColor(100).text,
            }}
          >
            100/100
          </span>
        </td>
        {competitors.map((competitor) => {
          const competitorPlan = competitorPlanIndex
            .get(competitor.id)
            ?.get(plan.id);
          
          // Get ALL features from competitor data for this plan
          const competitorFeatures = competitor.data?.features?.filter((f: any) => f.our_plan_id === plan.id) || [];
          
          // Count features by status
          const includedFeatures = competitorFeatures.filter((f: any) => f.status === 'available').length;
          const partialFeatures = competitorFeatures.filter((f: any) => f.status === 'partial').length;
          const unavailableFeatures = competitorFeatures.filter((f: any) => f.status === 'unavailable').length;
          const paidFeatures = 0; // Not used in current data model
          const customFeatures = competitorFeatures.filter((f: any) => f.status === 'amount').length;

          const planPrice = isRecurring
            ? (showYearly && competitorPlan?.yearly
              ? Number(competitorPlan.yearly)
              : Number(competitorPlan?.monthly || 0))
            : Number((competitorPlan as any)?.price || 0);
          
          const addOnCost = calculateAddOns(competitor.id);
          const totalPrice = planPrice + addOnCost;
          const ourPrice = plan.price ? (plan.price / 100) : 0;

          const scoreResult = calculateCompetitorScore({
            includedFeatures,
            partialFeatures,
            paidFeatures,
            customFeatures,
            totalFeatures: filteredFeatures.length,
            competitorPrice: totalPrice,
            ourPrice,
            pricingTransparency: competitorPlan ? 100 : 0,
          }, config.scoring?.weights ? {
            featureCoverage: config.scoring.weights.featureCoverage ?? 40,
            priceCompetitiveness: config.scoring.weights.priceCompetitiveness ?? 30,
            valueRatio: config.scoring.weights.valueRatio ?? 20,
            transparency: config.scoring.weights.transparency ?? 10,
          } : undefined);

          const badgeColor = getScoreBadgeColor(scoreResult.overall);

          return (
            <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center ${COMP_COL_BORDER}`}>
              <div className="inline-flex flex-col items-center gap-1">
                <span
                  className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold"
                  style={{
                    backgroundColor: badgeColor.bg,
                    color: badgeColor.text,
                  }}
                >
                  {scoreResult.overall}/100
                </span>
              </div>
            </td>
          );
        })}
      </tr>

      {/* Scoring Methodology Accordion */}
      {showScoringMethodology && (
        <tr
          className="border-b"
          style={{
            backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 30%, transparent)`,
          }}
        >
          <td colSpan={2 + competitors.length} className="px-2 py-2.5 sm:px-6 sm:py-4">
            <div className="text-sm text-gray-700 space-y-3">
              <h4 className="font-semibold text-gray-900">How Scores Are Calculated</h4>
              <p className="text-xs text-gray-600">
                Scores are automatically calculated using objective criteria. Each competitor is evaluated on:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-gray-900">Feature Coverage ({config.scoring?.weights?.featureCoverage || 40}%):</span>
                  <span className="text-gray-600"> Percentage of features included vs. unavailable</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Price Competitiveness ({config.scoring?.weights?.priceCompetitiveness || 30}%):</span>
                  <span className="text-gray-600"> How pricing compares to ours</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Value Ratio ({config.scoring?.weights?.valueRatio || 20}%):</span>
                  <span className="text-gray-600"> Features per dollar (value for money)</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Transparency ({config.scoring?.weights?.transparency || 10}%):</span>
                  <span className="text-gray-600"> Pricing clarity and data availability</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic pt-2">
                ⚠️ Scores are based on publicly available data and should be used as one factor among many when making decisions.
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

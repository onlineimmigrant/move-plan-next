import React from 'react';
import { PricingTableHeader } from './PricingTableHeader';
import { PricingTableRow } from './PricingTableRow';
import { ScoreRow } from './ScoreRow';
import { formatMoney } from '../../utils/formatting';
import { makeCompetitorFeatureKey } from '@/lib/comparison/indexes';
import { TABLE_CELL_PADDING, OURS_COL_BORDER, COMP_COL_BORDER } from '../../constants';

export interface PricingTableProps {
  plan: any;
  competitors: any[];
  competitorPlanIndex: Map<string, Map<string, any>>;
  competitorFeatureIndex: Map<string, Map<string, any>>;
  ourFeatures: any[];
  themeColors: any;
  config: any;
  siteName: string;
  isRecurring: boolean;
  showYearly: boolean;
  selectedPlanId: string | null;
  canSwitchPlans: boolean;
  filteredAvailablePlans: any[];
  organizationLogo?: string;
  competitorHeaders: React.ReactNode;
  setSelectedPlanId: (id: string) => void;
  setShowYearly: (show: boolean) => void;
  prefetchPlanData: (planId: string) => void;
  showScoringMethodology: boolean;
  setShowScoringMethodology: (show: boolean) => void;
  filteredFeatures: any[];
}

export const PricingTable: React.FC<PricingTableProps> = ({
  plan,
  competitors,
  competitorPlanIndex,
  competitorFeatureIndex,
  ourFeatures,
  themeColors,
  config,
  siteName,
  isRecurring,
  showYearly,
  selectedPlanId,
  canSwitchPlans,
  filteredAvailablePlans,
  organizationLogo,
  competitorHeaders,
  setSelectedPlanId,
  setShowYearly,
  prefetchPlanData,
  showScoringMethodology,
  setShowScoringMethodology,
  filteredFeatures,
}) => {
  // Calculate add-on features cost
  const calculateAddOns = (competitorId?: string) => {
    if (!competitorId) return 0;

    const competitorFeatures = competitorFeatureIndex.get(competitorId);
    
    const monthlyTotal = ourFeatures.filter(feature => {
      if (config.features?.filter?.display_on_product && !feature.display_on_product_card) {
        return false;
      }
      return true;
    }).reduce((total, feature) => {
      const competitorFeature = competitorFeatures?.get(
        makeCompetitorFeatureKey(feature.plan_id, feature.id)
      );
      
      if (competitorFeature?.status === 'amount' && competitorFeature?.unit === 'currency') {
        const amount = parseFloat(competitorFeature.amount || '0') || 0;
        return total + amount;
      }
      return total;
    }, 0);
    
    return (isRecurring && showYearly) ? monthlyTotal * 12 : monthlyTotal;
  };

  const ourPlanPrice = plan.price ? (plan.price / 100) : 0;
  const ourTotalCost = isRecurring && showYearly 
    ? ourPlanPrice * 12 * (1 - (plan.annual_size_discount || 0) / 100)
    : ourPlanPrice;

  return (
    <div className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <PricingTableHeader
            isRecurring={isRecurring}
            config={config}
            themeColors={themeColors}
            siteName={siteName}
            organizationLogo={organizationLogo}
            competitorHeaders={competitorHeaders}
          />
          <tbody>
            <PricingTableRow
              plan={plan}
              competitors={competitors}
              competitorPlanIndex={competitorPlanIndex}
              themeColors={themeColors}
              config={config}
              siteName={siteName}
              isRecurring={isRecurring}
              showYearly={showYearly}
              selectedPlanId={selectedPlanId}
              canSwitchPlans={canSwitchPlans}
              filteredAvailablePlans={filteredAvailablePlans}
              setSelectedPlanId={setSelectedPlanId}
              setShowYearly={setShowYearly}
              prefetchPlanData={prefetchPlanData}
            />
          </tbody>
          <tfoot className="border-t-2 border-gray-300">
            {/* Add-on Features Row */}
            <tr className="bg-gray-100 font-semibold">
              <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm`}>Add-on Features</td>
              <td
                className={`${TABLE_CELL_PADDING} text-center text-xs sm:text-sm tabular-nums ${OURS_COL_BORDER}`}
                style={{
                  backgroundColor: config.ui?.highlight_ours
                    ? `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 12%, transparent)`
                    : 'transparent',
                }}
              >
                {formatMoney(0)}
              </td>
              {competitors.map((competitor) => {
                const addOnCost = calculateAddOns(competitor.id);
                return (
                  <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center text-xs sm:text-sm tabular-nums ${COMP_COL_BORDER}`}>
                    {addOnCost > 0 ? formatMoney(addOnCost) : '—'}
                  </td>
                );
              })}
            </tr>

            {/* Total Cost Row */}
            <tr className="bg-gray-200 font-bold">
              <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm`}>Total Cost</td>
              <td
                className={`${TABLE_CELL_PADDING} text-center text-base sm:text-lg font-bold tabular-nums ${OURS_COL_BORDER}`}
                style={{
                  backgroundColor: config.ui?.highlight_ours
                    ? `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 18%, transparent)`
                    : 'transparent',
                  color: config.ui?.highlight_ours
                    ? themeColors.cssVars.primary.base
                    : 'inherit',
                }}
              >
                {formatMoney(ourTotalCost)}
              </td>
              {competitors.map((competitor) => {
                const competitorPlan = competitorPlanIndex
                  .get(competitor.id)
                  ?.get(plan.id);
                
                if (!competitorPlan) {
                  return (
                    <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center ${COMP_COL_BORDER}`}>
                      <span className="text-gray-400">—</span>
                    </td>
                  );
                }

                const planPrice = isRecurring 
                  ? (showYearly && competitorPlan.yearly
                    ? Number(competitorPlan.yearly)
                    : Number(competitorPlan.monthly || 0))
                  : Number((competitorPlan as any).price || 0);
                
                const addOnCost = calculateAddOns(competitor.id);
                const totalCost = planPrice + addOnCost;

                return (
                  <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center text-base sm:text-lg font-bold tabular-nums ${COMP_COL_BORDER}`}>
                    {totalCost > 0 ? formatMoney(totalCost) : '—'}
                  </td>
                );
              })}
            </tr>

            {/* Score Row */}
            <ScoreRow
              plan={plan}
              competitors={competitors}
              competitorPlanIndex={competitorPlanIndex}
              filteredFeatures={filteredFeatures}
              themeColors={themeColors}
              config={config}
              isRecurring={isRecurring}
              showYearly={showYearly}
              showScoringMethodology={showScoringMethodology}
              setShowScoringMethodology={setShowScoringMethodology}
              calculateAddOns={calculateAddOns}
            />
          </tfoot>
        </table>
      </div>
    </div>
  );
};

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { formatMoney } from '../../utils/formatting';
import { TABLE_CELL_PADDING, TABLE_FIRST_COL_WIDTH, TABLE_COL_WIDTH, OURS_COL_BORDER, COMP_COL_BORDER } from '../../constants';

/**
 * PricingTableRow component displays a row in the pricing comparison table.
 * Includes plan selection dropdown and pricing display with monthly/annual toggle.
 */
export interface PricingTableRowProps {
  plan: any;
  competitors: any[];
  competitorPlanIndex: Map<string, Map<string, any>>;
  themeColors: any;
  config: any;
  siteName: string;
  isRecurring: boolean;
  showYearly: boolean;
  selectedPlanId: string | null;
  canSwitchPlans: boolean;
  filteredAvailablePlans: any[];
  setSelectedPlanId: (id: string) => void;
  setShowYearly: (show: boolean) => void;
  prefetchPlanData: (planId: string) => void;
}

const PricingTableRowComponent: React.FC<PricingTableRowProps> = ({
  plan,
  competitors,
  competitorPlanIndex,
  themeColors,
  config,
  siteName,
  isRecurring,
  showYearly,
  selectedPlanId,
  canSwitchPlans,
  filteredAvailablePlans,
  setSelectedPlanId,
  setShowYearly,
  prefetchPlanData,
}) => {
  const monthlyPrice = plan.price ? formatMoney(plan.price / 100) : '—';
  const annualPrice = plan.price ? formatMoney((plan.price * 12 * (1 - (plan.annual_size_discount || 0) / 100)) / 100) : '—';
  const displayPrice = (isRecurring && showYearly) ? annualPrice : monthlyPrice;
  const planName = plan.package ? `${plan.product_name} - ${plan.package}` : plan.product_name;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className={`${TABLE_CELL_PADDING} ${TABLE_FIRST_COL_WIDTH} whitespace-normal`} style={{ overflowWrap: 'break-word' }}>
        {canSwitchPlans ? (
          <div className="relative">
            <select
              value={selectedPlanId ?? plan.id}
              onChange={(e) => {
                const nextPlanId = e.target.value;
                setSelectedPlanId(nextPlanId);
                setShowYearly(false);
              }}
              className="w-full appearance-none rounded-lg bg-white pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold text-gray-900 transition-all duration-200 focus-visible:outline-none cursor-pointer"
              style={{ 
                border: `2px solid color-mix(in srgb, ${themeColors.cssVars.primary.base} 25%, transparent)`,
                '--tw-ring-color': themeColors.cssVars.primary.base,
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.border = `2px solid color-mix(in srgb, ${themeColors.cssVars.primary.base} 45%, transparent)`}
              onMouseLeave={(e) => e.currentTarget.style.border = `2px solid color-mix(in srgb, ${themeColors.cssVars.primary.base} 25%, transparent)`}
              onFocus={(e) => e.currentTarget.style.border = `2px solid ${themeColors.cssVars.primary.base}`}
              onBlur={(e) => e.currentTarget.style.border = `2px solid color-mix(in srgb, ${themeColors.cssVars.primary.base} 25%, transparent)`}
              aria-label="Select plan for comparison"
            >
              {filteredAvailablePlans.map((p) => {
                const label = p.package ? `${p.product_name} - ${p.package}` : p.product_name;
                return (
                  <option 
                    key={p.id} 
                    value={p.id}
                    onMouseEnter={() => prefetchPlanData(p.id)}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
            <ChevronDown 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-transform duration-200"
              style={{ color: themeColors.cssVars.primary.base }}
            />
          </div>
        ) : (
          <div className="text-xs sm:text-sm font-medium">{planName}</div>
        )}
      </td>
      <td
        className={`${TABLE_CELL_PADDING} text-center text-sm sm:text-base font-bold ${TABLE_COL_WIDTH} tabular-nums ${OURS_COL_BORDER}`}
        style={{
          backgroundColor: config.ui?.highlight_ours
            ? `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 12%, transparent)`
            : 'transparent',
          color: config.ui?.highlight_ours
            ? themeColors.cssVars.primary.base
            : 'inherit',
        }}
      >
        <div>
          <div className="text-sm sm:text-base font-bold tabular-nums">{displayPrice}</div>
          <div className="text-xs text-gray-600 mt-1 font-normal">{planName}</div>
        </div>
      </td>
      {competitors.map((competitor) => {
        const competitorPlan = competitorPlanIndex
          .get(competitor.id)
          ?.get(plan.id);
        return (
          <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center ${TABLE_COL_WIDTH} ${COMP_COL_BORDER}`}>
            {competitorPlan ? (
              <div>
                <div className="text-sm sm:text-base font-semibold tabular-nums">
                  {(() => {
                    const price = isRecurring 
                      ? (showYearly && competitorPlan.yearly
                        ? competitorPlan.yearly
                        : competitorPlan.monthly || '—')
                      : ((competitorPlan as any).price || '—');
                    const numeric = Number(price);
                    if (price === '—' || Number.isNaN(numeric)) return price;
                    return formatMoney(numeric);
                  })()}
                </div>
                {competitorPlan.note && (
                  <div className="text-xs text-gray-500 mt-1">
                    {competitorPlan.note}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
};

export const PricingTableRow = React.memo(PricingTableRowComponent);

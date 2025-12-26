import { useMemo } from 'react';
import { makeCompetitorFeatureKey } from '@/lib/comparison/indexes';

/**
 * Custom hook to calculate chart data for price and feature coverage visualizations.
 */

export const useChartData = (
  viewModel: any,
  showYearly: boolean,
  themeColors: any,
  competitorPlanIndex: Map<string, Map<string, any>>,
  competitorFeatureIndex: Map<string, Map<string, any>>
) => {
  const priceChartData = useMemo(() => {
    if (!viewModel?.ourPricingPlans || viewModel.ourPricingPlans.length === 0) return [];
    if (!viewModel?.config || (viewModel.config.mode !== 'pricing' && viewModel.config.mode !== 'both')) return [];

    const plan = viewModel.ourPricingPlans[0];
    const isRecurring = plan.type === 'recurring';
    const siteName = viewModel.siteName || 'You';

    const calculateAddOns = (competitorId?: string) => {
      if (!competitorId) return 0;
      const competitorFeatures = competitorFeatureIndex.get(competitorId);
      const monthlyTotal = (viewModel.ourFeatures || []).reduce((total: number, feature: any) => {
        const competitorFeature = competitorFeatures?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
        if (competitorFeature?.status === 'amount' && competitorFeature?.unit === 'currency') {
          const amount = parseFloat(competitorFeature.amount || '0') || 0;
          return total + amount;
        }
        return total;
      }, 0);
      return (isRecurring && showYearly) ? monthlyTotal * 12 : monthlyTotal;
    };

    const ourPlanPrice = plan.price ? (plan.price / 100) : 0;
    const ourPrice = isRecurring && showYearly
      ? ourPlanPrice * 12 * (1 - (plan.annual_size_discount || 0) / 100)
      : ourPlanPrice;

    const data: any[] = [{
      name: siteName,
      planPrice: ourPrice,
      addOnCost: 0,
      price: ourPrice,
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel.competitors) {
      viewModel.competitors.forEach((competitor: any) => {
        const compPlan = competitorPlanIndex.get(competitor.id)?.get(plan.id);
        if (compPlan) {
          let compPrice = isRecurring
            ? (showYearly && compPlan.yearly ? Number(compPlan.yearly) : Number(compPlan.monthly || 0))
            : Number((compPlan as any).price || 0);
          
          if (compPrice && !isNaN(compPrice) && compPrice > 0) {
            const addOns = calculateAddOns(competitor.id);
            data.push({
              name: competitor.name,
              planPrice: compPrice,
              addOnCost: addOns,
              price: compPrice + addOns,
              color: '#6b7280',
            });
          }
        }
      });
    }
    return data;
  }, [viewModel, showYearly, themeColors, competitorPlanIndex, competitorFeatureIndex]);

  const featureCoverageData = useMemo(() => {
    if (!viewModel?.ourFeatures || viewModel.ourFeatures.length === 0) return [];
    if (!viewModel?.config || (viewModel.config.mode !== 'features' && viewModel.config.mode !== 'both')) return [];

    const totalFeatures = viewModel.ourFeatures.length;
    const siteName = viewModel.siteName || 'You';

    const data: any[] = [{
      name: siteName,
      coverage: 100,
      availableCount: totalFeatures,
      partialCount: 0,
      paidCount: 0,
      customCount: 0,
      totalCount: totalFeatures,
      color: themeColors.cssVars.primary.base,
    }];

    if (viewModel.competitors) {
      viewModel.competitors.forEach((competitor: any) => {
        const competitorFeatures = competitorFeatureIndex.get(competitor.id);
        const statusCounts = { available: 0, partial: 0, paid: 0, custom: 0 };

        viewModel.ourFeatures.forEach((feature: any) => {
          const compFeature = competitorFeatures?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
          if (compFeature?.status === 'available') statusCounts.available++;
          else if (compFeature?.status === 'partial') statusCounts.partial++;
          else if (compFeature?.status === 'amount' && compFeature?.unit === 'currency') statusCounts.paid++;
          else if (compFeature?.status === 'amount' && compFeature?.unit === 'custom') statusCounts.custom++;
        });

        const coverage = totalFeatures > 0 ? Math.round((statusCounts.available / totalFeatures) * 100) : 0;
        data.push({
          name: competitor.name,
          coverage,
          availableCount: statusCounts.available,
          partialCount: statusCounts.partial,
          paidCount: statusCounts.paid,
          customCount: statusCounts.custom,
          totalCount: totalFeatures,
          color: '#6b7280',
        });
      });
    }
    return data;
  }, [viewModel, themeColors, competitorFeatureIndex]);

  return {
    priceChartData,
    featureCoverageData,
  };
};

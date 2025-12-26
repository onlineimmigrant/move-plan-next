import { useMemo } from 'react';
import { buildCompetitorFeatureIndex, buildCompetitorPlanIndex } from '@/lib/comparison/indexes';
import { ComparisonViewModel } from '@/types/comparison';

export const useCompetitorIndexes = (viewModel: ComparisonViewModel | null) => {
  const competitorFeatureIndex = useMemo(() => {
    if (!viewModel?.competitors) {
      return new Map();
    }
    return buildCompetitorFeatureIndex(viewModel.competitors);
  }, [viewModel?.competitors]);

  const competitorPlanIndex = useMemo(() => {
    if (!viewModel?.competitors) {
      return new Map();
    }
    return buildCompetitorPlanIndex(viewModel.competitors);
  }, [viewModel?.competitors]);

  return { competitorFeatureIndex, competitorPlanIndex };
};

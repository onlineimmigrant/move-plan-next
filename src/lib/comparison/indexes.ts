import {
  ComparisonCompetitor,
  CompetitorFeature,
  CompetitorPlan,
} from '@/types/comparison';

export type CompetitorFeatureIndex = Map<string, Map<string, CompetitorFeature>>;
export type CompetitorPlanIndex = Map<string, Map<string, CompetitorPlan>>;

export const makeCompetitorFeatureKey = (ourPlanId: string, ourFeatureId: string) =>
  `${ourPlanId}:${ourFeatureId}`;

export function buildCompetitorFeatureIndex(
  competitors: ComparisonCompetitor[]
): CompetitorFeatureIndex {
  const index: CompetitorFeatureIndex = new Map();

  for (const competitor of competitors) {
    const byKey = new Map<string, CompetitorFeature>();
    for (const feature of competitor.data?.features ?? []) {
      byKey.set(makeCompetitorFeatureKey(feature.our_plan_id, feature.our_feature_id), feature);
    }
    index.set(competitor.id, byKey);
  }

  return index;
}

export function buildCompetitorPlanIndex(
  competitors: ComparisonCompetitor[]
): CompetitorPlanIndex {
  const index: CompetitorPlanIndex = new Map();

  for (const competitor of competitors) {
    const byOurPlanId = new Map<string, CompetitorPlan>();
    for (const plan of competitor.data?.plans ?? []) {
      byOurPlanId.set(plan.our_plan_id, plan);
    }
    index.set(competitor.id, byOurPlanId);
  }

  return index;
}

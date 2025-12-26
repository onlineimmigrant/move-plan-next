import { comparisonAnalytics } from '@/lib/comparisonAnalytics';

export const trackFeatureSearch = (sectionId: string, query: string, resultsCount: number) => {
  comparisonAnalytics.trackFeatureSearch({
    sectionId,
    query,
    resultsCount,
  });
};

// TODO: Implement trackCompetitorAdd and trackCompetitorRemove in @/lib/comparisonAnalytics
export const trackCompetitorAdd = (sectionId: string, competitorId: string, competitorName: string) => {
  comparisonAnalytics.trackCompetitorAdd({
    sectionId,
    competitorId,
    competitorName,
  });
};

export const trackCompetitorRemove = (sectionId: string, competitorId: string, competitorName: string) => {
  comparisonAnalytics.trackCompetitorRemove({
    sectionId,
    competitorId,
    competitorName,
  });
};


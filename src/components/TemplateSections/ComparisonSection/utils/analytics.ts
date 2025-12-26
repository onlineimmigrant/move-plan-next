import { comparisonAnalytics } from '@/lib/comparisonAnalytics';

export const trackFeatureSearch = (sectionId: string, query: string, resultsCount: number) => {
  comparisonAnalytics.trackFeatureSearch({
    sectionId,
    query,
    resultsCount,
  });
};

// TODO: Implement trackCompetitorAdd and trackCompetitorRemove in @/lib/comparisonAnalytics
// export const trackCompetitorAdd = (sectionId: string, competitorId: string) => {
//   comparisonAnalytics.trackCompetitorAdd({
//     sectionId,
//     competitorId,
//   });
// };

// export const trackCompetitorRemove = (sectionId: string, competitorId: string) => {
//   comparisonAnalytics.trackCompetitorRemove({
//     sectionId,
//     competitorId,
//   });
// };


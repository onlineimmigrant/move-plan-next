import { useMemo } from 'react';
import { groupFeaturesByHierarchy } from '@/utils/moduleHelper';
import { makeCompetitorFeatureKey } from '@/lib/comparison/indexes';
import { SortedHub, AggregatedStatus } from '../types';
import { orderValue, minOrderOfFeatures, getModuleSortKey, getHubSortKey } from '../utils/sorting';

export const useComparisonHierarchy = (
  filteredFeatures: any[],
  competitors: any[] | undefined,
  competitorFeatureIndex: Map<string, Map<string, any>>
) => {
  // Memoized sorted hierarchy with all sorting logic pre-calculated
  const sortedHierarchy = useMemo<SortedHub[]>(() => {
    const hierarchyMap = groupFeaturesByHierarchy(filteredFeatures);
    
    // Sort and structure everything once
    return Array.from(hierarchyMap.entries())
      .sort(([hubNameA, hubDataA], [hubNameB, hubDataB]) => {
        const a = getHubSortKey(hubDataA);
        const b = getHubSortKey(hubDataB);
        if (a !== b) return a - b;
        return String(hubNameA).localeCompare(String(hubNameB));
      })
      .map(([hubName, hubData]) => {
        // Sort modules within each hub
        const sortedModules = Array.from(hubData.modules.entries())
          .sort(([moduleNameA, moduleDataA], [moduleNameB, moduleDataB]) => {
            const a = getModuleSortKey(moduleDataA);
            const b = getModuleSortKey(moduleDataB);
            if (a !== b) return a - b;
            return String(moduleNameA).localeCompare(String(moduleNameB));
          })
          .map(([moduleName, moduleData]) => ({
            moduleName,
            moduleData,
            // Sort features within each module
            sortedFeatures: [...(moduleData.features ?? [])].sort((a, b) => {
              const ao = orderValue(a.order);
              const bo = orderValue(b.order);
              if (ao !== bo) return ao - bo;
              return String(a.name).localeCompare(String(b.name));
            })
          }));
        
        return {
          hubName,
          hubData,
          sortedModules
        };
      });
  }, [filteredFeatures]);

  // Extract sorted hub names
  const sortedHubNames = useMemo(() => {
    return sortedHierarchy.map(({ hubName }) => hubName);
  }, [sortedHierarchy]);

  // Memoized aggregated status cache
  const aggregatedStatusCache = useMemo(() => {
    if (!competitors || !sortedHierarchy) return new Map<string, AggregatedStatus>();
    
    const cache = new Map<string, AggregatedStatus>();
    
    sortedHierarchy.forEach(({ hubName, sortedModules }) => {
      sortedModules.forEach(({ moduleName, moduleData, sortedFeatures }) => {
        const moduleFeature = moduleData.moduleFeature;
        const hasLevel3Features = sortedFeatures.length > 0;
        
        competitors.forEach(competitor => {
          const cacheKey = `${hubName}|${moduleName}|${competitor.id}`;
          
          if (!hasLevel3Features) {
            // No Level 3 features - use module's own status
            if (!moduleFeature) {
              cache.set(cacheKey, 'unavailable');
              return;
            }
            const competitorModuleFeature = competitorFeatureIndex
              .get(competitor.id)
              ?.get(makeCompetitorFeatureKey(moduleFeature.plan_id, moduleFeature.id));
            const status = competitorModuleFeature?.status || 'unknown';
            if (status === 'available') {
              cache.set(cacheKey, 'available');
            } else if (status === 'partial') {
              cache.set(cacheKey, 'partial');
            } else {
              cache.set(cacheKey, 'unavailable');
            }
            return;
          }
          
          // Has Level 3 features - aggregate their statuses
          let availableCount = 0;
          let partialCount = 0;
          const totalCount = sortedFeatures.length;
          
          sortedFeatures.forEach(feature => {
            const competitorFeature = competitorFeatureIndex
              .get(competitor.id)
              ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
            const status = competitorFeature?.status || 'unknown';
            
            if (status === 'available') {
              availableCount++;
            } else if (status === 'partial') {
              partialCount++;
            }
          });
          
          // All available = full dot
          if (availableCount === totalCount) {
            cache.set(cacheKey, 'available');
          }
          // Any partial OR mix of available/partial = half-filled
          else if (partialCount > 0 || availableCount > 0) {
            cache.set(cacheKey, 'partial');
          }
          // None available = gray
          else {
            cache.set(cacheKey, 'unavailable');
          }
        });
      });
    });
    
    return cache;
  }, [sortedHierarchy, competitors, competitorFeatureIndex]);

  return {
    sortedHierarchy,
    sortedHubNames,
    aggregatedStatusCache,
  };
};

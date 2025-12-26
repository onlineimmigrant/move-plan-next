import { useEffect } from 'react';
import { ComparisonViewModel } from '@/types/comparison';
import { SortedHub } from '../types';

interface UseInitializationProps {
  viewModel: ComparisonViewModel | null;
  selectedPlanId: string | null;
  setSelectedPlanId: (planId: string | null) => void;
  selectedCompetitorIds: string[] | null;
  setSelectedCompetitorIds: (ids: string[] | null) => void;
  sortedHubNames: string[];
  sortedHierarchy: SortedHub[];
  setExpandedHubs: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedModules: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * useInitialization handles all initialization logic for the comparison section.
 * Manages expansion states and initial selections for plans and competitors.
 * 
 * This hook consolidates:
 * - Hub expansion initialization (always keep at least one hub open)
 * - Module expansion initialization (all modules expanded by default)
 * - Selected plan initialization
 * - Selected competitor initialization
 */
export const useInitialization = ({
  viewModel,
  selectedPlanId,
  setSelectedPlanId,
  selectedCompetitorIds,
  setSelectedCompetitorIds,
  sortedHubNames,
  sortedHierarchy,
  setExpandedHubs,
  setExpandedModules,
}: UseInitializationProps) => {
  /**
   * Initialize hub expansion - always keep one open
   */
  useEffect(() => {
    setExpandedHubs((prev) => {
      if (sortedHubNames.length === 0) {
        return prev.size === 0 ? prev : new Set();
      }

      const next = new Set<string>();
      for (const hubName of prev) {
        if (sortedHubNames.includes(hubName)) next.add(hubName);
      }
      if (next.size === 0) next.add(sortedHubNames[0]);

      if (next.size === prev.size) {
        let identical = true;
        for (const hubName of prev) {
          if (!next.has(hubName)) {
            identical = false;
            break;
          }
        }
        if (identical) return prev;
      }

      return next;
    });
  }, [sortedHubNames, setExpandedHubs]);

  /**
   * Initialize module expansion - all modules expanded by default
   */
  useEffect(() => {
    if (!viewModel?.ourFeatures) return;
    
    const allModuleKeys = new Set<string>();
    sortedHierarchy.forEach(({ hubName, sortedModules }) => {
      sortedModules.forEach(({ moduleName }) => {
        allModuleKeys.add(`${hubName}|${moduleName}`);
      });
    });
    
    setExpandedModules(allModuleKeys);
  }, [viewModel?.ourFeatures, sortedHierarchy, setExpandedModules]);

  /**
   * Initialize selected plan and competitors
   */
  useEffect(() => {
    if (!selectedPlanId && viewModel?.ourPricingPlans?.[0]) {
      const initialPlanId = viewModel.ourPricingPlans[0].id || viewModel.config?.selected_plan_id || null;
      if (initialPlanId) {
        setSelectedPlanId(initialPlanId);
      }
    }
    
    if (!selectedCompetitorIds && viewModel) {
      const initialCompetitorIds = Array.isArray(viewModel.config?.competitor_ids) 
        ? viewModel.config.competitor_ids 
        : [];
      if (initialCompetitorIds.length > 0) {
        setSelectedCompetitorIds(initialCompetitorIds);
      } else {
        // fallback to whatever was returned
        const returnedIds = (viewModel.competitors ?? []).map(c => c.id).filter(Boolean);
        setSelectedCompetitorIds(returnedIds.length > 0 ? returnedIds : []);
      }
    }
  }, [
    viewModel?.ourPricingPlans, 
    viewModel?.competitors, 
    viewModel?.config, 
    selectedPlanId, 
    selectedCompetitorIds,
    setSelectedPlanId,
    setSelectedCompetitorIds,
  ]);
};

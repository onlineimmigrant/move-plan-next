import { useCallback, useMemo } from 'react';
import { ComparisonCompetitor } from '@/types/comparison';

interface UseCompetitorManagementProps {
  selectedCompetitorIds: string[] | null;
  setSelectedCompetitorIds: (ids: string[] | ((prev: string[] | null) => string[])) => void;
  setShowAddCompetitorMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  viewModelCompetitors: ComparisonCompetitor[] | undefined;
  availableCompetitors: ComparisonCompetitor[] | undefined;
}

interface UseCompetitorManagementResult {
  handleRemoveCompetitor: (competitorId: string) => void;
  handleAddCompetitor: (competitorId: string) => void;
  remainingCompetitors: ComparisonCompetitor[];
  canRemoveCompetitors: boolean;
}

/**
 * useCompetitorManagement manages competitor addition and removal logic.
 * Provides handlers and computed state for competitor management UI.
 * 
 * @param selectedCompetitorIds - Currently selected competitor IDs
 * @param setSelectedCompetitorIds - State setter for competitor IDs
 * @param setShowAddCompetitorMenu - State setter for add competitor menu visibility
 * @param viewModelCompetitors - Current competitors from view model
 * @param availableCompetitors - All available competitors
 * @returns Handlers and computed state for competitor management
 */
export const useCompetitorManagement = ({
  selectedCompetitorIds,
  setSelectedCompetitorIds,
  setShowAddCompetitorMenu,
  viewModelCompetitors,
  availableCompetitors,
}: UseCompetitorManagementProps): UseCompetitorManagementResult => {
  /**
   * Handle competitor removal from comparison
   */
  const handleRemoveCompetitor = useCallback((competitorId: string) => {
    setShowAddCompetitorMenu(false);
    setSelectedCompetitorIds((prev) => {
      const current = (prev && prev.length > 0)
        ? prev
        : (viewModelCompetitors ?? []).map((c) => c.id);
      return current.filter((id) => id !== competitorId);
    });
    // comparisonAnalytics.trackCompetitorRemove - not yet implemented
  }, [viewModelCompetitors, setSelectedCompetitorIds, setShowAddCompetitorMenu]);

  /**
   * Handle competitor addition to comparison
   */
  const handleAddCompetitor = useCallback((competitorId: string) => {
    const current = selectedCompetitorIds ?? (viewModelCompetitors ?? []).map((c) => c.id);
    setSelectedCompetitorIds(Array.from(new Set([...current, competitorId])));
    // comparisonAnalytics.trackCompetitorAdd - not yet implemented
  }, [selectedCompetitorIds, viewModelCompetitors, setSelectedCompetitorIds]);

  /**
   * Calculate remaining competitors that can be added
   */
  const remainingCompetitors = useMemo(() => {
    return (availableCompetitors || []).filter(
      c => !selectedCompetitorIds?.includes(c.id)
    );
  }, [availableCompetitors, selectedCompetitorIds]);

  /**
   * Determine if competitors can be removed (need at least 1 competitor)
   */
  const canRemoveCompetitors = useMemo(() => {
    const totalAvailable = availableCompetitors?.length ?? viewModelCompetitors?.length ?? 0;
    const currentCount = viewModelCompetitors?.length ?? 0;
    return totalAvailable > 1 && currentCount > 0;
  }, [availableCompetitors, viewModelCompetitors]);

  return {
    handleRemoveCompetitor,
    handleAddCompetitor,
    remainingCompetitors,
    canRemoveCompetitors,
  };
};

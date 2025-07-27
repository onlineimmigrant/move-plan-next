'use client';

import React from 'react';
import MinersHeader from './MinersHeader';
import StatusMessages from './StatusMessages';
import ControlsPanel from './ControlsPanel';
import SummaryStats from './SummaryStats';
import MinersList from './MinersList';
import EmptyState from './EmptyState';
import CurrencySwitcher from './CurrencySwitcher';
import CurrencyInfo from './CurrencyInfo';
import MiningCostManager from './MiningCostManager';
import CostAnalyticsDashboard from './CostAnalyticsDashboard';
import { useMiningCosts } from '../../hooks/useMiningCosts';
import { 
  MinerData, 
  FilterState, 
  SortState, 
  GroupByKey 
} from './types';
import { 
  filterMiners, 
  groupMiners, 
  sortMiners, 
  getModelFromSerial,
  getMinerStatus 
} from './utils';

interface MinersDashboardProps {
  isAuthorized: boolean;
  miners: MinerData[];
  isCreatingSample: boolean;
  sampleMessage: string;
  debugInfo: string;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  groupBy: GroupByKey;
  onGroupByChange: (groupBy: GroupByKey) => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  copiedId: string | null;
  onCopyToClipboard: (text: string, id: string) => void;
  onCreateSample: () => void;
}

export default function MinersDashboard({
  isAuthorized,
  miners,
  isCreatingSample,
  sampleMessage,
  debugInfo,
  filters,
  onFiltersChange,
  groupBy,
  onGroupByChange,
  sort,
  onSortChange,
  showFilters,
  onToggleFilters,
  copiedId,
  onCopyToClipboard,
  onCreateSample
}: MinersDashboardProps) {
  // Get mining cost data
  const { miningCost } = useMiningCosts();

  // Process data with filtering, grouping, and sorting
  const filteredMiners = filterMiners(miners, filters);
  const sortedMiners = sortMiners(filteredMiners, sort);
  const groupedMiners = groupMiners(sortedMiners, groupBy);
  
  // Get unique values for filter options
  const uniqueStatuses = [...new Set(miners.map(m => getMinerStatus(m)))] as string[];
  const uniqueUsers = [...new Set(miners.map(m => m.profiles?.full_name || m.profiles?.email).filter(Boolean))] as string[];
  const uniqueModels = [...new Set(miners.map(m => getModelFromSerial(m.serial_number)))];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Ultra-Modern Header with Glass Morphism */}
          <div className="w-full mb-6">
            <MinersHeader 
              isAuthorized={isAuthorized}
              sortedMinersLength={sortedMiners.length}
              isCreatingSample={isCreatingSample}
              onCreateSample={onCreateSample}
              groupBy={groupBy}
              onGroupByChange={onGroupByChange}
              sort={sort}
              onSortChange={onSortChange}
            />
          </div>

          {/* Status Messages */}
          <StatusMessages 
            sampleMessage={sampleMessage}
            debugInfo={debugInfo}
          />

          {/* Currency Information */}
          <CurrencyInfo className="mb-4" />

          {/* Mining Cost Management */}
          <div className="mb-6">
            <MiningCostManager />
          </div>

          {/* Revolutionary Controls Panel with Glass Morphism */}
          <ControlsPanel 
            filters={filters}
            onFiltersChange={onFiltersChange}
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
            uniqueStatuses={uniqueStatuses}
            uniqueUsers={uniqueUsers}
            uniqueModels={uniqueModels}
          />

          {/* Content Display */}
          {sortedMiners.length === 0 ? (
            <EmptyState 
              filters={filters}
              isCreatingSample={isCreatingSample}
              onCreateSample={onCreateSample}
            />
          ) : (
            <>
              {/* Summary Stats */}
              <SummaryStats sortedMiners={sortedMiners} />

              {/* Cost Analytics Dashboard */}
              <CostAnalyticsDashboard 
                miners={sortedMiners}
                miningCost={miningCost}
                className="mb-6"
              />

              {/* Miners List */}
              <MinersList 
                groupedMiners={groupedMiners}
                groupBy={groupBy}
                copiedId={copiedId}
                onCopyToClipboard={onCopyToClipboard}
                miningCost={miningCost}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

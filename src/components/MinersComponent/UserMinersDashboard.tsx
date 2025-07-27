'use client';

import React, { useState } from 'react';
import UserMinersHeader from './UserMinersHeader';
import StatusMessages from './StatusMessages';
import ControlsPanel from './ControlsPanel';
import SummaryStats from './SummaryStats';
import MinersList from './MinersList';
import EmptyState from './EmptyState';
import CurrencyInfo from './CurrencyInfo';
import MiningCostManager from './MiningCostManager';
import CostAnalyticsDashboard from './CostAnalyticsDashboard';
import { useUserMinersDashboard } from '../../hooks/useUserMinersDashboard';
import { useMiningCosts } from '../../hooks/useMiningCosts';
import { filterMiners, groupMiners, sortMiners, getModelFromSerial, getMinerStatus } from './utils';

export default function UserMinersDashboard() {
  const {
    // Data
    sortedMiners: rawMiners,
    isLoading,
    error,
    
    // Filters
    filters,
    onFiltersChange,
    showFilters,
    onToggleFilters,
    
    // Grouping & Sorting
    groupBy,
    onGroupByChange,
    sort,
    onSortChange,
    
    // Derived data
    uniqueStatuses,
    uniqueUsers,
    uniqueModels,
  } = useUserMinersDashboard();

  // Get mining cost data
  const { miningCost } = useMiningCosts();

  // Apply filtering, grouping, and sorting using the same logic as admin
  const filteredMiners = filterMiners(rawMiners, filters);
  const groupedMiners = groupMiners(filteredMiners, groupBy);
  const sortedMiners = sortMiners(filteredMiners, sort);

  // UI State for copy functionality (users don't need this, but keeping for compatibility)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mt-8  min-h-screen overflow-hidden">
      {/* Ultra-Modern Background with Advanced Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_80%,rgba(76,29,149,0.15),rgba(255,255,255,0))]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>

      <div className="mx-auto max-w-7xl relative z-10">
        <div className=" px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Ultra-Modern Header with Glass Morphism */}
          <div className="w-full mb-6">
            <UserMinersHeader 
              sortedMinersLength={sortedMiners.length}
              groupBy={groupBy}
              onGroupByChange={onGroupByChange}
              sort={sort}
              onSortChange={onSortChange}
            />
          </div>

          {/* Status Messages */}
          <StatusMessages />

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
          {sortedMiners.length === 0 && !isLoading ? (
            <EmptyState 
              filters={filters}
              isCreatingSample={false}
              onCreateSample={() => {}} // Users can't create sample miners
            />
          ) : (
            <>
              {/* Advanced Stats Dashboard */}
              <SummaryStats 
                sortedMiners={sortedMiners}
              />

              {/* Cost Analytics Dashboard */}
              <CostAnalyticsDashboard 
                miners={sortedMiners}
                miningCost={miningCost}
                className="mb-6"
              />
              
              {/* Miners Grid/List Display */}
              <MinersList 
                groupedMiners={groupedMiners}
                groupBy={groupBy}
                copiedId={copiedId}
                onCopyToClipboard={handleCopyToClipboard}
                miningCost={miningCost}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

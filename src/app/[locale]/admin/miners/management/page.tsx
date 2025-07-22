'use client';

import React from 'react';
import Button from '@/ui/Button';
import { MinersDashboard, useMinersManagement } from '@/components/MinersComponent';

export default function AdminMinersPage({ params }: { params: { locale: string } }) {
  const {
    // Data
    miners,
    isLoading,
    error,
    
    // Authorization
    isAuthorized,
    authError,
    
    // Sample creation
    isCreatingSample,
    sampleMessage,
    debugInfo,
    
    // Filtering and grouping
    filters,
    setFilters,
    groupBy,
    setGroupBy,
    sort,
    setSort,
    showFilters,
    
    // UI state
    copiedId,
    
    // Handlers
    handleCreateSample,
    copyToClipboard,
    toggleFilters,
    refetch
  } = useMinersManagement();

  // Show loading state for authorization
  if (isAuthorized === null) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthorized) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.216 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500 mb-4">{authError}</p>
          <a 
            href="/login" 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl mb-4">Miners Dashboard (Admin)</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading miners data...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a moment while we fetch real-time data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl mb-4">Miners Dashboard (Admin)</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading miners: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button
            onClick={() => refetch()}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Revolutionary Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/5 to-indigo-400/10"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-indigo-500/20 rounded-full blur-3xl"></div>
      
      <MinersDashboard 
        isAuthorized={isAuthorized}
        miners={miners}
        isCreatingSample={isCreatingSample}
        sampleMessage={sampleMessage}
        debugInfo={debugInfo}
        filters={filters}
        onFiltersChange={setFilters}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        sort={sort}
        onSortChange={setSort}
        showFilters={showFilters}
        onToggleFilters={toggleFilters}
        copiedId={copiedId}
        onCopyToClipboard={copyToClipboard}
        onCreateSample={handleCreateSample}
      />
    </div>
  );
}
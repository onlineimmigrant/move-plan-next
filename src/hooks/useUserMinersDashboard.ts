'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FilterState, SortState, GroupByKey, MinerData } from '@/components/MinersComponent/types';

// Fetch user's miners (only their own)
async function fetchUserMiners(): Promise<MinerData[]> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No valid session found');
  }

  const response = await fetch('/api/miners', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch miners');
  }

  return response.json();
}

export function useUserMinersDashboard() {
  // Data fetching with better memoization
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-miners'],
    queryFn: fetchUserMiners,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    structuralSharing: true, // Enable structural sharing to prevent unnecessary re-renders
  });
  
  const miners = data || [];

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    user: [],
    model: [],
    profit_range: [0, 50],
    power_range: [0, 5000]
  });

  const [showFilters, setShowFilters] = useState(false);

  // Grouping and sorting
  const [groupBy, setGroupBy] = useState<GroupByKey>('none');
  const [sort, setSort] = useState<SortState>({
    key: 'serial_number',
    direction: 'asc'
  });

  // Derived data for filters
  const uniqueStatuses = ['all', 'active', 'idle', 'fault'];
  const uniqueUsers = ['all', ...[...new Set(miners.map((m: MinerData) => m.profiles?.full_name || 'Unknown'))]];
  const uniqueModels = ['all', ...[...new Set(miners.map((m: MinerData) => {
    // Extract model from serial number logic (similar to admin)
    if (m.serial_number.startsWith('S19')) return 'Antminer S19';
    if (m.serial_number.startsWith('S17')) return 'Antminer S17';
    if (m.serial_number.startsWith('M30')) return 'WhatsMiner M30';
    if (m.serial_number.startsWith('M20')) return 'WhatsMiner M20';
    return 'Unknown';
  }))]];

  // Event handlers
  const onFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const onToggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const onGroupByChange = (newGroupBy: GroupByKey) => {
    setGroupBy(newGroupBy);
  };

  const onSortChange = (newSort: SortState) => {
    setSort(newSort);
  };

  return {
    // Data
    sortedMiners: miners, // Return miners directly - filtering logic will be handled in components
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
    
    // Actions
    refetch,
  };
}

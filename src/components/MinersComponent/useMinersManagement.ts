'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { fetchMiners, createSampleMiners } from './api';
import { FilterState, SortState, GroupByKey, MinerData } from './types';

export function useMinersManagement() {
  // Query for miners data
  const { data: miners, refetch, error, isLoading } = useQuery({
    queryKey: ['miners'],
    queryFn: fetchMiners,
    refetchInterval: 30000,
  });

  // State management
  const [realTimeData, setRealTimeData] = useState<MinerData[]>([]);
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const [sampleMessage, setSampleMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filtering and grouping state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    user: [],
    model: [],
    profit_range: [0, 50],
    power_range: [0, 5000]
  });
  
  const [groupBy, setGroupBy] = useState<GroupByKey>('none');
  const [sort, setSort] = useState<SortState>({
    key: 'serial_number',
    direction: 'asc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  const queryClient = useQueryClient();

  // Authorization check
  const checkAuthorization = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setAuthError('You must be logged in to access this page');
        setIsAuthorized(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile) {
        setAuthError('Profile not found');
        setIsAuthorized(false);
        return;
      }

      if (profile.role !== 'admin') {
        setAuthError('Admin access required');
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      setAuthError('Authorization check failed');
      setIsAuthorized(false);
    }
  };

  // Effects
  useEffect(() => {
    checkAuthorization();
  }, []);

  // Handle updating miners with realtime data
  useEffect(() => {
    if (miners) {
      setRealTimeData(miners);
    }
  }, [miners]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!isAuthorized) return; // Don't setup realtime if not authorized

    const channel = supabase
      .channel('miners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'miners' }, (payload) => {
        refetch();
        if (payload.eventType === 'INSERT' && payload.new) {
          setRealTimeData((prev) => [payload.new as MinerData, ...prev]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setRealTimeData((prev) =>
            prev.map((miner) => (miner.id === payload.new?.id ? (payload.new as MinerData) : miner))
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setRealTimeData((prev) => prev.filter((miner) => miner.id !== payload.old?.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, isAuthorized]);

  // Handlers
  const handleCreateSample = async () => {
    setIsCreatingSample(true);
    setSampleMessage('');
    try {
      const result = await createSampleMiners();
      setSampleMessage(result.message);
      // Refetch miners data to show the new sample data
      queryClient.invalidateQueries({ queryKey: ['miners'] });
    } catch (error) {
      setSampleMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingSample(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Return all state and handlers
  return {
    // Data
    miners: realTimeData.length > 0 ? realTimeData : miners || [],
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
  };
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MiningCostData } from '@/components/MinersComponent/types';
import { supabase } from '@/lib/supabaseClient';

interface CreateMiningCostData {
  organization_id: string;
  electricity_rate_per_kwh: number;
  insurance_monthly?: number;
  rent_monthly?: number;
  cooling_monthly?: number;
  maintenance_monthly?: number;
  other_monthly?: number;
  total_facility_consumption_kwh?: number;
  currency?: string;
  notes?: string;
}

interface UpdateMiningCostData extends CreateMiningCostData {
  id: string;
}

export function useMiningCosts() {
  const queryClient = useQueryClient();

  // Fetch mining costs for the organization
  const { data: miningCost = null, isLoading, error } = useQuery({
    queryKey: ['mining-costs'],
    queryFn: async (): Promise<MiningCostData | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('mining_costs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found" error
      return data || null;
    },
  });

  // Create mining cost
  const createCostMutation = useMutation({
    mutationFn: async (newCost: CreateMiningCostData): Promise<MiningCostData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('mining_costs')
        .insert({
          organization_id: profile.organization_id,
          electricity_rate_per_kwh: newCost.electricity_rate_per_kwh,
          insurance_monthly: newCost.insurance_monthly || 0,
          rent_monthly: newCost.rent_monthly || 0,
          cooling_monthly: newCost.cooling_monthly || 0,
          maintenance_monthly: newCost.maintenance_monthly || 0,
          other_monthly: newCost.other_monthly || 0,
          total_facility_consumption_kwh: newCost.total_facility_consumption_kwh || 0,
          currency: newCost.currency || 'USD',
          is_active: true,
          notes: newCost.notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mining-costs'] });
      queryClient.invalidateQueries({ queryKey: ['miners'] });
    },
  });

  // Update mining cost
  const updateCostMutation = useMutation({
    mutationFn: async (updatedCost: UpdateMiningCostData): Promise<MiningCostData> => {
      const { data, error } = await supabase
        .from('mining_costs')
        .update({
          electricity_rate_per_kwh: updatedCost.electricity_rate_per_kwh,
          insurance_monthly: updatedCost.insurance_monthly,
          rent_monthly: updatedCost.rent_monthly,
          cooling_monthly: updatedCost.cooling_monthly,
          maintenance_monthly: updatedCost.maintenance_monthly,
          other_monthly: updatedCost.other_monthly,
          total_facility_consumption_kwh: updatedCost.total_facility_consumption_kwh,
          currency: updatedCost.currency,
          notes: updatedCost.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedCost.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mining-costs'] });
      queryClient.invalidateQueries({ queryKey: ['miners'] });
    },
  });

  return {
    miningCost,
    isLoading,
    error,
    createCost: createCostMutation.mutate,
    updateCost: updateCostMutation.mutate,
    isCreating: createCostMutation.isPending,
    isUpdating: updateCostMutation.isPending,
  };
}

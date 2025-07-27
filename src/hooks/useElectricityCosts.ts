import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ElectricityCostData } from '@/components/MinersComponent/types';
import { supabase } from '@/lib/supabase';

interface CreateElectricityCostData {
  name: string;
  rate_per_kwh: number;
  currency: string;
  base_cost_per_month: number;
}

interface UpdateElectricityCostData extends CreateElectricityCostData {
  id: string;
}

export function useElectricityCosts() {
  const queryClient = useQueryClient();

  // Fetch electricity costs for the organization
  const { data: electricityCosts = [], isLoading, error } = useQuery({
    queryKey: ['electricity-costs'],
    queryFn: async (): Promise<ElectricityCostData[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('electricity_costs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Get active electricity cost
  const activeElectricityCost = electricityCosts.find(cost => cost.is_active) || null;

  // Create electricity cost
  const createCostMutation = useMutation({
    mutationFn: async (newCost: CreateElectricityCostData): Promise<ElectricityCostData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // If this is being set as active, deactivate all other costs
      await supabase
        .from('electricity_costs')
        .update({ is_active: false })
        .eq('organization_id', profile.organization_id);

      const { data, error } = await supabase
        .from('electricity_costs')
        .insert([{
          ...newCost,
          organization_id: profile.organization_id,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricity-costs'] });
      queryClient.invalidateQueries({ queryKey: ['miners'] });
    },
  });

  // Update electricity cost
  const updateCostMutation = useMutation({
    mutationFn: async (updatedCost: UpdateElectricityCostData): Promise<ElectricityCostData> => {
      const { data, error } = await supabase
        .from('electricity_costs')
        .update({
          name: updatedCost.name,
          rate_per_kwh: updatedCost.rate_per_kwh,
          currency: updatedCost.currency,
          base_cost_per_month: updatedCost.base_cost_per_month,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedCost.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricity-costs'] });
      queryClient.invalidateQueries({ queryKey: ['miners'] });
    },
  });

  // Delete electricity cost
  const deleteCostMutation = useMutation({
    mutationFn: async (costId: string): Promise<void> => {
      const { error } = await supabase
        .from('electricity_costs')
        .delete()
        .eq('id', costId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricity-costs'] });
      queryClient.invalidateQueries({ queryKey: ['miners'] });
    },
  });

  // Set active electricity cost
  const setActiveCostMutation = useMutation({
    mutationFn: async (costId: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // Deactivate all costs first
      await supabase
        .from('electricity_costs')
        .update({ is_active: false })
        .eq('organization_id', profile.organization_id);

      // Activate the selected cost
      const { error } = await supabase
        .from('electricity_costs')
        .update({ is_active: true })
        .eq('id', costId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['electricity-costs'] });
      queryClient.invalidateQueries({ queryKey: ['miners'] });
    },
  });

  return {
    electricityCosts,
    activeElectricityCost,
    isLoading,
    error,
    createCost: createCostMutation.mutate,
    updateCost: updateCostMutation.mutate,
    deleteCost: deleteCostMutation.mutate,
    setActiveCost: setActiveCostMutation.mutate,
    isCreating: createCostMutation.isPending,
    isUpdating: updateCostMutation.isPending,
    isDeleting: deleteCostMutation.isPending,
    isSettingActive: setActiveCostMutation.isPending,
  };
}

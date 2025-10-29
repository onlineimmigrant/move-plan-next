/**
 * Admin System Models Hook
 * Hook for admins to view and enable/disable system-wide AI models for their organization
 * Filters models by organization type and pricing plan
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { SystemModel } from '../types/systemModels';

interface OrgSystemModelConfig {
  id: string;
  organization_id: string;
  system_model_id: string;
  is_enabled_for_users: boolean;
  token_limit_per_user: number | null;
  created_at: string;
  updated_at: string;
}

interface SystemModelWithConfig extends SystemModel {
  is_enabled: boolean;
  config_id: string | null;
}

const PLAN_HIERARCHY = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
} as const;

export function useAdminSystemModels(organizationId: string) {
  // Data State
  const [models, setModels] = useState<SystemModelWithConfig[]>([]);
  const [organizationType, setOrganizationType] = useState<string>('');
  const [organizationPlan, setOrganizationPlan] = useState<string>('free');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'starter' | 'pro' | 'enterprise'>('all');
  
  // Fetch organization details
  const fetchOrganizationDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('type, pricing_plan')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      
      setOrganizationType(data.type || '');
      setOrganizationPlan(data.pricing_plan || 'free');
    } catch (err: any) {
      console.error('Error fetching organization:', err);
      setError('Failed to load organization details');
    }
  }, [organizationId]);
  
  // Fetch system models with config status
  const fetchSystemModels = useCallback(async () => {
    if (!organizationType || !organizationPlan) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all active system models
      const { data: systemModels, error: modelsError } = await supabase
        .from('ai_models_system')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (modelsError) throw modelsError;
      
      // Fetch config for this organization
      const { data: configs, error: configsError } = await supabase
        .from('org_system_model_config')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (configsError) throw configsError;
      
      // Create a map of system_model_id -> config
      const configMap = new Map(
        configs?.map(c => [c.system_model_id, c]) || []
      );
      
      // Filter and enrich models
      const orgPlanLevel = PLAN_HIERARCHY[organizationPlan as keyof typeof PLAN_HIERARCHY] || 0;
      
      const filteredModels = (systemModels || [])
        .filter((model: SystemModel) => {
          // Filter by organization type
          const orgTypeMatch = 
            model.organization_types.length === 0 || 
            model.organization_types.includes(organizationType);
          
          if (!orgTypeMatch) return false;
          
          // Filter by plan hierarchy
          const modelPlanLevel = PLAN_HIERARCHY[model.required_plan as keyof typeof PLAN_HIERARCHY] || 0;
          const planMatch = modelPlanLevel <= orgPlanLevel;
          
          return planMatch;
        })
        .map((model: SystemModel) => {
          const config = configMap.get(model.id);
          return {
            ...model,
            is_enabled: config?.is_enabled_for_users || false,
            config_id: config?.id || null,
          };
        });
      
      setModels(filteredModels);
    } catch (err: any) {
      console.error('Error fetching system models:', err);
      setError(err.message || 'Failed to load system models');
    } finally {
      setLoading(false);
    }
  }, [organizationId, organizationType, organizationPlan]);
  
  // Initial fetch
  useEffect(() => {
    fetchOrganizationDetails();
  }, [fetchOrganizationDetails]);
  
  useEffect(() => {
    if (organizationType && organizationPlan) {
      fetchSystemModels();
    }
  }, [fetchSystemModels, organizationType, organizationPlan]);
  
  // Filter models
  const filteredModels = models.filter((model) => {
    // Search filter
    if (searchQuery && !model.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Enabled filter
    if (filterEnabled === 'enabled' && !model.is_enabled) return false;
    if (filterEnabled === 'disabled' && model.is_enabled) return false;
    
    // Plan filter
    if (filterPlan !== 'all' && model.required_plan !== filterPlan) return false;
    
    return true;
  });
  
  // Toggle model enabled status
  const toggleModelEnabled = async (modelId: string, currentStatus: boolean) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    try {
      setSaving(true);
      setError(null);
      
      if (model.config_id) {
        // Update existing config
        const { data, error: updateError } = await supabase
          .from('org_system_model_config')
          .update({ is_enabled_for_users: !currentStatus })
          .eq('id', model.config_id)
          .select();
        
        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(updateError.message || 'Failed to update config');
        }
      } else {
        // Create new config
        const { data, error: insertError } = await supabase
          .from('org_system_model_config')
          .insert([{
            organization_id: organizationId,
            system_model_id: modelId,
            is_enabled_for_users: true,
            token_limit_per_user: null,
          }])
          .select();
        
        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(insertError.message || 'Failed to create config');
        }
      }
      
      setSuccessMessage(`Model ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchSystemModels();
    } catch (err: any) {
      console.error('Error toggling model:', err);
      setError(err.message || 'Failed to toggle model');
    } finally {
      setSaving(false);
    }
  };
  
  // Enable all available models
  const enableAllModels = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const modelsToEnable = models.filter(m => !m.is_enabled);
      
      if (modelsToEnable.length === 0) {
        setSuccessMessage('All available models are already enabled');
        return;
      }
      
      // Prepare inserts/updates
      const operations = modelsToEnable.map(model => {
        if (model.config_id) {
          // Update existing
          return supabase
            .from('org_system_model_config')
            .update({ is_enabled_for_users: true })
            .eq('id', model.config_id);
        } else {
          // Create new
          return supabase
            .from('org_system_model_config')
            .insert([{
              organization_id: organizationId,
              system_model_id: model.id,
              is_enabled_for_users: true,
              token_limit_per_user: null,
            }]);
        }
      });
      
      await Promise.all(operations);
      
      setSuccessMessage(`${modelsToEnable.length} models enabled successfully`);
      fetchSystemModels();
    } catch (err: any) {
      console.error('Error enabling all models:', err);
      setError(err.message || 'Failed to enable all models');
    } finally {
      setSaving(false);
    }
  };
  
  // Disable all models
  const disableAllModels = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const modelsToDisable = models.filter(m => m.is_enabled && m.config_id);
      
      if (modelsToDisable.length === 0) {
        setSuccessMessage('No models to disable');
        return;
      }
      
      const updates = modelsToDisable.map(model =>
        supabase
          .from('org_system_model_config')
          .update({ is_enabled_for_users: false })
          .eq('id', model.config_id!)
      );
      
      await Promise.all(updates);
      
      setSuccessMessage(`${modelsToDisable.length} models disabled successfully`);
      fetchSystemModels();
    } catch (err: any) {
      console.error('Error disabling all models:', err);
      setError(err.message || 'Failed to disable all models');
    } finally {
      setSaving(false);
    }
  };
  
  return {
    // Data
    models: filteredModels,
    allModelsCount: models.length,
    enabledCount: models.filter(m => m.is_enabled).length,
    disabledCount: models.filter(m => !m.is_enabled).length,
    organizationType,
    organizationPlan,
    
    // UI State
    loading,
    saving,
    error,
    successMessage,
    
    // Filters
    searchQuery,
    filterEnabled,
    filterPlan,
    
    // Setters
    setError,
    setSuccessMessage,
    setSearchQuery,
    setFilterEnabled,
    setFilterPlan,
    
    // Actions
    toggleModelEnabled,
    enableAllModels,
    disableAllModels,
    refreshModels: fetchSystemModels,
  };
}

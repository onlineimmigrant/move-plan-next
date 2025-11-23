/**
 * usePricingPlansManagement Hook
 * 
 * Manages CRUD operations for pricing plans in ProductCreditEditModal
 * Includes drag-and-drop reordering functionality
 */

import { useState, useCallback } from 'react';
import type { PricingPlan } from '@/types/pricingplan';

interface UsePricingPlansManagementProps {
  organizationId: string | null;
  onToast?: (message: string, type: 'success' | 'error') => void;
}

interface UsePricingPlansManagementReturn {
  pricingPlans: PricingPlan[];
  isLoading: boolean;
  error: string | null;
  fetchPricingPlans: () => Promise<void>;
  createPricingPlan: (data: Partial<PricingPlan>) => Promise<void>;
  updatePricingPlan: (id: string, updates: Partial<PricingPlan>) => Promise<void>;
  deletePricingPlan: (id: string) => Promise<void>;
  reorderPricingPlans: (plans: Array<{ id: string; order: number }>) => Promise<void>;
}

export function usePricingPlansManagement({
  organizationId,
  onToast,
}: UsePricingPlansManagementProps): UsePricingPlansManagementReturn {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricingPlans = useCallback(async () => {
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pricingplans-management?organization_id=${organizationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch pricing plans');
      }

      const data = await response.json();
      setPricingPlans(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pricing plans';
      console.error('Error fetching pricing plans:', err);
      setError(message);
      onToast?.(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onToast]);

  const createPricingPlan = useCallback(async (data: Partial<PricingPlan>) => {
    if (!organizationId) {
      onToast?.('Organization ID is required', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pricingplans-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create pricing plan');
      }

      const newPlan = await response.json();
      setPricingPlans(prev => [...prev, newPlan]);
      onToast?.('Pricing plan created successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pricing plan';
      console.error('Error creating pricing plan:', err);
      setError(message);
      onToast?.(message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onToast]);

  const updatePricingPlan = useCallback(async (id: string, updates: Partial<PricingPlan>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pricingplans-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update pricing plan');
      }

      const updatedPlan = await response.json();
      setPricingPlans(prev => prev.map(plan => plan.id.toString() === id ? updatedPlan : plan));
      onToast?.('Pricing plan updated successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update pricing plan';
      console.error('Error updating pricing plan:', err);
      setError(message);
      onToast?.(message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onToast]);

  const deletePricingPlan = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pricingplans-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete pricing plan');
      }

      setPricingPlans(prev => prev.filter(plan => plan.id.toString() !== id));
      onToast?.('Pricing plan deleted successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete pricing plan';
      console.error('Error deleting pricing plan:', err);
      setError(message);
      onToast?.(message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onToast]);

  const reorderPricingPlans = useCallback(async (plans: Array<{ id: string; order: number }>) => {
    // Optimistic update
    const updatedPlans = [...pricingPlans];
    plans.forEach(({ id, order }) => {
      const planIndex = updatedPlans.findIndex(p => p.id.toString() === id);
      if (planIndex !== -1) {
        updatedPlans[planIndex] = { ...updatedPlans[planIndex], order };
      }
    });
    setPricingPlans(updatedPlans.sort((a, b) => (a.order || 0) - (b.order || 0)));

    try {
      const response = await fetch('/api/pricingplans-management', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reorder pricing plans');
      }

      onToast?.('Pricing plans reordered successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder pricing plans';
      console.error('Error reordering pricing plans:', err);
      setError(message);
      onToast?.(message, 'error');
      // Revert optimistic update
      await fetchPricingPlans();
      throw err;
    }
  }, [pricingPlans, onToast, fetchPricingPlans]);

  return {
    pricingPlans,
    isLoading,
    error,
    fetchPricingPlans,
    createPricingPlan,
    updatePricingPlan,
    deletePricingPlan,
    reorderPricingPlans,
  };
}

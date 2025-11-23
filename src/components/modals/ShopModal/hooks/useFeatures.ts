/**
 * useFeatures Hook
 * 
 * Fetches features and their associations with pricing plans
 */

import { useState, useCallback } from 'react';
import type { Feature, PricingPlanFeature } from '../types';

interface UseFeaturesProps {
  organizationId: string | null;
  onToast?: (message: string, type: 'success' | 'error') => void;
}

interface UseFeaturesReturn {
  features: Feature[];
  pricingPlanFeatures: PricingPlanFeature[];
  isLoading: boolean;
  error: string | null;
  fetchFeatures: () => Promise<void>;
  fetchPricingPlanFeatures: () => Promise<void>;
  createFeature: (featureData: Partial<Feature>) => Promise<Feature | null>;
  updateFeature: (id: string, updates: Partial<Feature>) => Promise<Feature | null>;
  deleteFeature: (id: string) => Promise<boolean>;
  assignFeatureToPlan: (pricingplanId: string, featureId: string, description?: string) => Promise<boolean>;
  removeFeatureFromPlan: (pricingplanId: string, featureId: string) => Promise<boolean>;
}

export function useFeatures({
  organizationId,
  onToast,
}: UseFeaturesProps): UseFeaturesReturn {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pricingPlanFeatures, setPricingPlanFeatures] = useState<PricingPlanFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all features
  const fetchFeatures = useCallback(async () => {
    if (!organizationId) {
      console.log('No organization ID, skipping features fetch');
      setError('Organization ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/features?organization_id=${organizationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch features');
      }
      
      const data: Feature[] = await response.json();
      setFeatures(data || []);
      console.log('Fetched features:', data?.length || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch features';
      console.error('Error fetching features:', err);
      setError(message);
      onToast?.(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, onToast]);

  // Fetch pricing plan feature assignments
  const fetchPricingPlanFeatures = useCallback(async () => {
    if (!organizationId) {
      console.log('No organization ID, skipping pricing plan features fetch');
      return;
    }

    try {
      const response = await fetch(`/api/pricingplan-features?organization_id=${organizationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch pricing plan features');
      }
      
      const data: PricingPlanFeature[] = await response.json();
      setPricingPlanFeatures(data || []);
      console.log('Fetched pricing plan features:', data?.length || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pricing plan features';
      console.error('Error fetching pricing plan features:', err);
    }
  }, [organizationId]);

  // Create a new feature
  const createFeature = useCallback(async (featureData: Partial<Feature>): Promise<Feature | null> => {
    if (!organizationId) {
      onToast?.('Organization ID is required', 'error');
      return null;
    }

    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...featureData, organization_id: organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create feature');
      }

      const newFeature: Feature = await response.json();
      setFeatures(prev => [...prev, newFeature]);
      onToast?.('Feature created successfully', 'success');
      return newFeature;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create feature';
      console.error('Error creating feature:', err);
      onToast?.(message, 'error');
      return null;
    }
  }, [organizationId, onToast]);

  // Update a feature
  const updateFeature = useCallback(async (id: string, updates: Partial<Feature>): Promise<Feature | null> => {
    try {
      const response = await fetch('/api/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update feature');
      }

      const updatedFeature: Feature = await response.json();
      setFeatures(prev => prev.map(f => f.id === id ? updatedFeature : f));
      onToast?.('Feature updated successfully', 'success');
      return updatedFeature;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update feature';
      console.error('Error updating feature:', err);
      onToast?.(message, 'error');
      return null;
    }
  }, [onToast]);

  // Delete a feature
  const deleteFeature = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/features?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete feature');
      }

      setFeatures(prev => prev.filter(f => f.id !== id));
      // Also remove any pricing plan associations
      setPricingPlanFeatures(prev => prev.filter(pf => pf.feature_id !== id));
      onToast?.('Feature deleted successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete feature';
      console.error('Error deleting feature:', err);
      onToast?.(message, 'error');
      return false;
    }
  }, [onToast]);

  // Assign feature to pricing plan
  const assignFeatureToPlan = useCallback(async (
    pricingplanId: string,
    featureId: string,
    description?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/pricingplan-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricingplan_id: pricingplanId, feature_id: featureId, description }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to assign feature');
      }

      const newAssignment: PricingPlanFeature = await response.json();
      setPricingPlanFeatures(prev => [...prev, newAssignment]);
      onToast?.('Feature assigned successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign feature';
      console.error('Error assigning feature:', err);
      onToast?.(message, 'error');
      return false;
    }
  }, [onToast]);

  // Remove feature from pricing plan
  const removeFeatureFromPlan = useCallback(async (
    pricingplanId: string,
    featureId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/pricingplan-features?pricingplan_id=${pricingplanId}&feature_id=${featureId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove feature');
      }

      setPricingPlanFeatures(prev => 
        prev.filter(pf => !(pf.pricingplan_id === pricingplanId && pf.feature_id === featureId))
      );
      onToast?.('Feature removed successfully', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove feature';
      console.error('Error removing feature:', err);
      onToast?.(message, 'error');
      return false;
    }
  }, [onToast]);

  return {
    features,
    pricingPlanFeatures,
    isLoading,
    error,
    fetchFeatures,
    fetchPricingPlanFeatures,
    createFeature,
    updateFeature,
    deleteFeature,
    assignFeatureToPlan,
    removeFeatureFromPlan,
  };
}

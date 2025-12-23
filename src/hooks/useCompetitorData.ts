import { useState, useCallback } from 'react';
import { ComparisonCompetitor, CompetitorFeatureStatus, CompetitorFeatureAmountUnit } from '@/types/comparison';

export function useCompetitorData(organizationId: string | null | undefined) {
  const [competitors, setCompetitors] = useState<ComparisonCompetitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitors = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/comparison/competitors?organization_id=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch competitors');
      const data = await response.json();
      setCompetitors(data.competitors || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load competitors');
      console.error('Error fetching competitors:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createCompetitor = useCallback(async (competitorData: {
    name: string;
    logo_url?: string;
    website_url?: string;
  }) => {
    if (!organizationId) throw new Error('Organization ID required');

    const response = await fetch('/api/comparison/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: organizationId,
        ...competitorData,
      }),
    });

    if (!response.ok) throw new Error('Failed to create competitor');
    const result = await response.json();
    setCompetitors(prev => [...prev, result.competitor]);
    return result.competitor;
  }, [organizationId]);

  const updateCompetitor = useCallback(async (id: string, updates: Partial<ComparisonCompetitor>) => {
    const response = await fetch('/api/comparison/competitors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) throw new Error('Failed to update competitor');
    const result = await response.json();
    setCompetitors(prev => prev.map(c => c.id === id ? result.competitor : c));
    return result.competitor;
  }, []);

  const deleteCompetitor = useCallback(async (id: string) => {
    const response = await fetch('/api/comparison/competitors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) throw new Error('Failed to delete competitor');
    setCompetitors(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCompetitorFeature = useCallback(async (
    competitorId: string,
    planId: string,
    featureId: string,
    status: CompetitorFeatureStatus,
    amount?: string,
    unit?: CompetitorFeatureAmountUnit,
    note?: string
  ) => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor) {
      console.error('Competitor not found:', competitorId);
      return;
    }

    console.log('Updating competitor feature:', { competitorId, planId, featureId, status, amount, unit });

    const currentFeatures = competitor.data?.features || [];
    const featureIndex = currentFeatures.findIndex((f: any) => 
      f.our_feature_id === featureId && f.our_plan_id === planId
    );

    let newFeatures;
    if (featureIndex >= 0) {
      // Update existing feature
      newFeatures = [...currentFeatures];
      newFeatures[featureIndex] = {
        ...newFeatures[featureIndex],
        status,
        ...(amount !== undefined && { amount }),
        ...(unit !== undefined && { unit }),
        ...(note !== undefined && { note })
      };
      console.log('Updated existing feature at index:', featureIndex);
    } else {
      // Add new feature
      newFeatures = [...currentFeatures, {
        our_feature_id: featureId,
        our_plan_id: planId,
        status,
        ...(amount && { amount }),
        ...(unit && { unit }),
        ...(note && { note })
      }];
      console.log('Added new feature, total features:', newFeatures.length);
    }

    const newData = { 
      plans: competitor.data?.plans || [],
      features: newFeatures 
    };
    
    console.log('Sending data to API:', JSON.stringify(newData, null, 2));

    await updateCompetitor(competitorId, {
      data: newData,
    });
  }, [competitors, updateCompetitor]);

  const updateCompetitorPricing = useCallback(async (
    competitorId: string,
    planId: string,
    interval: 'monthly' | 'yearly' | 'price' | 'note',
    price: number | string | undefined
  ) => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor) return;

    const currentPlans = competitor.data?.plans || [];
    const planIndex = currentPlans.findIndex((p: any) => p.our_plan_id === planId);

    let newPlans;
    if (planIndex >= 0) {
      newPlans = [...currentPlans];
      newPlans[planIndex] = { ...newPlans[planIndex], [interval]: price };
      // Remove the plan entry if all price fields are empty
      const plan = newPlans[planIndex];
      if (!plan.monthly && !plan.yearly && !(plan as any).price && !plan.note) {
        newPlans.splice(planIndex, 1);
      }
    } else if (price !== undefined) {
      newPlans = [...currentPlans, { our_plan_id: planId, [interval]: price }];
    } else {
      return;
    }

    await updateCompetitor(competitorId, {
      data: { 
        plans: newPlans,
        features: competitor.data?.features || []
      },
    });
  }, [competitors, updateCompetitor]);

  return {
    competitors,
    loading,
    error,
    fetchCompetitors,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
    updateCompetitorFeature,
    updateCompetitorPricing,
  };
}
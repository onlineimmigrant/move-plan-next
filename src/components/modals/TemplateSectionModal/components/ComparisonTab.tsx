'use client';

import React, { useState, useEffect } from 'react';
import { ComparisonCompetitor, ComparisonSectionConfig } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ComparisonTabProps {
  formData: any;
  setFormData: (data: any) => void;
  organizationId: string | null | undefined;
}

export function ComparisonTab({ formData, setFormData, organizationId }: ComparisonTabProps) {
  const [competitors, setCompetitors] = useState<ComparisonCompetitor[]>([]);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'competitors' | 'pricing' | 'features'>('competitors');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<ComparisonCompetitor | null>(null);
  const [newCompetitor, setNewCompetitor] = useState({ name: '', logo_url: '', website_url: '' });
  const [saving, setSaving] = useState(false);
  const themeColors = useThemeColors();

  // Deep merge saved config with defaults
  const savedConfig = formData.comparison_config || {};
  const config: ComparisonSectionConfig = {
    competitor_ids: savedConfig.competitor_ids || [],
    mode: savedConfig.mode || 'both',
    pricing: {
      show_interval: savedConfig.pricing?.show_interval || 'both',
      ...(savedConfig.pricing || {})
    },
    features: {
      filter: {
        display_on_product: savedConfig.features?.filter?.display_on_product ?? false,
        ...(savedConfig.features?.filter || {})
      },
      ...(savedConfig.features || {})
    },
    ui: {
      highlight_ours: savedConfig.ui?.highlight_ours ?? true,
      show_disclaimer: savedConfig.ui?.show_disclaimer ?? true,
      ...(savedConfig.ui || {})
    },
  };

  useEffect(() => {
    if (organizationId) {
      fetchCompetitors();
      fetchPricingPlans();
      fetchFeatures();
    }
  }, [organizationId]);

  const fetchCompetitors = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/comparison/competitors?organization_id=${organizationId}`);
      const data = await response.json();
      setCompetitors(data.competitors || []);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingPlans = async () => {
    if (!organizationId) return;
    try {
      const response = await fetch(`/api/pricingplans?organization_id=${organizationId}`);
      const data = await response.json();
      setPricingPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    }
  };

  const fetchFeatures = async () => {
    if (!organizationId) return;
    try {
      const response = await fetch(`/api/features?organization_id=${organizationId}`);
      const data = await response.json();
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
    }
  };

  const handleCreateCompetitor = async () => {
    if (!newCompetitor.name.trim() || !organizationId) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/comparison/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          name: newCompetitor.name,
          logo_url: newCompetitor.logo_url || null,
          website_url: newCompetitor.website_url || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create competitor');

      const result = await response.json();
      setCompetitors([...competitors, result.competitor]);
      setNewCompetitor({ name: '', logo_url: '', website_url: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating competitor:', error);
      alert('Failed to create competitor');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCompetitor = async () => {
    if (!editingCompetitor || !newCompetitor.name.trim()) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/comparison/competitors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCompetitor.id,
          name: newCompetitor.name,
          logo_url: newCompetitor.logo_url || null,
          website_url: newCompetitor.website_url || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update competitor');

      const result = await response.json();
      setCompetitors(competitors.map(c => c.id === editingCompetitor.id ? result.competitor : c));
      setNewCompetitor({ name: '', logo_url: '', website_url: '' });
      setEditingCompetitor(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error updating competitor:', error);
      alert('Failed to update competitor');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competitor?')) return;
    
    try {
      const response = await fetch('/api/comparison/competitors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete competitor');

      setCompetitors(competitors.filter(c => c.id !== id));
      const currentIds = config.competitor_ids || [];
      if (currentIds.includes(id)) {
        updateConfig({ competitor_ids: currentIds.filter(cid => cid !== id) });
      }
    } catch (error) {
      console.error('Error deleting competitor:', error);
      alert('Failed to delete competitor');
    }
  };

  const startEdit = (competitor: ComparisonCompetitor) => {
    setEditingCompetitor(competitor);
    setNewCompetitor({
      name: competitor.name,
      logo_url: competitor.logo_url || '',
      website_url: competitor.website_url || '',
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingCompetitor(null);
    setNewCompetitor({ name: '', logo_url: '', website_url: '' });
    setShowAddForm(false);
  };

  const updateConfig = (updates: Partial<ComparisonSectionConfig>) => {
    setFormData({
      ...formData,
      comparison_config: { ...config, ...updates },
    });
  };

  const toggleCompetitor = (competitorId: string) => {
    const currentIds = config.competitor_ids || [];
    const newIds = currentIds.includes(competitorId)
      ? currentIds.filter(id => id !== competitorId)
      : [...currentIds, competitorId];
    updateConfig({ competitor_ids: newIds });
  };

  if (!organizationId) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">Organization ID is required to manage competitors.</p>
        <p className="text-sm text-gray-500 mt-2">Please ensure this section has an organization assigned.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('competitors')} className={`px-4 py-2 -mb-px ${activeTab === 'competitors' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'competitors' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Competitors</button>
        <button onClick={() => setActiveTab('pricing')} className={`px-4 py-2 -mb-px ${activeTab === 'pricing' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'pricing' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Pricing</button>
        <button onClick={() => setActiveTab('features')} className={`px-4 py-2 -mb-px ${activeTab === 'features' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'features' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Features</button>
      </div>

      {activeTab === 'competitors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Select Competitors</h3>
            <button onClick={() => showAddForm && !editingCompetitor ? cancelEdit() : editingCompetitor ? cancelEdit() : setShowAddForm(true)} className="px-4 py-2 text-white rounded-lg transition-all" style={{ backgroundColor: themeColors.cssVars.primary.base }}>{showAddForm ? 'Cancel' : 'Add Competitor'}</button>
          </div>

          {showAddForm && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
              <h4 className="font-medium text-gray-900">{editingCompetitor ? 'Edit Competitor' : 'New Competitor'}</h4>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label><input type="text" value={newCompetitor.name} onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })} placeholder="e.g., Competitor Inc." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label><input type="url" value={newCompetitor.logo_url} onChange={(e) => setNewCompetitor({ ...newCompetitor, logo_url: e.target.value })} placeholder="https://example.com/logo.png" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Website URL (optional)</label><input type="url" value={newCompetitor.website_url} onChange={(e) => setNewCompetitor({ ...newCompetitor, website_url: e.target.value })} placeholder="https://competitor.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
              <div className="flex gap-2 pt-2"><button onClick={editingCompetitor ? handleUpdateCompetitor : handleCreateCompetitor} disabled={!newCompetitor.name.trim() || saving} className="px-4 py-2 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: themeColors.cssVars.primary.base }}>{saving ? 'Saving...' : (editingCompetitor ? 'Update Competitor' : 'Create Competitor')}</button><button onClick={cancelEdit} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all">Cancel</button></div>
            </div>
          )}

          {loading ? <p className="text-gray-500">Loading competitors...</p> : competitors.length === 0 ? <p className="text-gray-500">No competitors added yet. Click "Add Competitor" to get started.</p> : (
            <div className="grid grid-cols-1 gap-3">{competitors.map((competitor) => (
              <div key={competitor.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50">
                <input type="checkbox" checked={config.competitor_ids.includes(competitor.id)} onChange={() => toggleCompetitor(competitor.id)} className="h-4 w-4" style={{ accentColor: themeColors.cssVars.primary.base }} />
                {competitor.logo_url && <img src={competitor.logo_url} alt={competitor.name} className="h-8 w-8 rounded object-contain" />}
                <div className="flex-1"><p className="font-medium">{competitor.name}</p>{competitor.website_url && <a href={competitor.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{competitor.website_url}</a>}</div>
                <div className="flex gap-2"><button onClick={() => startEdit(competitor)} className="p-2 text-gray-600 hover:text-blue-600 rounded transition-colors" title="Edit competitor"><PencilIcon className="h-4 w-4" /></button><button onClick={() => handleDeleteCompetitor(competitor.id)} className="p-2 text-gray-600 hover:text-red-600 rounded transition-colors" title="Delete competitor"><TrashIcon className="h-4 w-4" /></button></div>
              </div>
            ))}</div>
          )}
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div><h3 className="text-lg font-medium mb-2">Configuration</h3><p className="text-sm text-gray-600 mb-4">Configure how pricing is compared across competitors.</p><label className="block text-sm font-medium text-gray-700 mb-2">Display Interval</label><select value={config.pricing?.show_interval || 'both'} onChange={(e) => updateConfig({ pricing: { ...config.pricing, show_interval: e.target.value as any } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="monthly">Monthly only</option><option value="yearly">Yearly only</option><option value="both">Both (with toggle)</option></select></div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800"><strong>Selected Competitors:</strong> {config.competitor_ids.length} competitors selected. Competitor pricing data will be managed in a future update.</div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-4">
          <div><h3 className="text-lg font-medium mb-2">Feature Configuration</h3><p className="text-sm text-gray-600 mb-4">Configure which features to compare across competitors.</p><label className="flex items-center gap-2"><input type="checkbox" checked={config.features?.filter?.display_on_product || false} onChange={(e) => updateConfig({ features: { ...config.features, filter: { ...config.features?.filter, display_on_product: e.target.checked } } })} className="h-4 w-4" style={{ accentColor: themeColors.cssVars.primary.base }} /><span className="text-sm font-medium text-gray-700">Only show features displayed on products</span></label></div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800"><strong>Selected Competitors:</strong> {config.competitor_ids.length} competitors selected. Feature availability for each competitor will be managed in a future update.</div>
        </div>
      )}
    </div>
  );
}

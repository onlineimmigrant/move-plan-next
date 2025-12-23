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
  const [activeTab, setActiveTab] = useState<'competitors' | 'pricing' | 'features' | 'display' | 'scoring'>('competitors');
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
      show_features: savedConfig.ui?.show_features ?? true,
      show_search: savedConfig.ui?.show_search ?? true,
      show_title: savedConfig.ui?.show_title ?? true,
      show_description: savedConfig.ui?.show_description ?? true,
      show_visuals: savedConfig.ui?.show_visuals ?? true,
      ...(savedConfig.ui || {})
    },
    scoring: {
      enabled: savedConfig.scoring?.enabled ?? false,
      weights: savedConfig.scoring?.weights || {
        featureCoverage: 40,
        priceCompetitiveness: 30,
        valueRatio: 20,
        transparency: 10,
      },
      show_breakdown: savedConfig.scoring?.show_breakdown ?? false,
      ...(savedConfig.scoring || {})
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
    const mergedConfig = { ...config };
    
    // Deep merge for nested objects
    if (updates.pricing) {
      mergedConfig.pricing = { ...config.pricing, ...updates.pricing };
    }
    if (updates.features) {
      mergedConfig.features = {
        ...config.features,
        ...updates.features,
        filter: {
          ...config.features?.filter,
          ...updates.features?.filter,
        },
      };
    }
    if (updates.ui) {
      mergedConfig.ui = { ...config.ui, ...updates.ui };
    }
    if (updates.scoring) {
      mergedConfig.scoring = {
        ...config.scoring,
        ...updates.scoring,
        weights: {
          ...config.scoring?.weights,
          ...updates.scoring?.weights,
        },
      };
    }
    
    // Apply other top-level updates
    Object.keys(updates).forEach(key => {
      if (!['pricing', 'features', 'ui', 'scoring'].includes(key)) {
        (mergedConfig as any)[key] = (updates as any)[key];
      }
    });
    
    setFormData({
      ...formData,
      comparison_config: mergedConfig,
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
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab('competitors')} className={`px-4 py-2 -mb-px whitespace-nowrap ${activeTab === 'competitors' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'competitors' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Competitors</button>
        <button onClick={() => setActiveTab('pricing')} className={`px-4 py-2 -mb-px whitespace-nowrap ${activeTab === 'pricing' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'pricing' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Pricing</button>
        <button onClick={() => setActiveTab('features')} className={`px-4 py-2 -mb-px whitespace-nowrap ${activeTab === 'features' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'features' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Features</button>
        <button onClick={() => setActiveTab('display')} className={`px-4 py-2 -mb-px whitespace-nowrap ${activeTab === 'display' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'display' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Display</button>
        <button onClick={() => setActiveTab('scoring')} className={`px-4 py-2 -mb-px whitespace-nowrap ${activeTab === 'scoring' ? 'border-b-2 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`} style={activeTab === 'scoring' ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base } : {}}>Scoring</button>
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

      {activeTab === 'display' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Display Options</h3>
            <p className="text-sm text-gray-600 mb-4">
              Control which elements are shown in the comparison section. Useful for creating compact pricing tables for blog posts or pages.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.show_title ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    show_title: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Show section title</span>
                <p className="text-xs text-gray-600 mt-0.5">Display the section heading at the top</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.show_description ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    show_description: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Show description</span>
                <p className="text-xs text-gray-600 mt-0.5">Display descriptive text below the title</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.show_features ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    show_features: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Show feature comparison table</span>
                <p className="text-xs text-gray-600 mt-0.5">Display detailed feature-by-feature comparison (disable for pricing-only view)</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.show_search ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    show_search: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Show search & filters</span>
                <p className="text-xs text-gray-600 mt-0.5">Display feature search and "show differences only" toggle</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.show_visuals ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    show_visuals: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Show visual elements</span>
                <p className="text-xs text-gray-600 mt-0.5">Display charts and other visual elements (when available)</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.highlight_ours ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    highlight_ours: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Highlight our column</span>
                <p className="text-xs text-gray-600 mt-0.5">Use accent color to highlight your organization's column</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.show_disclaimer ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    show_disclaimer: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Show disclaimer</span>
                <p className="text-xs text-gray-600 mt-0.5">Display disclaimer about data accuracy at the bottom</p>
              </div>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> For a compact pricing table perfect for blog posts, disable: Title, Description, Features, Search, and Visuals. Keep only the pricing table visible.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'scoring' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Automated Scoring</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enable automated competitor scoring to help visitors compare products objectively. Scores are calculated based on feature coverage, price competitiveness, value ratio, and pricing transparency.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Important Guidelines</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Scores are automatically calculated and displayed publicly when enabled</li>
                <li>Methodology is shown transparently to visitors via an info button</li>
                <li>Make sure competitor data is accurate and up-to-date before enabling</li>
                <li>Consider competitive and legal implications of public scoring</li>
              </ul>
            </div>

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
              <input
                type="checkbox"
                checked={config.scoring?.enabled || false}
                onChange={(e) => updateConfig({
                  scoring: {
                    ...config.scoring,
                    enabled: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Enable automated scoring</span>
                <p className="text-xs text-gray-600 mt-0.5">Display overall scores for each competitor in the comparison table</p>
              </div>
            </label>
          </div>

          {config.scoring?.enabled && (
            <>
              <div>
                <h4 className="text-md font-medium mb-3">Scoring Weights</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Customize how different criteria contribute to the overall score. Total must equal 100%.
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Feature Coverage</label>
                      <span className="text-sm font-semibold" style={{ color: themeColors.cssVars.primary.base }}>
                        {config.scoring?.weights?.featureCoverage || 40}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.scoring?.weights?.featureCoverage || 40}
                      onChange={(e) => updateConfig({
                        scoring: {
                          ...config.scoring,
                          weights: {
                            ...config.scoring?.weights,
                            featureCoverage: Number(e.target.value)
                          }
                        }
                      })}
                      className="w-full"
                      style={{ accentColor: themeColors.cssVars.primary.base }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Percentage of included vs. paid/unavailable features</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Price Competitiveness</label>
                      <span className="text-sm font-semibold" style={{ color: themeColors.cssVars.primary.base }}>
                        {config.scoring?.weights?.priceCompetitiveness || 30}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.scoring?.weights?.priceCompetitiveness || 30}
                      onChange={(e) => updateConfig({
                        scoring: {
                          ...config.scoring,
                          weights: {
                            ...config.scoring?.weights,
                            priceCompetitiveness: Number(e.target.value)
                          }
                        }
                      })}
                      className="w-full"
                      style={{ accentColor: themeColors.cssVars.primary.base }}
                    />
                    <p className="text-xs text-gray-500 mt-1">How competitor price compares to yours</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Value Ratio</label>
                      <span className="text-sm font-semibold" style={{ color: themeColors.cssVars.primary.base }}>
                        {config.scoring?.weights?.valueRatio || 20}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.scoring?.weights?.valueRatio || 20}
                      onChange={(e) => updateConfig({
                        scoring: {
                          ...config.scoring,
                          weights: {
                            ...config.scoring?.weights,
                            valueRatio: Number(e.target.value)
                          }
                        }
                      })}
                      className="w-full"
                      style={{ accentColor: themeColors.cssVars.primary.base }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Features per dollar (value for money)</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Transparency</label>
                      <span className="text-sm font-semibold" style={{ color: themeColors.cssVars.primary.base }}>
                        {config.scoring?.weights?.transparency || 10}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.scoring?.weights?.transparency || 10}
                      onChange={(e) => updateConfig({
                        scoring: {
                          ...config.scoring,
                          weights: {
                            ...config.scoring?.weights,
                            transparency: Number(e.target.value)
                          }
                        }
                      })}
                      className="w-full"
                      style={{ accentColor: themeColors.cssVars.primary.base }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Pricing clarity and availability of information</p>
                  </div>

                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Weight</span>
                      <span className={`text-sm font-bold ${
                        ((config.scoring?.weights?.featureCoverage || 40) +
                         (config.scoring?.weights?.priceCompetitiveness || 30) +
                         (config.scoring?.weights?.valueRatio || 20) +
                         (config.scoring?.weights?.transparency || 10)) === 100
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {(config.scoring?.weights?.featureCoverage || 40) +
                         (config.scoring?.weights?.priceCompetitiveness || 30) +
                         (config.scoring?.weights?.valueRatio || 20) +
                         (config.scoring?.weights?.transparency || 10)}%
                      </span>
                    </div>
                    {((config.scoring?.weights?.featureCoverage || 40) +
                       (config.scoring?.weights?.priceCompetitiveness || 30) +
                       (config.scoring?.weights?.valueRatio || 20) +
                       (config.scoring?.weights?.transparency || 10)) !== 100 && (
                      <p className="text-xs text-red-600 mt-1">⚠️ Weights must sum to 100%</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium mb-3">Display Options</h4>
                <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
                  <input
                    type="checkbox"
                    checked={config.scoring?.show_breakdown || false}
                    onChange={(e) => updateConfig({
                      scoring: {
                        ...config.scoring,
                        show_breakdown: e.target.checked
                      }
                    })}
                    className="h-5 w-5"
                    style={{ accentColor: themeColors.cssVars.primary.base }}
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Show detailed breakdown</span>
                    <p className="text-xs text-gray-600 mt-0.5">Display individual scores for each criterion below the overall score</p>
                  </div>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> Visitors will see an "Overall Score" row in the comparison table with scores for each competitor. 
                  An info button (ⓘ) next to "Overall Score" will show a modal explaining how scores are calculated, including disclaimers about data accuracy and methodology limitations.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

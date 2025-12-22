'use client';

import React, { useState, useEffect } from 'react';
import { ComparisonCompetitor, ComparisonSectionConfig } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';

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
  const [activeTab, setActiveTab] = useState<'competitors' | 'pricing' | 'features' | 'preview'>('competitors');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<ComparisonCompetitor | null>(null);
  const [newCompetitor, setNewCompetitor] = useState({ name: '', logo_url: '', website_url: '' });
  const [saving, setSaving] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [imageGalleryTarget, setImageGalleryTarget] = useState<'new' | string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const themeColors = useThemeColors();

  // Validation helpers
  const validateURL = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePrice = (price: number | undefined): boolean => {
    if (price === undefined) return true; // Optional
    return price >= 0 && price <= 999999;
  };

  const validateCompetitorForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!newCompetitor.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (newCompetitor.logo_url && !validateURL(newCompetitor.logo_url)) {
      errors.logo_url = 'Invalid URL format';
    }
    
    if (newCompetitor.website_url && !validateURL(newCompetitor.website_url)) {
      errors.website_url = 'Invalid URL format';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CSV Import Handler
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportProgress('Reading file...');
    
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      setErrorMessage('CSV file must contain a header row and at least one data row');
      setImportProgress(null);
      return;
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const logoIndex = headers.indexOf('logo_url');
    const websiteIndex = headers.indexOf('website_url');

    if (nameIndex === -1) {
      setErrorMessage('CSV must have a "name" column');
      setImportProgress(null);
      return;
    }

    const results = { imported: 0, failed: 0, errors: [] as string[] };
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const name = values[nameIndex];
      const logo_url = logoIndex !== -1 ? values[logoIndex] : undefined;
      const website_url = websiteIndex !== -1 ? values[websiteIndex] : undefined;

      if (!name) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      if (logo_url && !validateURL(logo_url)) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Invalid logo URL`);
        continue;
      }

      if (website_url && !validateURL(website_url)) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Invalid website URL`);
        continue;
      }

      setImportProgress(`Importing ${i} of ${lines.length - 1}...`);

      try {
        const response = await fetch('/api/comparison/competitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organizationId,
            name,
            logo_url: logo_url || null,
            website_url: website_url || null,
          }),
        });

        if (!response.ok) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${name} - API error`);
        } else {
          results.imported++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${name} - Network error`);
      }
    }

    setImportProgress(null);
    
    // Show results
    const message = `Import complete: ${results.imported} imported, ${results.failed} failed${
      results.errors.length > 0 ? '\n\nErrors:\n' + results.errors.slice(0, 5).join('\n') + 
      (results.errors.length > 5 ? `\n...and ${results.errors.length - 5} more` : '') : ''
    }`;
    
    if (results.failed > 0) {
      setErrorMessage(message);
    } else {
      setErrorMessage(null);
    }

    await fetchCompetitors();
    
    // Reset file input
    event.target.value = '';
  };

  // Handle image selection from gallery
  const handleImageSelect = (imageUrl: string) => {
    if (imageGalleryTarget === 'new') {
      setNewCompetitor({ ...newCompetitor, logo_url: imageUrl });
    } else if (imageGalleryTarget && editingCompetitor) {
      setNewCompetitor({ ...newCompetitor, logo_url: imageUrl });
    }
    setIsImageGalleryOpen(false);
    setImageGalleryTarget(null);
  };

  const openImageGallery = (target: 'new' | string) => {
    setImageGalleryTarget(target);
    setIsImageGalleryOpen(true);
  };

  // Initialize config from formData
  const [config, setConfig] = useState<ComparisonSectionConfig>(() => {
    return formData.comparison_config || {
      competitor_ids: [],
      mode: 'both',
      selected_plan_id: undefined,
      pricing: { show_interval: 'both' },
      features: { filter: { display_on_product: false } },
      ui: { highlight_ours: true, show_disclaimer: true },
    };
  });

  // Sync config to formData whenever it changes
  useEffect(() => {
    setFormData({
      ...formData,
      comparison_config: config,
    });
  }, [config]);

  // Load config from formData when it changes (handles reopening modal)
  useEffect(() => {
    if (formData.comparison_config) {
      setConfig(formData.comparison_config);
    }
  }, [formData.comparison_config]);

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

  const fetchFeatures = async (planId?: string) => {
    if (!organizationId) return;
    try {
      let url = `/api/features?organization_id=${organizationId}`;
      if (planId) {
        url += `&plan_id=${planId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
    }
  };

  // Refetch features when selected plan changes
  useEffect(() => {
    if (config.selected_plan_id && organizationId) {
      fetchFeatures(config.selected_plan_id);
    }
  }, [config.selected_plan_id, organizationId]);

  const handleCreateCompetitor = async () => {
    if (!validateCompetitorForm() || !organizationId) return;
    
    try {
      setSaving(true);
      setErrorMessage(null);
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create competitor');
      }

      const result = await response.json();
      setCompetitors([...competitors, result.competitor]);
      setNewCompetitor({ name: '', logo_url: '', website_url: '' });
      setValidationErrors({});
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error creating competitor:', error);
      setErrorMessage(error.message || 'Failed to create competitor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCompetitor = async () => {
    if (!editingCompetitor || !validateCompetitorForm()) return;
    
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
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const toggleCompetitor = (competitorId: string) => {
    const currentIds = config.competitor_ids || [];
    const newIds = currentIds.includes(competitorId)
      ? currentIds.filter(id => id !== competitorId)
      : [...currentIds, competitorId];
    updateConfig({ competitor_ids: newIds });
  };

  const getCompetitorFeatureStatus = (competitorId: string, featureId: string): 'available' | 'partial' | 'unavailable' => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor?.data?.features) return 'unavailable';
    const feature = competitor.data.features.find((f: any) => f.our_feature_id === featureId);
    const status = feature?.status || 'unavailable';
    return status === 'unknown' ? 'unavailable' : status;
  };

  const setCompetitorFeatureStatus = async (competitorId: string, featureId: string, status: 'available' | 'partial' | 'unavailable') => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor) return;

    const currentFeatures = competitor.data?.features || [];
    const featureIndex = currentFeatures.findIndex((f: any) => f.our_feature_id === featureId);

    let newFeatures;
    if (featureIndex >= 0) {
      newFeatures = [...currentFeatures];
      newFeatures[featureIndex] = { ...newFeatures[featureIndex], status };
    } else {
      newFeatures = [...currentFeatures, { our_feature_id: featureId, status }];
    }

    try {
      const response = await fetch('/api/comparison/competitors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: competitorId,
          data: { ...competitor.data, features: newFeatures },
        }),
      });

      if (!response.ok) throw new Error('Failed to update competitor feature');

      const result = await response.json();
      setCompetitors(competitors.map(c => c.id === competitorId ? result.competitor : c));
    } catch (error) {
      console.error('Error updating competitor feature:', error);
      alert('Failed to update competitor feature');
    }
  };

  const updateCompetitorPricing = async (competitorId: string, planId: string, interval: 'monthly' | 'yearly' | 'price', price: number | undefined) => {
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
      if (!plan.monthly && !plan.yearly && !(plan as any).price) {
        newPlans.splice(planIndex, 1);
      }
    } else if (price !== undefined) {
      newPlans = [...currentPlans, { our_plan_id: planId, [interval]: price }];
    } else {
      return; // Nothing to update
    }

    try {
      const response = await fetch('/api/comparison/competitors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: competitorId,
          data: { ...competitor.data, plans: newPlans },
        }),
      });

      if (!response.ok) throw new Error('Failed to update competitor pricing');

      const result = await response.json();
      setCompetitors(competitors.map(c => c.id === competitorId ? result.competitor : c));
    } catch (error) {
      console.error('Error updating competitor pricing:', error);
      alert('Failed to update competitor pricing');
    }
  };

  if (!organizationId) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">Organization ID is required to manage competitors.</p>
        <p className="text-sm text-gray-500 mt-2">Please ensure this section has an organization assigned.</p>
      </div>
    );
  }

  const selectedCompetitors = competitors.filter(c => config.competitor_ids.includes(c.id));

  return (
    <>
    <div className="space-y-6">
      {/* Plan Selector - Always visible at top */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Plan to Compare <span className="text-red-500">*</span>
        </label>
        <select
          value={config.selected_plan_id || ''}
          onChange={(e) => setConfig({ ...config, selected_plan_id: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Select a pricing plan --</option>
          {pricingPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.package ? `${plan.product_name} - ${plan.package}` : plan.product_name}
            </option>
          ))}
        </select>
        {!config.selected_plan_id && (
          <p className="mt-2 text-xs text-gray-600">
            Select a plan to enable competitor comparison
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('competitors')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'competitors'
              ? 'border-b-2 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={
            activeTab === 'competitors'
              ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base }
              : {}
          }
        >
          Competitors
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'pricing'
              ? 'border-b-2 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={
            activeTab === 'pricing'
              ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base }
              : {}
          }
        >
          Pricing
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'features'
              ? 'border-b-2 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={
            activeTab === 'features'
              ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base }
              : {}
          }
        >
          Features
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'preview'
              ? 'border-b-2 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={
            activeTab === 'preview'
              ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base }
              : {}
          }
          disabled={!config.selected_plan_id || selectedCompetitors.length === 0}
        >
          Preview
        </button>
      </div>

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-lg font-medium">Select Competitors</h3>
            <div className="flex gap-2">
              <label
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                  disabled={!!importProgress}
                />
              </label>
              <button
                onClick={() =>
                  showAddForm && !editingCompetitor
                    ? cancelEdit()
                    : editingCompetitor
                    ? cancelEdit()
                    : setShowAddForm(true)
                }
                className="px-4 py-2 text-white rounded-lg transition-all"
                style={{ backgroundColor: themeColors.cssVars.primary.base }}
              >
                {showAddForm ? 'Cancel' : 'Add Competitor'}
              </button>
            </div>
          </div>

          {importProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              {importProgress}
            </div>
          )}

          {showAddForm && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
              <h4 className="font-medium text-gray-900">
                {editingCompetitor ? 'Edit Competitor' : 'New Competitor'}
              </h4>
              
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCompetitor.name}
                  onChange={(e) => {
                    setNewCompetitor({ ...newCompetitor, name: e.target.value });
                    setValidationErrors({ ...validationErrors, name: '' });
                  }}
                  placeholder="e.g., Competitor Inc."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newCompetitor.logo_url}
                    onChange={(e) => {
                      setNewCompetitor({ ...newCompetitor, logo_url: e.target.value });
                      setValidationErrors({ ...validationErrors, logo_url: '' });
                    }}
                    placeholder="https://example.com/logo.png"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.logo_url ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => openImageGallery('new')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all whitespace-nowrap"
                  >
                    Browse Images
                  </button>
                </div>
                {validationErrors.logo_url && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.logo_url}</p>
                )}
                {newCompetitor.logo_url && !validationErrors.logo_url && (
                  <img
                    src={newCompetitor.logo_url}
                    alt="Logo preview"
                    className="mt-2 h-12 w-auto object-contain"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newCompetitor.website_url}
                    onChange={(e) => {
                      setNewCompetitor({ ...newCompetitor, website_url: e.target.value });
                      setValidationErrors({ ...validationErrors, website_url: '' });
                    }}
                    placeholder="https://competitor.com"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.website_url ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {!editingCompetitor && newCompetitor.website_url && (
                    <button
                      onClick={async () => {
                        setImportProgress('AI analyzing website...');
                        try {
                          const response = await fetch('/api/comparison/competitor/auto-fill', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              url: newCompetitor.website_url,
                              organizationId,
                            }),
                          });

                          const data = await response.json();
                          
                          if (response.ok) {
                            setNewCompetitor({
                              ...newCompetitor,
                              name: data.name || newCompetitor.name,
                              logo_url: data.logo_url || newCompetitor.logo_url,
                            });
                            setImportProgress(null);
                          } else {
                            throw new Error(data.error || 'Auto-fill failed');
                          }
                        } catch (error: any) {
                          setImportProgress(null);
                          setErrorMessage(error.message || 'Failed to auto-fill data');
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                      title="AI Auto-Fill from website"
                      disabled={!!importProgress}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Fill
                    </button>
                  )}
                </div>
                {validationErrors.website_url && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.website_url}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={editingCompetitor ? handleUpdateCompetitor : handleCreateCompetitor}
                  disabled={!newCompetitor.name.trim() || saving}
                  className="px-4 py-2 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: themeColors.cssVars.primary.base }}
                >
                  {saving ? 'Saving...' : editingCompetitor ? 'Update Competitor' : 'Create Competitor'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-500">Loading competitors...</p>
          ) : competitors.length === 0 ? (
            <p className="text-gray-500">No competitors added yet. Click "Add Competitor" to get started.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={config.competitor_ids.includes(competitor.id)}
                    onChange={() => toggleCompetitor(competitor.id)}
                    className="h-4 w-4"
                    style={{ accentColor: themeColors.cssVars.primary.base }}
                  />
                  {competitor.logo_url && (
                    <img
                      src={competitor.logo_url}
                      alt={competitor.name}
                      className="h-8 w-8 rounded object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{competitor.name}</p>
                    {competitor.website_url && (
                      <a
                        href={competitor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {competitor.website_url}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(competitor)}
                      className="p-2 text-gray-600 hover:text-blue-600 rounded transition-colors"
                      title="Edit competitor"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompetitor(competitor.id)}
                      className="p-2 text-gray-600 hover:text-red-600 rounded transition-colors"
                      title="Delete competitor"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          {!config.selected_plan_id ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Please select a pricing plan first</p>
            </div>
          ) : (
            <>
          <div>
            <h3 className="text-lg font-medium mb-2">Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Configure how pricing is compared across competitors.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Interval
            </label>
            <select
              value={config.pricing?.show_interval || 'both'}
              onChange={(e) =>
                updateConfig({
                  pricing: {
                    ...config.pricing,
                    show_interval: e.target.value as any,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="monthly">Monthly only</option>
              <option value="yearly">Yearly only</option>
              <option value="both">Both (with toggle)</option>
            </select>
          </div>

          {selectedCompetitors.length === 0 ? (
            <p className="text-gray-500">Select competitors first to configure their pricing.</p>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Competitor Pricing</h4>
              <p className="text-sm text-gray-600">
                Enter competitor prices for the selected plan.
              </p>
              {(() => {
                const plan = pricingPlans.find(p => p.id === config.selected_plan_id);
                if (!plan) return <p className="text-gray-500">Selected plan not found</p>;
                
                const planName = plan.package ? `${plan.product_name} - ${plan.package}` : (plan.product_name || 'Unnamed Plan');
                return (
                <div key={plan.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium">{planName}</p>
                    <div className="text-sm text-gray-600">
                      Your price: 
                      {plan.price && <span className="ml-1 font-medium">${(plan.price / 100).toFixed(2)}/mo</span>}
                      {!plan.price && <span className="ml-1 text-gray-400">Not set</span>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedCompetitors.map((competitor) => {
                      const competitorPlan: any = competitor.data?.plans?.find((p: any) => p.our_plan_id === plan.id) || {};
                      const isRecurring = plan.type === 'recurring';
                      return (
                        <div key={competitor.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded bg-gray-50">
                          <div className="font-medium text-sm flex items-center">
                            {competitor.logo_url && (
                              <img src={competitor.logo_url} alt="" className="h-5 w-5 mr-2 rounded object-contain" />
                            )}
                            {competitor.name}
                          </div>
                          {isRecurring ? (
                            <>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Monthly Price</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="999999"
                                  placeholder="e.g. 29.99"
                                  value={competitorPlan.monthly || ''}
                                  onChange={(e) => {
                                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                    if (validatePrice(value)) {
                                      updateCompetitorPricing(competitor.id, plan.id, 'monthly', value);
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Yearly Price</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="999999"
                                  placeholder="e.g. 299.99"
                                  value={competitorPlan.yearly || ''}
                                  onChange={(e) => {
                                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                    if (validatePrice(value)) {
                                      updateCompetitorPricing(competitor.id, plan.id, 'yearly', value);
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-600 mb-1">One-Time Price</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="999999"
                                placeholder="e.g. 99.99"
                                value={competitorPlan.price || ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  if (validatePrice(value)) {
                                    updateCompetitorPricing(competitor.id, plan.id, 'price', value);
                                  }
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })()}
            </div>
          )}
          </>
          )}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          {!config.selected_plan_id ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Please select a pricing plan first</p>
            </div>
          ) : (
            <>
          <div>
            <h3 className="text-lg font-medium mb-2">Feature Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Mark which features each competitor has for the selected plan.
            </p>
          </div>

          {selectedCompetitors.length === 0 ? (
            <p className="text-gray-500">Select competitors first to configure their features.</p>
          ) : (
            <div className="space-y-4">
              {features
                .filter(f => !config.features?.filter?.display_on_product || f.display_on_product_card)
                .map((feature) => (
                  <div key={feature.id} className="border rounded-lg p-4">
                    <p className="font-medium mb-2">{feature.name}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedCompetitors.map((competitor) => {
                        const status = getCompetitorFeatureStatus(competitor.id, feature.id);
                        return (
                          <div key={competitor.id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm truncate">{competitor.name}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setCompetitorFeatureStatus(competitor.id, feature.id, 'available')}
                                className={`p-1 rounded ${
                                  status === 'available'
                                    ? 'bg-green-100 text-green-600'
                                    : 'text-gray-400 hover:text-green-600'
                                }`}
                                title="Available"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setCompetitorFeatureStatus(competitor.id, feature.id, 'partial')}
                                className={`p-1 rounded ${
                                  status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : 'text-gray-400 hover:text-yellow-600'
                                }`}
                                title="Partial"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setCompetitorFeatureStatus(competitor.id, feature.id, 'unavailable')}
                                className={`p-1 rounded ${
                                  status === 'unavailable'
                                    ? 'bg-red-100 text-red-600'
                                    : 'text-gray-400 hover:text-red-600'
                                }`}
                                title="Unavailable"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
          </>
          )}
        </div>
      )}
      
      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Preview</h3>
            <p className="text-sm text-gray-600 mb-4">
              This shows how the comparison will appear on your website.
            </p>
            
            {!config.selected_plan_id ? (
              <p className="text-gray-500">Please select a plan to preview</p>
            ) : selectedCompetitors.length === 0 ? (
              <p className="text-gray-500">Please add competitors to preview</p>
            ) : (
              <div className="bg-white p-6 rounded-lg border">
                {/* Pricing Preview */}
                {pricingPlans.find(p => p.id === config.selected_plan_id) && (
                  <div className="mb-6">
                    <h4 className="text-base font-semibold mb-3">Pricing Comparison</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b-2">
                            <th className="text-left p-2">Plan</th>
                            <th className="text-center p-2 bg-blue-50">Your Organization</th>
                            {selectedCompetitors.map(comp => (
                              <th key={comp.id} className="text-center p-2">
                                <div className="flex flex-col items-center gap-1">
                                  {comp.logo_url && (
                                    <img src={comp.logo_url} alt={comp.name} className="h-6 w-auto" />
                                  )}
                                  <span className="text-xs">{comp.name}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const plan = pricingPlans.find(p => p.id === config.selected_plan_id);
                            if (!plan) return null;
                            const planName = plan.package ? `${plan.product_name} - ${plan.package}` : plan.product_name;
                            const price = plan.price ? `$${(plan.price / 100).toFixed(0)}` : '—';
                            
                            return (
                              <tr className="border-b">
                                <td className="p-2 font-medium">{planName}</td>
                                <td className="p-2 text-center bg-blue-50 font-semibold">{price}</td>
                                {selectedCompetitors.map(comp => {
                                  const compPlan: any = comp.data.plans?.find((p: any) => p.our_plan_id === plan.id);
                                  const compPrice = compPlan?.monthly || compPlan?.price || '—';
                                  return (
                                    <td key={comp.id} className="p-2 text-center">{compPrice}</td>
                                  );
                                })}
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Features Preview */}
                {features.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold mb-3">Features Comparison</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b-2">
                            <th className="text-left p-2">Feature</th>
                            <th className="text-center p-2 bg-blue-50">Your Organization</th>
                            {selectedCompetitors.map(comp => (
                              <th key={comp.id} className="text-center p-2">
                                <span className="text-xs">{comp.name}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {features.slice(0, 5).map(feature => (
                            <tr key={feature.id} className="border-b">
                              <td className="p-2">{feature.name}</td>
                              <td className="p-2 text-center bg-blue-50">
                                <span className="text-green-600">✓</span>
                              </td>
                              {selectedCompetitors.map(comp => {
                                const compFeature = comp.data.features?.find((f: any) => f.our_feature_id === feature.id);
                                const status = compFeature?.status || 'unknown';
                                return (
                                  <td key={comp.id} className="p-2 text-center">
                                    {status === 'available' && <span className="text-green-600">✓</span>}
                                    {status === 'partial' && <span className="text-yellow-600">~</span>}
                                    {status === 'unavailable' && <span className="text-red-600">✕</span>}
                                    {status === 'unknown' && <span className="text-gray-400">—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {features.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">Showing first 5 features...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Image Gallery Modal */}
    {isImageGalleryOpen && (
      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => {
          setIsImageGalleryOpen(false);
          setImageGalleryTarget(null);
        }}
        onSelectImage={handleImageSelect}
      />
    )}
    </>
  );
}

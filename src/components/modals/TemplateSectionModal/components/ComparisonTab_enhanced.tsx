'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ComparisonSectionConfig, ComparisonCompetitor, CompetitorFeatureStatus, CompetitorFeatureAmountUnit } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCompetitorData } from '@/hooks/useCompetitorData';
import { CompetitorList } from './CompetitorList';
import { PricingConfig } from './PricingConfig';
import { FeatureConfig } from './FeatureConfig';
import { ComparisonPreview } from './ComparisonPreview';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import Button from '@/ui/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Currency code to symbol mapping
const getCurrencySymbol = (code: string): string => {
  const currencyMap: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'INR': '₹',
    'RUB': '₽',
    'BRL': 'R$',
    'ZAR': 'R',
    'KRW': '₩',
    'MXN': 'MX$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'TRY': '₺',
    'AED': 'د.إ',
    'SAR': 'ر.س',
  };
  return currencyMap[code.toUpperCase()] || code;
};

interface ComparisonTabProps {
  formData: any;
  setFormData: (data: any) => void;
  organizationId: string | null | undefined;
}

export function ComparisonTab({ formData, setFormData, organizationId }: ComparisonTabProps) {
  const [activeTab, setActiveTab] = useState<'competitors' | 'pricing' | 'features' | 'display' | 'preview'>('competitors');
  const [editingCompetitor, setEditingCompetitor] = useState<any | null>(null);
  const [newCompetitor, setNewCompetitor] = useState({ name: '', logo_url: '', website_url: '' });
  const [saving, setSaving] = useState(false);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [imageGalleryTarget, setImageGalleryTarget] = useState<'new' | string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [showImportDropdown, setShowImportDropdown] = useState(false);

  // Initialize config from formData
  const [config, setConfig] = useState<ComparisonSectionConfig>(() => {
    return formData.comparison_config || {
      competitor_ids: [],
      mode: 'both',
      selected_plan_id: undefined,
      pricing: { show_interval: 'both' },
      features: { filter: { display_on_product: false } },
      ui: { 
        highlight_ours: true, 
        show_disclaimer: true,
        show_features: true,
        show_search: true,
        show_title: true,
        show_description: true,
        show_visuals: true,
      },
    };
  });

  const [showAllFeatures, setShowAllFeatures] = useState(() => {
    // Initialize from config: if display_on_product is false, show all features
    return !config.features?.filter?.display_on_product;
  });

  const themeColors = useThemeColors();

  // Use custom hooks
  const {
    competitors,
    loading: competitorsLoading,
    error: competitorsError,
    fetchCompetitors,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
    updateCompetitorFeature,
    updateCompetitorPricing,
  } = useCompetitorData(organizationId);

  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [currency, setCurrency] = useState<string>('$');

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

  // JSON Import Handler
  const handleJSONImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportProgress('Reading file...');
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        setErrorMessage('JSON file must contain an array of competitors');
        setImportProgress(null);
        return;
      }

      const results = { imported: 0, failed: 0, errors: [] as string[] };
      
      // Fetch existing competitors to check for duplicates
      setImportProgress('Checking existing competitors...');
      const existingCompetitors = competitors || [];
      
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        if (!item.name) {
          results.failed++;
          results.errors.push(`Item ${i + 1}: Name is required`);
          continue;
        }

        if (item.logo_url && !validateURL(item.logo_url)) {
          results.failed++;
          results.errors.push(`Item ${i + 1}: Invalid logo URL`);
          continue;
        }

        if (item.website_url && !validateURL(item.website_url)) {
          results.failed++;
          results.errors.push(`Item ${i + 1}: Invalid website URL`);
          continue;
        }

        setImportProgress(`Importing ${i + 1} of ${data.length}...`);

        try {
          // Build the data object with pricing_plans and features
          const competitorData: any = {
            plans: item.pricing_plans || [],
            features: item.features || []
          };

          // Check if competitor already exists
          const existingCompetitor = existingCompetitors.find(
            c => c.name.toLowerCase() === item.name.toLowerCase()
          );

          let response;
          if (existingCompetitor) {
            // Merge imported data with existing data to preserve other plans/features
            const existingData = existingCompetitor.data || { plans: [], features: [] };
            const existingPlans = existingData.plans || [];
            const existingFeatures = existingData.features || [];
            
            // Merge plans: Update existing plans or add new ones
            const mergedPlans = [...existingPlans];
            (competitorData.plans || []).forEach((newPlan: any) => {
              const existingPlanIndex = mergedPlans.findIndex((p: any) => p.our_plan_id === newPlan.our_plan_id);
              if (existingPlanIndex >= 0) {
                // Update existing plan
                mergedPlans[existingPlanIndex] = { ...mergedPlans[existingPlanIndex], ...newPlan };
              } else {
                // Add new plan
                mergedPlans.push(newPlan);
              }
            });
            
            // Merge features: Update existing features or add new ones
            const mergedFeatures = [...existingFeatures];
            (competitorData.features || []).forEach((newFeature: any) => {
              const existingFeatureIndex = mergedFeatures.findIndex((f: any) => 
                f.our_feature_id === newFeature.our_feature_id && f.our_plan_id === newFeature.our_plan_id
              );
              if (existingFeatureIndex >= 0) {
                // Update existing feature
                mergedFeatures[existingFeatureIndex] = { ...mergedFeatures[existingFeatureIndex], ...newFeature };
              } else {
                // Add new feature
                mergedFeatures.push(newFeature);
              }
            });
            
            const mergedData = {
              plans: mergedPlans,
              features: mergedFeatures
            };
            
            // Update existing competitor with merged data
            response = await fetch('/api/comparison/competitors', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: existingCompetitor.id,
                name: item.name,
                logo_url: item.logo_url || null,
                website_url: item.website_url || null,
                data: mergedData,
              }),
            });
          } else {
            // Create new competitor
            response = await fetch('/api/comparison/competitors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organization_id: organizationId,
                name: item.name,
                logo_url: item.logo_url || null,
                website_url: item.website_url || null,
                data: competitorData,
              }),
            });
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            results.failed++;
            results.errors.push(`Item ${i + 1}: ${item.name} - ${errorData.error || 'API error'}`);
          } else {
            results.imported++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Item ${i + 1}: ${item.name} - ${error instanceof Error ? error.message : 'Network error'}`);
        }
      }

      setImportProgress(null);
      
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
      event.target.value = '';
    } catch (error) {
      setErrorMessage('Invalid JSON file format');
      setImportProgress(null);
      event.target.value = '';
    }
  };

  // Download CSV Sample
  const downloadCSVSample = () => {
    // Get the selected plan details
    const selectedPlan = pricingPlans.find(p => p.id === config.selected_plan_id);
    const planName = selectedPlan ? (selectedPlan.package || selectedPlan.product_name) : 'Not specified';
    
    // Headers: competitor info + only the selected plan (pricing + all features)
    const planId = selectedPlan?.id || '';
    const featureHeaders = features.map(f => [
      `plan_${planId}_feature_${f.id}_status`,
      `plan_${planId}_feature_${f.id}_amount`,
      `plan_${planId}_feature_${f.id}_unit`,
      `plan_${planId}_feature_${f.id}_note`
    ]).flat();
    
    const planHeaders = [
      `plan_${planId}_monthly`,
      `plan_${planId}_yearly`,
      `plan_${planId}_note`,
      ...featureHeaders
    ];
    
    const headers = `name,logo_url,website_url,${planHeaders.join(',')}`;
    
    // Get only selected competitors
    const selectedCompetitors = competitors.filter(comp => config.competitor_ids?.includes(comp.id));
    
    // Add selected competitors as sample rows with their existing data
    const rows = selectedCompetitors.map(comp => {
      const compPlan = comp.data?.plans?.find((cp: any) => cp.our_plan_id === planId);
      const featureData = features.flatMap(f => {
        const compFeature = comp.data?.features?.find((cf: any) => 
          cf.our_feature_id === f.id && cf.our_plan_id === planId
        );
        return [
          compFeature?.status || 'unknown',
          compFeature?.amount || '',
          compFeature?.unit || '',
          compFeature?.note || ''
        ];
      });
      
      const planData = [
        compPlan?.monthly || '',
        compPlan?.yearly || '',
        compPlan?.note || '',
        ...featureData
      ];
      
      return [
        comp.name,
        comp.logo_url || '',
        comp.website_url || '',
        ...planData
      ].join(',');
    });
    
    // Create comprehensive instructions for AI agents
    const instructions = [
      '# ==================== AI AGENT INSTRUCTIONS ====================',
      `# COMPARISON CONTEXT: You are comparing competitors against our "${planName}" plan ONLY`,
      '# ',
      '# TASK: Research and fill in competitor data for ONE plan and its features',
      '# ',
      `# CURRENCY: All prices should be in ${currency} (organization default currency)`,
      '# ',
      '# DATA STRUCTURE: Single plan with flat features array',
      `# All columns are for the "${planName}" plan - no other plans included`,
      '# This is the most efficient format - minimal tokens, clear scope',
      '# ',
      '# OUTPUT FORMAT: Return a CSV file with the exact same structure as this file.',
      '# Keep all comment lines (starting with #), headers, and data rows.',
      '# Only modify the data values in the competitor rows below.',
      '# ',
      `# COLUMN FORMAT: plan_{planId}_feature_{featureId}_{field}`,
      `# Plan columns: monthly, yearly, note (for "${planName}" plan)`,
      `# Feature columns: status, amount, unit, note (for each feature in "${planName}" plan)`,
      '# ',
      '# FEATURE STATUS VALUES:',
      '#   - "available" = Feature is included in their offering',
      '#   - "partial" = Feature is partially available or limited',
      '#   - "unavailable" = Feature is not offered',
      '#   - "amount" = Feature is available with a specific quantity/limit (fill amount & unit)',
      '#   - "unknown" = Unable to determine availability',
      '# ',
      '# FEATURE AMOUNT: Numeric value when status is "amount" (e.g., 100, 50, unlimited)',
      '# FEATURE UNIT: Unit for the amount (e.g., "users", "GB", "projects", "custom")',
      '# FEATURE NOTE: Optional additional context or details',
      '# ',
      '# PRICING:',
      `#   - currency: ${currency} (all prices in this currency)`,
      '#   - monthly: Monthly price in numeric format (e.g., 29.99)',
      '#   - yearly: Yearly price in numeric format (e.g., 299.99)',
      '#   - note: Optional pricing details (e.g., "per user", "billed annually")',
      '# ',
      '# INSTRUCTIONS:',
      '#   1. Research each competitor listed below',
      `#   2. Find the competitor\'s plan equivalent to our "${planName}" plan`,
      '#   3. Fill in monthly/yearly pricing for that equivalent plan',
      '#   4. For EACH feature column, research that specific feature availability',
      `#   5. All features are for "${planName}" plan equivalent at the competitor`,
      '#   6. Save the completed file as CSV and upload it back',
      '# ================================================================',
      '',
      '# COLUMN REFERENCE:',
      `# Plan: ${planName}`,
      `#   - Pricing: plan_${planId}_monthly, plan_${planId}_yearly, plan_${planId}_note`,
      `#   - Features: ${features.map(f => f.name).join(', ')}`
    ];

    const csv = [...instructions, '', headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'competitors-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowImportDropdown(false);
  };

  // Download JSON Sample
  const downloadJSONSample = () => {
    // Get the selected plan details
    const selectedPlan = pricingPlans.find(p => p.id === config.selected_plan_id);
    const planName = selectedPlan ? (selectedPlan.package || selectedPlan.product_name) : 'Not specified';
    
    // Get only selected competitors
    const selectedCompetitors = competitors.filter(comp => config.competitor_ids?.includes(comp.id));
    
    // Only include the selected plan, not all plans
    const selectedPlanData = selectedPlan ? {
      our_plan_id: selectedPlan.id,
      our_plan_name: selectedPlan.package || selectedPlan.product_name
    } : null;

    const sampleData = selectedCompetitors.map(comp => {
      const compPlan = comp.data?.plans?.find((cp: any) => cp.our_plan_id === config.selected_plan_id);
      
      return {
        name: comp.name,
        logo_url: comp.logo_url || '',
        website_url: comp.website_url || '',
        pricing_plans: selectedPlanData ? [{
          our_plan_id: selectedPlanData.our_plan_id,
          our_plan_name: selectedPlanData.our_plan_name,
          monthly: compPlan?.monthly || '',
          yearly: compPlan?.yearly || '',
          note: compPlan?.note || ''
        }] : [],
        features: features.map(f => {
          const compFeature = comp.data?.features?.find((cf: any) => 
            cf.our_feature_id === f.id && cf.our_plan_id === config.selected_plan_id
          );
          return {
            our_feature_id: f.id,
            our_feature_name: f.name,
            our_plan_id: selectedPlanData?.our_plan_id || '',
            our_plan_name: selectedPlanData?.our_plan_name || '',
            status: compFeature?.status || 'unknown',
            amount: compFeature?.amount || '',
            unit: compFeature?.unit || '',
            note: compFeature?.note || ''
          };
        })
      };
    });
    
    // Create comprehensive data structure with instructions
    const jsonWithInstructions = {
      _instructions: {
        comparison_context: `You are comparing competitors against our "${planName}" plan`,
        task: 'Research and fill in competitor data for the features and pricing below',
        currency: `${currency} (organization default currency - all prices should be in this currency)`,
        output_format: {
          description: 'Return a JSON file with ONLY the "competitors" array',
          example: 'Remove this entire _instructions object and return: [{ "name": "...", "logo_url": "...", "pricing_plans": [...], "features": [...] }]',
          note: 'The result should be a JSON array of competitor objects, not an object with an instructions key'
        },
        data_structure: {
          description: 'Features are in a FLAT ARRAY with plan reference',
          note: `You are comparing ONLY the "${planName}" plan`,
          structure: '{ pricing_plans: [one plan only], features: [{ our_plan_id: "same for all" }] }',
          benefit: 'Minimal token usage - only one plan to research',
          example: `All features reference the same plan: "${planName}"`
        },
        feature_status_values: {
          available: 'Feature is included in their offering',
          partial: 'Feature is partially available or limited',
          unavailable: 'Feature is not offered',
          amount: 'Feature is available with a specific quantity/limit (fill amount & unit)',
          unknown: 'Unable to determine availability'
        },
        feature_fields: {
          our_feature_id: 'Reference ID - do not modify',
          our_feature_name: 'Reference name - do not modify',
          our_plan_id: 'REQUIRED: Links feature to specific plan - do not modify',
          our_plan_name: 'Reference name - do not modify',
          status: 'One of: available, partial, unavailable, amount, unknown',
          amount: 'Numeric value when status is "amount" (e.g., 100, 50, "unlimited")',
          unit: 'Unit for the amount (e.g., "users", "GB", "projects", "custom")',
          note: 'Optional additional context or details'
        },
        pricing_fields: {
          our_plan_id: 'Reference ID - do not modify',
          our_plan_name: 'Reference name - do not modify',
          monthly: `Monthly price in numeric format in ${currency} (e.g., 29.99)`,
          yearly: `Yearly price in numeric format in ${currency} (e.g., 299.99)`,
          note: 'Optional pricing details (e.g., "per user", "billed annually")'
        },
        partial_updates: {
          tip: 'To update only one plan, filter features array by our_plan_id',
          example: 'features.filter(f => f.our_plan_id === "basic-plan-id")',
          benefit: 'Saves 80%+ tokens when updating incrementally'
        },
        steps: [
          'Research each competitor listed in the competitors array',
          `Find the competitor\'s plan equivalent to our "${planName}" plan`,
          'Fill in the monthly/yearly pricing in the single pricing_plans entry',
          'For EACH feature in features array, research that competitor\'s feature availability',
          `All features are for the "${planName}" plan only (our_plan_id is the same for all)`,
          'Feature status: available/unavailable/partial/amount/unknown',
          'Add notes where feature differs from ours or has special conditions',
          'IMPORTANT: Remove this entire _instructions object from the final output',
          'Return ONLY the competitors array: [{ "name": "...", "pricing_plans": [one plan], "features": [...] }]'
        ]
      },
      competitors: sampleData
    };
    
    const json = JSON.stringify(jsonWithInstructions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'competitors-sample.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowImportDropdown(false);
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
      fetchCurrency();
      fetchFeatures();
    }
  }, [organizationId]);

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

  const fetchCurrency = async () => {
    if (!organizationId) return;
    try {
      const response = await fetch(`/api/organizations/${organizationId}`);
      const data = await response.json();
      if (data?.default_currency) {
        setCurrency(data.default_currency);
      }
    } catch (error) {
      console.error('Error fetching currency:', error);
      // Keep default '$'
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showImportDropdown && !target.closest('.relative')) {
        setShowImportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImportDropdown]);

  const handleCreateCompetitor = async () => {
    if (!validateCompetitorForm() || !organizationId) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      await createCompetitor({
        name: newCompetitor.name,
        logo_url: newCompetitor.logo_url || undefined,
        website_url: newCompetitor.website_url || undefined,
      });
      setNewCompetitor({ name: '', logo_url: '', website_url: '' });
      setValidationErrors({});
      setShowCompetitorModal(false);
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
      await updateCompetitor(editingCompetitor.id, {
        name: newCompetitor.name,
        logo_url: newCompetitor.logo_url || undefined,
        website_url: newCompetitor.website_url || undefined,
      });
      setNewCompetitor({ name: '', logo_url: '', website_url: '' });
      setEditingCompetitor(null);
      setShowCompetitorModal(false);
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
      await deleteCompetitor(id);
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
    setShowCompetitorModal(true);
  };

  const cancelEdit = () => {
    setEditingCompetitor(null);
    setNewCompetitor({ name: '', logo_url: '', website_url: '' });
    setShowCompetitorModal(false);
  };

  const updateConfig = (updates: Partial<ComparisonSectionConfig>) => {
    setConfig(prev => {
      const merged = { ...prev };
      
      // Deep merge for nested objects
      if (updates.pricing) {
        merged.pricing = { ...prev.pricing, ...updates.pricing };
      }
      if (updates.features) {
        merged.features = {
          ...prev.features,
          ...updates.features,
          filter: {
            ...prev.features?.filter,
            ...updates.features?.filter,
          },
        };
      }
      if (updates.ui) {
        merged.ui = { ...prev.ui, ...updates.ui };
      }
      if (updates.scoring) {
        merged.scoring = {
          ...prev.scoring,
          ...updates.scoring,
          weights: {
            ...prev.scoring?.weights,
            ...updates.scoring?.weights,
          },
        };
      }
      
      // Apply other top-level updates
      Object.keys(updates).forEach(key => {
        if (!['pricing', 'features', 'ui', 'scoring'].includes(key)) {
          (merged as any)[key] = (updates as any)[key];
        }
      });
      
      return merged;
    });
  };

  const toggleCompetitor = (competitorId: string) => {
    const currentIds = config.competitor_ids || [];
    const newIds = currentIds.includes(competitorId)
      ? currentIds.filter(id => id !== competitorId)
      : [...currentIds, competitorId];
    updateConfig({ competitor_ids: newIds });
  };

  const getCompetitorFeatureStatus = (competitorId: string, planId: string, featureId: string): 'available' | 'partial' | 'unavailable' => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor?.data?.features) return 'unavailable';
    const feature = competitor.data.features.find((f: any) => 
      f.our_feature_id === featureId && f.our_plan_id === planId
    );
    const status = feature?.status || 'unavailable';
    if (status === 'available' || status === 'amount') return 'available';
    if (status === 'partial') return 'partial';
    return 'unavailable';
  };

  const getCompetitorFeatureAmount = (competitorId: string, planId: string, featureId: string): string => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor?.data?.features) return '';
    const feature = competitor.data.features.find((f: any) => 
      f.our_feature_id === featureId && f.our_plan_id === planId
    );
    return feature?.amount || '';
  };

  const getCompetitorFeatureUnit = (competitorId: string, planId: string, featureId: string): CompetitorFeatureAmountUnit => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor?.data?.features) return 'custom';
    const feature = competitor.data.features.find((f: any) => 
      f.our_feature_id === featureId && f.our_plan_id === planId
    );
    return feature?.unit || 'custom';
  };

  const setCompetitorFeatureStatus = async (competitorId: string, planId: string, featureId: string, status: CompetitorFeatureStatus, amount?: string, unit?: CompetitorFeatureAmountUnit, note?: string) => {
    try {
      await updateCompetitorFeature(competitorId, planId, featureId, status, amount, unit, note);
    } catch (error) {
      console.error('Error updating competitor feature:', error);
      alert('Failed to update competitor feature');
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
      <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('competitors')}
          className={`px-3 sm:px-4 py-2 -mb-px text-sm sm:text-base whitespace-nowrap ${
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
          className={`px-3 sm:px-4 py-2 -mb-px text-sm sm:text-base whitespace-nowrap ${
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
          className={`px-3 sm:px-4 py-2 -mb-px text-sm sm:text-base whitespace-nowrap ${
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
          onClick={() => setActiveTab('display')}
          className={`px-3 sm:px-4 py-2 -mb-px text-sm sm:text-base whitespace-nowrap ${
            activeTab === 'display'
              ? 'border-b-2 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={
            activeTab === 'display'
              ? { borderBottomColor: themeColors.cssVars.primary.base, color: themeColors.cssVars.primary.base }
              : {}
          }
        >
          Display
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 sm:px-4 py-2 -mb-px text-sm sm:text-base whitespace-nowrap ${
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <h3 className="text-base sm:text-lg font-medium">Select Competitors</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <button
                  onClick={() => setShowImportDropdown(!showImportDropdown)}
                  className="px-3 sm:px-4 py-2 hover:bg-gray-50 text-gray-700 rounded-lg transition-all flex items-center gap-2 text-sm"
                  style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}
                  disabled={!!importProgress}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="whitespace-nowrap">Import</span>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showImportDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                    <label className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => { handleCSVImport(e); setShowImportDropdown(false); }}
                        className="hidden"
                        disabled={!!importProgress}
                      />
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload .csv
                      </div>
                    </label>
                    
                    <label className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-t border-gray-100">
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => { handleJSONImport(e); setShowImportDropdown(false); }}
                        className="hidden"
                        disabled={!!importProgress}
                      />
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload .json
                      </div>
                    </label>
                    
                    <button
                      onClick={downloadCSVSample}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Sample .csv
                      </div>
                    </button>
                    
                    <button
                      onClick={downloadJSONSample}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Sample .json
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setEditingCompetitor(null);
                  setNewCompetitor({ name: '', logo_url: '', website_url: '' });
                  setShowCompetitorModal(true);
                }}
                className="px-3 sm:px-4 py-2 text-white rounded-lg transition-all hover:opacity-90 text-sm whitespace-nowrap"
                style={{ backgroundColor: themeColors.cssVars.primary.base }}
              >
                Add Competitor
              </button>
            </div>
          </div>

          {importProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              {importProgress}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <CompetitorList
            competitors={competitors}
            selectedIds={config.competitor_ids}
            loading={competitorsLoading}
            onToggleSelect={toggleCompetitor}
            onEdit={startEdit}
            onDelete={handleDeleteCompetitor}
          />
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <PricingConfig
          config={config}
          pricingPlans={pricingPlans}
          selectedCompetitors={selectedCompetitors}
          onConfigUpdate={updateConfig}
          onPricingUpdate={updateCompetitorPricing}
          currency={currency}
        />
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <FeatureConfig
          config={config}
          features={features}
          selectedCompetitors={selectedCompetitors}
          showAllFeatures={showAllFeatures}
          onShowAllFeaturesChange={setShowAllFeatures}
          onFeatureUpdate={setCompetitorFeatureStatus}
          getCompetitorFeatureUnit={getCompetitorFeatureUnit}
        />
      )}

      {/* Display Tab */}
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

            <label className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={config.ui?.allow_plan_selection ?? true}
                onChange={(e) => updateConfig({
                  ui: {
                    ...config.ui,
                    allow_plan_selection: e.target.checked
                  }
                })}
                className="h-5 w-5"
                style={{ accentColor: themeColors.cssVars.primary.base }}
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Allow plan selection</span>
                <p className="text-xs text-gray-600 mt-0.5">Let users choose/switch between pricing plans (disable to show default plan only)</p>
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
      
      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <ComparisonPreview
          config={config}
          competitors={competitors}
          pricingPlans={pricingPlans}
          features={features}
          currency={currency}
          siteName={organizationId ? 'You' : 'Your Brand'}
        />
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

    {/* Competitor Add/Edit Modal */}
    {showCompetitorModal && (
      <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/20">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center" style={{ borderBottomColor: themeColors.cssVars.primary.border, borderBottomWidth: '1px' }}>
            <h3 className="text-lg font-semibold">
              {editingCompetitor ? 'Edit Competitor' : 'Add Competitor'}
            </h3>
            <button
              onClick={() => {
                setShowCompetitorModal(false);
                setEditingCompetitor(null);
                setNewCompetitor({ name: '', logo_url: '', website_url: '' });
                setValidationErrors({});
                setErrorMessage(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700" style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}>
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
                className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ borderColor: validationErrors.name ? '#ef4444' : themeColors.cssVars.primary.border, borderWidth: '1px' }}
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
                  className="flex-1 px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ borderColor: validationErrors.logo_url ? '#ef4444' : themeColors.cssVars.primary.border, borderWidth: '1px' }}
                />
                <Button
                  type="button"
                  onClick={() => openImageGallery('new')}
                  variant="outline"
                  size="default"
                >
                  Browse
                </Button>
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
                  className="flex-1 px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ borderColor: validationErrors.website_url ? '#ef4444' : themeColors.cssVars.primary.border, borderWidth: '1px' }}
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
          </div>

          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3" style={{ borderTopColor: themeColors.cssVars.primary.border, borderTopWidth: '1px' }}>
            <Button
              onClick={async () => {
                if (editingCompetitor) {
                  await handleUpdateCompetitor();
                } else {
                  await handleCreateCompetitor();
                }
                if (!validationErrors.name && !validationErrors.logo_url && !validationErrors.website_url) {
                  setShowCompetitorModal(false);
                }
              }}
              disabled={!newCompetitor.name.trim() || saving}
              variant="primary"
              className="flex-1"
            >
              {saving ? 'Saving...' : (editingCompetitor ? 'Update Competitor' : 'Create Competitor')}
            </Button>
            <Button
              onClick={() => {
                setShowCompetitorModal(false);
                setEditingCompetitor(null);
                setNewCompetitor({ name: '', logo_url: '', website_url: '' });
                setValidationErrors({});
                setErrorMessage(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

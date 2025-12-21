# Competitor Comparison Feature - Detailed Implementation Plan

## Overview
This plan implements a competitor comparison template section that displays pricing and feature comparisons in a clean, maintainable way using JSONB storage.

---

## Phase 1: Database Schema (SQL Migration)

### File: `database/migrations/add_comparison_competitor_table.sql`

```sql
-- Migration: Add comparison_competitor table for template sections
-- Purpose: Store competitor data for pricing/feature comparisons

-- Create comparison_competitor table
CREATE TABLE IF NOT EXISTS comparison_competitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Organization ownership
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  
  -- Comparison data (JSONB for flexibility)
  data JSONB DEFAULT '{
    "plans": [],
    "features": []
  }'::jsonb,
  
  -- Metadata tracking
  pricing_last_checked TIMESTAMP WITH TIME ZONE,
  features_last_checked TIMESTAMP WITH TIME ZONE,
  data_source VARCHAR(50) DEFAULT 'manual' CHECK (data_source IN ('manual', 'import', 'api')),
  notes TEXT,
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT unique_competitor_per_org UNIQUE (organization_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_comparison_competitor_org ON comparison_competitor(organization_id);
CREATE INDEX idx_comparison_competitor_active ON comparison_competitor(is_active) WHERE is_active = true;
CREATE INDEX idx_comparison_competitor_data ON comparison_competitor USING GIN (data);

-- Enable Row Level Security
ALTER TABLE comparison_competitor ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access - anyone can view competitors (for public comparison sections)
CREATE POLICY "Public can view competitors" 
  ON comparison_competitor
  FOR SELECT 
  USING (is_active = true);

-- RLS Policy: Only admins/superadmins can manage (INSERT/UPDATE/DELETE) competitors
CREATE POLICY "Only admins can manage competitors" 
  ON comparison_competitor
  FOR ALL 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'superadmin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'superadmin')
    )
  );

-- Add 'comparison' to section_type enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_type_enum') THEN
    -- Check if 'comparison' already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'section_type_enum'::regtype 
      AND enumlabel = 'comparison'
    ) THEN
      ALTER TYPE section_type_enum ADD VALUE 'comparison';
      RAISE NOTICE 'Added comparison to section_type_enum';
    ELSE
      RAISE NOTICE 'comparison already exists in section_type_enum';
    END IF;
  ELSE
    RAISE NOTICE 'section_type_enum does not exist - no action needed';
  END IF;
END
$$;

-- Helper function to validate comparison data JSONB structure
CREATE OR REPLACE FUNCTION validate_comparison_data(data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check that data has plans and features arrays
  IF NOT (data ? 'plans' AND jsonb_typeof(data->'plans') = 'array') THEN
    RETURN FALSE;
  END IF;
  
  IF NOT (data ? 'features' AND jsonb_typeof(data->'features') = 'array') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint
ALTER TABLE comparison_competitor 
ADD CONSTRAINT valid_comparison_data 
CHECK (validate_comparison_data(data));

COMMENT ON TABLE comparison_competitor IS 'Stores competitor information for comparison template sections';
COMMENT ON COLUMN comparison_competitor.data IS 'JSONB structure: { "plans": [{ "our_plan_id": "uuid", "monthly": 19, "yearly": 190, "note": "" }], "features": [{ "our_feature_id": "uuid", "status": "available|partial|unavailable|unknown", "note": "" }] }';
```

---

## Phase 2: TypeScript Types

### File: `src/types/comparison.ts`

```typescript
// Comparison feature types
export type CompetitorFeatureStatus = 'available' | 'partial' | 'unavailable' | 'unknown';
export type ComparisonMode = 'pricing' | 'features' | 'both';
export type CompetitorDataSource = 'manual' | 'import' | 'api';

export interface CompetitorPlan {
  our_plan_id: string; // References pricingplan.id
  monthly?: number;
  yearly?: number;
  note?: string;
}

export interface CompetitorFeature {
  our_feature_id: string; // References feature.id
  status: CompetitorFeatureStatus;
  note?: string;
  competitor_label?: string; // Their marketing name for it (optional)
}

export interface CompetitorData {
  plans: CompetitorPlan[];
  features: CompetitorFeature[];
}

export interface ComparisonCompetitor {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: number;
  name: string;
  logo_url?: string;
  website_url?: string;
  data: CompetitorData;
  pricing_last_checked?: string;
  features_last_checked?: string;
  data_source: CompetitorDataSource;
  notes?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ComparisonSectionConfig {
  competitor_ids: string[];
  mode: ComparisonMode;
  pricing?: {
    our_plan_ids?: string[]; // If empty, show all
    show_interval: 'monthly' | 'yearly' | 'both';
  };
  features?: {
    filter?: {
      display_on_product?: boolean;
      types?: string[];
    };
    our_feature_ids?: string[]; // If specified, only show these
  };
  ui?: {
    highlight_ours?: boolean;
    show_disclaimer?: boolean;
    disclaimer_text?: string;
  };
}

// For rendering
export interface ComparisonViewModel {
  competitors: ComparisonCompetitor[];
  ourPricingPlans: any[]; // From your existing pricingplan table
  ourFeatures: any[]; // From your existing feature table
  config: ComparisonSectionConfig;
}
```

---

## Phase 3: API Endpoints

### File: `src/app/api/comparison/competitors/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List competitors for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('comparison_competitor')
      .select('*')
      .eq('organization_id', parseInt(organizationId))
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ competitors: data || [] });
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

// POST - Create a new competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, name, logo_url, website_url, data, notes } = body;

    if (!organization_id || !name) {
      return NextResponse.json(
        { error: 'organization_id and name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const competitorData = {
      organization_id: parseInt(organization_id),
      name,
      logo_url: logo_url || null,
      website_url: website_url || null,
      data: data || { plans: [], features: [] },
      notes: notes || null,
      data_source: 'manual',
      is_active: true,
    };

    const { data: created, error } = await supabase
      .from('comparison_competitor')
      .insert([competitorData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ competitor: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating competitor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create competitor' },
      { status: 500 }
    );
  }
}

// PUT - Update existing competitor
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, logo_url, website_url, data, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (website_url !== undefined) updates.website_url = website_url;
    if (data !== undefined) updates.data = data;
    if (notes !== undefined) updates.notes = notes;

    const { data: updated, error } = await supabase
      .from('comparison_competitor')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ competitor: updated });
  } catch (error: any) {
    console.error('Error updating competitor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update competitor' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete (set is_active to false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('comparison_competitor')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}
```

### File: `src/app/api/comparison/section-data/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all data needed to render a comparison section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section_id');
    const organizationId = searchParams.get('organization_id');

    if (!sectionId || !organizationId) {
      return NextResponse.json(
        { error: 'section_id and organization_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the template section to get config
    const { data: section, error: sectionError } = await supabase
      .from('website_templatesection')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (sectionError) throw sectionError;

    const config: any = section.comparison_config || {};
    const competitorIds = config.competitor_ids || [];

    // Fetch competitors
    const { data: competitors, error: competitorsError } = await supabase
      .from('comparison_competitor')
      .select('*')
      .in('id', competitorIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (competitorsError) throw competitorsError;

    // Fetch our pricing plans
    let ourPricingPlans = [];
    if (config.mode === 'pricing' || config.mode === 'both') {
      const planQuery = supabase
        .from('pricingplan')
        .select('*')
        .eq('organization_id', parseInt(organizationId))
        .eq('is_active', true);

      if (config.pricing?.our_plan_ids && config.pricing.our_plan_ids.length > 0) {
        planQuery.in('id', config.pricing.our_plan_ids);
      }

      const { data: plans, error: plansError } = await planQuery;
      if (plansError) throw plansError;
      ourPricingPlans = plans || [];
    }

    // Fetch our features
    let ourFeatures = [];
    if (config.mode === 'features' || config.mode === 'both') {
      const featureQuery = supabase
        .from('feature')
        .select('*')
        .eq('organization_id', parseInt(organizationId));

      if (config.features?.our_feature_ids && config.features.our_feature_ids.length > 0) {
        featureQuery.in('id', config.features.our_feature_ids);
      } else if (config.features?.filter) {
        if (config.features.filter.display_on_product) {
          featureQuery.eq('display_on_product', true);
        }
        if (config.features.filter.types && config.features.filter.types.length > 0) {
          featureQuery.in('type', config.features.filter.types);
        }
      }

      const { data: features, error: featuresError } = await featureQuery;
      if (featuresError) throw featuresError;
      ourFeatures = features || [];
    }

    return NextResponse.json({
      competitors: competitors || [],
      ourPricingPlans,
      ourFeatures,
      config,
    });
  } catch (error: any) {
    console.error('Error fetching comparison section data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}
```

---

## Phase 4: Template Section Modal Integration

### File: `src/components/modals/TemplateSectionModal/components/ComparisonTab.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { ComparisonCompetitor, ComparisonSectionConfig, CompetitorPlan, CompetitorFeature } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ComparisonTabProps {
  formData: any;
  setFormData: (data: any) => void;
  organizationId: number;
}

export function ComparisonTab({ formData, setFormData, organizationId }: ComparisonTabProps) {
  const [competitors, setCompetitors] = useState<ComparisonCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'competitors' | 'pricing' | 'features'>('competitors');
  const themeColors = useThemeColors();

  const config: ComparisonSectionConfig = formData.comparison_config || {
    competitor_ids: [],
    mode: 'both',
    pricing: { show_interval: 'both' },
    features: { filter: { display_on_product: true } },
    ui: { highlight_ours: true, show_disclaimer: true },
  };

  useEffect(() => {
    fetchCompetitors();
  }, [organizationId]);

  const fetchCompetitors = async () => {
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

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('competitors')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'competitors'
              ? 'border-b-2 text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={activeTab === 'competitors' ? {
            borderBottomColor: themeColors.cssVars.primary.base,
            color: themeColors.cssVars.primary.base
          } : {}}
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
          style={activeTab === 'pricing' ? {
            borderBottomColor: themeColors.cssVars.primary.base,
            color: themeColors.cssVars.primary.base
          } : {}}
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
          style={activeTab === 'features' ? {
            borderBottomColor: themeColors.cssVars.primary.base,
            color: themeColors.cssVars.primary.base
          } : {}}
        >
          Features
        </button>
      </div>

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Select Competitors</h3>
            <button
              onClick={() => {
                // TODO: Open create competitor modal
              }}
              className="px-4 py-2 text-white rounded-lg transition-all"
              style={{
                backgroundColor: themeColors.cssVars.primary.base,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Add Competitor
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading competitors...</p>
          ) : competitors.length === 0 ? (
            <p className="text-gray-500">No competitors added yet. Click "Add Competitor" to get started.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {competitors.map((competitor) => (
                <label
                  key={competitor.id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.competitor_ids.includes(competitor.id)}
                    onChange={() => toggleCompetitor(competitor.id)}
                    className="h-4 w-4"
                    style={{
                      accentColor: themeColors.cssVars.primary.base,
                    }}
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        {competitor.website_url}
                      </a>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Configure how pricing is compared. Selected competitors' pricing will be displayed alongside your plans.
          </p>
          
          <div>
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
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Configure which features to compare. Features marked as available/unavailable for each competitor.
          </p>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.features?.filter?.display_on_product || false}
                onChange={(e) =>
                  updateConfig({
                    features: {
                      ...config.features,
                      filter: {
                        ...config.features?.filter,
                        display_on_product: e.target.checked,
                      },
                    },
                  })
                }
                className="h-4 w-4"
                style={{
                  accentColor: themeColors.cssVars.primary.base,
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                Only show features displayed on products
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 5: Register Section Type

### Update: `src/components/modals/TemplateSectionModal/TemplateSectionEditModal.tsx`

Find the section type detection logic (around line 200-220) and add:

```typescript
// Add this to the section type detection logic
else if (section.section_type === 'comparison') sectionType = 'comparison';
```

Find the content tabs rendering (around line 600-800) and add the comparison tab:

```typescript
{activeTopTab === 'content' && openMenu === 'content' && sectionType === 'comparison' && (
  <ComparisonTab 
    formData={formData} 
    setFormData={setFormData} 
    organizationId={editingSection?.organization_id || 0}
  />
)}
```

Import the ComparisonTab at the top:

```typescript
import { ComparisonTab } from './components/ComparisonTab';
```

---

## Phase 6: Frontend Component

### File: `src/components/TemplateSections/ComparisonSection.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { ComparisonViewModel } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ComparisonSectionProps {
  section: any;
}

export default function ComparisonSection({ section }: ComparisonSectionProps) {
  const [viewModel, setViewModel] = useState<ComparisonViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showYearly, setShowYearly] = useState(false);
  const themeColors = useThemeColors();

  useEffect(() => {
    fetchData();
  }, [section.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/comparison/section-data?section_id=${section.id}&organization_id=${section.organization_id}`
      );
      const data = await response.json();
      setViewModel(data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center">Loading comparison...</div>;
  }

  if (!viewModel) {
    return null;
  }

  const { competitors, ourPricingPlans, ourFeatures, config } = viewModel;
  const showPricing = config.mode === 'pricing' || config.mode === 'both';
  const showFeatures = config.mode === 'features' || config.mode === 'both';

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {section.section_title || 'Compare Plans'}
          </h2>
          {section.section_description && (
            <p className="text-xl text-gray-600">{section.section_description}</p>
          )}
        </div>

        {/* Pricing Comparison */}
        {showPricing && ourPricingPlans.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-semibold mb-6">Pricing Comparison</h3>
            
            {config.pricing?.show_interval === 'both' && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setShowYearly(false)}
                    className={`px-4 py-2 rounded-md transition ${
                      !showYearly
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={!showYearly ? {
                      backgroundColor: themeColors.cssVars.primary.base,
                    } : {}}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setShowYearly(true)}
                    className={`px-4 py-2 rounded-md transition ${
                      showYearly
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={showYearly ? {
                      backgroundColor: themeColors.cssVars.primary.base,
                    } : {}}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-semibold">Plan</th>
                    <th
                      className="text-center p-4 font-semibold"
                      style={{
                        backgroundColor: config.ui?.highlight_ours
                          ? themeColors.cssVars.primary.lighter + '40'
                          : 'transparent',
                      }}
                    >
                      You
                    </th>
                    {competitors.map((competitor) => (
                      <th key={competitor.id} className="text-center p-4 font-semibold">
                        {competitor.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ourPricingPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium">{plan.product_name}</td>
                      <td
                        className="p-4 text-center text-lg font-bold"
                        style={{
                          backgroundColor: config.ui?.highlight_ours
                            ? themeColors.cssVars.primary.lighter + '20'
                            : 'transparent',
                          color: config.ui?.highlight_ours
                            ? themeColors.cssVars.primary.base
                            : 'inherit',
                        }}
                      >
                        {plan.currency_symbol || '$'}
                        {showYearly && plan.price_yearly
                          ? plan.price_yearly
                          : plan.price_monthly || plan.price_manual}
                      </td>
                      {competitors.map((competitor) => {
                        const competitorPlan = competitor.data.plans.find(
                          (p) => p.our_plan_id === plan.id
                        );
                        return (
                          <td key={competitor.id} className="p-4 text-center">
                            {competitorPlan ? (
                              <div>
                                <div className="text-lg font-semibold">
                                  $
                                  {showYearly && competitorPlan.yearly
                                    ? competitorPlan.yearly
                                    : competitorPlan.monthly || '—'}
                                </div>
                                {competitorPlan.note && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {competitorPlan.note}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature Comparison */}
        {showFeatures && ourFeatures.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-6">Feature Comparison</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-semibold sticky left-0 bg-white">
                      Feature
                    </th>
                    <th
                      className="text-center p-4 font-semibold"
                      style={{
                        backgroundColor: config.ui?.highlight_ours
                          ? themeColors.cssVars.primary.lighter + '40'
                          : 'transparent',
                      }}
                    >
                      You
                    </th>
                    {competitors.map((competitor) => (
                      <th key={competitor.id} className="text-center p-4 font-semibold">
                        {competitor.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ourFeatures.map((feature) => (
                    <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        {feature.name}
                      </td>
                      <td
                        className="p-4 text-center"
                        style={{
                          backgroundColor: config.ui?.highlight_ours
                            ? themeColors.cssVars.primary.lighter + '20'
                            : 'transparent',
                        }}
                      >
                        <span className="text-green-600 text-xl">✓</span>
                      </td>
                      {competitors.map((competitor) => {
                        const competitorFeature = competitor.data.features.find(
                          (f) => f.our_feature_id === feature.id
                        );
                        const status = competitorFeature?.status || 'unknown';
                        
                        return (
                          <td key={competitor.id} className="p-4 text-center">
                            {status === 'available' && (
                              <span className="text-green-600 text-xl">✓</span>
                            )}
                            {status === 'partial' && (
                              <span className="text-yellow-600 text-xl">~</span>
                            )}
                            {status === 'unavailable' && (
                              <span className="text-red-600 text-xl">✕</span>
                            )}
                            {status === 'unknown' && (
                              <span className="text-gray-400">—</span>
                            )}
                            {competitorFeature?.note && (
                              <div className="text-xs text-gray-500 mt-1">
                                {competitorFeature.note}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {config.ui?.show_disclaimer && (
          <div className="mt-8 text-center text-sm text-gray-500">
            {config.ui.disclaimer_text ||
              'Pricing and feature information is based on publicly available data and may not be current. Please verify with providers.'}
          </div>
        )}
      </div>
    </section>
  );
}
```

---

## Phase 7: Register in Section Renderer

### Update: `src/components/TemplateSections/SectionTypeRenderer.tsx`

Add import:

```typescript
const ComparisonSection = dynamic(() => import('./ComparisonSection'));
```

Add to the switch/if-else rendering logic:

```typescript
if (section.section_type === 'comparison') {
  return <ComparisonSection key={section.id} section={section} />;
}
```

---

## Implementation Checklist

- [ ] Run SQL migration to create `comparison_competitor` table
- [ ] Create `src/types/comparison.ts` with all interfaces
- [ ] Create API route `/api/comparison/competitors/route.ts`
- [ ] Create API route `/api/comparison/section-data/route.ts`
- [ ] Create `ComparisonTab.tsx` component
- [ ] Update `TemplateSectionEditModal.tsx` to register comparison type
- [ ] Create `ComparisonSection.tsx` component
- [ ] Update `SectionTypeRenderer.tsx` to render comparison sections
- [ ] Test creating a competitor
- [ ] Test adding competitor pricing/features
- [ ] Test rendering comparison section on frontend
- [ ] Add mobile responsive tabs (optional enhancement)
- [ ] Add CSV import for bulk competitor data (optional enhancement)

---

## Next Steps

1. Run the migration
2. Test the API endpoints in Postman/browser
3. Implement the admin UI for competitor management
4. Build the comparison section component
5. Add mobile-specific enhancements (tabs instead of scroll)
6. Consider adding export functionality for sharing comparisons

This plan provides a complete, production-ready implementation that leverages your existing data structures while keeping competitor data simple and maintainable.

'use client';

import React from 'react';
import { ComparisonCompetitor } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PricingConfigProps {
  config: any;
  pricingPlans: any[];
  selectedCompetitors: ComparisonCompetitor[];
  onConfigUpdate: (updates: any) => void;
  onPricingUpdate: (competitorId: string, planId: string, interval: 'monthly' | 'yearly' | 'price' | 'note', price: number | string | undefined) => void;
  currency?: string;
}

export function PricingConfig({
  config,
  pricingPlans,
  selectedCompetitors,
  onConfigUpdate,
  onPricingUpdate,
  currency = '$'
}: PricingConfigProps) {
  const themeColors = useThemeColors();

  const validatePrice = (price: number | undefined): boolean => {
    if (price === undefined) return true;
    return price >= 0 && price <= 999999;
  };

  if (!config.selected_plan_id) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Please select a pricing plan first</p>
      </div>
    );
  }

  if (selectedCompetitors.length === 0) {
    return (
      <p className="text-gray-500">Select competitors first to configure their pricing.</p>
    );
  }

  const plan = pricingPlans.find(p => p.id === config.selected_plan_id);
  if (!plan) {
    return <p className="text-gray-500">Selected plan not found</p>;
  }

  const planName = plan.package ? `${plan.product_name} - ${plan.package}` : (plan.product_name || 'Unnamed Plan');
  const isRecurring = plan.type === 'recurring';

  return (
    <div className="space-y-4">
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
            onConfigUpdate({
              pricing: {
                ...config.pricing,
                show_interval: e.target.value,
              },
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Pricing display interval"
        >
          <option value="monthly">Monthly only</option>
          <option value="yearly">Yearly only</option>
          <option value="both">Both (with toggle)</option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium text-gray-900">Competitor Pricing</h4>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {currency}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Enter competitor prices for the selected plan.
        </p>

        <div className="rounded-lg p-4" style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium">{planName}</p>
            <div className="text-sm text-gray-600">
              Your price:
              {plan.price && <span className="ml-1 font-medium">{currency}{(plan.price / 100).toFixed(2)}/mo</span>}
              {!plan.price && <span className="ml-1 text-gray-400">Not set</span>}
            </div>
          </div>
          <div className="space-y-3">
            {selectedCompetitors.map((competitor) => {
              const competitorPlan: any = competitor.data?.plans?.find((p: any) => p.our_plan_id === plan.id) || {};
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
                          placeholder={`e.g. 29.99`}
                          value={competitorPlan.monthly || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            if (validatePrice(value)) {
                              onPricingUpdate(competitor.id, plan.id, 'monthly', value);
                            }
                          }}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label={`Monthly price for ${competitor.name}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Yearly Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="999999"
                          placeholder={`e.g. 299.99`}
                          value={competitorPlan.yearly || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            if (validatePrice(value)) {
                              onPricingUpdate(competitor.id, plan.id, 'yearly', value);
                            }
                          }}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label={`Yearly price for ${competitor.name}`}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Note (optional)</label>
                        <textarea
                          placeholder="Add a note about this plan..."
                          value={competitorPlan.note || ''}
                          onChange={(e) => {
                            onPricingUpdate(competitor.id, plan.id, 'note', e.target.value);
                          }}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                          aria-label={`Note for ${competitor.name}`}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="999999"
                        placeholder={`e.g. 99.99`}
                        value={(competitorPlan as any).price || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          if (validatePrice(value)) {
                            onPricingUpdate(competitor.id, plan.id, 'price', value);
                          }
                        }}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label={`Price for ${competitor.name}`}
                      />
                      <label className="block text-xs text-gray-600 mb-1 mt-2">Note (optional)</label>
                      <textarea
                        placeholder="Add a note about this plan..."
                        value={competitorPlan.note || ''}
                        onChange={(e) => {
                          onPricingUpdate(competitor.id, plan.id, 'note', e.target.value);
                        }}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        aria-label={`Note for ${competitor.name}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
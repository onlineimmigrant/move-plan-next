'use client';

import React, { useState } from 'react';
import { ComparisonCompetitor, CompetitorFeatureStatus, CompetitorFeatureAmountUnit } from '@/types/comparison';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CheckIcon, XMarkIcon, MinusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FeatureRowSkeleton } from '@/components/ui/Skeleton';

interface FeatureConfigProps {
  config: any;
  features: any[];
  selectedCompetitors: ComparisonCompetitor[];
  showAllFeatures: boolean;
  onShowAllFeaturesChange: (showAll: boolean) => void;
  onFeatureUpdate: (competitorId: string, planId: string, featureId: string, status: CompetitorFeatureStatus, amount?: string, unit?: CompetitorFeatureAmountUnit, note?: string) => void;
  getCompetitorFeatureUnit: (competitorId: string, planId: string, featureId: string) => CompetitorFeatureAmountUnit;
}

export function FeatureConfig({
  config,
  features,
  selectedCompetitors,
  showAllFeatures,
  onShowAllFeaturesChange,
  onFeatureUpdate,
  getCompetitorFeatureUnit
}: FeatureConfigProps) {
  const themeColors = useThemeColors();
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['Other'])); // Default 'Other' to open

  const toggleAccordion = (type: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const getCompetitorFeatureStatus = (competitorId: string, planId: string, featureId: string): string => {
    const competitor = selectedCompetitors.find(c => c.id === competitorId);
    if (!competitor?.data?.features) return 'unavailable';
    const feature = competitor.data.features.find((f: any) => 
      f.our_feature_id === featureId && f.our_plan_id === planId
    );
    return feature?.status || 'unavailable';
  };

  const getCompetitorFeatureAmount = (competitorId: string, planId: string, featureId: string): string => {
    const competitor = selectedCompetitors.find(c => c.id === competitorId);
    if (!competitor?.data?.features) return '';
    const feature = competitor.data.features.find((f: any) => 
      f.our_feature_id === featureId && f.our_plan_id === planId
    );
    return feature?.amount || '';
  };

  const getCompetitorFeatureNote = (competitorId: string, planId: string, featureId: string): string => {
    const competitor = selectedCompetitors.find(c => c.id === competitorId);
    if (!competitor?.data?.features) return '';
    const feature = competitor.data.features.find((f: any) => 
      f.our_feature_id === featureId && f.our_plan_id === planId
    );
    return feature?.note || '';
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
      <p className="text-gray-500">Select competitors first to configure their features.</p>
    );
  }

  const filteredFeatures = features.filter(f => showAllFeatures || f.display_on_product_card);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Feature Configuration</h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showAllFeatures}
                onChange={(e) => onShowAllFeaturesChange(e.target.checked)}
                className="rounded"
                style={{ accentColor: themeColors.cssVars.primary.base }}
                aria-label="Show all features"
              />
              <span className="text-gray-700">Show all features</span>
            </label>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Mark which features each competitor has for the selected plan.
          {!showAllFeatures && " (Showing product card features only)"}
        </p>
      </div>

      <div className="space-y-4">
        {filteredFeatures.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No features found for the selected plan.</p>
          </div>
        ) : (
          (() => {
            // Group features by type and sort by order within each group
            const groupedFeatures = filteredFeatures.reduce((acc: any, feature: any) => {
              const type = feature.type || 'Other';
              if (!acc[type]) acc[type] = [];
              acc[type].push(feature);
              return acc;
            }, {});

            // Sort features within each group by order
            Object.keys(groupedFeatures).forEach(type => {
              groupedFeatures[type].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            });

            // Render grouped features as accordions
            return Object.entries(groupedFeatures).map(([type, typeFeatures]: [string, any]) => {
              const isOpen = openAccordions.has(type);
              const featureCount = typeFeatures.length;

              return (
                <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(type)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    aria-expanded={isOpen}
                    aria-controls={`accordion-content-${type}`}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                        {type}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {featureCount} feature{featureCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    id={`accordion-content-${type}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="max-h-[600px] overflow-y-auto">
                      <div className="p-4 space-y-4 bg-white">
                        {typeFeatures.map((feature: any) => (
                        <div key={feature.id} className="rounded-lg p-4" style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}>
                          <p className="font-medium mb-2">{feature.name}</p>
                          <div className="space-y-2">
                            {selectedCompetitors.map((competitor) => {
                              const status = getCompetitorFeatureStatus(competitor.id, config.selected_plan_id, feature.id);
                              const amount = getCompetitorFeatureAmount(competitor.id, config.selected_plan_id, feature.id);
                              return (
                                <div key={competitor.id} className="rounded p-2" style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}>
                                  <div className="mb-2">
                                    <span className="text-sm font-medium truncate block mb-2">{competitor.name}</span>
                                    <div className="flex flex-wrap gap-1">
                                      <button
                                        onClick={() => onFeatureUpdate(competitor.id, config.selected_plan_id, feature.id, 'available', '')}
                                        className={`px-2 py-1 rounded text-xs ${
                                          status === 'available'
                                            ? 'bg-green-100 text-green-600'
                                            : 'text-gray-400 hover:text-green-600'
                                        }`}
                                        title="Available"
                                        aria-label={`Mark ${feature.name} as available for ${competitor.name}`}
                                      >
                                        <CheckIcon className="h-3 w-3 inline mr-1" />
                                        Available
                                      </button>
                                      <button
                                        onClick={() => onFeatureUpdate(competitor.id, config.selected_plan_id, feature.id, 'partial', '')}
                                        className={`px-2 py-1 rounded text-xs ${
                                          status === 'partial'
                                            ? 'bg-yellow-100 text-yellow-600'
                                            : 'text-gray-400 hover:text-yellow-600'
                                        }`}
                                        title="Partial"
                                        aria-label={`Mark ${feature.name} as partial for ${competitor.name}`}
                                      >
                                        <MinusIcon className="h-3 w-3 inline mr-1" />
                                        Partial
                                      </button>
                                      <button
                                        onClick={() => onFeatureUpdate(competitor.id, config.selected_plan_id, feature.id, 'unavailable', '')}
                                        className={`px-2 py-1 rounded text-xs ${
                                          status === 'unavailable'
                                            ? 'bg-red-100 text-red-600'
                                            : 'text-gray-400 hover:text-red-600'
                                        }`}
                                        title="Unavailable"
                                        aria-label={`Mark ${feature.name} as unavailable for ${competitor.name}`}
                                      >
                                        <XMarkIcon className="h-3 w-3 inline mr-1" />
                                        Unavailable
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <label className="text-xs text-gray-600 block mb-1">Or specify amount:</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => {
                                          const unit = getCompetitorFeatureUnit(competitor.id, config.selected_plan_id, feature.id);
                                          onFeatureUpdate(competitor.id, config.selected_plan_id, feature.id, 'amount', e.target.value, unit);
                                        }}
                                        placeholder="e.g., 10, 100, unlimited"
                                        className={`flex-1 px-2 py-1 text-xs rounded ${
                                          status === 'amount' ? 'bg-blue-50' : ''
                                        }`}
                                        style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}
                                        aria-label={`Amount for ${feature.name} on ${competitor.name}`}
                                      />
                                      <select
                                        value={getCompetitorFeatureUnit(competitor.id, config.selected_plan_id, feature.id)}
                                        onChange={(e) => {
                                          const currentAmount = getCompetitorFeatureAmount(competitor.id, config.selected_plan_id, feature.id);
                                          onFeatureUpdate(competitor.id, config.selected_plan_id, feature.id, 'amount', currentAmount, e.target.value as CompetitorFeatureAmountUnit);
                                        }}
                                        className="px-2 py-1 text-xs rounded"
                                        style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}
                                        aria-label={`Unit for ${feature.name} amount on ${competitor.name}`}
                                      >
                                        <option value="users">user(s)</option>
                                        <option value="GB">GB</option>
                                        <option value="MB">MB</option>
                                        <option value="TB">TB</option>
                                        <option value="currency">currency</option>
                                        <option value="projects">project(s)</option>
                                        <option value="items">item(s)</option>
                                        <option value="seats">seat(s)</option>
                                        <option value="api_calls">API calls</option>
                                        <option value="integrations">integration(s)</option>
                                        <option value="custom">custom</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <label className="text-xs text-gray-600 block mb-1">Note (optional):</label>
                                    <textarea
                                      value={getCompetitorFeatureNote(competitor.id, config.selected_plan_id, feature.id)}
                                      onChange={(e) => {
                                        const currentAmount = getCompetitorFeatureAmount(competitor.id, config.selected_plan_id, feature.id);
                                        const currentUnit = getCompetitorFeatureUnit(competitor.id, config.selected_plan_id, feature.id);
                                        const currentStatus = getCompetitorFeatureStatus(competitor.id, config.selected_plan_id, feature.id);
                                        onFeatureUpdate(competitor.id, config.selected_plan_id, feature.id, currentStatus as CompetitorFeatureStatus, currentAmount, currentUnit, e.target.value);
                                      }}
                                      placeholder="Add a note about this feature..."
                                      className="w-full px-2 py-1 text-xs rounded resize-none"
                                      style={{ borderColor: themeColors.cssVars.primary.border, borderWidth: '1px' }}
                                      rows={2}
                                      aria-label={`Note for ${feature.name} on ${competitor.name}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}
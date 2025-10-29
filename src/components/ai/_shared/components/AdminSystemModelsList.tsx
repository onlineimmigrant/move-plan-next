/**
 * Admin System Models List Component
 * Displays system-wide models filtered by organization type and plan
 * Allows admins to enable/disable models for their organization users
 */

'use client';

import React from 'react';
import Button from '@/ui/Button';
import { AILoadingSkeleton } from '@/components/ai/_shared';
import { AIIcons } from './AIIcons';
import { useAdminSystemModels } from '../hooks/useAdminSystemModels';

const SearchIcon = AIIcons.Search;
const CheckIcon = AIIcons.Check;
const XIcon = AIIcons.X;

interface AdminSystemModelsListProps {
  organizationId: string;
  primary: {
    base: string;
    light: string;
    lighter: string;
    hover: string;
    active: string;
    disabled: string;
    border: string;
  };
}

export function AdminSystemModelsList({ organizationId, primary }: AdminSystemModelsListProps) {
  const {
    // Data
    models,
    allModelsCount,
    enabledCount,
    disabledCount,
    organizationType,
    organizationPlan,
    
    // UI State
    loading,
    saving,
    
    // Filters
    searchQuery,
    filterEnabled,
    filterPlan,
    
    // Setters
    setSearchQuery,
    setFilterEnabled,
    setFilterPlan,
    
    // Actions
    toggleModelEnabled,
    enableAllModels,
    disableAllModels,
  } = useAdminSystemModels(organizationId);
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-4"></div>
        <AILoadingSkeleton count={6} />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              System AI Models
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Enable system-wide AI models for your organization users. Models are filtered based on your organization type (<strong>{organizationType || 'Not set'}</strong>) and plan (<strong className="capitalize">{organizationPlan}</strong>).
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Available:</span> {allModelsCount}
              </div>
              <div>
                <span className="text-green-600 font-medium">Enabled:</span> {enabledCount}
              </div>
              <div>
                <span className="text-gray-600 font-medium">Disabled:</span> {disabledCount}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={enableAllModels}
              disabled={saving || enabledCount === allModelsCount}
              size="sm"
              variant="outline"
            >
              Enable All
            </Button>
            <Button
              onClick={disableAllModels}
              disabled={saving || enabledCount === 0}
              size="sm"
              variant="outline"
            >
              Disable All
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
          
          {/* Plan Filter */}
          <div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Models Grid */}
      {models.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No models found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterEnabled !== 'all' || filterPlan !== 'all'
              ? 'Try adjusting your filters'
              : `No system models are available for your organization type (${organizationType}) and plan (${organizationPlan})`}
          </p>
          {!searchQuery && filterEnabled === 'all' && filterPlan === 'all' && (
            <p className="text-sm text-gray-500">
              Contact support or upgrade your plan to access more models.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${
                model.is_enabled 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Model Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-3xl">{model.icon || '🤖'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                        {model.name}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {model.is_enabled && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                            <CheckIcon className="h-3 w-3" />
                            Enabled
                          </span>
                        )}
                        {model.is_featured && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            ⭐ Featured
                          </span>
                        )}
                        {model.is_free && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            🆓 Free
                          </span>
                        )}
                        {model.is_trial && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            ⏰ Trial
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {model.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {model.description}
                  </p>
                )}
              </div>
              
              {/* Model Details */}
              <div className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium truncate ml-2">{model.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Plan:</span>
                  <span className="font-medium capitalize">{model.required_plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Tokens:</span>
                  <span className="font-medium">{model.max_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Limit:</span>
                  <span className="font-medium">
                    {model.token_limit_amount
                      ? `${model.token_limit_amount.toLocaleString()}/${model.token_limit_period}`
                      : 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks:</span>
                  <span className="font-medium">
                    {model.task && Array.isArray(model.task) ? model.task.length : 0} defined
                  </span>
                </div>
                {model.trial_expires_days && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Period:</span>
                    <span className="font-medium">{model.trial_expires_days} days</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {model.tags && model.tags.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="flex flex-wrap gap-1">
                    {model.tags.slice(0, 5).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {model.tags.length > 5 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{model.tags.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Button
                  onClick={() => toggleModelEnabled(model.id, model.is_enabled)}
                  disabled={saving}
                  className={`w-full ${
                    model.is_enabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'text-white'
                  }`}
                  style={!model.is_enabled ? { backgroundColor: primary.base } : {}}
                >
                  {saving ? (
                    'Processing...'
                  ) : model.is_enabled ? (
                    <>
                      <XIcon className="h-4 w-4 mr-2" />
                      Disable for Users
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Enable for Users
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

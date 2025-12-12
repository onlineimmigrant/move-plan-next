/**
 * FeaturesView Component
 * 
 * Manages features and their assignments to pricing plans
 */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, ChevronDown, Search, ArrowUpDown, GripVertical } from 'lucide-react';
import FeaturesToolbar from './FeaturesToolbar';
import { useThemeColors } from '@/hooks/useThemeColors';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import type { UnsplashAttribution } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';
import type { PexelsAttributionData } from '@/components/MediaAttribution';
import type { Feature, PricingPlanFeature } from '../types';
import type { PricingPlan } from '@/types/pricingplan';

interface FeaturesViewProps {
  features: Feature[];
  pricingPlans: PricingPlan[];
  pricingPlanFeatures: PricingPlanFeature[];
  isLoading: boolean;
  searchQuery?: string;
  onCreateFeature: (data: Partial<Feature>) => Promise<void>;
  onUpdateFeature: (id: string, updates: Partial<Feature>) => Promise<void>;
  onDeleteFeature: (id: string) => Promise<void>;
  onAssignFeature: (pricingplanId: string, featureId: string) => Promise<void>;
  onRemoveFeature: (pricingplanId: string, featureId: string) => Promise<void>;
}

const DEFAULT_FORM_DATA = {
  name: '',
  content: '',
  feature_image: '',
  slug: '',
  display_content: false,
  display_on_product_card: false,
  type: '',
  package: '',
  order: 0,
  is_help_center: false,
};

function FeaturesView({
  features,
  pricingPlans,
  pricingPlanFeatures,
  isLoading,
  searchQuery = '',
  onCreateFeature,
  onUpdateFeature,
  onDeleteFeature,
  onAssignFeature,
  onRemoveFeature,
}: FeaturesViewProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [openDropdownFeatureId, setOpenDropdownFeatureId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'order' | 'type'>('order');
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
  const [draggedFeature, setDraggedFeature] = useState<Feature | null>(null);
  const [dragOverFeature, setDragOverFeature] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Memoize helper functions
  const formatPlanBadge = useCallback((plan: PricingPlan) => {
    const packageName = plan.package || '';
    const measure = plan.measure || '';
    const currencySymbol = plan.currency_symbol || '$';
    const price = plan.price ? `${currencySymbol}${(plan.price / 100).toFixed(2)}` : '';
    return [packageName, measure, price].filter(Boolean).join(' - ');
  }, []);

  const getAssignedPlansForFeature = useCallback((featureId: string): PricingPlan[] => {
    const assignedPlanIds = pricingPlanFeatures
      .filter(pf => pf.feature_id === featureId)
      .map(pf => String(pf.pricingplan_id));
    
    return pricingPlans.filter(plan => assignedPlanIds.includes(String(plan.id)));
  }, [pricingPlanFeatures, pricingPlans]);

  const groupAssignedPlansByProduct = useCallback((assignedPlans: PricingPlan[]) => {
    return assignedPlans.reduce((acc, plan) => {
      const productName = (plan as any).product_name || 'Unknown Product';
      if (!acc[productName]) {
        acc[productName] = [];
      }
      acc[productName].push(plan);
      return acc;
    }, {} as Record<string, PricingPlan[]>);
  }, []);

  const isFeatureAssignedToPlan = useCallback((featureId: string, planId: string): boolean => {
    return pricingPlanFeatures.some(
      pf => pf.feature_id === featureId && String(pf.pricingplan_id) === planId
    );
  }, [pricingPlanFeatures]);

  // Memoize event handlers
  const handleEdit = useCallback((feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name || '',
      content: feature.content || '',
      feature_image: feature.feature_image || '',
      slug: feature.slug || '',
      display_content: feature.display_content || false,
      display_on_product_card: feature.display_on_product_card || false,
      type: feature.type || '',
      package: feature.package || '',
      order: feature.order || 0,
      is_help_center: feature.is_help_center || false,
    });
    setIsCreating(false);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingFeature(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsCreating(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (editingFeature) {
      await onUpdateFeature(editingFeature.id, formData);
    } else {
      await onCreateFeature(formData);
    }
    setEditingFeature(null);
    setIsCreating(false);
  }, [editingFeature, formData, onUpdateFeature, onCreateFeature]);

  const handleCancel = useCallback(() => {
    setEditingFeature(null);
    setIsCreating(false);
  }, []);

  const handleImageSelect = useCallback((url: string, attribution?: UnsplashAttribution | PexelsAttributionData) => {
    setFormData(prev => ({ ...prev, feature_image: url }));
    setIsImageGalleryOpen(false);
  }, []);

  // Group pricing plans by product - memoized
  const groupedPricingPlans = useMemo(() => pricingPlans.reduce((acc, plan) => {
    const productName = (plan as any).product_name || 'Unknown Product';
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(plan);
    return acc;
  }, {} as Record<string, PricingPlan[]>), [pricingPlans]);

  // Search and filter features - optimized single-pass
  const filteredAndSortedFeatures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasSearch = query.length > 0;

    // Single-pass filter and search
    const filtered = hasSearch
      ? features.filter(feature => {
          // Search in feature name and content
          const featureMatch = 
            feature.name?.toLowerCase().includes(query) ||
            feature.content?.toLowerCase().includes(query);

          if (featureMatch) return true;

          // Search in assigned pricing plans
          const assignedPlans = getAssignedPlansForFeature(feature.id);
          return assignedPlans.some(plan => {
            const productName = ((plan as any).product_name || '').toLowerCase();
            const packageName = (plan.package || '').toLowerCase();
            const measure = (plan.measure || '').toLowerCase();
            const price = plan.price ? (plan.price / 100).toFixed(2) : '';
            
            return productName.includes(query) ||
                   packageName.includes(query) ||
                   measure.includes(query) ||
                   price.includes(query);
          });
        })
      : features;

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        case 'order':
        default:
          return (a.order || 999) - (b.order || 999);
      }
    });
  }, [features, searchQuery, sortBy, getAssignedPlansForFeature]);

  // Drag and drop handlers - memoized
  const handleDragStart = useCallback((e: React.DragEvent, feature: Feature) => {
    setDraggedFeature(feature);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, featureId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFeature(featureId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverFeature(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetFeature: Feature) => {
    e.preventDefault();
    setDragOverFeature(null);

    if (!draggedFeature || draggedFeature.id === targetFeature.id) {
      setDraggedFeature(null);
      return;
    }

    // Update order: swap the order values
    const draggedOrder = draggedFeature.order || 0;
    const targetOrder = targetFeature.order || 0;

    await onUpdateFeature(draggedFeature.id, { order: targetOrder });
    await onUpdateFeature(targetFeature.id, { order: draggedOrder });

    setDraggedFeature(null);
  }, [draggedFeature, onUpdateFeature]);

  const handleDragEnd = useCallback(() => {
    setDraggedFeature(null);
    setDragOverFeature(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this feature?')) {
      await onDeleteFeature(id);
    }
  }, [onDeleteFeature]);

  const toggleFeatureAssignment = useCallback(async (featureId: string, planId: string) => {
    if (isFeatureAssignedToPlan(featureId, planId)) {
      await onRemoveFeature(planId, featureId);
    } else {
      await onAssignFeature(planId, featureId);
    }
    // Don't close the dropdown - let user continue selecting
  }, [isFeatureAssignedToPlan, onRemoveFeature, onAssignFeature]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
            style={{ borderColor: primary.base }}></div>
          <p className="text-sm text-gray-500">Loading features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">


      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {(isCreating || editingFeature) && (
          <>
            {/* Modal Overlay */}
            <div 
              className="fixed inset-0 z-[9999]"
              onClick={() => {
                setIsCreating(false);
                setEditingFeature(null);
                setFormData({
                  name: '',
                  content: '',
                  feature_image: '',
                  slug: '',
                  display_content: false,
                  display_on_product_card: false,
                  type: '',
                  package: '',
                  order: 0,
                  is_help_center: false,
                });
              }}
            />
            
            {/* Modal Content */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[10000]">
              <div 
                className="bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 flex items-center justify-between sticky top-0 bg-white z-10">
                  <h4 className="text-lg font-semibold">
                    {editingFeature ? 'Edit Feature' : 'Create New Feature'}
                  </h4>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingFeature(null);
                      setFormData({
                        name: '',
                        content: '',
                        feature_image: '',
                        slug: '',
                        display_content: false,
                        display_on_product_card: false,
                        type: '',
                        package: '',
                        order: 0,
                        is_help_center: false,
                      });
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                  placeholder="Feature name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                  rows={3}
                  placeholder="Feature description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="feature-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Feature type"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feature Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.feature_image}
                    onChange={(e) => setFormData({ ...formData, feature_image: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => setIsImageGalleryOpen(true)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Browse
                  </button>
                </div>
                {formData.feature_image && (
                  <div className="mt-2">
                    <img
                      src={formData.feature_image}
                      alt="Feature preview"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                  <input
                    type="text"
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Package name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.display_content}
                    onChange={(e) => setFormData({ ...formData, display_content: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Display Content</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.display_on_product_card}
                    onChange={(e) => setFormData({ ...formData, display_on_product_card: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Display on Product Card</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_help_center}
                    onChange={(e) => setFormData({ ...formData, is_help_center: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Help Center</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: primary.base }}
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Features Table */}
        {filteredAndSortedFeatures.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No features found</h3>
                <p className="text-sm text-gray-500">Try a different search term</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No features yet</h3>
                <p className="text-sm text-gray-500">Create your first feature to get started</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedFeatures.map((feature) => {
              const isExpanded = expandedFeatureId === feature.id;
              const isDragging = draggedFeature?.id === feature.id;
              const isDragOver = dragOverFeature === feature.id;
              
              return (
                <div
                  key={feature.id}
                  draggable={!searchQuery && sortBy === 'order'} // Only allow dragging when sorted by order and no search
                  onDragStart={(e) => handleDragStart(e, feature)}
                  onDragOver={(e) => handleDragOver(e, feature.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, feature)}
                  onDragEnd={handleDragEnd}
                  className={`border border-slate-200 rounded-lg bg-white transition-all ${
                    isDragging ? 'opacity-50 cursor-grabbing' : ''
                  } ${isDragOver ? 'border-2 border-dashed' : ''}`}
                  style={isDragOver ? { borderColor: primary.base } : {}}
                >
                  {/* Accordion Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer transition-colors"
                    style={{ 
                      backgroundColor: isExpanded ? `${primary.base}15` : 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = `${primary.base}10`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                    onClick={() => setExpandedFeatureId(isExpanded ? null : feature.id)}
                  >
                    {/* Drag Handle - only show when sortable */}
                    {!searchQuery && sortBy === 'order' && (
                      <div className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Order Number Circle */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ backgroundColor: primary.base }}
                    >
                      {feature.order || 0}
                    </div>

                    {/* Feature Name */}
                    <h4 className="font-semibold flex-1" style={{ color: isExpanded ? primary.base : '#111827' }}>{feature.name}</h4>

                    {/* Chevron */}
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      style={{ color: isExpanded ? primary.base : '#9ca3af' }}
                    />
                  </div>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="flex items-start justify-between pt-4">
                        <div className="flex-1">
                          {feature.content && (
                            <p className="text-sm text-gray-600 mt-1">{feature.content}</p>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            {feature.type && <span>Type: {feature.type}</span>}
                            {feature.package && <span>Package: {feature.package}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(feature);
                            }}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${primary.base}15`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Edit feature"
                          >
                            <Edit2 className="w-4 h-4" style={{ color: primary.base }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(feature.id);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete feature"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                {/* Pricing Plan Assignments */}
                {pricingPlans.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Pricing Plans</h5>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownFeatureId(
                              openDropdownFeatureId === feature.id ? null : feature.id
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Assign Plans
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                            openDropdownFeatureId === feature.id ? 'rotate-180' : ''
                          }`} />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdownFeatureId === feature.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenDropdownFeatureId(null)}
                            />
                            <div className="absolute right-0 bottom-full mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                              {Object.entries(groupedPricingPlans).map(([productName, plans]) => (
                                <div key={productName} className="border-b border-gray-100 last:border-b-0">
                                  <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-700 sticky top-0">
                                    {productName}
                                  </div>
                                  <div className="p-2">
                                    {plans.map((plan) => {
                                      const isAssigned = isFeatureAssignedToPlan(feature.id, String(plan.id));
                                      return (
                                        <button
                                          type="button"
                                          key={plan.id}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            console.log('Plan button clicked!');
                                            await toggleFeatureAssignment(feature.id, String(plan.id));
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors"
                                        >
                                          <div
                                            className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                                            style={{
                                              borderColor: isAssigned ? primary.base : '#d1d5db',
                                              backgroundColor: isAssigned ? primary.base : 'transparent',
                                            }}
                                          >
                                            {isAssigned && <Check className="w-3 h-3 text-white" />}
                                          </div>
                                          <span className="flex-1 text-gray-700">
                                            {formatPlanBadge(plan)}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Display Assigned Plans Grouped by Product */}
                    {(() => {
                      const assignedPlans = getAssignedPlansForFeature(feature.id);
                      const groupedAssigned = groupAssignedPlansByProduct(assignedPlans);
                      
                      if (assignedPlans.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 italic">No pricing plans assigned</p>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {Object.entries(groupedAssigned).map(([productName, plans]) => (
                            <div key={productName}>
                              <div className="text-xs font-medium text-gray-600 mb-1.5">
                                {productName}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {plans.map((plan) => (
                                  <div
                                    key={plan.id}
                                    className="group relative px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
                                    style={{
                                      backgroundColor: primary.base,
                                      color: 'white',
                                    }}
                                  >
                                    <span>{formatPlanBadge(plan)}</span>
                                    <button
                                      onClick={() => toggleFeatureAssignment(feature.id, String(plan.id))}
                                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                      title="Remove"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Features Toolbar */}
      <FeaturesToolbar
        totalCount={features.length}
        filteredCount={filteredAndSortedFeatures.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onAddFeature={handleCreate}
      />

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageGalleryModal
          isOpen={isImageGalleryOpen}
          onClose={() => setIsImageGalleryOpen(false)}
          onSelectImage={handleImageSelect}
        />
      )}
    </div>
  );
}

export default memo(FeaturesView);

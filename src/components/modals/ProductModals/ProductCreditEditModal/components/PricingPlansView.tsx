/**
 * PricingPlansView Component
 * 
 * Manages pricing plans with drag-and-drop ordering
 * Groups plans by product and supports full CRUD operations
 */

'use client';

import React, { useState, useMemo, memo } from 'react';
import { Plus, Search, CreditCard, ChevronDown, Edit2, Trash2, Check, X, GripVertical } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { PricingPlan } from '@/types/pricingplan';
import type { Product } from '../types';

interface PricingPlansViewProps {
  pricingPlans: PricingPlan[];
  products: Product[];
  isLoading: boolean;
  onCreatePlan: (data: Partial<PricingPlan>) => Promise<void>;
  onUpdatePlan: (id: string, updates: Partial<PricingPlan>) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onReorderPlans: (plans: Array<{ id: string; order: number }>) => Promise<void>;
}

interface PlanFormData {
  product_id: number | null;
  price: number;
  currency: string;
  type: 'one_time' | 'recurring';
  recurring_interval: string | null;
  description: string;
  is_active: boolean;
  is_promotion: boolean;
  promotion_percent: number | null;
  valid_until: string | null;
  package: string;
  measure: string;
}

const DEFAULT_FORM_DATA: PlanFormData = {
  product_id: null,
  price: 0,
  currency: 'gbp',
  type: 'one_time',
  recurring_interval: null,
  description: '',
  is_active: true,
  is_promotion: false,
  promotion_percent: null,
  valid_until: null,
  package: '',
  measure: 'item',
};

const CURRENCY_OPTIONS = [
  { value: 'gbp', label: 'GBP (£)', symbol: '£' },
  { value: 'usd', label: 'USD ($)', symbol: '$' },
  { value: 'eur', label: 'EUR (€)', symbol: '€' },
];

const RECURRING_INTERVALS = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
];

function PricingPlansView({
  pricingPlans,
  products,
  isLoading,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onReorderPlans,
}: PricingPlansViewProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(DEFAULT_FORM_DATA);
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [dragOverPlanId, setDragOverPlanId] = useState<string | null>(null);

  // Format price for display
  const formatPrice = (price: number, currencySymbol: string = '£') => {
    return `${currencySymbol}${(price / 100).toFixed(2)}`;
  };

  // Get product name
  const getProductName = (productId: number | null) => {
    if (!productId) return 'Unassigned';
    const product = products.find(p => Number(p.id) === productId);
    return product?.product_name || 'Unknown Product';
  };

  // Group plans by product
  const groupedPlans = useMemo(() => {
    const filtered = pricingPlans.filter(plan => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const productName = getProductName(plan.product_id || null).toLowerCase();
      const planPackage = (plan.package || '').toLowerCase();
      const description = (plan.description || '').toLowerCase();
      return productName.includes(query) || planPackage.includes(query) || description.includes(query);
    });

    const grouped = filtered.reduce((acc, plan) => {
      const productId = plan.product_id || 0; // 0 for unassigned
      if (!acc[productId]) {
        acc[productId] = [];
      }
      acc[productId].push(plan);
      return acc;
    }, {} as Record<number, PricingPlan[]>);

    // Sort plans within each group by order
    Object.keys(grouped).forEach(key => {
      grouped[Number(key)].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return grouped;
  }, [pricingPlans, searchQuery, products]);

  const handleFormChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenForm = () => {
    setEditingPlan(null);
    setFormData(DEFAULT_FORM_DATA);
    setShowForm(true);
    setExpandedPlanId(null);
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      product_id: plan.product_id || null,
      price: plan.price || 0,
      currency: plan.currency || 'gbp',
      type: (plan.type as 'one_time' | 'recurring') || 'one_time',
      recurring_interval: plan.recurring_interval || null,
      description: plan.description || '',
      is_active: plan.is_active,
      is_promotion: plan.is_promotion,
      promotion_percent: plan.promotion_percent || null,
      valid_until: plan.valid_until || null,
      package: plan.package || '',
      measure: plan.measure || 'item',
    });
    setShowForm(true);
    setExpandedPlanId(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        await onUpdatePlan(editingPlan.id.toString(), formData as any);
      } else {
        await onCreatePlan(formData as any);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error submitting plan:', error);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm('Are you sure you want to delete this pricing plan?')) {
      try {
        await onDeletePlan(id.toString());
        if (expandedPlanId === id.toString()) setExpandedPlanId(null);
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleToggleExpand = (planId: number) => {
    const planIdStr = planId.toString();
    setExpandedPlanId(expandedPlanId === planIdStr ? null : planIdStr);
    setShowForm(false);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, planId: number) => {
    setDraggedPlanId(planId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, planId: number, productId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Only allow drop within same product group
    const draggedPlan = pricingPlans.find(p => p.id.toString() === draggedPlanId);
    if (draggedPlan && (draggedPlan.product_id || 0) === productId) {
      setDragOverPlanId(planId.toString());
    }
  };

  const handleDragLeave = () => {
    setDragOverPlanId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPlanId: number, productId: number) => {
    e.preventDefault();
    
    if (!draggedPlanId || draggedPlanId === targetPlanId.toString()) {
      setDraggedPlanId(null);
      setDragOverPlanId(null);
      return;
    }

    const draggedPlan = pricingPlans.find(p => p.id.toString() === draggedPlanId);
    if (!draggedPlan || (draggedPlan.product_id || 0) !== productId) {
      setDraggedPlanId(null);
      setDragOverPlanId(null);
      return;
    }

    // Reorder plans within the product group
    const productPlans = groupedPlans[productId] || [];
    const draggedIndex = productPlans.findIndex(p => p.id.toString() === draggedPlanId);
    const targetIndex = productPlans.findIndex(p => p.id === targetPlanId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedPlanId(null);
      setDragOverPlanId(null);
      return;
    }

    // Reorder array
    const reordered = [...productPlans];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Assign new order values
    const updates = reordered.map((plan, index) => ({
      id: plan.id.toString(),
      order: index + 1,
    }));

    try {
      await onReorderPlans(updates);
    } catch (error) {
      console.error('Error reordering plans:', error);
    }

    setDraggedPlanId(null);
    setDragOverPlanId(null);
  };

  const handleDragEnd = () => {
    setDraggedPlanId(null);
    setDragOverPlanId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primary.base }}></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Pricing Plans</h3>
            <span className="text-sm text-gray-500">({pricingPlans.length})</span>
          </div>
          
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary.base }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Pricing Plan</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pricing plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {Object.keys(groupedPlans).length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {searchQuery ? 'No pricing plans found matching your search' : 'No pricing plans yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPlans).map(([productId, plans], groupIndex) => (
              <React.Fragment key={productId}>
                {/* Product Group Divider */}
                {groupIndex > 0 && (
                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>
                )}

                {/* Product Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: primary.base }}
                  >
                    📦 {getProductName(Number(productId))}
                  </div>
                  <span className="text-xs text-gray-500">({plans.length} plans)</span>
                </div>

                {/* Plans List */}
                <div className="space-y-3">
                  {plans.map((plan) => {
                    const isExpanded = expandedPlanId === plan.id.toString();
                    const isDragging = draggedPlanId === plan.id.toString();
                    const isDropTarget = dragOverPlanId === plan.id.toString();

                    return (
                      <div
                        key={plan.id}
                        draggable={!showForm}
                        onDragStart={(e) => handleDragStart(e, plan.id)}
                        onDragOver={(e) => handleDragOver(e, plan.id, plan.product_id || 0)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, plan.id, plan.product_id || 0)}
                        onDragEnd={handleDragEnd}
                        className={`border rounded-lg transition-all ${
                          isDragging ? 'opacity-50 scale-95' : ''
                        } ${
                          isDropTarget ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                        } ${
                          isExpanded ? '' : 'hover:shadow-md'
                        }`}
                      >
                        {/* Card Header */}
                        <div
                          className={`p-4 cursor-pointer ${
                            isExpanded ? '' : 'rounded-lg'
                          }`}
                          onClick={() => handleToggleExpand(plan.id)}
                        >
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                            {/* Drag Handle */}
                            <div className="flex-shrink-0">
                              <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                            </div>

                            {/* Plan Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {plan.package || 'Unnamed Plan'}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {/* Type Badge */}
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    plan.type === 'recurring'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {plan.type === 'recurring' ? `🔁 ${plan.recurring_interval || 'recurring'}` : '💵 One-time'}
                                  </span>
                                  
                                  {/* Status Badge */}
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    plan.is_active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {plan.is_active ? '✅ Active' : '❌ Inactive'}
                                  </span>

                                  {/* Promotion Badge */}
                                  {plan.is_promotion && (
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                                      🎉 {plan.promotion_percent}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Price */}
                              <div className="text-lg font-semibold" style={{ color: primary.base }}>
                                {formatPrice(plan.price || 0, plan.currency_symbol)}
                                {plan.type === 'recurring' && plan.recurring_interval && (
                                  <span className="text-sm text-gray-500 font-normal"> / {plan.recurring_interval}</span>
                                )}
                              </div>

                              {/* Description */}
                              {plan.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{plan.description}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPlan(plan);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlan(plan.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <ChevronDown
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Measure:</span>
                                <span className="ml-2 text-gray-600">{plan.measure || 'item'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Currency:</span>
                                <span className="ml-2 text-gray-600">{(plan.currency || 'gbp').toUpperCase()}</span>
                              </div>
                              {plan.stripe_price_id && (
                                <div className="sm:col-span-2">
                                  <span className="font-medium text-gray-700">Stripe Price ID:</span>
                                  <span className="ml-2 text-gray-600 font-mono text-xs">{plan.stripe_price_id}</span>
                                </div>
                              )}
                              {plan.is_promotion && plan.valid_until && (
                                <div className="sm:col-span-2">
                                  <span className="font-medium text-gray-700">Valid Until:</span>
                                  <span className="ml-2 text-gray-600">{plan.valid_until}</span>
                                </div>
                              )}
                              <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Created:</span>
                                <span className="ml-2 text-gray-600">
                                  {new Date(plan.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
              </h3>

              <div className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    value={formData.product_id || ''}
                    onChange={(e) => handleFormChange('product_id', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Package Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.package}
                    onChange={(e) => handleFormChange('package', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    placeholder="e.g., Basic Plan, Premium Package"
                  />
                </div>

                {/* Price and Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (in cents) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      placeholder="5000"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Display: {formatPrice(formData.price, CURRENCY_OPTIONS.find(c => c.value === formData.currency)?.symbol)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleFormChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      {CURRENCY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Type and Recurring Interval */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    >
                      <option value="one_time">One-time</option>
                      <option value="recurring">Recurring</option>
                    </select>
                  </div>
                  {formData.type === 'recurring' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recurring Interval <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.recurring_interval || ''}
                        onChange={(e) => handleFormChange('recurring_interval', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      >
                        <option value="">Select interval</option>
                        {RECURRING_INTERVALS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Measure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measure
                  </label>
                  <input
                    type="text"
                    value={formData.measure}
                    onChange={(e) => handleFormChange('measure', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    placeholder="item, user, license, etc."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    placeholder="Plan description..."
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleFormChange('is_active', e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: primary.base }}
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_promotion}
                      onChange={(e) => handleFormChange('is_promotion', e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: primary.base }}
                    />
                    <span className="text-sm text-gray-700">Promotion</span>
                  </label>
                </div>

                {/* Promotion Fields */}
                {formData.is_promotion && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        value={formData.promotion_percent || ''}
                        onChange={(e) => handleFormChange('promotion_percent', e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        placeholder="20"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid Until
                      </label>
                      <input
                        type="text"
                        value={formData.valid_until || ''}
                        onChange={(e) => handleFormChange('valid_until', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        placeholder="2025-12-31"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primary.base }}
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  {editingPlan ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PricingPlansView);

/**
 * InventoryView Component
 * 
 * Manages inventory items linked to pricing plans
 * Similar to FeaturesView architecture
 */

'use client';

import React, { useState, useMemo, memo } from 'react';
import { Plus, Search, Package, ChevronDown, Edit2, Trash2, AlertCircle, Check, X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { PricingPlan } from '@/types/pricingplan';

interface Inventory {
  id: string;
  created_at: string;
  quantity: number;
  minimum_threshold: number;
  status: string;
  pricing_plan_id: string;
  permanent_presence: boolean;
  planned_delivery_quantity: number | null;
  earliest_planned_delivery_date: string | null;
  description: string | null;
}

interface InventoryFormData {
  quantity: number;
  minimum_threshold: number;
  status: string;
  pricing_plan_id: string;
  permanent_presence: boolean;
  planned_delivery_quantity: number | null;
  earliest_planned_delivery_date: string | null;
  description: string;
}

interface InventoryViewProps {
  inventories: Inventory[];
  pricingPlans: PricingPlan[];
  isLoading: boolean;
  onCreateInventory: (data: InventoryFormData) => Promise<void>;
  onUpdateInventory: (id: string, updates: Partial<InventoryFormData>) => Promise<void>;
  onDeleteInventory: (id: string) => Promise<void>;
}

const STATUS_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock', 'Backordered', 'Discontinued'];

const DEFAULT_FORM_DATA: InventoryFormData = {
  quantity: 100,
  minimum_threshold: 10,
  status: 'In Stock',
  pricing_plan_id: '',
  permanent_presence: true,
  planned_delivery_quantity: null,
  earliest_planned_delivery_date: null,
  description: '',
};

function InventoryView({
  inventories,
  pricingPlans,
  isLoading,
  onCreateInventory,
  onUpdateInventory,
  onDeleteInventory,
}: InventoryViewProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInventoryId, setExpandedInventoryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>(DEFAULT_FORM_DATA);

  // Get product name for display
  const getProductName = (planId: string | number) => {
    const plan = pricingPlans.find(p => p.id === planId || p.id.toString() === planId.toString());
    if (!plan || !plan.product) return 'Unknown Product';
    return plan.product.product_name || 'Unknown Product';
  };

  // Get plan name for display
  const getPlanName = (planId: string | number) => {
    const plan = pricingPlans.find(p => p.id === planId || p.id.toString() === planId.toString());
    if (!plan) return 'Unknown Plan';
    const planPackage = plan.package || 'N/A';
    const planMeasure = plan.measure || '';
    
    // Add type and recurring interval if applicable
    let typeInfo = '';
    if (plan.type === 'recurring' && plan.recurring_interval) {
      typeInfo = ` / ${plan.recurring_interval}`;
    }
    
    return `${planPackage} - ${planMeasure}${typeInfo}`;
  };

  // Format price (divide by 100 with 2 decimals)
  const formatPrice = (planId: string | number) => {
    const plan = pricingPlans.find(p => p.id === planId || p.id.toString() === planId.toString());
    if (!plan || !plan.price) return '$0.00';
    const planCurrency = plan.currency_symbol || '$';
    const formattedPrice = (plan.price / 100).toFixed(2);
    return `${planCurrency}${formattedPrice}`;
  };

  // Get available plans (not already in inventory)
  const getAvailablePlans = () => {
    const usedPlanIds = inventories.map(inv => String(inv.pricing_plan_id));
    return pricingPlans.filter(plan => !usedPlanIds.includes(String(plan.id)));
  };

  // Filter and sort inventories
  const filteredAndSortedInventories = useMemo(() => {
    let filtered = inventories;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => {
        const planName = getPlanName(inv.pricing_plan_id).toLowerCase();
        const productName = getProductName(inv.pricing_plan_id).toLowerCase();
        const status = inv.status.toLowerCase();
        const description = (inv.description || '').toLowerCase();
        return planName.includes(query) || productName.includes(query) || status.includes(query) || description.includes(query);
      });
    }

    // Sort by product name, then by price
    const sorted = [...filtered].sort((a, b) => {
      // First sort by product name
      const productA = getProductName(a.pricing_plan_id);
      const productB = getProductName(b.pricing_plan_id);
      const productCompare = productA.localeCompare(productB);
      
      if (productCompare !== 0) {
        return productCompare;
      }
      
      // Then sort by price
      const planA = pricingPlans.find(p => String(p.id) === String(a.pricing_plan_id));
      const planB = pricingPlans.find(p => String(p.id) === String(b.pricing_plan_id));
      const priceA = planA?.price || 0;
      const priceB = planB?.price || 0;
      
      return priceA - priceB;
    });

    return sorted;
  }, [inventories, searchQuery, pricingPlans]);

  const handleOpenForm = (inventory?: Inventory) => {
    if (inventory) {
      setEditingInventory(inventory);
      setFormData({
        quantity: inventory.quantity,
        minimum_threshold: inventory.minimum_threshold,
        status: inventory.status,
        pricing_plan_id: inventory.pricing_plan_id,
        permanent_presence: inventory.permanent_presence,
        planned_delivery_quantity: inventory.planned_delivery_quantity,
        earliest_planned_delivery_date: inventory.earliest_planned_delivery_date,
        description: inventory.description || '',
      });
    } else {
      setEditingInventory(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInventory(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleSubmit = async () => {
    if (!formData.pricing_plan_id) {
      alert('Please select a pricing plan');
      return;
    }

    if (editingInventory) {
      await onUpdateInventory(editingInventory.id, formData);
    } else {
      await onCreateInventory(formData);
    }
    handleCloseForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      await onDeleteInventory(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return '#10b981';
      case 'Low Stock': return '#f59e0b';
      case 'Out of Stock': return '#ef4444';
      case 'Backordered': return '#3b82f6';
      case 'Discontinued': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary.base }}></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Manage</h2>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary.base }}
          >
            <Plus className="w-4 h-4" />
            Add Inventory
          </button>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredAndSortedInventories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Inventory Items</h3>
            <p className="text-sm text-gray-500">Create your first inventory item to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedInventories.map((inventory, index) => {
              const isExpanded = expandedInventoryId === inventory.id;
              const isLowStock = inventory.quantity <= inventory.minimum_threshold;
              
              // Check if this is a new product group
              const currentProduct = getProductName(inventory.pricing_plan_id);
              const previousProduct = index > 0 ? getProductName(filteredAndSortedInventories[index - 1].pricing_plan_id) : null;
              const isNewProductGroup = currentProduct !== previousProduct;
              
              return (
                <React.Fragment key={inventory.id}>
                  {/* Product Divider */}
                  {isNewProductGroup && index > 0 && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ 
                          backgroundColor: `${primary.base}15`,
                          color: primary.base,
                        }}
                      >
                        {currentProduct}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                  )}
                  
                  {/* Product Header for First Item */}
                  {index === 0 && (
                    <div className="flex items-center gap-3 pb-2 mb-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ 
                          backgroundColor: `${primary.base}15`,
                          color: primary.base,
                        }}
                      >
                        {currentProduct}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                  )}
                  
                <div
                  className="border border-gray-200 rounded-lg bg-white transition-all overflow-hidden"
                >
                  {/* Accordion Header */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer transition-colors ${!isExpanded ? 'rounded-lg' : ''}`}
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
                    onClick={() => setExpandedInventoryId(isExpanded ? null : inventory.id)}
                  >
                    {/* Top Row: Badges - Mobile */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      <div
                        className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: getStatusColor(inventory.status) }}
                      >
                        {inventory.status}
                      </div>

                      {/* Product Badge */}
                      <div
                        className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ 
                          backgroundColor: `${primary.base}20`,
                          color: primary.base,
                        }}
                      >
                        {getProductName(inventory.pricing_plan_id)}
                      </div>

                      {/* Quantity Badge - Inline on Mobile */}
                      <div className="flex items-center gap-1 ml-auto sm:hidden">
                        <span className="text-xs text-gray-600">
                          Qty: <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {inventory.quantity}
                          </span>
                        </span>
                        {isLowStock && (
                          <AlertCircle className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Plan Info - Mobile & Desktop */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Plan Name and Price */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base truncate" style={{ color: isExpanded ? primary.base : '#111827' }}>
                          {getPlanName(inventory.pricing_plan_id)}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatPrice(inventory.pricing_plan_id)}
                        </p>
                      </div>

                      {/* Quantity Badge - Desktop Only */}
                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-600">
                          Qty: <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {inventory.quantity}
                          </span>
                        </span>
                        {isLowStock && (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>

                      {/* Chevron */}
                      <ChevronDown
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: isExpanded ? primary.base : '#9ca3af' }}
                      />
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Minimum Threshold:</span>
                            <span className="ml-2 font-medium text-gray-900">{inventory.minimum_threshold}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Permanent Presence:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {inventory.permanent_presence ? (
                                <Check className="w-4 h-4 inline text-green-600" />
                              ) : (
                                <X className="w-4 h-4 inline text-red-600" />
                              )}
                            </span>
                          </div>
                          {inventory.planned_delivery_quantity && (
                            <div>
                              <span className="text-gray-500">Planned Delivery:</span>
                              <span className="ml-2 font-medium text-gray-900">{inventory.planned_delivery_quantity}</span>
                            </div>
                          )}
                          {inventory.earliest_planned_delivery_date && (
                            <div>
                              <span className="text-gray-500">Delivery Date:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(inventory.earliest_planned_delivery_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {inventory.description && (
                          <div className="text-sm">
                            <span className="text-gray-500">Description:</span>
                            <p className="mt-1 text-gray-900">{inventory.description}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenForm(inventory);
                            }}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${primary.base}15`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Edit inventory"
                          >
                            <Edit2 className="w-4 h-4" style={{ color: primary.base }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(inventory.id);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete inventory"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50" onClick={handleCloseForm}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingInventory ? 'Edit Inventory' : 'Add Inventory'}
              </h3>

              {!editingInventory && getAvailablePlans().length === 0 ? (
                /* All plans already added */
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium mb-2">All pricing plans already have inventory</p>
                  <p className="text-sm text-gray-500 mb-4">Create a new pricing plan to add more inventory items.</p>
                  <button
                    onClick={handleCloseForm}
                    className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primary.base }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                {/* Pricing Plan Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pricing Plan *
                  </label>
                  <select
                    value={formData.pricing_plan_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricing_plan_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    required
                    disabled={editingInventory ? true : false}
                  >
                    <option value="">Select a pricing plan</option>
                    {(editingInventory ? pricingPlans : getAvailablePlans()).map((plan) => {
                      const productName = plan.product?.product_name || 'Unknown Product';
                      const planName = plan.package || 'N/A';
                      const measure = plan.measure || '';
                      const price = plan.price ? `${plan.currency_symbol || '$'}${(plan.price / 100).toFixed(2)}` : '$0.00';
                      let typeInfo = '';
                      if (plan.type === 'recurring' && plan.recurring_interval) {
                        typeInfo = ` / ${plan.recurring_interval}`;
                      }
                      
                      return (
                        <option key={plan.id} value={plan.id.toString()}>
                          {productName} - {planName} - {measure}{typeInfo} - {price}
                        </option>
                      );
                    })}
                  </select>
                  {editingInventory && (
                    <p className="text-xs text-gray-500 mt-1">Pricing plan cannot be changed when editing</p>
                  )}
                </div>

                {/* Quantity and Threshold */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Threshold *
                    </label>
                    <input
                      type="number"
                      value={formData.minimum_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_threshold: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Permanent Presence */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="permanent_presence"
                    checked={formData.permanent_presence}
                    onChange={(e) => setFormData(prev => ({ ...prev, permanent_presence: e.target.checked }))}
                    className="rounded"
                    style={{ accentColor: primary.base }}
                  />
                  <label htmlFor="permanent_presence" className="text-sm font-medium text-gray-700">
                    Permanent Presence
                  </label>
                </div>

                {/* Planned Delivery */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned Delivery Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.planned_delivery_quantity || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, planned_delivery_quantity: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Earliest Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.earliest_planned_delivery_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, earliest_planned_delivery_date: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    rows={3}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primary.base }}
                >
                  {editingInventory ? 'Update' : 'Create'}
                </button>
              </div>
                </>  
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(InventoryView);

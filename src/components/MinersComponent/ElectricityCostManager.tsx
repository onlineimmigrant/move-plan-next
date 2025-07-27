'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Zap, DollarSign } from 'lucide-react';
import { useElectricityCosts } from '@/hooks/useElectricityCosts';
import { ElectricityCostData } from '@/components/MinersComponent/types';
import { formatCurrency } from '@/lib/costCalculations';

interface ElectricityCostFormData {
  name: string;
  rate_per_kwh: number;
  currency: string;
  base_cost_per_month: number;
}

const defaultFormData: ElectricityCostFormData = {
  name: '',
  rate_per_kwh: 0,
  currency: 'EUR',
  base_cost_per_month: 0,
};

export default function ElectricityCostManager() {
  const {
    electricityCosts,
    activeElectricityCost,
    isLoading,
    createCost,
    updateCost,
    deleteCost,
    setActiveCost,
    isCreating,
    isUpdating,
    isDeleting,
  } = useElectricityCosts();

  const [showForm, setShowForm] = useState(false);
  const [editingCost, setEditingCost] = useState<ElectricityCostData | null>(null);
  const [formData, setFormData] = useState<ElectricityCostFormData>(defaultFormData);

  const handleCreate = () => {
    setEditingCost(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleEdit = (cost: ElectricityCostData) => {
    setEditingCost(cost);
    setFormData({
      name: cost.name,
      rate_per_kwh: cost.rate_per_kwh,
      currency: cost.currency,
      base_cost_per_month: cost.base_cost_per_month,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCost) {
      updateCost({
        id: editingCost.id,
        ...formData,
      });
    } else {
      createCost(formData);
    }
    setShowForm(false);
    setFormData(defaultFormData);
    setEditingCost(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(defaultFormData);
    setEditingCost(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Zap className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Electricity Cost Management</h3>
            <p className="text-sm text-gray-500">Manage electricity rates and base costs for accurate profit calculations</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={showForm}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Cost Plan</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingCost ? 'Edit Cost Plan' : 'Create New Cost Plan'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Standard Rate, Night Rate"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate per kWh
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.rate_per_kwh}
                    onChange={(e) => setFormData({ ...formData, rate_per_kwh: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.1200"
                    required
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {formData.currency}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Cost per Month
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_cost_per_month}
                    onChange={(e) => setFormData({ ...formData, base_cost_per_month: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50.00"
                    required
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {formData.currency}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Fixed monthly costs (connection fees, taxes, etc.) divided proportionally among miners
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isCreating || isUpdating ? 'Saving...' : editingCost ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {electricityCosts.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No electricity cost plans configured</p>
            <p className="text-sm text-gray-400">Create your first cost plan to enable profit calculations</p>
          </div>
        ) : (
          electricityCosts.map((cost) => (
            <div
              key={cost.id}
              className={`p-4 rounded-lg border transition-all ${
                cost.is_active
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{cost.name}</h4>
                    {cost.is_active && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Rate:</span> {formatCurrency(cost.rate_per_kwh, cost.currency)}/kWh
                    </div>
                    <div>
                      <span className="font-medium">Base Cost:</span> {formatCurrency(cost.base_cost_per_month, cost.currency)}/month
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(cost.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!cost.is_active && (
                    <button
                      onClick={() => setActiveCost(cost.id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Set as active"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(cost)}
                    disabled={showForm}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCost(cost.id)}
                    disabled={isDeleting || cost.is_active}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    title={cost.is_active ? "Cannot delete active cost plan" : "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

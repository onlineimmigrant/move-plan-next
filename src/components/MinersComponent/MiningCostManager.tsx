'use client';

import React, { useState } from 'react';
import { Edit2, Check, X, Zap, DollarSign, Building, Shield, Thermometer, Wrench, MoreHorizontal } from 'lucide-react';
import { useMiningCosts } from '@/hooks/useMiningCosts';
import { formatCurrency } from '@/lib/costCalculations';

interface CostFormData {
  electricity_rate_per_kwh: number;
  insurance_monthly: number;
  rent_monthly: number;
  cooling_monthly: number;
  maintenance_monthly: number;
  other_monthly: number;
  total_facility_consumption_kwh: number;
  currency: string;
  notes: string;
}

const DEFAULT_FORM_DATA: CostFormData = {
  electricity_rate_per_kwh: 0,
  insurance_monthly: 0,
  rent_monthly: 0,
  cooling_monthly: 0,
  maintenance_monthly: 0,
  other_monthly: 0,
  total_facility_consumption_kwh: 0,
  currency: 'USD',
  notes: '',
};

export default function MiningCostManager() {
  const {
    miningCost,
    isLoading,
    createCost,
    updateCost,
    isCreating,
    isUpdating,
  } = useMiningCosts();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CostFormData>(() => ({
    electricity_rate_per_kwh: miningCost?.electricity_rate_per_kwh || 0,
    insurance_monthly: miningCost?.insurance_monthly || 0,
    rent_monthly: miningCost?.rent_monthly || 0,
    cooling_monthly: miningCost?.cooling_monthly || 0,
    maintenance_monthly: miningCost?.maintenance_monthly || 0,
    other_monthly: miningCost?.other_monthly || 0,
    total_facility_consumption_kwh: miningCost?.total_facility_consumption_kwh || 0,
    currency: miningCost?.currency || 'USD',
    notes: miningCost?.notes || '',
  }));

  const handleEdit = () => {
    setFormData({
      electricity_rate_per_kwh: miningCost?.electricity_rate_per_kwh || 0,
      insurance_monthly: miningCost?.insurance_monthly || 0,
      rent_monthly: miningCost?.rent_monthly || 0,
      cooling_monthly: miningCost?.cooling_monthly || 0,
      maintenance_monthly: miningCost?.maintenance_monthly || 0,
      other_monthly: miningCost?.other_monthly || 0,
      total_facility_consumption_kwh: miningCost?.total_facility_consumption_kwh || 0,
      currency: miningCost?.currency || 'USD',
      notes: miningCost?.notes || '',
    });
    setIsEditing(true);
  };

  const handleInputChange = (field: keyof CostFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (miningCost) {
      updateCost({
        id: miningCost.id,
        organization_id: miningCost.organization_id,
        ...formData,
      });
    } else {
      createCost({
        organization_id: '', // This will be set by the hook
        ...formData,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      electricity_rate_per_kwh: miningCost?.electricity_rate_per_kwh || 0,
      insurance_monthly: miningCost?.insurance_monthly || 0,
      rent_monthly: miningCost?.rent_monthly || 0,
      cooling_monthly: miningCost?.cooling_monthly || 0,
      maintenance_monthly: miningCost?.maintenance_monthly || 0,
      other_monthly: miningCost?.other_monthly || 0,
      total_facility_consumption_kwh: miningCost?.total_facility_consumption_kwh || 0,
      currency: miningCost?.currency || 'USD',
      notes: miningCost?.notes || '',
    });
    setIsEditing(false);
  };

  const totalMonthlyCosts = formData.insurance_monthly + formData.rent_monthly + 
                           formData.cooling_monthly + formData.maintenance_monthly + 
                           formData.other_monthly;

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
            <h3 className="text-lg font-semibold text-gray-900">Mining Cost Settings</h3>
            <p className="text-sm text-gray-500">Configure all operational costs for accurate profit calculations</p>
          </div>
        </div>
        {miningCost && !isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit Costs</span>
          </button>
        )}
      </div>

      {!miningCost && !isEditing ? (
        <div className="text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No cost configuration found</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Configure Costs
          </button>
        </div>
      ) : isEditing ? (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {miningCost ? 'Update Mining Costs' : 'Configure Mining Costs'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Electricity Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                  Electricity Rate per kWh
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.electricity_rate_per_kwh}
                    onChange={(e) => handleInputChange('electricity_rate_per_kwh', parseFloat(e.target.value) || 0)}
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
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            {/* Monthly Facility Costs */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">Monthly Facility Costs</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    Insurance
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.insurance_monthly}
                      onChange={(e) => handleInputChange('insurance_monthly', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {formData.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-green-600" />
                    Rent
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.rent_monthly}
                      onChange={(e) => handleInputChange('rent_monthly', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {formData.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Thermometer className="h-4 w-4 mr-2 text-cyan-600" />
                    Cooling
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cooling_monthly}
                      onChange={(e) => handleInputChange('cooling_monthly', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {formData.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-orange-600" />
                    Maintenance
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maintenance_monthly}
                      onChange={(e) => handleInputChange('maintenance_monthly', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {formData.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <MoreHorizontal className="h-4 w-4 mr-2 text-purple-600" />
                    Other Costs
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.other_monthly}
                      onChange={(e) => handleInputChange('other_monthly', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {formData.currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Consumption (kWh/month)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.total_facility_consumption_kwh}
                    onChange={(e) => handleInputChange('total_facility_consumption_kwh', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Additional facility electricity usage (lighting, ventilation, etc.)
                  </p>
                </div>
              </div>
              
              {/* Cost Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Total Monthly Facility Costs:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(totalMonthlyCosts, formData.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes about your cost structure..."
              />
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
                {isCreating || isUpdating ? 'Saving...' : miningCost ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Electricity Rate Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-gray-900">Electricity Rate</h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">Rate:</span> {formatCurrency(miningCost?.electricity_rate_per_kwh || 0, miningCost?.currency || 'USD')}/kWh
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Facility Costs Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              Monthly Facility Costs
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-blue-600" />
                  Insurance:
                </span>
                <span className="font-medium">{formatCurrency(miningCost?.insurance_monthly || 0, miningCost?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center">
                  <Building className="h-4 w-4 mr-1 text-green-600" />
                  Rent:
                </span>
                <span className="font-medium">{formatCurrency(miningCost?.rent_monthly || 0, miningCost?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center">
                  <Thermometer className="h-4 w-4 mr-1 text-cyan-600" />
                  Cooling:
                </span>
                <span className="font-medium">{formatCurrency(miningCost?.cooling_monthly || 0, miningCost?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center">
                  <Wrench className="h-4 w-4 mr-1 text-orange-600" />
                  Maintenance:
                </span>
                <span className="font-medium">{formatCurrency(miningCost?.maintenance_monthly || 0, miningCost?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center">
                  <MoreHorizontal className="h-4 w-4 mr-1 text-purple-600" />
                  Other:
                </span>
                <span className="font-medium">{formatCurrency(miningCost?.other_monthly || 0, miningCost?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-yellow-600" />
                  Facility kWh:
                </span>
                <span className="font-medium">{miningCost?.total_facility_consumption_kwh || 0} kWh</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-blue-300">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">Total Monthly Costs:</span>
                <span className="text-lg font-bold text-blue-900">
                  {formatCurrency(
                    (miningCost?.insurance_monthly || 0) + 
                    (miningCost?.rent_monthly || 0) + 
                    (miningCost?.cooling_monthly || 0) + 
                    (miningCost?.maintenance_monthly || 0) + 
                    (miningCost?.other_monthly || 0), 
                    miningCost?.currency || 'USD'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Notes and Metadata */}
          {(miningCost?.notes || miningCost?.updated_at) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {miningCost?.notes && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Notes:</span>
                  <p className="text-sm text-gray-600 mt-1">{miningCost.notes}</p>
                </div>
              )}
              {miningCost?.updated_at && (
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(miningCost.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

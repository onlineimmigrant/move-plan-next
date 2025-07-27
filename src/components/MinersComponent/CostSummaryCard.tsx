'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { MinerData, MiningCostData } from '@/components/MinersComponent/types';
import { calculateMinerCosts, formatCurrency, formatROI, getROIColorClass, getProfitabilityStatus } from '@/lib/costCalculations';

interface CostSummaryCardProps {
  miner: MinerData;
  miningCost: MiningCostData | null;
  className?: string;
}

export default function CostSummaryCard({ 
  miner, 
  miningCost, 
  className = '' 
}: CostSummaryCardProps) {
  const costs = calculateMinerCosts(miner, miningCost);
  const profitabilityStatus = getProfitabilityStatus(costs.profitAfterCosts);

  if (!miningCost) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-amber-700">
          <Calculator className="h-4 w-4" />
          <span className="text-sm font-medium">Cost Analysis Unavailable</span>
        </div>
        <p className="text-xs text-amber-600 mt-1">
          Configure electricity costs to enable profit analysis
        </p>
      </div>
    );
  }

  if (!miner.power || !miner.profit) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-700">
          <Calculator className="h-4 w-4" />
          <span className="text-sm font-medium">Incomplete Data</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Power consumption and profit data required for analysis
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Daily Cost Analysis</span>
        </div>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${profitabilityStatus.colorClass}`}>
          {costs.profitAfterCosts > 0 ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {profitabilityStatus.label}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Calculator className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-gray-600">Daily Electricity Cost</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(costs.electricityCostPerDay, costs.currency)}
          </p>
          <p className="text-xs text-gray-500">
            {miner.power}W @ {formatCurrency(miningCost.electricity_rate_per_kwh, costs.currency)}/kWh
          </p>
        </div>
        
        {costs.breakdown && (
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Calculator className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-gray-600">Daily Facility Cost</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(costs.facilityCostPerDay, costs.currency)}
            </p>
            <p className="text-xs text-gray-500">
              Allocated from monthly facility costs
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Daily Electricity Cost:</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(costs.electricityCostPerDay, costs.currency)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Daily Facility Costs:</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(costs.facilityCostPerDay, costs.currency)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Daily Profit (Gross):</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(miner.profit || 0, costs.currency)}
          </span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-900">Net Daily Profit:</span>
          <span className={`text-sm font-bold ${costs.profitAfterCosts >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(costs.profitAfterCosts, costs.currency)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">ROI:</span>
          <span className={`text-sm font-bold ${getROIColorClass(costs.roi)}`}>
            {formatROI(costs.roi)}
          </span>
        </div>
      </div>

      {costs.roi < 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          ⚠️ This miner is operating at a loss. Consider reviewing electricity costs or mining configuration.
        </div>
      )}
    </div>
  );
}

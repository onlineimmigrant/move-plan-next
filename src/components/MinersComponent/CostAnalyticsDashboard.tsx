'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Zap, Calculator, PieChart } from 'lucide-react';
import { MinerData, MiningCostData } from '@/components/MinersComponent/types';
import { calculateMinerCosts, formatCurrency, formatROI } from '@/lib/costCalculations';

interface CostAnalyticsDashboardProps {
  miners: MinerData[];
  miningCost: MiningCostData | null;
  className?: string;
}

export default function CostAnalyticsDashboard({ 
  miners, 
  miningCost, 
  className = '' 
}: CostAnalyticsDashboardProps) {
  if (!miningCost) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <Calculator className="h-6 w-6 text-amber-600" />
          <div>
            <h3 className="text-lg font-semibold text-amber-800">Cost Analytics Unavailable</h3>
            <p className="text-sm text-amber-600 mt-1">Configure electricity costs to enable detailed cost analysis</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate aggregate statistics
  const validMiners = miners.filter(m => m.power && m.profit);
  const totalMiners = miners.length;

  if (validMiners.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <Calculator className="h-6 w-6 text-gray-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Insufficient Data</h3>
            <p className="text-sm text-gray-600 mt-1">Power consumption and profit data required for cost analysis</p>
          </div>
        </div>
      </div>
    );
  }

  const calculations = validMiners.map(miner => 
    calculateMinerCosts(miner, miningCost)
  );

  // Aggregate calculations
  const totalElectricityCost = calculations.reduce((sum, calc) => sum + calc.electricityCostPerDay, 0);
  const totalFacilityCost = calculations.reduce((sum, calc) => sum + calc.facilityCostPerDay, 0);
  const totalOperatingCost = calculations.reduce((sum, calc) => sum + calc.totalCostPerDay, 0);
  const totalGrossProfit = validMiners.reduce((sum, miner) => sum + (miner.profit || 0), 0);
  const totalNetProfit = totalGrossProfit - totalOperatingCost;
  const averageROI = calculations.reduce((sum, calc) => sum + calc.roi, 0) / calculations.length;

  // Profitability breakdown
  const profitableMiners = calculations.filter(calc => calc.profitAfterCosts > 1).length;
  const breakEvenMiners = calculations.filter(calc => calc.profitAfterCosts >= -0.5 && calc.profitAfterCosts <= 1).length;
  const losingMiners = calculations.filter(calc => calc.profitAfterCosts < -0.5).length;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <PieChart className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Cost Analytics Dashboard</h3>
          <p className="text-sm text-gray-500">
            Daily cost analysis for {validMiners.length} of {totalMiners} miners with complete data
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Net Daily Profit</div>
            {totalNetProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className={`text-lg font-bold ${totalNetProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(totalNetProfit, miningCost.currency)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Gross: {formatCurrency(totalGrossProfit, miningCost.currency)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Operating Costs</div>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-900">
            {formatCurrency(totalOperatingCost, miningCost.currency)}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Per day across all miners
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Electricity Cost</div>
            <Zap className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-lg font-bold text-yellow-900">
            {formatCurrency(totalElectricityCost, 'EUR')}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            @ {formatCurrency(miningCost.electricity_rate_per_kwh, miningCost.currency)}/kWh
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Average ROI</div>
            <Calculator className="h-4 w-4 text-purple-600" />
          </div>
          <div className={`text-lg font-bold ${averageROI >= 0 ? 'text-purple-900' : 'text-red-900'}`}>
            {formatROI(averageROI)}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Return on investment
          </div>
        </div>
      </div>

      {/* Profitability Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Profitability Breakdown</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{profitableMiners}</div>
            <div className="text-xs text-gray-600">Profitable</div>
            <div className="text-xs text-emerald-600">&gt; €1/day profit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{breakEvenMiners}</div>
            <div className="text-xs text-gray-600">Break-even</div>
            <div className="text-xs text-yellow-600">±€0.50/day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{losingMiners}</div>
            <div className="text-xs text-gray-600">Loss</div>
            <div className="text-xs text-red-600">&lt; -€0.50/day</div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Cost Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Daily Breakdown</h5>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Electricity ({formatCurrency(miningCost.electricity_rate_per_kwh, miningCost.currency)}/kWh)</span>
              <span className="text-sm font-medium">{formatCurrency(totalElectricityCost, miningCost.currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Facility Costs</span>
              <span className="text-sm font-medium">{formatCurrency(totalFacilityCost, miningCost.currency)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Total Daily Cost</span>
              <span className="text-sm font-bold">{formatCurrency(totalOperatingCost, miningCost.currency)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Monthly Projections</h5>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Operating Costs</span>
              <span className="text-sm font-medium">{formatCurrency(totalOperatingCost * 30, miningCost.currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gross Revenue</span>
              <span className="text-sm font-medium">{formatCurrency(totalGrossProfit * 30, miningCost.currency)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Net Profit</span>
              <span className={`text-sm font-bold ${totalNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totalNetProfit * 30, miningCost.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

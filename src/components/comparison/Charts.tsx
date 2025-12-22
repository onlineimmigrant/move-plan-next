/**
 * Simple chart components using SVG (no external dependencies)
 */

import React from 'react';

interface PriceComparisonChartProps {
  data: Array<{
    name: string;
    price: number;
    color?: string;
  }>;
  currency: string;
}

export function PriceComparisonChart({ data, currency }: PriceComparisonChartProps) {
  if (!data || data.length === 0) return null;

  const maxPrice = Math.max(...data.map(d => d.price));
  const chartHeight = 200;
  const barWidth = 60;
  const spacing = 20;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 overflow-hidden">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">Price Comparison</h4>
      <div className="overflow-x-auto -mx-6 px-6">
        <svg
          width={data.length * (barWidth + spacing) + spacing}
          height={chartHeight + 60}
        >
        {/* Y-axis labels */}
        <line
          x1={spacing}
          y1={20}
          x2={spacing}
          y2={chartHeight + 20}
          stroke="#e5e7eb"
          strokeWidth={2}
        />
        
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.price / maxPrice) * chartHeight;
          const x = spacing + index * (barWidth + spacing);
          const y = chartHeight + 20 - barHeight;
          const color = item.color || '#3b82f6';

          return (
            <g key={index}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity={0.8}
                rx={4}
              />
              
              {/* Price label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-700"
              >
                {currency}{item.price.toLocaleString()}
              </text>
              
              {/* Name label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 40}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                style={{ maxWidth: barWidth }}
              >
                {item.name.length > 10 ? item.name.slice(0, 10) + '...' : item.name}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}

interface FeatureCoverageChartProps {
  data: Array<{
    name: string;
    coverage: number; // 0-100
    availableCount?: number;
    totalCount?: number;
    color?: string;
  }>;
}

export function FeatureCoverageChart({ data }: FeatureCoverageChartProps) {
  if (!data || data.length === 0) return null;

  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 w-full">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Feature Coverage</h4>
      <p className="text-xs text-gray-500 mb-4">Percentage of features available by provider</p>
      <div className="flex flex-wrap gap-8 justify-center">
        {data.map((item, index) => {
          const offset = circumference - (item.coverage / 100) * circumference;
          const color = item.color || '#3b82f6';

          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                {/* Percentage text */}
                <text
                  x={size / 2}
                  y={size / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold fill-gray-700 transform rotate-90"
                  transform={`rotate(90 ${size / 2} ${size / 2})`}
                >
                  {item.coverage}%
                </text>
              </svg>
              <div className="text-center">
                <span className="text-sm font-medium text-gray-600 block">{item.name}</span>
                <span className="text-xs text-gray-500">{item.availableCount || 0}/{item.totalCount || 0} features</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ValueMetricsProps {
  metrics: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
}

export function ValueMetrics({ metrics }: ValueMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            {metric.icon}
            <span className="text-xs font-medium text-gray-600">{metric.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
        </div>
      ))}
    </div>
  );
}

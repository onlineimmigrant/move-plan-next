/**
 * Simple chart components using SVG (no external dependencies)
 */

import React from 'react';

interface PriceComparisonChartProps {
  data: Array<{
    name: string;
    price: number;
    planPrice?: number;
    addOnCost?: number;
    color?: string;
  }>;
  currency: string;
  intervalLabel?: string;
  isRecurring?: boolean;
  showYearly?: boolean;
  onToggleInterval?: (isYearly: boolean) => void;
}

export function PriceComparisonChart({ data, currency, intervalLabel, isRecurring, showYearly, onToggleInterval }: PriceComparisonChartProps) {
  if (!data || data.length === 0) return null;

  const maxPrice = Math.max(...data.map(d => d.price));
  const chartHeight = 200;
  const barWidth = 60;
  const spacing = 20;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700">
          Price Comparison
        </h4>
        {isRecurring && onToggleInterval && (
          <button
            onClick={() => onToggleInterval(!showYearly)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <span className={!showYearly ? 'text-gray-900' : 'text-gray-500'}>Monthly</span>
            <div className="relative w-9 h-5 bg-gray-200 rounded-full transition-colors" style={{ backgroundColor: showYearly ? '#3b82f6' : '#e5e7eb' }}>
              <div
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                style={{ transform: showYearly ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </div>
            <span className={showYearly ? 'text-gray-900' : 'text-gray-500'}>Annual</span>
          </button>
        )}
      </div>
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
          const totalHeight = (item.price / maxPrice) * chartHeight;
          const x = spacing + index * (barWidth + spacing);
          const y = chartHeight + 20 - totalHeight;
          const color = item.color || '#3b82f6';
          
          // If we have planPrice and addOnCost, show stacked bars
          const hasStackedData = item.planPrice !== undefined && item.addOnCost !== undefined;
          const planHeight = hasStackedData ? ((item.planPrice || 0) / maxPrice) * chartHeight : totalHeight;
          const addOnHeight = hasStackedData ? ((item.addOnCost || 0) / maxPrice) * chartHeight : 0;
          const planY = chartHeight + 20 - planHeight;
          const addOnY = planY - addOnHeight;

          return (
            <g key={index}>
              {hasStackedData ? (
                <>
                  {/* Plan price bar (bottom) */}
                  <rect
                    x={x}
                    y={planY}
                    width={barWidth}
                    height={planHeight}
                    fill={color}
                    opacity={0.8}
                    rx={4}
                    ry={4}
                  />
                  
                  {/* Add-on cost bar (top) */}
                  {addOnHeight > 0 && (
                    <rect
                      x={x}
                      y={addOnY}
                      width={barWidth}
                      height={addOnHeight}
                      fill={color}
                      opacity={0.5}
                      rx={4}
                      ry={4}
                    />
                  )}
                </>
              ) : (
                /* Single color bar for backward compatibility */
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={totalHeight}
                  fill={color}
                  opacity={0.8}
                  rx={4}
                />
              )}
              
              {/* Total price label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-700"
              >
                {currency}{Math.round(item.price).toLocaleString()}
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
  featureData: Array<{
    name: string;
    coverage: number; // 0-100
    availableCount?: number;
    partialCount?: number;
    paidCount?: number;
    customCount?: number;
    totalCount?: number;
    color?: string;
  }>;

  priceData?: Array<{
    name: string;
    price: number;
    planPrice?: number;
    addOnCost?: number;
    color?: string;
  }>;

  currency?: string;
  intervalLabel?: string;
  isRecurring?: boolean;
  showYearly?: boolean;
  onToggleInterval?: (isYearly: boolean) => void;
}

export function FeatureCoverageChart({
  featureData,
  priceData,
  currency = '$',
  intervalLabel,
  isRecurring,
  showYearly,
  onToggleInterval,
}: FeatureCoverageChartProps) {
  const hasFeatureData = !!featureData && featureData.length > 0;
  const hasPriceData = !!priceData && priceData.length > 0;
  if (!hasFeatureData && !hasPriceData) return null;

  const [mode, setMode] = React.useState<'coverage' | 'pricing'>(hasFeatureData ? 'coverage' : 'pricing');

  const [hoveredItem, setHoveredItem] = React.useState<{ index: number; type: string; count: number } | null>(null);

  const baseSize = 120;
  const strokeWidth = 12;
  const radius = (baseSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const priceRangeLabel = React.useMemo(() => {
    if (!hasPriceData) return null;
    const prices = (priceData ?? []).map(d => d.price).filter(p => typeof p === 'number' && !Number.isNaN(p));
    if (prices.length === 0) return null;

    const minPrice = Math.round(Math.min(...prices));
    const maxPrice = Math.round(Math.max(...prices));
    if (minPrice === maxPrice) return `${currency}${minPrice.toLocaleString()}`;
    return `${currency}${minPrice.toLocaleString()} – ${currency}${maxPrice.toLocaleString()}`;
  }, [currency, hasPriceData, priceData]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            {mode === 'coverage' ? 'Feature Coverage' : 'Price Comparison'}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'coverage'
              ? 'Breakdown of features by availability status'
              : `Included vs add-ons${intervalLabel ? ` (${intervalLabel})` : ''}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
          {(hasFeatureData && hasPriceData) && (
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setMode('coverage')}
                className={
                  mode === 'coverage'
                    ? 'px-3 py-1 text-xs font-medium rounded-md bg-white text-gray-900 shadow-sm'
                    : 'px-3 py-1 text-xs font-medium rounded-md text-gray-600 hover:text-gray-900'
                }
              >
                Feature Coverage
              </button>
              <button
                type="button"
                onClick={() => setMode('pricing')}
                className={
                  mode === 'pricing'
                    ? 'px-3 py-1 text-xs font-medium rounded-md bg-white text-gray-900 shadow-sm'
                    : 'px-3 py-1 text-xs font-medium rounded-md text-gray-600 hover:text-gray-900'
                }
              >
                Price Comparison
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:gap-8 sm:justify-center mt-6">
        {mode === 'coverage' && (featureData ?? []).map((item, index) => {
          const total = item.totalCount || 0;
          const available = item.availableCount || 0;
          const partial = item.partialCount || 0;
          const paid = item.paidCount || 0;
          const custom = item.customCount || 0;
          
          // For competitors, display count should be only features they have
          // For organization (index 0), it's all features
          const displayCount = index === 0 ? total : (available + partial + paid + custom);
          
          // Calculate percentages for each segment
          const availablePercent = total > 0 ? (available / total) * 100 : 0;
          const partialPercent = total > 0 ? (partial / total) * 100 : 0;
          const paidPercent = total > 0 ? (paid / total) * 100 : 0;
          const customPercent = total > 0 ? (custom / total) * 100 : 0;
          
          // Calculate offsets for stacked rings
          const availableOffset = circumference - (availablePercent / 100) * circumference;
          const partialOffset = circumference - ((availablePercent + partialPercent) / 100) * circumference;
          const paidOffset = circumference - ((availablePercent + partialPercent + paidPercent) / 100) * circumference;
          const customOffset = circumference - ((availablePercent + partialPercent + paidPercent + customPercent) / 100) * circumference;
          
          const color = item.color || '#3b82f6';

          return (
            <div key={index} className="flex flex-col items-center gap-2 relative">
              <svg
                viewBox={`0 0 ${baseSize} ${baseSize}`}
                className="w-24 h-24 sm:w-30 sm:h-30 transform -rotate-90"
              >
                {/* Background circle */}
                <circle
                  cx={baseSize / 2}
                  cy={baseSize / 2}
                  r={radius}
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                
                {/* Custom conditions (gray) */}
                {customPercent > 0 && (
                  <g 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredItem({ index, type: 'custom', count: custom })}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <circle
                      cx={baseSize / 2}
                      cy={baseSize / 2}
                      r={radius}
                      stroke="#9ca3af"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={customOffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 hover:opacity-70"
                    />
                  </g>
                )}
                
                {/* Paid extra (red) */}
                {paidPercent > 0 && (
                  <g 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredItem({ index, type: 'paid', count: paid })}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <circle
                      cx={baseSize / 2}
                      cy={baseSize / 2}
                      r={radius}
                      stroke="#ef4444"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={paidOffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 hover:opacity-70"
                    />
                  </g>
                )}
                
                {/* Partial (orange) */}
                {partialPercent > 0 && (
                  <g 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredItem({ index, type: 'partial', count: partial })}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <circle
                      cx={baseSize / 2}
                      cy={baseSize / 2}
                      r={radius}
                      stroke="#f59e0b"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={partialOffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 hover:opacity-70"
                    />
                  </g>
                )}
                
                {/* Fully available (primary color for organization, gray for competitors) */}
                {availablePercent > 0 && (
                  <g 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredItem({ index, type: 'included', count: available })}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <circle
                      cx={baseSize / 2}
                      cy={baseSize / 2}
                      r={radius}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={availableOffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 hover:opacity-70"
                    />
                  </g>
                )}
                
                {/* Total feature count in center */}
                <text
                  x={baseSize / 2}
                  y={baseSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xl sm:text-2xl font-bold fill-gray-900"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(90 ${baseSize / 2} ${baseSize / 2})`}
                >
                  {displayCount}
                </text>
              </svg>
              
              {/* Hover tooltip */}
              {hoveredItem && hoveredItem.index === index && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                  {hoveredItem.count} {hoveredItem.type === 'included' ? 'included' : 
                   hoveredItem.type === 'partial' ? 'partial' : 
                   hoveredItem.type === 'paid' ? 'paid extra' : 'custom'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
              
              <div className="text-center">
                <span className="text-xs sm:text-sm font-medium text-gray-600 block">{item.name}</span>
              </div>
            </div>
          );
        })}

        {mode === 'pricing' && (priceData ?? []).map((item, index) => {
          const planPrice = typeof item.planPrice === 'number' ? item.planPrice : item.price;
          const addOnCost = typeof item.addOnCost === 'number' ? item.addOnCost : 0;
          const totalPrice = Math.max(0, (planPrice || 0) + (addOnCost || 0));

          const includedPercent = totalPrice > 0 ? (planPrice / totalPrice) * 100 : 0;
          const addOnPercent = totalPrice > 0 ? (addOnCost / totalPrice) * 100 : 0;

          const includedOffset = circumference - (includedPercent / 100) * circumference;
          const addOnOffset = circumference - ((includedPercent + addOnPercent) / 100) * circumference;

          const color = item.color || '#3b82f6';

          return (
            <div key={index} className="flex flex-col items-center gap-2 relative">
              <svg
                viewBox={`0 0 ${baseSize} ${baseSize}`}
                className="w-24 h-24 sm:w-30 sm:h-30 transform -rotate-90"
              >
                <circle
                  cx={baseSize / 2}
                  cy={baseSize / 2}
                  r={radius}
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                  fill="none"
                />

                {/* Add-ons segment (lighter) */}
                {addOnPercent > 0 && (
                  <circle
                    cx={baseSize / 2}
                    cy={baseSize / 2}
                    r={radius}
                    stroke={color}
                    strokeOpacity={0.35}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={addOnOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}

                {/* Included segment (strong) */}
                {includedPercent > 0 && (
                  <circle
                    cx={baseSize / 2}
                    cy={baseSize / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={includedOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}

                <text
                  x={baseSize / 2}
                  y={baseSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm sm:text-lg font-bold fill-gray-900"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(90 ${baseSize / 2} ${baseSize / 2})`}
                >
                  {currency}{Math.round(item.price).toLocaleString()}
                </text>
              </svg>

              <div className="text-center">
                <span className="text-xs sm:text-sm font-medium text-gray-600 block">{item.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {mode === 'pricing' && (priceRangeLabel || (isRecurring && onToggleInterval)) && (
        <div className="mt-5 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {priceRangeLabel ? (
            <div className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Price range:</span> {priceRangeLabel}
            </div>
          ) : (
            <div />
          )}

          {isRecurring && onToggleInterval && (
            <button
              type="button"
              onClick={() => onToggleInterval(!showYearly)}
              className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <span className={!showYearly ? 'text-gray-900' : 'text-gray-500'}>Monthly</span>
              <div className="relative w-9 h-5 bg-gray-200 rounded-full transition-colors">
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                  style={{ transform: showYearly ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </div>
              <span className={showYearly ? 'text-gray-900' : 'text-gray-500'}>Annual</span>
            </button>
          )}
        </div>
      )}
      
      {/* Legend */}
      {mode === 'coverage' ? (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">Legend:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-700 flex-shrink-0"></div>
              <span className="text-gray-600"><strong>Included:</strong> Fully available in base plan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"></div>
              <span className="text-gray-600"><strong>Partial:</strong> Limited or restricted availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
              <span className="text-gray-600"><strong>Paid Extra:</strong> Available with additional cost</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></div>
              <span className="text-gray-600"><strong>Custom:</strong> Special conditions or custom setup</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-2">Legend:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-700 flex-shrink-0"></div>
              <span className="text-gray-600"><strong>Included:</strong> darker ring segment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></div>
              <span className="text-gray-600"><strong>Add-ons:</strong> lighter ring segment</span>
            </div>
          </div>
        </div>
      )}
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
        <div key={index} className="bg-linear-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
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

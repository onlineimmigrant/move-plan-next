'use client';

import { memo } from 'react';

interface ProgressBarProps {
  stage: number; // Current stage (1, 2, or 3)
}

const ProgressBar = memo(function ProgressBar({ stage }: ProgressBarProps) {
  const stages = [
    { id: 1, label: 'Basket' },
    { id: 2, label: 'Checkout' },
    { id: 3, label: 'Payment' },
  ];

  return (
    <div className="flex items-center justify-center py-6 bg-gray-50/50 border-t border-gray-200 px-4">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8 w-full max-w-2xl overflow-x-auto sm:overflow-x-visible">
        {stages.map((s, index) => (
          <div key={s.id} className="flex items-center flex-shrink-0">
            {/* Circle + Label */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-200 border-2 flex-shrink-0
                  ${
                    s.id === stage
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : s.id < stage
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'border-gray-300 text-gray-400 bg-white'
                  }
                `}
              >
                {s.id < stage ? '✓' : s.id}
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                  s.id === stage
                    ? 'text-gray-900'
                    : s.id < stage
                    ? 'text-sky-600'
                    : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div
                className={`
                  h-0.5 w-6 sm:w-12 md:w-20 mx-2 sm:mx-4 md:mx-6 transition-colors duration-200 flex-shrink-0
                  ${s.id < stage ? 'bg-sky-600' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ProgressBar;

'use client';

import { memo } from 'react';
import { useProductTranslations } from './useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ProgressBarProps {
  stage: number; // Current stage (1, 2, or 3)
}

const ProgressBar = memo(function ProgressBar({ stage }: ProgressBarProps) {
  const { t } = useProductTranslations();
  const themeColors = useThemeColors();
  
  const stages = [
    { id: 1, label: t.basket },
    { id: 2, label: t.checkout },
    { id: 3, label: t.payment },
  ];

  return (
    <div className="bg-white/60 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between space-x-2 sm:space-x-4">
          {stages.map((s, index) => (
            <div key={s.id} className="flex items-center flex-1">
              {/* Circle + Label */}
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2 w-full">
                <div
                  className={`
                    flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border-2 flex-shrink-0
                    ${
                      s.id === stage
                        ? `bg-${themeColors.primary.bg} border-${themeColors.primary.bg} text-white shadow-md`
                        : s.id < stage
                        ? `bg-${themeColors.primary.bg} text-white border-${themeColors.primary.bg}`
                        : 'border-gray-300 text-gray-400 bg-white'
                    }
                  `}
                >
                  {s.id < stage ? '✓' : s.id}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium transition-colors duration-200 mt-1 sm:mt-0 text-center sm:text-left ${
                    s.id === stage
                      ? 'text-gray-900 font-semibold'
                      : s.id < stage
                      ? `text-${themeColors.primary.text}`
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
                    h-0.5 w-4 sm:w-8 md:w-16 mx-1 sm:mx-2 transition-colors duration-200 flex-shrink-0
                    ${s.id < stage ? `bg-${themeColors.primary.bg}` : 'bg-gray-300'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ProgressBar;

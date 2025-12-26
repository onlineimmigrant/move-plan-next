import React from 'react';
import { Info } from 'lucide-react';
import { getScoringMethodology } from '@/lib/comparison/scoring';

interface ScoringMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScoringMethodologyModal({ isOpen, onClose }: ScoringMethodologyModalProps) {
  if (!isOpen) return null;

  const methodology = getScoringMethodology();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {methodology.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Transparent, objective scoring methodology
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              {methodology.description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scoring Criteria
            </h3>
            
            {methodology.criteria.map((criterion) => (
              <div
                key={criterion.name}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {criterion.name}
                  </h4>
                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {criterion.weight}% weight
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {criterion.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Important Note
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Scores are based solely on features and pricing data shown in this comparison. 
                  Other factors like customer support, reliability, ease of use, and brand reputation 
                  are not included. Use scores as one factor in your decision, not the only factor.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Data Sources
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All pricing and feature information is based on publicly available data from competitor 
              websites and is regularly updated. Scores are recalculated automatically when data changes.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
}

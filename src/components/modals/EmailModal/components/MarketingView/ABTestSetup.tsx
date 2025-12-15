'use client';

import React, { useState } from 'react';
import { TestTube2, X } from 'lucide-react';
import Button from '@/ui/Button';

interface ABTestSetupProps {
  campaignData: any;
  onUpdateCampaign: (updates: any) => void;
  primary: { base: string; hover: string };
}

export default function ABTestSetup({ campaignData, onUpdateCampaign, primary }: ABTestSetupProps) {
  const [enabled, setEnabled] = useState(false);
  const [testType, setTestType] = useState<'subject' | 'content' | 'from_name'>('subject');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [testPercentage, setTestPercentage] = useState(20);
  const [winnerMetric, setWinnerMetric] = useState<'open_rate' | 'click_rate'>('open_rate');
  const [testDuration, setTestDuration] = useState(24);

  const handleSetup = () => {
    if (!variantA || !variantB) {
      alert('Please provide both variants');
      return;
    }

    onUpdateCampaign({
      ab_test_enabled: true,
      ab_test_type: testType,
      ab_test_variant_a: variantA,
      ab_test_variant_b: variantB,
      ab_test_percentage: testPercentage,
      ab_test_metric: winnerMetric,
      ab_test_duration_hours: testDuration,
    });

    alert('A/B test configured! The winning variant will be automatically sent to remaining recipients after the test period.');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <TestTube2 className="w-4 h-4 sm:w-5 sm:h-5" />
            A/B Testing
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Test different versions to optimize your campaign
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 text-primary focus:ring-primary rounded"
          />
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Enable A/B Testing</span>
        </label>
      </div>

      {enabled && (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Test Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What to test
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as any)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary min-h-[44px] text-sm"
            >
              <option value="subject">Subject Line</option>
              <option value="content">Email Content</option>
              <option value="from_name">From Name</option>
            </select>
          </div>

          {/* Variants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variant A
              </label>
              <input
                type="text"
                value={variantA}
                onChange={(e) => setVariantA(e.target.value)}
                placeholder={testType === 'subject' ? 'Subject line A' : testType === 'from_name' ? 'From name A' : 'Content A'}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary min-h-[44px] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variant B
              </label>
              <input
                type="text"
                value={variantB}
                onChange={(e) => setVariantB(e.target.value)}
                placeholder={testType === 'subject' ? 'Subject line B' : testType === 'from_name' ? 'From name B' : 'Content B'}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary min-h-[44px] text-sm"
              />
            </div>
          </div>

          {/* Test Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Sample Size: {testPercentage}%
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={testPercentage}
                onChange={(e) => setTestPercentage(Number(e.target.value))}
                className="w-full min-h-[44px]"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {testPercentage}% will receive test variants, {100 - testPercentage}% will receive the winner
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Winning Metric
              </label>
              <select
                value={winnerMetric}
                onChange={(e) => setWinnerMetric(e.target.value as any)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary min-h-[44px] text-sm"
              >
                <option value="open_rate">Open Rate</option>
                <option value="click_rate">Click Rate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Duration: {testDuration} hours
            </label>
            <input
              type="range"
              min="1"
              max="72"
              step="1"
              value={testDuration}
              onChange={(e) => setTestDuration(Number(e.target.value))}
              className="w-full min-h-[44px]"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              After {testDuration} hours, the winning variant will be sent to the remaining {100 - testPercentage}%
            </p>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <h5 className="font-medium text-blue-700 dark:text-blue-400 mb-2 text-xs sm:text-sm">Test Summary</h5>
            <ul className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• {testPercentage / 2}% will receive Variant A: "{variantA || '...'}"</li>
              <li>• {testPercentage / 2}% will receive Variant B: "{variantB || '...'}"</li>
              <li>• Winner determined by {winnerMetric === 'open_rate' ? 'open rate' : 'click rate'} after {testDuration}h</li>
              <li>• Remaining {100 - testPercentage}% will receive the winning variant</li>
            </ul>
          </div>

          <Button onClick={handleSetup} variant="primary" className="w-full min-h-[44px]">
            <TestTube2 className="w-4 h-4" />
            <span className="ml-2">Configure A/B Test</span>
          </Button>
        </div>
      )}
    </div>
  );
}

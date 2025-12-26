import React from 'react';
import PricingToggle from '@/components/pricing/PricingToggle';
import { AddCompetitorDropdown } from './AddCompetitorDropdown';
import { CurrencyBadge } from './CurrencyBadge';
import { ComparisonCompetitor } from '@/types/comparison';

interface PricingControlsProps {
  showYearly: boolean;
  onToggleYearly: (isYearly: boolean) => void;
  isRecurring: boolean;
  showInterval: 'monthly' | 'yearly' | 'both' | undefined;
  remainingCompetitors: ComparisonCompetitor[];
  showAddCompetitorMenu: boolean;
  onToggleAddCompetitor: () => void;
  onAddCompetitor: (competitorId: string) => void;
  currencyCode?: string;
  currencySymbol: string;
}

/**
 * PricingControls manages the pricing toggle, add competitor button, and currency badge.
 * Handles two different layouts: grid (with interval toggle) or flex (without interval toggle).
 */
export const PricingControls = React.memo<PricingControlsProps>(({
  showYearly,
  onToggleYearly,
  isRecurring,
  showInterval,
  remainingCompetitors,
  showAddCompetitorMenu,
  onToggleAddCompetitor,
  onAddCompetitor,
  currencyCode,
  currencySymbol,
}) => {
  const showIntervalToggle = isRecurring && showInterval === 'both';

  if (showIntervalToggle) {
    return (
      <div className="flex items-center justify-between gap-2 sm:grid sm:grid-cols-3 sm:items-center">
        <div className="flex justify-start">
          <AddCompetitorDropdown
            remainingCompetitors={remainingCompetitors}
            isOpen={showAddCompetitorMenu}
            onToggle={onToggleAddCompetitor}
            onAddCompetitor={onAddCompetitor}
          />
        </div>
        <div className="flex justify-center">
          <PricingToggle
            isAnnual={showYearly}
            onToggle={onToggleYearly}
            translations={{ monthly: 'Monthly', annual: 'Annual' }}
            variant="inline"
            size="md"
          />
        </div>
        <div className="flex justify-end">
          <CurrencyBadge
            currencyCode={currencyCode}
            currencySymbol={currencySymbol}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
      <div className="flex justify-start">
        <AddCompetitorDropdown
          remainingCompetitors={remainingCompetitors}
          isOpen={showAddCompetitorMenu}
          onToggle={onToggleAddCompetitor}
          onAddCompetitor={onAddCompetitor}
        />
      </div>
      <div className="flex justify-end">
        <CurrencyBadge
          currencyCode={currencyCode}
          currencySymbol={currencySymbol}
        />
      </div>
    </div>
  );
});

PricingControls.displayName = 'PricingControls';

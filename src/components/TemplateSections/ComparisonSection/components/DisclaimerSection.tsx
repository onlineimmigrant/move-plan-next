import React from 'react';

interface DisclaimerSectionProps {
  showDisclaimer?: boolean;
  disclaimerText?: string;
}

const DEFAULT_DISCLAIMER = 'Pricing and feature information is based on publicly available data and may not be current. Please verify with providers.';

/**
 * DisclaimerSection displays a footer disclaimer for comparison data.
 * Commonly used to clarify that pricing/feature information may not be current.
 */
export const DisclaimerSection = React.memo<DisclaimerSectionProps>(({ 
  showDisclaimer, 
  disclaimerText 
}) => {
  if (!showDisclaimer) {
    return null;
  }

  return (
    <div className="mt-8 text-center text-sm text-gray-500">
      {disclaimerText || DEFAULT_DISCLAIMER}
    </div>
  );
});

DisclaimerSection.displayName = 'DisclaimerSection';

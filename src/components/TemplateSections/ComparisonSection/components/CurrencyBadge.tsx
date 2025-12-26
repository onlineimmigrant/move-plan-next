import React from 'react';

/**
 * CurrencyBadge displays the currency code and symbol.
 */

interface CurrencyBadgeProps {
  currencyCode?: string;
  currencySymbol: string;
}

const CurrencyBadgeComponent: React.FC<CurrencyBadgeProps> = ({
  currencyCode,
  currencySymbol,
}) => {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
      {currencyCode ? (
        <>
          <span>{currencyCode}</span>
          <span className="mx-1">·</span>
          <span>{currencySymbol}</span>
        </>
      ) : (
        <span>{currencySymbol}</span>
      )}
    </span>
  );
};

export const CurrencyBadge = React.memo(CurrencyBadgeComponent);

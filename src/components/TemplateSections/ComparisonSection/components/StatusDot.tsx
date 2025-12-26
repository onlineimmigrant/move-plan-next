import React, { memo } from 'react';

export interface StatusDotProps {
  status: 'available' | 'partial' | 'unavailable' | 'unknown';
  primaryColor: string;
  label?: string;
}

export const StatusDot = memo<StatusDotProps>(({ status, primaryColor, label }) => {
  if (status === 'available') {
    return (
      <>
        <span className="sr-only">{label || 'Available'}</span>
        <span
          aria-hidden="true"
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: primaryColor }}
          title={label || 'Available'}
        />
      </>
    );
  }
  
  if (status === 'partial') {
    return (
      <>
        <span className="sr-only">{label || 'Partial'}</span>
        <span
          aria-hidden="true"
          className="inline-block w-3 h-3 rounded-full border bg-transparent"
          style={{
            borderColor: primaryColor,
            backgroundImage: `linear-gradient(to right, ${primaryColor} 50%, transparent 50%)`,
          }}
          title={label || 'Partial'}
        />
      </>
    );
  }
  
  // unavailable or unknown
  return (
    <>
      <span className="sr-only">{label || (status === 'unavailable' ? 'Unavailable' : 'Unknown')}</span>
      <span
        aria-hidden="true"
        className="inline-block w-3 h-3 rounded-full bg-gray-200"
        title={label || (status === 'unavailable' ? 'Unavailable' : 'Unknown')}
      />
    </>
  );
});

StatusDot.displayName = 'StatusDot';

import React, { memo } from 'react';

export interface StatusDotProps {
  status: 'available' | 'partial' | 'unavailable' | 'unknown';
  primaryColor: string;
  label?: string;
  onMouseEnter?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  className?: string;
}

export const StatusDot = memo<StatusDotProps>(({ 
  status, 
  primaryColor, 
  label,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className = '',
}) => {
  if (status === 'available') {
    return (
      <>
        <span className="sr-only">{label || 'Available'}</span>
        <span
          aria-hidden="true"
          data-feature-media-hover-anchor="true"
          className={`inline-block w-3 h-3 rounded-full cursor-pointer hover:scale-150 transition-all duration-200 ${className}`}
          style={{ backgroundColor: primaryColor }}
          title={label || 'Available'}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
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
          data-feature-media-hover-anchor="true"
          className={`inline-block w-3 h-3 rounded-full border bg-transparent cursor-pointer hover:scale-150 transition-all duration-200 ${className}`}
          style={{
            borderColor: primaryColor,
            backgroundImage: `linear-gradient(to right, ${primaryColor} 50%, transparent 50%)`,
          }}
          title={label || 'Partial'}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
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

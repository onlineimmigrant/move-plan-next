import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function CompetitorCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200">
      <Skeleton variant="circular" width={32} height={32} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={32} height={32} />
        <Skeleton variant="rectangular" width={32} height={32} />
      </div>
    </div>
  );
}

export function FeatureRowSkeleton() {
  return (
    <div className="border-b border-gray-100 p-3">
      <div className="flex items-center gap-4">
        <Skeleton variant="text" width="30%" height={16} />
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="circular" width={20} height={20} />
      </div>
    </div>
  );
}
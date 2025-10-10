// ModalBackdrop.tsx - Backdrop/Overlay for modals
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ModalBackdropProps {
  onClick?: () => void;
  className?: string;
  blur?: boolean;
}

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  onClick,
  className,
  blur = true,
}) => {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 transition-opacity',
        blur && 'backdrop-blur-sm',
        className
      )}
      onClick={onClick}
      aria-hidden="true"
    />
  );
};

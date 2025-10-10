// ModalFooter.tsx - Footer section for modals with actions
'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ModalFooterProps {
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
  align = 'right',
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50',
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

// ModalBody.tsx - Body/content section for modals
'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  scrollable?: boolean;
}

export const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className,
  noPadding = false,
  scrollable = true,
}) => {
  return (
    <div 
      className={cn(
        'flex-1',
        !noPadding && 'p-6',
        scrollable && 'overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

'use client';

import React from 'react';
import CrmModal from './CrmModal';
import { useCrmModal } from './context';

export function CrmModalManager() {
  const { isOpen, initialTab, closeModal } = useCrmModal();

  return (
    <CrmModal
      isOpen={isOpen}
      onClose={closeModal}
      initialTab={initialTab}
    />
  );
}
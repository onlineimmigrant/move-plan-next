/**
 * CustomersView Component for CRM Modal
 *
 * Reuses the existing CustomersView from ShopModal
 * Part of the CRM modal - Customers tab
 */

'use client';

import React from 'react';
import ShopCustomersView from '../../ShopModal/components/CustomersView';

interface CustomersViewProps {
  organizationId?: string;
  searchQuery?: string;
}

export default function CustomersView({ organizationId, searchQuery }: CustomersViewProps) {
  return <ShopCustomersView organizationId={organizationId} />;
}
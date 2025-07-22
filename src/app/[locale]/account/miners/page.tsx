'use client';

import React from 'react';
import { CurrencyProvider } from '@/components/MinersComponent/CurrencyContext';
import UserMinersDashboard from '@/components/MinersComponent/UserMinersDashboard';

export default function MinersPage({ params }: { params: { locale: string } }) {
  return (
    <CurrencyProvider>
      <div className=" min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <UserMinersDashboard />
      </div>
    </CurrencyProvider>
  );
}
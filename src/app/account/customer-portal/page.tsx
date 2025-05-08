'use client';

import Link from 'next/link';
import { useState } from 'react';
import AccountTab from '@/components/AccountTab';
import Toast from '@/components/Toast';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CustomerPortal() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  return (
    <div className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}



        {/* Tabs Section */}
        <div className='pt-8'>
            <AccountTab />
        </div>
        {/* Link to Stripe Billing */}
        <div className="mt-16 flex justify-center">
          <Link
            href="https://billing.stripe.com/p/login/test_9B63cv84e11kb94ee76sw00"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sky-600 font-medium text-base underline hover:text-sky-800 transition-colors duration-150"
            aria-label="Manage your billing account on Stripe (opens in a new tab)"
          >
            <span>Manage your billing account</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
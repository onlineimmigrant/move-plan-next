'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw } from 'react-icons/fi';
import Tooltip from '@/components/Tooltip';
import Button from '@/ui/Button';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAccountAuth } from '@/hooks/useAccountAuth';
import { useTransactions, type Transaction } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { AccountPagination } from '@/components/account/AccountPagination';
import { PAGINATION } from '@/constants/ui';
import { logger } from '@/lib/logger';

// Define the Item interface based on the metadata.items JSON
interface Item {
  id: string;
  product_name: string;
  package: string;
  measure: string;
}

export default function PaymentsPage() {
  const { accessToken, userId, isLoading: authLoading, error: authError } = useAccountAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const itemsPerPage = PAGINATION.ITEMS_PER_PAGE_SMALL;
  
  const { 
    transactions, 
    totalCount, 
    isLoading: transactionsLoading, 
    error: transactionsError, 
    hasNonSucceeded, 
    fetchTransactions,
    syncAndFetchTransactions 
  } = useTransactions({
    userId,
    accessToken,
    itemsPerPage,
    currentPage,
    showAllPayments,
  });

  const { success, error: showError } = useToast();
  const router = useRouter();
  const { t } = useAccountTranslations();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const isLoading = authLoading || transactionsLoading;
  const error = authError || transactionsError;

  // Fetch transactions when dependencies change
  useEffect(() => {
    if (accessToken && userId) {
      fetchTransactions();
    }
  }, [accessToken, userId, currentPage, showAllPayments, fetchTransactions]);

  // Format amount based on currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  // Format date and time
  const formatDateTime = (date: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(date));
  };

  // Determine transaction status
  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.refunded_date) {
      return 'refunded';
    }
    return transaction.status;
  };

  // Format refunded date
  const formatRefundedDate = (refundedDate: string | null) => {
    if (!refundedDate) return 'N/A';
    return formatDateTime(refundedDate);
  };

  // Parse and format purchased items from metadata
  const formatPurchasedItems = (metadata: { items?: string; [key: string]: string | undefined }) => {
    if (!metadata || !metadata.items) return 'N/A';
    try {
      const items: Item[] = JSON.parse(metadata.items);
      return (
        <div className="space-y-2" role="list" aria-label="Purchased items">
          {items.map((item) => (
            <div key={item.id} className="flex items-center bg-gray-50 p-1" role="listitem">
              <p className="text-sm text-gray-900 font-medium">
                {item.product_name}
              </p>
              <p className="ml-2 text-xs text-gray-500">
                ({item.package}, {item.measure})
              </p>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      logger.error('Error parsing items from metadata:', error);
      return 'No items found';
    }
  };

  // Navigate to receipt page
  const handleViewReceipt = (stripeTransactionId: string) => {
    router.push(`/account/profile/payments/receipt?transaction_id=${stripeTransactionId}`);
  };

  // Handle sync and show toast
  const handleSync = async () => {
    try {
      await syncAndFetchTransactions();
      success(t.transactionsSyncedSuccessfully);
      setCurrentPage(1); // Reset to first page after sync
    } catch (err) {
      showError((err as Error).message || t.failedToSyncTransactions);
    }
  };

  // Reset page to 1 when switching modes
  useEffect(() => {
    setCurrentPage(1);
  }, [showAllPayments]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.payments}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View and manage your payment history
          </p>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {showAllPayments ? 'All Payments' : 'Succeeded Payments'}
        </h2>
        {hasNonSucceeded && (
          <Tooltip content="Show Succeeded/All Payments">
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllPayments}
                  onChange={() => setShowAllPayments(!showAllPayments)}
                  className="sr-only peer"
                  aria-label="Toggle between succeeded and all payments"
                />
                <div 
                  className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    '--tw-ring-color': `${primary.lighter}80`,
                    backgroundColor: showAllPayments ? primary.base : undefined
                  } as React.CSSProperties}
                ></div>
              </label>
            </Tooltip>
          )}
        </div>

        {/* Transactions Table */}
        {error ? (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md text-center" role="alert" aria-live="polite">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-md" role="region" aria-label="Payment transactions table">
              <table className="min-w-full divide-y divide-gray-200" role="table">
                <thead className="bg-gray-50 sticky top-0 z-10" role="rowgroup">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50"
                    >
                      {t.transactionDate}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t.amount}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t.method}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t.status}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t.refundedDate}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t.purchasedItems}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="border-r border-gray-200 sm:min-w-xs min-w-48 px-6 py-4 text-sm text-gray-900 sticky left-0 z-10 bg-white">
                        <button
                          onClick={() => handleViewReceipt(transaction.stripe_transaction_id)}
                          className="text-sm text-gray-800 hover:text-sky-500 hover:underline transition duration-150"
                          aria-label={`View receipt for transaction ${transaction.stripe_transaction_id}`}
                        >
                          {formatDateTime(transaction.created_at)}
                        </button>
                        <br />
                        <span className="text-xs text-gray-400 font-light" style={{ fontSize: '8px' }}>
                          {transaction.stripe_transaction_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.payment_method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            getTransactionStatus(transaction) === 'succeeded'
                              ? 'bg-green-100 text-green-800'
                              : getTransactionStatus(transaction) === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : getTransactionStatus(transaction) === 'refunded'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getTransactionStatus(transaction)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRefundedDate(transaction.refunded_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatPurchasedItems(transaction.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <AccountPagination
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
            />
          </>
        ) : (
          <div className="mt-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {showAllPayments ? 'No transactions found' : 'No succeeded transactions found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {showAllPayments
                ? 'It looks like you haven’t made any payments yet.'
                : 'You don’t have any succeeded payments at this time.'}
            </p>
            <div className="mt-4 max-w-sm mx-auto">
              <Button
                variant="start"
                onClick={handleSync}
                className="bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 rounded-md px-4"
                aria-label="Sync transactions"
              >
                {t.syncTransactions}
              </Button>
            </div>
          </div>
        )}
      </div>
  );
}
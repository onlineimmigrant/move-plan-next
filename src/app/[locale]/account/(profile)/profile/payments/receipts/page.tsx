'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAccountAuth } from '@/hooks/useAccountAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import { AccountPagination } from '@/components/account/AccountPagination';

// Item interface for metadata parsing
interface Item {
  id: string;
  product_name: string;
  package: string;
  measure: string;
}

export default function ReceiptsPage() {
  const { accessToken, userId, isLoading: authLoading, error: authError } = useAccountAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const {
    transactions,
    totalCount,
    isLoading: transactionsLoading,
    error: transactionsError,
    syncAndFetchTransactions,
  } = useTransactions({
    userId,
    accessToken,
    itemsPerPage,
    currentPage,
    succeededOnly: true, // Only fetch succeeded transactions for receipts
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
      syncAndFetchTransactions();
    }
  }, [accessToken, userId, currentPage, syncAndFetchTransactions]);

  // Fetch transactions when dependencies change
  useEffect(() => {
    if (accessToken && userId) {
      syncAndFetchTransactions();
    }
  }, [accessToken, userId, currentPage, syncAndFetchTransactions]);

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

  // Parse and format purchased items from metadata
  const formatPurchasedItems = (metadata: { [key: string]: string | undefined }) => {
    if (!metadata || !metadata.items) return 'N/A';
    try {
      const items: Item[] = JSON.parse(metadata.items);
      return (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center bg-gray-50 p-1">
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
      console.error('Error parsing items from metadata:', error);
      return t.noItemsFound;
    }
  };

  // Navigate to receipt page
  const handleViewReceipt = (stripeTransactionId: string) => {
    router.push(`/account/profile/payments/receipt?transaction_id=${stripeTransactionId}`);
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await syncAndFetchTransactions();
      success('Receipts refreshed successfully!');
      setCurrentPage(1);
    } catch (err) {
      showError((err as Error).message || 'Failed to refresh receipts');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.receipts}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View and download your payment receipts
          </p>
        </div>
      </div>

      {/* Receipts Table */}
      {error ? (
        <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg border border-white/20 dark:border-gray-700/30 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          {accessToken && (
            <button
              onClick={handleRefresh}
              className="mt-4 text-white hover:opacity-90 focus:ring-2 rounded-md px-4 py-2 transition-all"
              style={{ backgroundColor: primary.base, boxShadow: `0 0 0 3px ${primary.lighter}40` }}
              aria-label="Retry fetching receipts"
            >
              Retry
            </button>
          )}
        </div>
      ) : transactions.length > 0 ? (
        <>
          <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/30 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 z-20 bg-gray-50/80 dark:bg-gray-700/50"
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
                      {t.purchasedItems}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t.action}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="border-r border-gray-200 sm:min-w-xs min-w-48 px-6 py-4 text-sm text-gray-900 sticky left-0 z-10 bg-white">
                        {formatDateTime(transaction.created_at)}
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatPurchasedItems(transaction.metadata)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <button
                          onClick={() => handleViewReceipt(transaction.stripe_transaction_id)}
                          className="hover:underline transition-colors"
                          style={{ color: primary.base }}
                          aria-label={`View receipt for transaction ${transaction.stripe_transaction_id}`}
                        >
                          {t.viewReceipt}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AccountPagination
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
            />
          </>
        ) : (
          <div className="mt-4 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-12">
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
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No receipts found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You don't have any receipts at this time.</p>
            <div className="mt-4 max-w-sm mx-auto">
              <button
                onClick={handleRefresh}
                className="text-white hover:opacity-90 focus:ring-2 rounded-md px-4 py-2 transition-all"
                style={{ backgroundColor: primary.base, boxShadow: `0 0 0 3px ${primary.lighter}40` }}
                aria-label="Refresh receipts"
              >
                Refresh Receipts
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
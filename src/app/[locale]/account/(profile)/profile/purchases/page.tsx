'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiRefreshCw, FiDownload, FiArrowRightCircle } from 'react-icons/fi';
import { MdOutlineLocalShipping } from 'react-icons/md';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import Tooltip from '@/components/Tooltip';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAccountAuth } from '@/hooks/useAccountAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { useToast } from '@/hooks/useToast';
import { AccountPagination } from '@/components/account/AccountPagination';
import { PAGINATION } from '@/constants/ui';

export default function PurchasesPage() {
  const { accessToken, userId, canonicalProfileId, isLoading: authLoading, error: authError } = useAccountAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  const itemsPerPage = PAGINATION.ITEMS_PER_PAGE_SMALL;

  const {
    groupedPurchases,
    totalCount,
    isLoading: purchasesLoading,
    error: purchasesError,
    fetchPurchases,
    syncAndFetchPurchases,
  } = usePurchases({
    userId: canonicalProfileId,
    accessToken,
    itemsPerPage,
    currentPage,
  });

  const { success, error: showError } = useToast();
  const router = useRouter();
  const { t } = useAccountTranslations();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  const isLoading = authLoading || purchasesLoading;
  const error = authError || purchasesError;

  // Fetch purchases when dependencies change
  useEffect(() => {
    if (accessToken && userId) {
      fetchPurchases();
    }
  }, [accessToken, userId, currentPage, fetchPurchases]);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Navigate to receipt page
  const handleViewReceipt = (stripeTransactionId: string) => {
    router.push(`/account/profile/payments/receipt?transaction_id=${stripeTransactionId}`);
  };

  // Handle sync
  const handleSync = async () => {
    try {
      await syncAndFetchPurchases();
      success('Purchases synchronized successfully!');
      setCurrentPage(1);
    } catch (err) {
      showError((err as Error).message || 'Failed to sync purchases');
    }
  };

  // Reset page when switching modes
  useEffect(() => {
    setCurrentPage(1);
  }, [showAllPurchases]);

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 pt-8">
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
            {t.purchases}
          </h1>
        </div>
      </div>

      {/* Controls Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Tooltip content="Sync with Stripe">
            <button
              onClick={handleSync}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: primary.base,
                color: primary.base,
              }}
              aria-label="Sync purchases"
            >
              <FiRefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Sync</span>
            </button>
          </Tooltip>
          
          <Link
            href="/account/profile/payments"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ color: primary.base }}
          >
            <span className="font-medium">View Payments</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Purchases List */}
      {error ? (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md text-center" role="alert" aria-live="polite">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : groupedPurchases.length > 0 ? (
        <>
          <div className="space-y-6" role="list" aria-label="Purchase transactions">
            {groupedPurchases.map((group) => (
              <div
                key={group.transaction_id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-md"
                role="listitem"
              >
                {/* Transaction Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(group.purchase_date)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Transaction ID: {group.transaction_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {group.currency.toUpperCase()} {group.total.toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleViewReceipt(group.transaction_id)}
                      className="text-sm mt-2 hover:underline transition-colors"
                      style={{ color: primary.base }}
                    >
                      {t.viewReceipt || 'View Receipt'}
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4" role="list" aria-label="Items in this transaction">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                      role="listitem"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {item.product_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.pricing_plan}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {item.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                                Expired
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Download/Access Buttons */}
                      <div className="flex gap-2">
                        {item.epub_file && (
                          <a
                            href={item.epub_file}
                            download
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: `${primary.lighter}40`,
                              color: primary.base,
                            }}
                            aria-label={`Download ${item.product_name} EPUB`}
                          >
                            <FiDownload className="h-4 w-4" />
                            <span>EPUB</span>
                          </a>
                        )}
                        {item.pdf_file && (
                          <a
                            href={item.pdf_file}
                            download
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: `${primary.lighter}40`,
                              color: primary.base,
                            }}
                            aria-label={`Download ${item.product_name} PDF`}
                          >
                            <FiDownload className="h-4 w-4" />
                            <span>PDF</span>
                          </a>
                        )}
                        {item.digital_asset_access && (
                          <a
                            href={item.digital_asset_access}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: `${primary.lighter}40`,
                              color: primary.base,
                            }}
                            aria-label={`Access ${item.product_name}`}
                          >
                            <FiArrowRightCircle className="h-4 w-4" />
                            <span>Access</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
          <MdOutlineLocalShipping className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No purchases found
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            It looks like you haven't made any purchases yet.
          </p>
          <div className="mt-6">
            <Button
              onClick={handleSync}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: primary.base,
                color: 'white',
              }}
            >
              <FiRefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Purchases
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

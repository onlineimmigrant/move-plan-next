'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/ui/Button';
import AccountPaymentsReceiptTab from '@/components/AccountPaymentsReceiptTab';
import Toast from '@/components/Toast';

// Transaction interface (same as PaymentsPage)
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_transaction_id: string;
  payment_method: string;
  refunded_date: string | null;
  metadata: { [key: string]: string };
}

// Item interface (same as PaymentsPage)
interface Item {
  id: string;
  product_name: string;
  package: string;
  measure: string;
}

// Custom Hook for Authentication (same as PaymentsPage)
const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw new Error(`Failed to fetch session: ${error.message}`);

        if (session) {
          setAccessToken(session.access_token);
          setUserId(session.user.id);
        } else {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            throw new Error('No active session found. Please log in.');
          }
          setAccessToken(refreshData.session.access_token);
          setUserId(refreshData.session.user.id);
        }
      } catch (error) {
        console.error('useAuth error:', error);
        setError((error as Error).message);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  return { accessToken, userId, isLoading, error };
};

// Custom Hook to Fetch Transactions
const useTransactions = (accessToken: string | null, userId: string | null, itemsPerPage: number, currentPage: number) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!accessToken || !userId) {
      console.log('No access token or user ID, skipping fetchTransactions');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, user_id, amount, currency, status, created_at, stripe_transaction_id, payment_method, refunded_date, metadata')
        .eq('user_id', userId)
        .eq('status', 'succeeded') // Only fetch succeeded transactions for receipts
        .is('refunded_date', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (transactionsError) throw new Error(transactionsError.message);

      const { count, error: countError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'succeeded')
        .is('refunded_date', null);

      if (countError) throw new Error(countError.message);

      console.log('Supabase transactions:', transactionsData, 'Total:', count);
      setTransactions(transactionsData || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('fetchTransactions error:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, itemsPerPage, currentPage]);

  useEffect(() => {
    if (accessToken && userId) {
      console.log('Triggering fetchTransactions');
      fetchTransactions();
    }
  }, [accessToken, userId, itemsPerPage, currentPage, fetchTransactions]);

  return { transactions, totalCount, isLoading, error, fetchTransactions };
};

export default function ReceiptsPage() {
  const { accessToken, userId, isLoading: authLoading, error: authError } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { transactions, totalCount, isLoading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransactions(accessToken, userId, itemsPerPage, currentPage);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const isLoading = authLoading || transactionsLoading;
  const error = authError || transactionsError;

  // Pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
  const formatPurchasedItems = (metadata: { [key: string]: string }) => {
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
      return 'No items found';
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Navigate to receipt page
  const handleViewReceipt = (stripeTransactionId: string) => {
    router.push(`/account/payments/receipt?transaction_id=${stripeTransactionId}`);
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await fetchTransactions();
      setToast({ message: 'Receipts refreshed successfully', type: 'success' });
      setCurrentPage(1);
    } catch (error) {
      setToast({ message: (error as Error).message || 'Failed to refresh receipts', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
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
        <div className="pt-8">
          <AccountPaymentsReceiptTab />
        </div>

        <div className="mt-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Receipts</h2>
        </div>

        {/* Receipts Table */}
        {error ? (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-600 font-medium">{error}</p>
            {accessToken && (
              <Button
                variant="start"
                onClick={handleRefresh}
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 rounded-md px-4"
                aria-label="Retry fetching receipts"
              >
                Retry
              </Button>
            )}
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50"
                    >
                      Transaction Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Method
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Purchased Items
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Action
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
                          className="text-sky-600 hover:text-sky-800 underline"
                          aria-label={`View receipt for transaction ${transaction.stripe_transaction_id}`}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {totalCount} {totalCount === 1 ? 'receipt' : 'receipts'}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } focus:ring-blue-500 rounded-md px-4`}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } focus:ring-blue-500 rounded-md px-4`}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts found</h3>
            <p className="mt-1 text-sm text-gray-500">You don’t have any receipts at this time.</p>
            <div className="mt-4 max-w-sm mx-auto">
              <Button
                variant="start"
                onClick={handleRefresh}
                className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 rounded-md px-4"
                aria-label="Refresh receipts"
              >
                Refresh Receipts
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
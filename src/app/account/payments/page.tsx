'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw } from 'react-icons/fi';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import AccountTab from '@/components/AccountTab';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/ui/Button';


import Link from 'next/link';

import { ArrowRightIcon } from '@heroicons/react/24/outline';

// Define the Transaction interface based on the Supabase transactions table
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

// Define the Item interface based on the metadata.items JSON
interface Item {
  id: string;
  product_name: string;
  package: string;
  measure: string;
}

// Custom Hook for Authentication (unchanged)
const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
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
        } else {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            throw new Error('No active session found. Please log in.');
          }
          setAccessToken(refreshData.session.access_token);
        }
      } catch (error) {
        setError((error as Error).message);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  return { accessToken, isLoading, error };
};

// Custom Hook to Fetch User's Transactions with Pagination (unchanged)
const useTransactions = (accessToken: string | null, itemsPerPage: number, currentPage: number) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(`/api/transactions?limit=${itemsPerPage}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalCount(data.totalCount);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, itemsPerPage, currentPage]);

  const syncAndFetchTransactions = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const syncResponse = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Failed to sync transactions with Stripe');
      }

      await fetchTransactions();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchTransactions]);

  useEffect(() => {
    if (accessToken) fetchTransactions();
  }, [accessToken, itemsPerPage, currentPage, fetchTransactions]);

  return { transactions, totalCount, isLoading, error, fetchTransactions, syncAndFetchTransactions };
};



export default function PaymentsPage() {
  const { accessToken, isLoading: authLoading, error: authError } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { transactions, totalCount, isLoading: transactionsLoading, error: transactionsError, fetchTransactions, syncAndFetchTransactions } = useTransactions(accessToken, itemsPerPage, currentPage);
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
    }).format(amount); // Removed division by 100
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
  const formatPurchasedItems = (metadata: { [key: string]: string }) => {
    if (!metadata || !metadata.items) return 'N/A';
    try {
      const items: Item[] = JSON.parse(metadata.items);
      return (
        <div className="space-y-2">
          {items.map((item, index) => (
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

        {/* Transactions Table */}
        {error ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-600 font-medium">{error}</p>
            {accessToken && (
              <Button
                onClick={fetchTransactions}
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus:ring-sky-600"
                aria-label="Retry fetching transactions"
              >
                Retry
              </Button>
            )}
          </div>
        ) : transactions.length > 0 ? (
          <>


            {/* Tabs Section */}
            <div className="pt-8">
              <AccountTab />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-md">
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
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Refunded Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Purchased Items
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
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        {formatPurchasedItems(transaction.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {totalCount} {totalCount === 1 ? 'transaction' : 'transactions'}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } focus:ring-sky-600 rounded-md px-4`}
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
                  } focus:ring-sky-600 rounded-md px-4`}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
            <div className="flex justify-start">
              <Tooltip content="Refresh Transactions">
                <button
                  onClick={syncAndFetchTransactions}
                  className="text-sky-600 hover:text-gray-700 transition duration-150"
                  aria-label="Refresh transactions"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                    </svg>
                  ) : (
                    <FiRefreshCw className="h-6 w-6" />
                  )}
                </button>
              </Tooltip>
            </div>
          </>
        ) : (
          <div className="space-y-16 bg-white p-6 text-center">
                        {/* Tabs Section */}
            <div className="pt-8">
              <AccountTab />
            </div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                

                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              It looks like you haven't made any payments yet.
            </p>
            <div className="mt-4 max-w-sm mx-auto flex justify-center">
              <Button
              variant='start'
                onClick={syncAndFetchTransactions}
                        >
                Refresh Transactions
              </Button>
            </div>
          </div>
        )}


        {/* Link to Stripe Billing */}
        <div className="mt-16 flex justify-center">
          <Link
            href="https://billing.stripe.com/p/login/14k6oScoJ4Hv4rS5kk"
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
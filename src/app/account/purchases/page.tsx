'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiRefreshCw, FiDownload, FiArrowRightCircle } from 'react-icons/fi';
import { MdOutlineLocalShipping } from "react-icons/md";
import Toast from '@/components/Toast';
import AccountTab from '@/components/AccountTab';
import { supabase } from '@/lib/supabaseClient';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';

// Define the Purchase interface based on the purchases table with joined data
interface Purchase {
  id: string;
  purchased_item_id: string;
  profiles_id: string;
  transaction_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  product_name: string;
  product_slug: string;
  product_image: string;
  pricing_plan: string;
  purchase_date: string;
  discount: string;
  price: number;
  actual_price: number;
  currency: string;
  epub_file?: string;
  pdf_file?: string;
  digital_asset_access?: string;
}

// Define the GroupedPurchase interface for grouped transactions
interface GroupedPurchase {
  transaction_id: string;
  purchase_date: string;
  total: number;
  currency: string;
  items: Purchase[];
}

// Custom Hook for Authentication
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

// Custom Hook to Fetch User's Purchases with Pagination
const usePurchases = (accessToken: string | null, userId: string | null, itemsPerPage: number, currentPage: number) => {
  const [groupedPurchases, setGroupedPurchases] = useState<GroupedPurchase[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    if (!accessToken || !userId) return;

    setIsLoading(true);
    setError(null);
    try {
      // Fetch pricing plans and products for lookup
      const { data: pricingPlansData, error: pricingPlansError } = await supabase
        .from('pricingplan')
        .select('id, product_id, package, measure, price, currency, epub_file, pdf_file, digital_asset_access');
      if (pricingPlansError) throw new Error(pricingPlansError.message);

      const { data: productData, error: productError } = await supabase
        .from('product')
        .select('id, product_name, slug, links_to_image');
      if (productError) throw new Error(productError.message);

      const pricingPlanMap = new Map<string, any>(
        pricingPlansData.map(pp => [pp.id, pp])
      );
      const productMap = new Map<string, any>(
        productData.map(p => [p.id, p])
      );

      // Fetch total count of purchases for pagination
      const { count: totalPurchasesCount, error: countError } = await supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .eq('profiles_id', userId);
      if (countError) throw new Error(countError.message);

      // Fetch purchases for the current page
      const offset = (currentPage - 1) * itemsPerPage;
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('id, purchased_item_id, profiles_id, transaction_id, start_date, end_date, is_active')
        .eq('profiles_id', userId)
        .order('start_date', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (purchasesError) throw new Error(purchasesError.message);

      // Fetch transactions to get metadata for calculations
      const transactionIds = [...new Set(purchasesData.map(p => p.transaction_id))];
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('stripe_transaction_id, created_at, metadata')
        .in('stripe_transaction_id', transactionIds);

      if (transactionsError) throw new Error(transactionsError.message);

      const transactionMap = new Map<string, any>(
        transactionsData.map(t => [t.stripe_transaction_id, t])
      );

      // Enrich purchases with display data
      const enrichedPurchases: Purchase[] = purchasesData.map((purchase: any) => {
        const transaction = transactionMap.get(purchase.transaction_id);
        if (!transaction) return null;

        const pricingPlan = pricingPlanMap.get(purchase.purchased_item_id);
        if (!pricingPlan) return null;

        const product = productMap.get(pricingPlan.product_id);
        if (!product) return null;

        const discountPercent = parseFloat(transaction.metadata.discount_percent || '0');
        const priceInPounds = pricingPlan.price / 100;
        const discountAmount = discountPercent > 0
          ? (pricingPlan.price * discountPercent) / 10000
          : 0;
        const discount = discountPercent > 0
          ? `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: pricingPlan.currency }).format(discountAmount)}`
          : '-';
        const actualPrice = priceInPounds - discountAmount;

        return {
          id: purchase.id,
          purchased_item_id: purchase.purchased_item_id,
          profiles_id: purchase.profiles_id,
          transaction_id: purchase.transaction_id,
          start_date: purchase.start_date,
          end_date: purchase.end_date,
          is_active: purchase.is_active,
          product_name: product.product_name,
          product_slug: product.slug,
          product_image: product.links_to_image,
          pricing_plan: `${pricingPlan.package} (${pricingPlan.measure})`,
          purchase_date: transaction.created_at,
          discount,
          price: priceInPounds,
          actual_price: actualPrice,
          currency: pricingPlan.currency,
          epub_file: pricingPlan.epub_file,
          pdf_file: pricingPlan.pdf_file,
          digital_asset_access: pricingPlan.digital_asset_access,
        };
      }).filter((p: Purchase | null) => p !== null) as Purchase[];

      // Group purchases by transaction_id
      const groupedByTransaction: { [key: string]: GroupedPurchase } = {};
      enrichedPurchases.forEach((purchase) => {
        const transaction = transactionMap.get(purchase.transaction_id);
        if (!transaction) return;

        const originalAmount = parseFloat(transaction.metadata.original_amount || '0') / 100;
        if (!groupedByTransaction[purchase.transaction_id]) {
          groupedByTransaction[purchase.transaction_id] = {
            transaction_id: purchase.transaction_id,
            purchase_date: purchase.purchase_date,
            total: originalAmount,
            currency: purchase.currency,
            items: [],
          };
        }
        groupedByTransaction[purchase.transaction_id].items.push(purchase);

        const discountAmount = purchase.discount === '-'
          ? 0
          : parseFloat(purchase.discount.replace(/[^0-9.-]+/g, ''));
        groupedByTransaction[purchase.transaction_id].total -= discountAmount;
      });

      const groupedPurchasesArray = Object.values(groupedByTransaction);
      setGroupedPurchases(groupedPurchasesArray);
      setTotalCount(totalPurchasesCount || 0); // Use the total count from the count query
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, itemsPerPage, currentPage]);

  useEffect(() => {
    if (accessToken && userId) fetchPurchases();
  }, [accessToken, userId, itemsPerPage, currentPage, fetchPurchases]);

  return { groupedPurchases, totalCount, isLoading, error, fetchPurchases };
};



export default function PurchasesPage() {
  const { accessToken, userId, isLoading: authLoading, error: authError } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { groupedPurchases, totalCount, isLoading: purchasesLoading, error: purchasesError, fetchPurchases } = usePurchases(accessToken, userId, itemsPerPage, currentPage);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const isLoading = authLoading || purchasesLoading;
  const error = authError || purchasesError;

  // Pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Format date and time for transaction date
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

  // Format date for end_date (e.g., "01 May 2025") or return "Permanent"
  const formatShortDate = (date: string | null) => {
    if (!date) return 'Permanent';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Format amount based on currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  // Check if a purchase is active
  const isPurchaseActive = (purchase: Purchase) => {
    if (!purchase.is_active) return false;
    const currentDate = new Date();
    const startDate = new Date(purchase.start_date);
    const endDate = purchase.end_date ? new Date(purchase.end_date) : null;
    return currentDate >= startDate && (!endDate || currentDate <= endDate);
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
      <div className="max max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            aria-live="polite"
          />
        )}

        {/* Purchases Table */}
        {error ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-600 font-medium">{error}</p>
            {accessToken && (
              <Button
              variant='start'
                onClick={fetchPurchases}

              >
                Retry
              </Button>
            )}
          </div>
        ) : groupedPurchases.length > 0 ? (
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
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Access/Shipping
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Expire
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actual Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Transaction Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Discount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedPurchases.map((group, index) => (
                    <tr key={group.transaction_id} className="hover:bg-gray-50 transition duration-150">
                      <td className="border-r border-gray-200 sm:min-w-xs min-w-48 px-6 py-8 text-sm text-gray-900 sticky left-0 z-10 bg-white">
                        <div className="space-y-4">
                          {group.items.map((item, itemIndex) => (
                            <div key={item.id} className="flex items-center space-x-4">
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="hidden sm:block w-auto h-24 object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-image.jpg';
                                }}
                              />
                              <div className="text-xs sm:text-sm">
                                <div className="flex items-center space-x-2">
                                  <Link
                                    href={`/products/${item.product_slug}`}
                                    className="text-gray-800 hover:text-sky-500 hover:underline transition duration-150"
                                  >
                                    {item.product_name}
                                  </Link>
                                  {isPurchaseActive(item) ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Active
                                    </span>
                                  ) : 
                                  (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400">
                                  Expired
                                </span>)}
                                </div>
                                <span className="text-gray-500 font-thin">{item.pricing_plan}</span>
                                <br />
                                <span className="hidden sm:block text-xs text-gray-400 font-light" style={{ fontSize: '8px' }}>
                                  {item.purchased_item_id}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 align-top">
                        <div className="space-y-4">
                          {group.items.map((item) => (
                            <div key={item.id} className="flex flex-col space-y-2">
                              {item.epub_file && (
                                <a
                                  href={item.epub_file}
                                  download
                                  className="text-sky-600 hover:text-sky-500 hover:underline flex items-center"
                                >
                                  <FiDownload className="mr-4 h-4 w-4" />
                                  <span className="text-xs font-medium">EPUB</span>
                                </a>
                              )}
                              {item.pdf_file && (
                                <a
                                  href={item.pdf_file}
                                  download
                                  className="text-sky-600 hover:text-sky-500 hover:underline flex items-center"
                                >
                                  <FiDownload className="mr-4 h-4 w-4" />
                                  <span className="text-xs font-medium">PDF</span>
                                </a>
                              )}
                              {item.digital_asset_access && (
                                <a
                                  href={item.digital_asset_access}
                                  className="text-sky-600 hover:text-sky-500 hover:underline flex items-center"
                                >
                                  <FiArrowRightCircle className="mr-4 h-4 w-4" />
                                  <span className="text-xs font-medium">Access</span>
                                </a>
                              )}
                              {!item.epub_file && !item.pdf_file && !item.digital_asset_access && (
                                <a
                                  href={item.digital_asset_access}
                                  className="text-sky-600 hover:text-sky-500 hover:underline flex items-center"
                                >
                                  <MdOutlineLocalShipping className="mr-4 h-4 w-4" />
                                  <span className="text-xs font-medium">Info</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 align-top">
                        <div className="space-y-4">
                          {group.items.map((item) => (
                            <div key={item.id} className="flex flex-col space-y-2">
                              <span className="text-xs font-medium text-gray-700">
                                {formatShortDate(item.end_date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="flex-col px-6 py-4 text-sm text-gray-900 font-semibold align-top">
                        <div className="space-y-4">
                          {group.items.map((item) => (
                            <div key={item.id}>
                              {formatAmount(item.actual_price, item.currency)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                        <button
                          onClick={() => handleViewReceipt(group.transaction_id)}
                          className="text-sm text-gray-800 hover:text-sky-500 hover:underline transition duration-150"
                          aria-label={`View receipt for transaction ${group.transaction_id}`}
                        >
                          {formatDateTime(group.purchase_date)}
                        </button>
                        <br />
                        <span className="text-xs text-gray-400 font-light" style={{ fontSize: '8px' }}>
                          {group.transaction_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                        <div className="space-y-4">
                          {group.items.map((item) => (
                            <div key={item.id}>
                              <span>{item.discount}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold align-top">
                        {formatAmount(group.total, group.currency)}
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
          <div className="bg-white p-6 space-y-16 text-center">
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
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
            <p className="mt-1 text-sm text-gray-500">
              It looks like you haven't made any purchases yet.
            </p>
            <div className="mt-4 max-w-sm mx-auto">
              <Button
              variant='start'
                onClick={fetchPurchases}
                            >
                Refresh Purchases
              </Button>
            </div>
          </div>
        )}


        {/* Link to Stripe Billing */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/account/payments"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sky-600 font-medium text-base underline hover:text-sky-800 transition-colors duration-150"
            aria-label="Manage your billing account on Stripe (opens in a new tab)"
          >
            <span>Payments</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
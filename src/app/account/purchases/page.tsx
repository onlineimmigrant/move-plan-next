'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiRefreshCw, FiDownload, FiArrowRightCircle } from 'react-icons/fi'; // Added FiDownload for download links
import { MdOutlineLocalShipping } from "react-icons/md";

import Toast from '@/components/Toast';
import AccountTab from '@/components/AccountTab';
import { supabase } from '@/lib/supabaseClient';

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

// Define the PricingPlan interface based on the pricingplan table
interface PricingPlan {
  id: string;
  product_id: string;
  package: string;
  measure: string;
  price: number; // Price in pence
  currency: string;
  epub_file?: string; // e.g., https://storage.com/book.epub
  pdf_file?: string; // e.g., https://storage.com/book.pdf
  digital_asset_access?: string;
}

// Define the Product interface based on the product table
interface Product {
  id: string;
  product_name: string;
  slug: string;
  links_to_image: string; // e.g., https://example.com/image.jpg
}

// Define the Purchase interface for the flattened list
interface Purchase {
  product_name: string;
  product_slug: string;
  product_image: string; // URL from links_to_image
  pricing_plan: string; // package + measure
  item_id: string; // From items[].id (maps to pricingplan.id)
  purchase_date: string;
  transaction_id: string;
  discount: string; // e.g., "£150.00" or "-"
  price: number; // Original price per item from pricingplan (in pounds)
  actual_price: number; // Price after discount (in pounds)
  currency: string; // Currency from pricingplan
  epub_file?: string; // Link to EPUB file
  pdf_file?: string; // Link to PDF file
  digital_asset_access?: string;
}

// Define the GroupedPurchase interface for grouped transactions
interface GroupedPurchase {
  transaction_id: string;
  purchase_date: string;
  total: number; // Total after discount (in pounds)
  currency: string; // Currency from pricingplan (assumed same for all items in a transaction)
  items: Purchase[];
}

// Custom Hook for Authentication
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

// Custom Hook to Fetch User's Purchases with Pagination
const usePurchases = (accessToken: string | null, itemsPerPage: number, currentPage: number) => {
  const [groupedPurchases, setGroupedPurchases] = useState<GroupedPurchase[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      // Fetch pricing plans with price, currency, epub_file, and pdf_file
      const { data: pricingPlansData, error: pricingPlansError } = await supabase
        .from('pricingplan')
        .select('id, product_id, package, measure, price, currency, epub_file, pdf_file, digital_asset_access');
      if (pricingPlansError) throw new Error(pricingPlansError.message);

      // Fetch products
      const { data: productData, error: productError } = await supabase
        .from('product')
        .select('id, product_name, slug, links_to_image');
      if (productError) throw new Error(productError.message);

      // Create maps for quick lookup
      const pricingPlanMap = new Map<string, PricingPlan>(
        pricingPlansData.map(pp => [pp.id, pp])
      );
      const productMap = new Map<string, Product>(
        productData.map(p => [p.id, p])
      );

      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(`/api/transactions?limit=${itemsPerPage}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      const data = await response.json();
      console.log('Fetched transactions for purchases:', data.transactions);

      // Process transactions into purchases
      const allPurchases: Purchase[] = [];
      data.transactions.forEach((transaction: Transaction) => {
        if (transaction.metadata && transaction.metadata.items) {
          try {
            const items: Item[] = JSON.parse(transaction.metadata.items);
            const discountPercent = parseFloat(transaction.metadata.discount_percent || '0');

            items.forEach((item) => {
              const pricingPlan = pricingPlanMap.get(item.id);
              if (!pricingPlan) {
                console.warn(`Pricing plan not found for item_id: ${item.id}`);
                return;
              }

              const product = productMap.get(pricingPlan.product_id);
              if (!product) {
                console.warn(`Product not found for product_id: ${pricingPlan.product_id}`);
                return;
              }

              // Calculate discount per item based on pricingplan price
              const priceInPounds = pricingPlan.price / 100; // Convert from pence to pounds
              const discountAmount = discountPercent > 0
                ? (pricingPlan.price * discountPercent) / 10000 // Convert to pounds
                : 0;
              const discount = discountPercent > 0
                ? `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: pricingPlan.currency }).format(discountAmount)}`
                : '-';
              const actualPrice = priceInPounds - discountAmount;

              allPurchases.push({
                product_name: product.product_name,
                product_slug: product.slug,
                product_image: product.links_to_image,
                pricing_plan: `${pricingPlan.package} (${pricingPlan.measure})`,
                item_id: item.id,
                purchase_date: transaction.created_at,
                transaction_id: transaction.stripe_transaction_id,
                discount: discount,
                price: priceInPounds,
                actual_price: actualPrice,
                currency: pricingPlan.currency,
                epub_file: pricingPlan.epub_file,
                pdf_file: pricingPlan.pdf_file,
                digital_asset_access: pricingPlan.digital_asset_access,
              });
            });
          } catch (parseError) {
            console.error(`Error parsing items for transaction ${transaction.stripe_transaction_id}:`, parseError);
          }
        }
      });

      // Group purchases by transaction_id
      const groupedByTransaction: { [key: string]: GroupedPurchase } = {};
      allPurchases.forEach((purchase) => {
        const transaction = data.transactions.find(
          (t: Transaction) => t.stripe_transaction_id === purchase.transaction_id
        );
        if (!transaction) return;

        const originalAmount = parseFloat(transaction.metadata.original_amount || '0') / 100; // Convert to pounds
        if (!groupedByTransaction[purchase.transaction_id]) {
          groupedByTransaction[purchase.transaction_id] = {
            transaction_id: purchase.transaction_id,
            purchase_date: purchase.purchase_date,
            total: originalAmount,
            currency: purchase.currency, // Assumes all items in a transaction have the same currency
            items: [],
          };
        }
        groupedByTransaction[purchase.transaction_id].items.push(purchase);

        // Subtract the discount from the total
        const discountAmount = purchase.discount === '-'
          ? 0
          : parseFloat(purchase.discount.replace(/[^0-9.-]+/g, '')); // Extract numeric value
        groupedByTransaction[purchase.transaction_id].total -= discountAmount;
      });

      const groupedPurchasesArray = Object.values(groupedByTransaction);
      setGroupedPurchases(groupedPurchasesArray);
      setTotalCount(data.totalCount || groupedPurchasesArray.length); // Use API totalCount
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, itemsPerPage, currentPage]);

  useEffect(() => {
    if (accessToken) fetchPurchases();
  }, [accessToken, itemsPerPage, currentPage, fetchPurchases]);

  return { groupedPurchases, totalCount, isLoading, error, fetchPurchases };
};

// Reusable Button Component
const Button = ({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  />
);

export default function PurchasesPage() {
  const { accessToken, isLoading: authLoading, error: authError } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Fixed to 5 transactions per page
  const { groupedPurchases, totalCount, isLoading: purchasesLoading, error: purchasesError, fetchPurchases } = usePurchases(accessToken, itemsPerPage, currentPage);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const isLoading = authLoading || purchasesLoading;
  const error = authError || purchasesError;

  // Pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

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

  // Format amount based on currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
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
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

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

        {/* Purchases Table */}
        {error ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-600 font-medium">{error}</p>
            {accessToken && (
              <Button
                onClick={fetchPurchases}
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                aria-label="Retry fetching purchases"
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
                      <td className="border-r border-gray-200 sm:min-w-xs min-w-48 px-6 py-4 text-sm text-gray-900 sticky left-0 z-10 bg-white">
                        <div className=" space-y-4">
                          {group.items.map((item, itemIndex) => (
                            <div key={item.item_id} className=" flex items-center space-x-4">
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="hidden sm:block w-auto h-12 object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-image.jpg'; // Fallback image
                                }}
                              />
                              <div className="text-xs sm:text-sm">
                                <Link
                                  href={`/products/${item.product_slug}`}
                                  className="text-gray-800 hover:text-sky-500 hover:underline transition duration-150"
                                >
                                  {item.product_name}
                                </Link>
                                <br />
                                <span className='text-gray-500 font-thin'>{item.pricing_plan}</span>
                                <br />
                                <span className="hidden sm:block text-xs text-gray-400 font-light" style={{ fontSize: '8px' }}>
                                  {item.item_id}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 align-top">
                        <div className="space-y-4">
                          {group.items.map((item) => (
                            <div key={item.item_id} className="flex flex-col space-y-2">
                              {item.epub_file && (
                                <a
                                  href={item.epub_file}
                                  download
                                  className="text-gray-800 hover:text-sky-500 hover:underline flex items-center"
                                >
                                  <FiDownload className="mr-1 h-4 w-4 " /> 
                                  <span className="text-xs  font-medium">EPUB</span>
                                </a>
                              )}
                              {item.pdf_file && (
                                <a
                                  href={item.pdf_file}
                                  download
                                  className="text-gray-800 hover:text-sky-500 hover:underline flex items-center"
                                >
                                  <FiDownload className="mr-1 h-4 w-4" /> 
                                  <span className="text-xs  font-medium">PDF</span>
                                  
                                </a>
                              )}
                                {item.digital_asset_access && (
                                <a
                                  href={item.digital_asset_access}
                                  download
                                  className="text-gray-800 hover:text-sky-500 hover:underline flex items-center"
                                >
                                  <FiArrowRightCircle className="mr-1 h-4 w-4" /> 
                                  <span className="text-xs  font-medium">Access</span>
                                  
                                </a>
                              )}

                              {!item.epub_file && !item.pdf_file && !item.digital_asset_access &&(
                                               <a
                                               href={item.digital_asset_access}
                                               download
                                               className="text-gray-800 hover:text-sky-500 hover:underline flex items-center"
                                             >
                                <MdOutlineLocalShipping  className="mr-1 h-4 w-4"/>
                                <span className="text-xs  font-medium">Info </span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="flex-col px-6 py-4 text-sm text-gray-900 font-semibold align-top">
                        <div className="space-y-4">
                          {group.items.map((item) => (
                            <div key={item.item_id}>
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
                            <div key={item.item_id}>
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
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
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
            <div className="mt-4">
              <Button
                onClick={fetchPurchases}
                className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 rounded-full px-6"
              >
                Refresh Purchases
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
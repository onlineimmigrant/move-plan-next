'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { jsPDF } from 'jspdf';
import AccountPaymentsReceiptTab from '@/components/AccountPaymentsReceiptTab';
import Loading from '@/ui/Loading';
import { useSettings } from '@/context/SettingsContext';
import { Settings } from '@/types/settings';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

// Define the context type
interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}



// Define the Transaction interface based on the Supabase transactions table
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_transaction_id: string;
  stripe_customer_id: string;
  updated_at: string;
  description: string | null;
  customer: string;
  email: string;
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

// Child component containing the main logic
function ReceiptContent() {
  const { t } = useAccountTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cssVars } = useThemeColors();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      const transactionId = searchParams.get('transaction_id');
      if (!transactionId) {
        setError('Transaction ID not provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('No active session found. Please log in.');
        }

        const accessToken = session.access_token;

        const response = await fetch(`/api/transactions?limit=1&offset=0&transaction_id=${transactionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch transaction');
        }

        const data = await response.json();
        if (data.transactions.length === 0) {
          throw new Error('Transaction not found');
        }

        const fetchedTransaction: Transaction = data.transactions[0];
        setTransaction(fetchedTransaction);

        if (fetchedTransaction.metadata && fetchedTransaction.metadata.items) {
          try {
            const parsedItems: Item[] = JSON.parse(fetchedTransaction.metadata.items);
            setItems(parsedItems);
          } catch (parseError) {
            console.error('Error parsing items from metadata:', parseError);
            setItems([]);
          }
        }

        setIsLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [searchParams, router]);

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
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(date));
  };

  // Download receipt as PDF
  const downloadPDF = () => {
    if (!transaction) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Payment Receipt', 20, 20);

    doc.setFontSize(12);
    let yPosition = 30;

    doc.text(`Transaction ID: ${transaction.stripe_transaction_id}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Date: ${formatDateTime(transaction.created_at)}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Customer: ${transaction.customer}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Email: ${transaction.email}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Amount: ${formatAmount(transaction.amount, transaction.currency)}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Payment Method: ${transaction.payment_method || 'N/A'}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Status: ${transaction.refunded_date ? 'refunded' : transaction.status}`, 20, yPosition);
    yPosition += 10;
    if (transaction.refunded_date) {
      doc.text(`Refunded Date: ${formatDateTime(transaction.refunded_date)}`, 20, yPosition);
      yPosition += 10;
    }

    yPosition += 10;
    doc.text('Items:', 20, yPosition);
    yPosition += 10;

    items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.product_name} (${item.package}, ${item.measure})`,
        20,
        yPosition
      );
      yPosition += 10;
    });

    doc.save(`receipt_${transaction.stripe_transaction_id}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-red-600 font-medium">{error || 'Transaction not found'}</p>
          <button
            onClick={() => router.push('/account/profile/payments')}
            className="mt-4 underline"
            style={{ color: cssVars.primary.base }}
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
                {/* Tabs Section 
                <div className="pt-8">
                  <AccountPaymentsReceiptTab />
                </div>*/}
        {/* Header */}
        <div className="mt-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight sm:text-3xl">
            Payment Receipt
          </h1>
          <p className="mt-2 text-sm text-gray-600">Thank you for your purchase!</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="p-6 sm:p-8">
            {/* Header and Download Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Transaction Details</h2>
              <button
                onClick={downloadPDF}
                className="cursor-pointer mt-4 sm:mt-0 px-6 py-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200"
              >
                Download PDF
              </button>
            </div>

            {/* Transaction Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                <p className="mt-1 text-gray-900">{transaction.stripe_transaction_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="mt-1 text-gray-900">{formatDateTime(transaction.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Customer</p>
                <p className="mt-1 text-gray-900">{transaction.customer}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-gray-900">{transaction.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="mt-1 text-gray-900 font-semibold">
                  {formatAmount(transaction.amount, transaction.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                <p className="mt-1 text-gray-900">{transaction.payment_method || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1 text-gray-900 capitalize">
                  {transaction.refunded_date ? 'Refunded' : transaction.status}
                </p>
              </div>
              {transaction.refunded_date && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Refunded Date</p>
                  <p className="mt-1 text-gray-900">{formatDateTime(transaction.refunded_date)}</p>
                </div>
              )}
            </div>

            {/* Items Section */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Purchased Items</h3>
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100"
                    >
                      <div>
                        <p className="text-gray-900 font-medium">
                          {index + 1}. {item.product_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.package}, {item.measure}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No items found in this transaction.</p>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/account/profile/payments')}
            className="inline-flex items-center px-6 py-3 font-medium transition duration-200"
            style={{ color: cssVars.primary.base }}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Payments
          </button>
        </div>
      </div>
    </div>
  );
}

// Parent component with Suspense boundary
export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-4 h-4 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-4 h-4 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
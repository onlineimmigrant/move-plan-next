import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

// Proper typing for metadata
interface TransactionMetadata {
  items?: string; // JSON string of items
  [key: string]: string | undefined;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_transaction_id: string;
  payment_method: string;
  refunded_date: string | null;
  metadata: TransactionMetadata;
}

interface UseTransactionsOptions {
  userId: string | null;
  accessToken: string | null;
  itemsPerPage?: number;
  currentPage?: number;
  showAllPayments?: boolean;
  succeededOnly?: boolean; // For receipts page
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  hasNonSucceeded: boolean;
  fetchTransactions: () => Promise<void>;
  syncAndFetchTransactions: () => Promise<void>;
}

/**
 * Shared hook for fetching and managing transactions
 * Used by payments and receipts pages
 */
export function useTransactions({
  userId,
  accessToken,
  itemsPerPage = 10,
  currentPage = 1,
  showAllPayments = false,
  succeededOnly = false,
}: UseTransactionsOptions): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNonSucceeded, setHasNonSucceeded] = useState<boolean>(false);

  const fetchTransactions = useCallback(async () => {
    if (!accessToken || !userId) {
      logger.debug('No access token or user ID, skipping fetchTransactions');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      
      // Build query
      let query = supabase
        .from('transactions')
        .select('id, user_id, amount, currency, status, created_at, stripe_transaction_id, payment_method, refunded_date, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (!showAllPayments || succeededOnly) {
        query = query.eq('status', 'succeeded').is('refunded_date', null);
      }

      // Parallel query execution
      const [transactionsResult, totalResult, allCountResult] = await Promise.all([
        query,
        supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'succeeded')
          .is('refunded_date', null),
        supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);

      if (transactionsResult.error) throw new Error(transactionsResult.error.message);
      if (totalResult.error) throw new Error(totalResult.error.message);
      if (allCountResult.error) throw new Error(allCountResult.error.message);

      setTransactions(transactionsResult.data || []);
      setTotalCount(showAllPayments ? allCountResult.count || 0 : totalResult.count || 0);
      setHasNonSucceeded((allCountResult.count || 0) > (totalResult.count || 0));
    } catch (err) {
      logger.error('fetchTransactions error:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, itemsPerPage, currentPage, showAllPayments]);

  const syncAndFetchTransactions = useCallback(async () => {
    if (!accessToken) {
      logger.debug('No access token available, skipping syncAndFetchTransactions');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('Syncing transactions with Stripe');
      const syncResponse = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Failed to sync transactions');
      }

      logger.debug('Sync successful, fetching updated transactions');
      await fetchTransactions();
    } catch (err) {
      logger.error('syncAndFetchTransactions error:', err);
      setError((err as Error).message);
      setIsLoading(false);
    }
  }, [accessToken, fetchTransactions]);

  return {
    transactions,
    totalCount,
    isLoading,
    error,
    hasNonSucceeded,
    fetchTransactions,
    syncAndFetchTransactions,
  };
}

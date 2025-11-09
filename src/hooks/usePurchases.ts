import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

export interface Purchase {
  id: string;
  profiles_id: string;
  purchased_item_id: string;
  transaction_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  product_name: string;
  product_slug: string;
  product_image: string | null;
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

export interface GroupedPurchase {
  transaction_id: string;
  purchase_date: string;
  total: number;
  currency: string;
  items: Purchase[];
}

interface UsePurchasesOptions {
  userId: string | null;
  accessToken: string | null;
  itemsPerPage?: number;
  currentPage?: number;
}

interface UsePurchasesReturn {
  groupedPurchases: GroupedPurchase[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  fetchPurchases: () => Promise<void>;
  syncAndFetchPurchases: () => Promise<void>;
}

/**
 * Shared hook for fetching and managing purchases
 * Handles data enrichment with product/pricing info
 */
export function usePurchases({
  userId,
  accessToken,
  itemsPerPage = 10,
  currentPage = 1,
}: UsePurchasesOptions): UsePurchasesReturn {
  const [groupedPurchases, setGroupedPurchases] = useState<GroupedPurchase[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    if (!accessToken || !userId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (currentPage - 1) * itemsPerPage;

      // Parallel data fetching
      const [pricingPlansResult, productResult, countResult, purchasesResult] = await Promise.all([
        supabase
          .from('pricingplan')
          .select('id, product_id, package, measure, price, currency, epub_file, pdf_file, digital_asset_access'),
        supabase
          .from('product')
          .select('id, product_name, slug, links_to_image'),
        supabase
          .from('purchases')
          .select('id', { count: 'exact', head: true })
          .eq('profiles_id', userId),
        supabase
          .from('purchases')
          .select('id, purchased_item_id, profiles_id, transaction_id, start_date, end_date, is_active')
          .eq('profiles_id', userId)
          .order('start_date', { ascending: false })
          .range(offset, offset + itemsPerPage - 1)
      ]);

      if (pricingPlansResult.error) throw new Error(pricingPlansResult.error.message);
      if (productResult.error) throw new Error(productResult.error.message);
      if (countResult.error) throw new Error(countResult.error.message);
      if (purchasesResult.error) throw new Error(purchasesResult.error.message);

      // Create lookup maps for O(1) access
      const pricingPlanMap = new Map(
        pricingPlansResult.data.map(pp => [pp.id, pp])
      );
      const productMap = new Map(
        productResult.data.map(p => [p.id, p])
      );

      // Enrich purchases with product data
      const enrichedPurchases = purchasesResult.data
        .map(purchase => {
          const pricingPlan = pricingPlanMap.get(purchase.purchased_item_id);
          const product = pricingPlan ? productMap.get(pricingPlan.product_id) : null;

          if (!pricingPlan || !product) {
            logger.warn('Missing data for purchase:', purchase.id);
            return null;
          }

          return {
            id: purchase.id,
            profiles_id: purchase.profiles_id,
            purchased_item_id: purchase.purchased_item_id,
            transaction_id: purchase.transaction_id,
            start_date: purchase.start_date,
            end_date: purchase.end_date,
            is_active: purchase.is_active,
            product_name: product.product_name,
            product_slug: product.slug,
            product_image: product.links_to_image,
            pricing_plan: `${pricingPlan.package} (${pricingPlan.measure})`,
            purchase_date: purchase.start_date,
            discount: '0%',
            price: pricingPlan.price,
            actual_price: pricingPlan.price,
            currency: pricingPlan.currency,
            epub_file: pricingPlan.epub_file || undefined,
            pdf_file: pricingPlan.pdf_file || undefined,
            digital_asset_access: pricingPlan.digital_asset_access || undefined,
          } as Purchase;
        })
        .filter((p): p is Purchase => p !== null);

      // Group by transaction_id
      const grouped = enrichedPurchases.reduce((acc, purchase) => {
        const existing = acc.find(g => g.transaction_id === purchase.transaction_id);
        
        if (existing) {
          existing.items.push(purchase);
          existing.total += purchase.price;
        } else {
          acc.push({
            transaction_id: purchase.transaction_id,
            purchase_date: purchase.purchase_date,
            total: purchase.price,
            currency: purchase.currency,
            items: [purchase],
          });
        }
        
        return acc;
      }, [] as GroupedPurchase[]);

      setGroupedPurchases(grouped);
      setTotalCount(countResult.count || 0);
    } catch (err) {
      logger.error('fetchPurchases error:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, itemsPerPage, currentPage]);

  const syncAndFetchPurchases = useCallback(async () => {
    if (!accessToken) {
      logger.debug('No access token available, skipping syncAndFetchPurchases');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('Syncing purchases with transactions');
      const syncResponse = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Failed to sync purchases');
      }

      logger.debug('Sync successful, fetching updated purchases');
      await fetchPurchases();
    } catch (err) {
      logger.error('syncAndFetchPurchases error:', err);
      setError((err as Error).message);
      setIsLoading(false);
    }
  }, [accessToken, fetchPurchases]);

  return {
    groupedPurchases,
    totalCount,
    isLoading,
    error,
    fetchPurchases,
    syncAndFetchPurchases,
  };
}

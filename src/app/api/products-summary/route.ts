import { NextResponse } from 'next/server';
import { supabase, getOrganizationId, getOrganizationWithType } from '@/lib/supabase';
import { getPriceForCurrency } from '@/lib/currency';
import { getBaseUrl } from '@/lib/utils';

// Simple in-memory cache (ephemeral in serverless, but useful for repeated navigations)
type CacheEntry = { timestamp: number; data: any };
const CACHE_TTL_MS = 30_000; // 30s
const cache = new Map<string, CacheEntry>();

async function fetchAll(baseUrl: string, categoryId: string | undefined, userCurrency: string) {
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) throw new Error('Organization not found');

  let productQuery = supabase
    .from('product')
    .select(`*, pricingplans:pricingplan(id, price, currency, currency_symbol, stripe_price_id, is_active, is_promotion, promotion_percent, prices_multi_currency, stripe_price_ids, base_currency)`)
    .eq('organization_id', organizationId)
    .eq('is_displayed', true)
    .order('order', { ascending: true });

  if (categoryId) {
    productQuery = productQuery.or(`product_sub_type_id.eq.${categoryId},product_sub_type_additional_id.eq.${categoryId}`);
  }
  const [{ data: products, error: prodError }] = await Promise.all([
    productQuery,
  ]);
  if (prodError) throw new Error(prodError.message);

  // Sub types
  const { data: subTypes, error: subError } = await supabase
    .from('product_sub_type')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('display_for_products', true)
    .order('name', { ascending: true });
  if (subError) throw new Error(subError.message);

  const orgData = await getOrganizationWithType(baseUrl);

  // Price processing (simplified, only min active plan)
  const processed = (products || []).map((p: any) => {
    const activePlans = (p.pricingplans || []).filter((pl: any) => pl.is_active);
    let minPrice: number | null = null;
    let currencySymbol: string | null = null;
    if (activePlans.length) {
      const chosen = activePlans.reduce((min: any, cur: any) => {
        const curData = getPriceForCurrency(cur, userCurrency);
        const minData = getPriceForCurrency(min, userCurrency);
        if (!curData) return min;
        if (!minData) return cur;
        let curPrice = curData.price;
        let minPriceVal = minData.price;
        if (cur.is_promotion && cur.promotion_percent) curPrice *= (1 - cur.promotion_percent / 100);
        if (min.is_promotion && min.promotion_percent) minPriceVal *= (1 - min.promotion_percent / 100);
        return curPrice < minPriceVal ? cur : min;
      });
      const data = getPriceForCurrency(chosen, userCurrency) || getPriceForCurrency(chosen, chosen.base_currency || 'USD');
      if (data) {
        let price = data.price;
        if (chosen.is_promotion && chosen.promotion_percent) price *= (1 - chosen.promotion_percent / 100);
        minPrice = price;
        currencySymbol = data.symbol;
      }
    }
    const { pricingplans, ...rest } = p;
    return {
      ...rest,
      computed_min_price: minPrice,
      computed_currency_symbol: currencySymbol,
      user_currency: userCurrency,
    };
  });

  return {
    products: processed,
    subTypes: subTypes || [],
    organizationType: orgData?.type || 'services',
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    // Currency detection from header (fallback USD)
    const currencyHeader = request.headers.get('x-user-currency');
    const userCurrency = currencyHeader || 'USD';
    let baseUrl = getBaseUrl(true);
    if (!baseUrl || baseUrl === 'http://localhost:3000') {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    const cacheKey = `${baseUrl}|${category || 'all'}|${userCurrency}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ ...cached.data, cached: true, age: now - cached.timestamp });
    }
    const data = await fetchAll(baseUrl, category, userCurrency);
    cache.set(cacheKey, { timestamp: now, data });
    return NextResponse.json({ ...data, cached: false, age: 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

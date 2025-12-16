// /app/faq/page.tsx
import ClientFAQPage from './ClientFAQPage';
import { getOrganizationId } from '@/lib/supabase';
import { supabase } from '@/lib/supabaseClient';
import { getBaseUrl } from '@/lib/utils';
import type { FAQ } from '@/types/faq';

async function fetchFAQs(organizationId: string, limit: number = 20, offset: number = 0): Promise<{ data: FAQ[], hasMore: boolean }> {
  const { data, error, count } = await supabase
    .from('faq')
    .select('id, order, display_order, question, answer, section, organization_id, product_sub_type_id', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching FAQs:', error.message);
    throw new Error(`Failed to load FAQs: ${error.message}`);
  }

  const totalCount = count || 0;
  const hasMore = offset + limit < totalCount;

  return { 
    data: data || [], 
    hasMore 
  };
}

async function getOrgId(): Promise<string | null> {
  const baseUrl = getBaseUrl(true);
  
  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (organizationId) return organizationId;
    
    // Fallback to NEXT_PUBLIC_BASE_URL
    const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return await getOrganizationId(fallbackUrl);
  } catch (error) {
    console.error('Error fetching organizationId:', error);
    return null;
  }
}

export default async function FAQ() {
  // Skip Supabase queries during build
  if (process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL) {
    return (
      <div className="mt-16 min-h-[600px]">
        <div className="mx-auto max-w-7xl mt-8">
          <ClientFAQPage initialFAQs={[]} hasMore={false} organizationId={null} />
        </div>
      </div>
    );
  }

  let faqs: FAQ[] = [];
  let hasMore = false;
  let organizationId: string | null = null;
  let error: string | null = null;

  try {
    organizationId = await getOrgId();
    
    if (!organizationId) {
      error = 'Organization not found. Please check the URL.';
    } else {
      const result = await fetchFAQs(organizationId);
      faqs = result.data;
      hasMore = result.hasMore;
    }
  } catch (err: any) {
    console.error('Error in FAQ page:', err.message);
    error = 'Failed to load FAQs. Please try again later.';
  }

  return (
    <div className="mt-16 min-h-[600px]">
      <div className="mx-auto max-w-7xl mt-8">
        {error ? (
          <div className="text-center text-red-500 py-8 min-h-[200px] flex items-center justify-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <ClientFAQPage initialFAQs={faqs} hasMore={hasMore} organizationId={organizationId} />
        )}
      </div>
    </div>
  );
}
// /app/faq/page.tsx
import ClientFAQPage from './ClientFAQPage';
import { getOrganizationId, supabase } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import type { FAQ } from '@/types/faq';

async function fetchFAQs(organizationId: string): Promise<FAQ[]> {
  console.log('Fetching FAQs for organizationId:', organizationId);
  const { data, error } = await supabase
    .from('faq')
    .select('id, order, display_order, question, answer, section, organization_id, product_sub_type_id')
    .eq('organization_id', organizationId)
    .order('order', { ascending: true });

  if (error || !data) {
    console.error('Error fetching FAQs:', error?.message || 'No FAQs found', 'organizationId:', organizationId, 'data:', data);
    throw new Error(`Failed to load FAQs: ${error?.message || 'No FAQs found'}`);
  }

  console.log('Fetched FAQs:', data);
  return data;
}

export default async function FAQ() {
  // Skip Supabase queries during Vercel static build
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
  if (isBuild) {
    console.log('Skipping Supabase queries during Vercel build');
    return (
      <div className="mt-16">
        <div className="mx-auto max-w-7xl mt-8">
          <ClientFAQPage initialFAQs={[]} />
        </div>
      </div>
    );
  }

  let faqs: FAQ[] = [];
  let error: string | null = null;

  // Fetch organizationId dynamically
  let baseUrl = getBaseUrl(true);
  console.log('FAQPage baseUrl:', baseUrl, 'VERCEL_URL:', process.env.VERCEL_URL, 'NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);

  let organizationId: string | null = null;
  try {
    organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      throw new Error('Organization not found');
    }
    console.log('Fetched organizationId:', organizationId);
  } catch (err) {
    console.error('Error fetching organizationId with initial baseUrl:', err);
    // Fallback to NEXT_PUBLIC_BASE_URL
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('Falling back to baseUrl:', baseUrl);
    try {
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        throw new Error('Organization not found after fallback');
      }
      console.log('Fetched organizationId after fallback:', organizationId);
    } catch (fallbackErr) {
      console.error('Error fetching organizationId after fallback:', fallbackErr);
      error = 'Failed to resolve organization. Please try again later.';
    }
  }

  if (organizationId && !error) {
    try {
      faqs = await fetchFAQs(organizationId);
    } catch (err: any) {
      console.error('Error in fetchFAQs:', err.message);
      error = err.message;
    }
  }

  return (
    <div className="mt-16">
      <div className="mx-auto max-w-7xl mt-8">
        {error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <ClientFAQPage initialFAQs={faqs} />
        )}
      </div>
    </div>
  );
}
// app/faq/page.tsx
import ClientFAQPage from './ClientFAQPage';
import { getOrganizationId } from '@/lib/supabase';
import type { FAQ } from '@/types/faq'; // Use type-only import

async function fetchFAQs(organizationId: string): Promise<FAQ[]> {
  try {
    const response = await fetch(
      `http://localhost:3000/api/faqs?organization_id=${organizationId}`,
      { cache: 'no-store' }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch FAQs');
    }
    const data = await response.json();
    console.log('Fetched FAQs:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw new Error(`Failed to load FAQs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default async function FAQ() {
  let faqs: FAQ[] = [];
  let error: string | null = null;

  // Fetch organizationId dynamically
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let organizationId: string | null = null;
  try {
    organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      throw new Error('Organization not found');
    }
  } catch (err) {
    console.error('Error fetching organizationId:', err);
    error = 'Failed to resolve organization. Please try again later.';
  }

  if (organizationId && !error) {
    try {
      faqs = await fetchFAQs(organizationId);
    } catch (err: any) {
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
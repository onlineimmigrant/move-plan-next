// app/faq/page.tsx
import ClientFAQPage from './ClientFAQPage';
import { supabase } from '../../lib/supabaseClient';

type FAQ = {
  id: number;
  question: string;
  answer: string;
  section?: string;
  display_order?: number;
  order?: number;
  product_sub_type_id?: number;
  [key: string]: any;
};

async function fetchFAQs(): Promise<FAQ[]> {
  const { data, error } = await supabase
    .from('faq')
    .select('*')
    .order('order', { ascending: true });
  if (error) {
    console.error('Error fetching FAQs:', error);
    throw new Error('Failed to load FAQs: ' + error.message);
  }
  console.log('Fetched FAQs:', data);
  return data || [];
}

export default async function FAQ() {
  let faqs: FAQ[] = [];
  let error: string | null = null;

  try {
    faqs = await fetchFAQs();
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        {error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <ClientFAQPage initialFAQs={faqs} />
        )}
      </div>
    </div>
  );
}
import { getOrganizationWithType } from '../../../lib/supabase';
import { getBaseUrl } from '../../../lib/utils';
import ClientBlogPage from './ClientBlogPage';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export default async function BlogPage() {
  const baseUrl = getBaseUrl();
  // console.log('BlogPage baseUrl:', baseUrl, 'VERCEL_URL:', process.env.NEXT_PUBLIC_VERCEL_URL);
  
  let organizationType = 'general'; // Default fallback

  try {
    // Fetch organization with type, with proper error handling
    const organizationData = await getOrganizationWithType(baseUrl);
    if (organizationData?.type) {
      organizationType = organizationData.type;
      // console.log('Fetched organization with type:', organizationData.id, organizationData.type);
    } else {
      console.warn('No organization data found, using default type:', organizationType);
    }
  } catch (error) {
    console.error('Error fetching organization type:', error);
    // Continue with default organizationType
  }

  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-500">Loading...</div>}>
      <ClientBlogPage organizationType={organizationType} />
    </Suspense>
  );
}
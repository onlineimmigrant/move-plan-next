import { supabase } from './supabase';

export async function getOrganizationId(reqOrBaseUrl?: { headers: { host?: string } } | string): Promise<string | null> {
  let currentUrl: string | undefined;

  // Check if the argument is a req object (with headers) or a baseUrl string
  if (typeof reqOrBaseUrl === 'string') {
    currentUrl = reqOrBaseUrl;
  } else if (reqOrBaseUrl && 'headers' in reqOrBaseUrl && reqOrBaseUrl.headers.host) {
    currentUrl = `https://${reqOrBaseUrl.headers.host}`;
  } else {
    currentUrl = process.env.NEXT_PUBLIC_BASE_URL;
  }

  const isLocal = process.env.NODE_ENV === 'development';

  console.log('Fetching organization for URL:', currentUrl, 'isLocal:', isLocal);

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
    .single();

  if (error) {
    console.error('Error fetching organization:', error, 'URL:', currentUrl);
    return null;
  }

  if (!data) {
    console.error('No organization found for URL:', currentUrl);
    return null;
  }

  return data.id;
}
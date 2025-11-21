/**
 * Supabase Redirect URL Sync
 * Automatically updates Supabase Auth redirect URLs when organizations are created/updated
 */

import { supabase } from './supabase';

interface Organization {
  id: string;
  name: string;
  base_url: string | null;
  base_url_local: string | null;
  domains: string[];
}

/**
 * Fetches all organizations and their domains from the database
 */
async function getAllOrganizationDomains(): Promise<string[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('base_url, base_url_local, domains');

  if (error) {
    console.error('Error fetching organizations:', error);
    return [];
  }

  const allDomains = new Set<string>();

  // Add localhost for development
  allDomains.add('http://localhost:3000');

  data?.forEach((org) => {
    // Add base_url
    if (org.base_url) {
      allDomains.add(org.base_url);
    }

    // Add base_url_local
    if (org.base_url_local) {
      allDomains.add(org.base_url_local);
    }

    // Add all domains from domains array
    if (org.domains && Array.isArray(org.domains)) {
      org.domains.forEach((domain: string) => {
        // Ensure domain has protocol
        const domainWithProtocol = domain.startsWith('http') 
          ? domain 
          : `https://${domain}`;
        allDomains.add(domainWithProtocol);
      });
    }
  });

  return Array.from(allDomains);
}

/**
 * Generates redirect URLs for all locales and domains
 */
export async function generateAllRedirectUrls(): Promise<string[]> {
  const domains = await getAllOrganizationDomains();
  const redirectUrls = new Set<string>();

  // Supported locales
  const locales = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl'];

  domains.forEach((domain) => {
    // Add root callback
    redirectUrls.add(`${domain}/auth/callback`);

    // Add locale-specific callbacks
    locales.forEach((locale) => {
      redirectUrls.add(`${domain}/${locale}/auth/callback`);
    });

    // Add wildcard pattern (if Supabase supports it)
    redirectUrls.add(`${domain}/*/auth/callback`);
  });

  return Array.from(redirectUrls);
}

/**
 * Updates Supabase project configuration via Management API
 * Note: This requires SUPABASE_ACCESS_TOKEN (not service role key)
 * Get token from: https://app.supabase.com/account/tokens
 */
export async function updateSupabaseRedirectUrls(): Promise<{
  success: boolean;
  redirectUrls: string[];
  error?: string;
}> {
  try {
    const redirectUrls = await generateAllRedirectUrls();

    // Check if we have the management API token
    if (!process.env.SUPABASE_ACCESS_TOKEN) {
      console.warn('SUPABASE_ACCESS_TOKEN not configured. Skipping Supabase API update.');
      console.log('Generated redirect URLs that need to be manually added:', redirectUrls);
      return {
        success: true,
        redirectUrls,
        error: 'SUPABASE_ACCESS_TOKEN not configured - URLs generated but not synced',
      };
    }

    // Use Supabase Management API to update auth configuration
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          ADDITIONAL_REDIRECT_URLS: redirectUrls.join(','),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Supabase API error:', errorData);
      return {
        success: false,
        redirectUrls,
        error: `Failed to update Supabase config: ${errorData}`,
      };
    }

    const result = await response.json();
    console.log('Successfully updated Supabase redirect URLs:', redirectUrls.length);
    return {
      success: true,
      redirectUrls,
    };
  } catch (error) {
    console.error('Error in updateSupabaseRedirectUrls:', error);
    return {
      success: false,
      redirectUrls: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current redirect URLs configuration
 */
export async function getCurrentRedirectUrls(): Promise<string[]> {
  return await generateAllRedirectUrls();
}

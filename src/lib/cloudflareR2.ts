/**
 * Cloudflare R2 CORS Management
 * Automatically updates CORS configuration based on organization domains
 */

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export interface CORSRule {
  rules: {
    allowed: {
      origins: string[];
      methods: string[];
    };
  }[];
}

/**
 * Get all unique domains from all organizations
 */
export async function getAllOrganizationDomains(): Promise<string[]> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('domains, base_url');

  if (error) {
    console.error('[R2 CORS] Failed to fetch organizations:', error);
    return [];
  }

  const allDomains = new Set<string>();

  organizations?.forEach(org => {
    // Add domains from domains array
    if (org.domains && Array.isArray(org.domains)) {
      org.domains.forEach((domain: string) => {
        if (domain) {
          // Check if domain already has protocol, remove it
          const cleanDomain = domain.replace(/^https?:\/\//, '');
          
          allDomains.add(`https://${cleanDomain}`);
          // Only add www variant if not already starting with www
          if (!cleanDomain.startsWith('www.')) {
            allDomains.add(`https://www.${cleanDomain}`);
            // Add wildcard for subdomains (but not for www)
            allDomains.add(`https://*.${cleanDomain}`);
          }
        }
      });
    }

    // Add base_url
    if (org.base_url) {
      allDomains.add(org.base_url);
    }
  });

  // Always include localhost for development
  allDomains.add('http://localhost:3000');
  allDomains.add('http://localhost:3001');

  return Array.from(allDomains).filter(Boolean);
}

/**
 * Update R2 bucket CORS configuration
 */
export async function updateR2CORS(allowedOrigins: string[]): Promise<boolean> {
  // Use Cloudflare R2 API format: rules.allowed.origins
  const corsConfig = {
    rules: [
      {
        allowed: {
          origins: allowedOrigins,
          methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/cors`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corsConfig),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[R2 CORS] Update failed:', result);
      return false;
    }

    console.log('[R2 CORS] Successfully updated CORS configuration');
    console.log('[R2 CORS] Allowed origins:', allowedOrigins);
    return true;
  } catch (error) {
    console.error('[R2 CORS] Error updating CORS:', error);
    return false;
  }
}

/**
 * Sync R2 CORS with all organization domains
 * Call this when organizations are added/updated
 */
export async function syncR2CORSWithOrganizations(): Promise<boolean> {
  console.log('[R2 CORS] Syncing CORS configuration with organization domains...');
  
  const domains = await getAllOrganizationDomains();
  
  if (domains.length === 0) {
    console.warn('[R2 CORS] No domains found to configure');
    return false;
  }

  return await updateR2CORS(domains);
}

/**
 * Get current CORS configuration from R2 bucket
 */
export async function getCurrentCORSConfig(): Promise<CORSRule | null> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/cors`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[R2 CORS] Failed to get CORS config:', result);
      return null;
    }

    return result.result || null;
  } catch (error) {
    console.error('[R2 CORS] Error getting CORS config:', error);
    return null;
  }
}

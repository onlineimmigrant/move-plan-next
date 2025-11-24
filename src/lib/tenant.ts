// src/lib/tenant.ts
import { getOrganizationId } from "@/lib/getSettings";
import { headers } from "next/headers";

/**
 * Get current tenant (organization) based on request headers
 * Wrapper around existing getOrganizationId with consistent return format
 */
export async function getCurrentTenant() {
  const headersList = await headers();
  const host = headersList.get("host");
  
  if (!host) {
    return null;
  }

  // Construct URL from host header
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const currentUrl = `${protocol}://${host}`;
  
  // Use existing getOrganizationId which handles:
  // - Custom domains (base_url)
  // - Development domains (base_url_local)
  // - Domains array matching
  // - Fallback to NEXT_PUBLIC_TENANT_ID
  const organizationId = await getOrganizationId(currentUrl);
  
  if (!organizationId) {
    return null;
  }
  
  // Determine if custom domain by checking if it's not a localhost pattern
  const isCustomDomain = !host.includes('localhost');
  
  return {
    organizationId,
    isCustomDomain
  };
}

/**
 * CRM API Layer
 * 
 * Centralized API functions for CRM operations
 * Provides consistent error handling and response formatting
 */

import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/components/modals/CrmModal/types';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get current session and organization ID
 */
export async function getCurrentOrgId(): Promise<ApiResponse<string>> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { data: null, error: 'No active session' };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return { data: null, error: 'Failed to fetch user profile' };
    }

    const orgId = userProfile?.organization_id || session.user.user_metadata.organization_id;
    
    if (!orgId) {
      return { data: null, error: 'No organization ID found' };
    }

    return { data: orgId, error: null };
  } catch (error) {
    console.error('Error getting organization ID:', error);
    return { data: null, error: 'Failed to get organization ID' };
  }
}

/**
 * Fetch all accounts for organization
 */
export async function fetchAccounts(orgId: string): Promise<ApiResponse<Profile[]>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, email, city, postal_code, country, created_at, organization_id, role, team, customer')
      .eq('organization_id', orgId)
      .neq('role', 'superadmin')
      .order('full_name');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return { data: null, error: 'Failed to fetch accounts' };
  }
}

/**
 * Fetch accounts with organization ID resolution
 */
export async function fetchAccountsWithOrgId(providedOrgId?: string): Promise<ApiResponse<{ accounts: Profile[]; organizationId: string }>> {
  try {
    // Use provided org ID or get from session
    let orgId = providedOrgId;
    
    if (!orgId) {
      const orgResult = await getCurrentOrgId();
      if (orgResult.error || !orgResult.data) {
        return { data: null, error: orgResult.error || 'Failed to get organization ID' };
      }
      orgId = orgResult.data;
    }

    const accountsResult = await fetchAccounts(orgId);
    
    if (accountsResult.error || !accountsResult.data) {
      return { data: null, error: accountsResult.error || 'Failed to fetch accounts' };
    }

    return { 
      data: { 
        accounts: accountsResult.data, 
        organizationId: orgId 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error in fetchAccountsWithOrgId:', error);
    return { data: null, error: 'Failed to fetch accounts with org ID' };
  }
}

/**
 * Update account via API
 */
export async function updateAccount(profileId: string, updateData: Partial<Profile>): Promise<ApiResponse<boolean>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: 'Authentication required' };
    }

    const response = await fetch('/api/accounts/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        profileId,
        ...updateData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData.error || 'Failed to update account' };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error updating account:', error);
    return { data: null, error: 'Failed to update account' };
  }
}

/**
 * Delete account via API
 */
export async function deleteAccount(accountId: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await fetch('/api/accounts/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      const result = await response.json();
      return { data: null, error: result.error || 'Failed to delete account' };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { data: null, error: 'Failed to delete account' };
  }
}

/**
 * Fetch leads for organization
 */
export async function fetchLeads(orgId: string): Promise<ApiResponse<Profile[]>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, email, city, postal_code, country, created_at, organization_id, customer')
      .eq('organization_id', orgId)
      .eq('customer->>is_lead', 'true')
      .order('full_name');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching leads:', error);
    return { data: null, error: 'Failed to fetch leads' };
  }
}

/**
 * Fetch testimonials for organization
 */
export async function fetchTestimonials(orgId: string): Promise<ApiResponse<Profile[]>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, email, city, postal_code, country, created_at, organization_id, customer')
      .eq('organization_id', orgId)
      .not('customer->>testimonial_text', 'is', null)
      .order('full_name');

    if (error) {
      return { data: null, error: error.message };
    }

    // Additional filter for non-empty testimonial text
    const filtered = (data || []).filter(p => 
      p.customer?.testimonial_text && p.customer.testimonial_text.trim() !== ''
    );

    return { data: filtered, error: null };
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return { data: null, error: 'Failed to fetch testimonials' };
  }
}

/**
 * Update testimonial status
 */
export async function updateTestimonialStatus(
  profileId: string, 
  status: string, 
  currentCustomerData: any
): Promise<ApiResponse<boolean>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: 'Authentication required' };
    }

    const response = await fetch('/api/accounts/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        profileId,
        customer: {
          ...currentCustomerData,
          testimonial_status: status,
          testimonial_approved_at: status === 'approved' ? new Date().toISOString() : null,
          testimonial_approved_by: status === 'approved' ? 'admin' : null,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData.error || 'Failed to update testimonial' };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return { data: null, error: 'Failed to update testimonial' };
  }
}

/**
 * Convert lead to customer
 */
export async function convertLeadToCustomer(leadId: string, currentCustomerData: any): Promise<ApiResponse<boolean>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: 'Authentication required' };
    }

    const response = await fetch('/api/accounts/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        profileId: leadId,
        customer: {
          ...currentCustomerData,
          is_lead: false,
          is_customer: true,
          converted_at: new Date().toISOString(),
          lead_status: 'converted',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { data: null, error: errorData.error || 'Failed to convert lead' };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error converting lead:', error);
    return { data: null, error: 'Failed to convert lead' };
  }
}

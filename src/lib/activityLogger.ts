import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface LogActivityParams {
  organizationId: string;
  action: 'created' | 'updated' | 'deployed' | 'deleted';
  details?: string;
  userEmail?: string;
}

export async function logActivity({ 
  organizationId, 
  action, 
  details, 
  userEmail 
}: LogActivityParams): Promise<boolean> {
  try {
    console.log('Logging activity:', { organizationId, action, details, userEmail });
    
    // Get organization name for details if not provided
    if (!details) {
      const organizationName = await getOrganizationName(organizationId);
      details = `${organizationName} ${action}`;
    }

    // Use upsert to update existing activities for the same organization and action
    const { data, error } = await supabase
      .from('organization_activities')
      .upsert({
        organization_id: organizationId,
        action,
        details,
        user_email: userEmail || 'system@example.com',
        created_at: new Date().toISOString() // Always update the timestamp
      }, {
        onConflict: 'organization_id,action', // Only one activity per org per action type
        ignoreDuplicates: false // Always update existing records
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log activity:', error);
      return false;
    }

    console.log('Activity logged successfully:', data);
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

// Helper function to get organization name for better activity details
export async function getOrganizationName(organizationId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (error || !data) {
      return `Organization ${organizationId.slice(0, 8)}...`;
    }

    return data.name;
  } catch (error) {
    console.error('Error fetching organization name:', error);
    return `Organization ${organizationId.slice(0, 8)}...`;
  }
}

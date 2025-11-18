/**
 * Supabase Realtime Listener for Organization Updates
 * Automatically syncs R2 CORS when organizations are updated
 */

import { createClient } from '@supabase/supabase-js';
import { syncR2CORSWithOrganizations } from './cloudflareR2';

let isListening = false;

/**
 * Start listening for organization changes and auto-sync CORS
 * Call this once during application initialization
 */
export async function startOrganizationCORSSync() {
  if (isListening) {
    console.log('[CORS Sync] Already listening for organization changes');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Subscribe to organization changes
  const channel = supabase
    .channel('organization-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'organizations',
      },
      async (payload) => {
        console.log('[CORS Sync] Organization changed:', payload.eventType, (payload.new as any)?.id);

        // Check if domains-related fields changed
        if (payload.eventType === 'INSERT' || 
            payload.eventType === 'UPDATE' && payload.new && payload.old) {
          const newOrg = payload.new as any;
          const oldOrg = payload.old as any;
          
          const domainsChanged = 
            JSON.stringify(newOrg.domains) !== JSON.stringify(oldOrg?.domains) ||
            newOrg.base_url !== oldOrg?.base_url ||
            newOrg.base_url_local !== oldOrg?.base_url_local;

          if (domainsChanged || payload.eventType === 'INSERT') {
            console.log('[CORS Sync] Domains changed, syncing R2 CORS...');
            
            // Wait a bit to batch multiple rapid changes
            setTimeout(async () => {
              const success = await syncR2CORSWithOrganizations();
              if (success) {
                console.log('[CORS Sync] ✅ R2 CORS synced successfully');
              } else {
                console.error('[CORS Sync] ❌ Failed to sync R2 CORS');
              }
            }, 2000); // 2 second debounce
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[CORS Sync] ✅ Listening for organization changes');
        isListening = true;
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[CORS Sync] ❌ Failed to subscribe to organization changes');
        isListening = false;
      }
    });

  return channel;
}

/**
 * Manually trigger CORS sync
 * Use this for testing or one-time sync operations
 */
export async function manualCORSSync(): Promise<boolean> {
  console.log('[CORS Sync] Manual sync triggered...');
  return await syncR2CORSWithOrganizations();
}

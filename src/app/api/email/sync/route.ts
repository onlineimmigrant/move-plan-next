import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/email/sync
 * Triggers email synchronization for the organization's connected accounts
 * Returns sync status and progress information
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { account_id } = body;

    // Fetch email accounts to sync
    let accountsQuery = supabase
      .from('email_accounts')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true);

    if (account_id) {
      accountsQuery = accountsQuery.eq('id', account_id);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) {
      console.error('Error fetching email accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch email accounts' },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No active email accounts found' },
        { status: 404 }
      );
    }

    // Update sync status to 'syncing'
    const accountIds = accounts.map((acc: any) => acc.id);
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({ 
        sync_status: 'syncing',
        last_sync_at: new Date().toISOString()
      })
      .in('id', accountIds);

    if (updateError) {
      console.error('Error updating sync status:', updateError);
    }

    // Create service role client for background sync operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Sync emails for each account
    const syncPromises = accounts.map(async (account: any) => {
      try {
        if (account.provider === 'gmail') {
          await syncGmailAccount(account, serviceSupabase);
        } else if (account.provider === 'outlook') {
          await syncOutlookAccount(account, serviceSupabase);
        }

        // Update to synced on success
        await serviceSupabase
          .from('email_accounts')
          .update({ 
            sync_status: 'synced',
            last_sync_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', account.id);
      } catch (error) {
        console.error(`Sync error for account ${account.id}:`, error);
        
        // Update to error status
        await serviceSupabase
          .from('email_accounts')
          .update({ 
            sync_status: 'error',
            sync_error: error instanceof Error ? error.message : 'Sync failed',
          })
          .eq('id', account.id);
      }
    });

    // Don't wait for sync to complete - return immediately
    Promise.all(syncPromises).catch(err => {
      console.error('Error in sync promises:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Email sync initiated',
      accounts_syncing: accounts.length,
      status: 'syncing',
    });

  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/sync?organization_id=...&account_id=...
 * Returns current sync status for email accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');
    const account_id = searchParams.get('account_id');

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Fetch sync status
    let query = supabase
      .from('email_accounts')
      .select('id, email_address, sync_status, last_sync_at')
      .eq('organization_id', organization_id);

    if (account_id) {
      query = query.eq('id', account_id);
    }

    const { data: accounts, error } = await query;

    if (error) {
      console.error('Error fetching sync status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      );
    }

    const syncing = accounts?.filter((a: any) => a.sync_status === 'syncing').length || 0;
    const synced = accounts?.filter((a: any) => a.sync_status === 'synced').length || 0;
    const failed = accounts?.filter((a: any) => a.sync_status === 'failed').length || 0;

    return NextResponse.json({
      accounts: accounts || [],
      summary: {
        total: accounts?.length || 0,
        syncing,
        synced,
        failed,
      },
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sync Gmail account - fetch recent emails (last 30 days max)
 */
async function syncGmailAccount(account: any, supabase: any) {
  const { access_token, refresh_token, token_expires_at, id: accountId, organization_id } = account;

  // Check if token is expired and refresh if needed
  let activeToken = access_token;
  if (token_expires_at && new Date(token_expires_at) < new Date()) {
    activeToken = await refreshGmailToken(account, supabase);
  }

  // Fetch messages from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const afterDate = Math.floor(thirtyDaysAgo.getTime() / 1000);

  // Get list of message IDs
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=after:${afterDate}`,
    {
      headers: { Authorization: `Bearer ${activeToken}` },
    }
  );

  if (!listResponse.ok) {
    throw new Error(`Gmail API error: ${listResponse.statusText}`);
  }

  const { messages } = await listResponse.json();
  
  if (!messages || messages.length === 0) {
    console.log('No new messages to sync');
    return;
  }

  // Fetch full message details in batches
  for (const { id: messageId } of messages.slice(0, 50)) { // Limit to 50 most recent
    try {
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );

      if (!messageResponse.ok) continue;

      const message = await messageResponse.json();
      
      // Parse email data
      const headers = message.payload.headers.reduce((acc: any, h: any) => {
        acc[h.name.toLowerCase()] = h.value;
        return acc;
      }, {});

      const threadId = message.threadId;
      const from = headers['from'] || '';
      const to = headers['to'] || '';
      const subject = headers['subject'] || '(No Subject)';
      const date = new Date(parseInt(message.internalDate));

      // Get or create thread - check if we have this message's thread already
      // We'll use the Gmail threadId stored in the first message
      const { data: existingMessage } = await supabase
        .from('email_messages')
        .select('thread_id')
        .eq('external_id', messageId)
        .single();

      let dbThreadId: string;

      if (existingMessage) {
        dbThreadId = existingMessage.thread_id;
      } else {
        // Check if we have any message from this Gmail thread already
        const { data: threadMessages } = await supabase
          .from('email_messages')
          .select('thread_id')
          .eq('account_id', accountId)
          .like('labels', `%gmail_thread:${threadId}%`)
          .limit(1);

        if (threadMessages && threadMessages.length > 0) {
          dbThreadId = threadMessages[0].thread_id;
        } else {
          // Create new thread
          const { data: newThread, error: insertError } = await supabase
            .from('email_threads')
            .insert({
              organization_id,
              account_id: accountId,
              subject,
              participants: [from, to].filter(Boolean),
              first_message_at: date.toISOString(),
              last_message_at: date.toISOString(),
              is_read: !message.labelIds?.includes('UNREAD'),
            })
            .select('id')
            .single();

          if (insertError || !newThread) {
            console.error('Error creating thread:', insertError);
            continue; // Skip this message
          }

          dbThreadId = newThread.id;
        }
      }

      // Check if message already exists (check again in case of race condition)
      const { data: msgCheck } = await supabase
        .from('email_messages')
        .select('id')
        .eq('external_id', messageId)
        .single();

      if (msgCheck) continue; // Skip if already synced

      // Get email body - handle Gmail's URL-safe base64 and nested parts
      let body = '';
      let htmlBody = '';
      
      const decodeBase64 = (data: string) => {
        // Gmail uses URL-safe base64, replace - with + and _ with /
        const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(normalized, 'base64').toString('utf-8');
      };

      const extractBody = (part: any) => {
        if (part.body?.data) {
          const content = decodeBase64(part.body.data);
          if (part.mimeType === 'text/plain') {
            body = content;
          } else if (part.mimeType === 'text/html') {
            htmlBody = content;
          }
        }
        
        // Recursively check nested parts
        if (part.parts) {
          for (const subPart of part.parts) {
            extractBody(subPart);
          }
        }
      };

      // Extract from top-level body or parts
      if (message.payload.body?.data) {
        body = decodeBase64(message.payload.body.data);
      } else if (message.payload.parts) {
        for (const part of message.payload.parts) {
          extractBody(part);
        }
      }

      // Prefer plain text, fallback to HTML
      const finalBodyText = body;
      const finalBodyHtml = htmlBody;

      // Insert message - include Gmail threadId in labels for thread matching
      const allLabels = [...(message.labelIds || []), `gmail_thread:${threadId}`];
      
      const { error: insertError } = await supabase
        .from('email_messages')
        .insert({
          organization_id,
          thread_id: dbThreadId,
          external_id: messageId,
          account_id: accountId,
          from_email: from,
          to_emails: [to],
          subject,
          body_text: finalBodyText,
          body_html: finalBodyHtml,
          snippet: (finalBodyText || finalBodyHtml || '').substring(0, 200),
          direction: 'inbound',
          sent_at: date.toISOString(),
          received_at: date.toISOString(),
          is_read: !message.labelIds?.includes('UNREAD'),
        });

      if (insertError) {
        console.error(`Error inserting message ${messageId}:`, insertError);
        throw insertError;
      }

    } catch (error) {
      console.error(`Error syncing message ${messageId}:`, error);
      // Continue with next message
    }
  }
}

/**
 * Refresh Gmail access token
 */
async function refreshGmailToken(account: any, supabase: any): Promise<string> {
  const { refresh_token, id } = account;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Gmail token');
  }

  const { access_token, expires_in } = await response.json();
  const expiresAt = new Date(Date.now() + expires_in * 1000);

  // Update token in database
  await supabase
    .from('email_accounts')
    .update({
      access_token,
      token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', id);

  return access_token;
}

/**
 * Sync Outlook account (stub for now)
 */
async function syncOutlookAccount(account: any, supabase: any) {
  console.log('Outlook sync not yet implemented');
  // Similar to Gmail but using Microsoft Graph API
}

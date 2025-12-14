import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/email/campaigns/[id]/send
 * Sends a marketing email campaign to all subscribers in associated lists
 * Handles batching, deduplication, and progress tracking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = parseInt(params.id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*, email_template(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign fetch error:', campaignError);
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check campaign status
    if (campaign.status === 'sent') {
      return NextResponse.json(
        { error: 'Campaign already sent' },
        { status: 400 }
      );
    }

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Campaign is already being sent' },
        { status: 400 }
      );
    }

    // Fetch subscribers from the associated list
    const { data: subscribers, error: subscribersError } = await supabase
      .from('email_list_subscribers')
      .select('*')
      .eq('list_id', campaign.list_id)
      .eq('status', 'active'); // Only send to active subscribers

    if (subscribersError) {
      console.error('Subscribers fetch error:', subscribersError);
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found in the list' },
        { status: 400 }
      );
    }

    // Deduplicate subscribers by email
    const uniqueSubscribers = Array.from(
      new Map(subscribers.map((s: any) => [s.email, s])).values()
    );

    // Update campaign status to 'sending'
    const { error: statusUpdateError } = await supabase
      .from('email_campaigns')
      .update({ 
        status: 'sending',
        total_recipients: uniqueSubscribers.length,
        total_sent: 0,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (statusUpdateError) {
      console.error('Status update error:', statusUpdateError);
    }

    // Create campaign recipient records for tracking
    const recipientRecords = uniqueSubscribers.map((sub: any) => ({
      campaign_id: campaignId,
      subscriber_id: sub.id,
      email: sub.email,
      status: 'pending',
    }));

    const { error: recipientsInsertError } = await supabase
      .from('email_campaign_recipients')
      .insert(recipientRecords);

    if (recipientsInsertError) {
      console.error('Recipients insert error:', recipientsInsertError);
    }

    // Get primary email account for sending
    const { data: emailAccount, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('organization_id', campaign.organization_id)
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();

    if (accountError || !emailAccount) {
      console.error('Email account fetch error:', accountError);
      
      // Update campaign status to failed
      await supabase
        .from('email_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
      
      return NextResponse.json(
        { error: 'No active email account found for sending' },
        { status: 500 }
      );
    }

    // Note: In production, this should use a queue/background worker
    // For now, we'll batch send via the existing /api/email/send endpoint
    const BATCH_SIZE = 50;
    let totalSent = 0;
    let totalFailed = 0;

    // Process in batches
    for (let i = 0; i < uniqueSubscribers.length; i += BATCH_SIZE) {
      const batch = uniqueSubscribers.slice(i, i + BATCH_SIZE);
      
      // Send batch (in real implementation, use queue)
      const batchPromises = batch.map(async (subscriber: any) => {
        try {
          // Replace merge fields in template
          let body = campaign.email_template?.body || '';
          let subject = campaign.subject;
          
          // Simple merge field replacement
          const mergeFields: Record<string, string> = {
            email: subscriber.email,
            first_name: subscriber.first_name || '',
            last_name: subscriber.last_name || '',
            name: `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim(),
          };

          Object.entries(mergeFields).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            body = body.replace(regex, value);
            subject = subject.replace(regex, value);
          });

          // Call send API
          const sendResponse = await fetch(`${request.nextUrl.origin}/api/email/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify({
              organization_id: campaign.organization_id,
              account_id: emailAccount.id,
              recipients: [subscriber.email],
              subject,
              body,
            }),
          });

          if (sendResponse.ok) {
            totalSent++;
            
            // Update recipient status
            await supabase
              .from('email_campaign_recipients')
              .update({ 
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('campaign_id', campaignId)
              .eq('subscriber_id', subscriber.id);
          } else {
            totalFailed++;
            
            await supabase
              .from('email_campaign_recipients')
              .update({ 
                status: 'failed',
                error_message: 'Send failed'
              })
              .eq('campaign_id', campaignId)
              .eq('subscriber_id', subscriber.id);
          }
        } catch (err) {
          console.error('Batch send error:', err);
          totalFailed++;
        }
      });

      await Promise.allSettled(batchPromises);

      // Update campaign progress
      await supabase
        .from('email_campaigns')
        .update({ 
          total_sent: totalSent,
        })
        .eq('id', campaignId);
    }

    // Final status update
    const finalStatus = totalFailed === 0 ? 'sent' : totalSent > 0 ? 'sent' : 'failed';
    
    await supabase
      .from('email_campaigns')
      .update({ 
        status: finalStatus,
        total_sent: totalSent,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      total_recipients: uniqueSubscribers.length,
      total_sent: totalSent,
      total_failed: totalFailed,
      status: finalStatus,
      message: `Campaign sent to ${totalSent} recipients`,
    });

  } catch (error) {
    console.error('Campaign send error:', error);
    
    // Try to update campaign status to failed
    try {
      const supabaseError = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase
        .from('email_campaigns')
        .update({ status: 'failed' })
        .eq('id', parseInt(params.id));
    } catch (updateErr) {
      console.error('Failed to update campaign status:', updateErr);
    }
    
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
 * GET /api/email/campaigns/[id]/send
 * Returns the current sending status/progress of a campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaignId = parseInt(params.id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Fetch campaign with recipient counts
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get recipient status breakdown
    const { data: recipients, error: recipientsError } = await supabase
      .from('email_campaign_recipients')
      .select('status')
      .eq('campaign_id', campaignId);

    if (recipientsError) {
      console.error('Recipients fetch error:', recipientsError);
    }

    const statusCounts = recipients?.reduce((acc: Record<string, number>, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const progress = campaign.total_recipients > 0 
      ? (campaign.total_sent / campaign.total_recipients) * 100 
      : 0;

    return NextResponse.json({
      campaign_id: campaignId,
      status: campaign.status,
      total_recipients: campaign.total_recipients,
      total_sent: campaign.total_sent,
      progress: Math.round(progress),
      status_breakdown: statusCounts,
      sent_at: campaign.sent_at,
    });

  } catch (error) {
    console.error('Campaign status fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

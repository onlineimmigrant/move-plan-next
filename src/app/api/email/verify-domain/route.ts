import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  SESClient, 
  GetIdentityVerificationAttributesCommand, 
  GetIdentityDkimAttributesCommand,
  VerifyDomainIdentityCommand, 
  VerifyDomainDkimCommand 
} from '@aws-sdk/client-ses';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { domain, organization_id } = await request.json();

    if (!domain || !organization_id) {
      return NextResponse.json(
        { error: 'Domain and organization_id are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get AWS SES credentials from settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('domain, ses_access_key_id, ses_secret_access_key, ses_region')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Organization settings not found' },
        { status: 404 }
      );
    }

    // Use organization's AWS credentials if available, otherwise use default
    const accessKeyId = settings.ses_access_key_id || process.env.AWS_SES_ACCESS_KEY_ID;
    const secretAccessKey = settings.ses_secret_access_key || process.env.AWS_SES_SECRET_ACCESS_KEY;
    const region = settings.ses_region || process.env.AWS_SES_REGION || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { error: 'AWS SES credentials not configured' },
        { status: 400 }
      );
    }

    // Initialize AWS SES client
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Check current verification status
    const getStatusCommand = new GetIdentityVerificationAttributesCommand({
      Identities: [domain],
    });

    const statusResponse = await sesClient.send(getStatusCommand);
    const verificationStatus = statusResponse.VerificationAttributes?.[domain]?.VerificationStatus;
    const isVerified = verificationStatus === 'Success';

    // Get DKIM attributes (works for both verified and unverified domains)
    const getDkimCommand = new GetIdentityDkimAttributesCommand({
      Identities: [domain],
    });
    const dkimResponse = await sesClient.send(getDkimCommand);
    let dkimTokens: string[] = dkimResponse.DkimAttributes?.[domain]?.DkimTokens || [];
    const dkimVerificationStatus = dkimResponse.DkimAttributes?.[domain]?.DkimVerificationStatus;
    const isDkimVerified = dkimVerificationStatus === 'Success';

    // If not verified or DKIM not enabled, initiate verification
    let verificationToken = null;

    if (!isVerified) {
      // Verify domain identity (get verification token for TXT record)
      const verifyIdentityCommand = new VerifyDomainIdentityCommand({
        Domain: domain,
      });
      const identityResponse = await sesClient.send(verifyIdentityCommand);
      verificationToken = identityResponse.VerificationToken;
    }

    // If DKIM tokens not available, request them
    if (dkimTokens.length === 0) {
      const verifyDkimCommand = new VerifyDomainDkimCommand({
        Domain: domain,
      });
      const dkimVerifyResponse = await sesClient.send(verifyDkimCommand);
      dkimTokens = dkimVerifyResponse.DkimTokens || [];
    }

    // Build DNS records array
    const records = [];

    // 1. Domain verification TXT record (only if not verified)
    if (verificationToken) {
      records.push({
        type: 'TXT',
        name: `_amazonses.${domain}`,
        value: verificationToken,
        description: 'Amazon SES domain verification',
        verified: false,
      });
    }

    // 2. SPF record - allows Amazon SES to send emails on behalf of your domain
    records.push({
      type: 'TXT',
      name: '@',
      value: 'v=spf1 include:amazonses.com ~all',
      description: 'SPF record - Authorizes Amazon SES to send emails on behalf of your domain',
      verified: isVerified, // SPF is part of domain verification
    });

    // 3. DKIM records - cryptographic signatures for email authenticity
    if (dkimTokens.length > 0) {
      dkimTokens.forEach((token, index) => {
        records.push({
          type: 'CNAME',
          name: `${token}._domainkey`,
          value: `${token}.dkim.amazonses.com`,
          description: `DKIM signature record ${index + 1} - Verifies email authenticity`,
          verified: isDkimVerified,
        });
      });
    }

    // 4. DMARC record - specifies how to handle unauthorized emails
    records.push({
      type: 'TXT',
      name: '_dmarc',
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${domain}; ruf=mailto:dmarc-failures@${domain}; fo=1`,
      description: 'DMARC record - Specifies policy for handling unauthorized emails and reporting',
      verified: isVerified, // DMARC typically added after domain verification
    });

    return NextResponse.json({
      verified: isVerified,
      verificationStatus,
      message: isVerified 
        ? 'Domain is verified and ready to send emails' 
        : 'Domain verification initiated. Please add DNS records and check back.',
      records,
    });
  } catch (error) {
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

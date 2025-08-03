import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createVercelClient, generateSiteEnvironmentVariables } from '@/lib/vercel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Deploy site to Vercel
export async function POST(request: NextRequest) {
  console.log('POST /api/organizations/deploy - Starting deployment request');
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const body = await request.json();
    const { organizationId, gitRepository, branch = 'main' } = body;

    console.log('Deployment request:', { organizationId, gitRepository, branch, userId });

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions
    if (!profile.is_site_creator) {
      return NextResponse.json({ error: 'Access denied. Site creator role required.' }, { status: 403 });
    }

    // Get the organization to deploy
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify user has permission to deploy this organization
    if (profile.organization_id !== organizationId && profile.role !== 'admin') {
      // For non-admin users, check if they can edit this organization
      const { data: generalOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      if (usersError) {
        return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
      }

      const creatorEmails = generalOrgUsers?.map(user => user.email) || [];
      if (!creatorEmails.includes(organization.created_by_email)) {
        return NextResponse.json({ 
          error: 'Access denied. You can only deploy organizations created by your team.' 
        }, { status: 403 });
      }
    }

    // Initialize Vercel client
    let vercelClient;
    try {
      vercelClient = createVercelClient();
    } catch (error) {
      console.error('Vercel client initialization error:', error);
      return NextResponse.json({ 
        error: 'Vercel integration not configured. Please contact administrator.' 
      }, { status: 500 });
    }

    const projectName = `${organization.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${organizationId.slice(0, 8)}`;
    const siteName = organization.name;

    console.log('Creating Vercel project:', projectName);

    // Create Vercel project first (without GitHub repository)
    let vercelProject;
    try {
      vercelProject = await vercelClient.createProject(projectName, 'nextjs');
      console.log('Vercel project created:', vercelProject.id);
    } catch (error: any) {
      console.error('Error creating Vercel project:', error);
      return NextResponse.json({ 
        error: `Failed to create Vercel project: ${error.message}` 
      }, { status: 500 });
    }

    // Connect GitHub repository to the project
    if (gitRepository) {
      console.log('Connecting GitHub repository to project:', gitRepository);
      try {
        await vercelClient.connectGitRepository(vercelProject.id, gitRepository);
        console.log('GitHub repository connected successfully');
      } catch (error: any) {
        console.error('Error connecting GitHub repository:', error);
        return NextResponse.json({ 
          error: `Failed to connect GitHub repository: ${error.message}` 
        }, { status: 500 });
      }
    }

    // Generate the base URL (will be updated after deployment)
    const baseUrl = `https://${projectName}.vercel.app`;

    // Generate environment variables
    const envVars = generateSiteEnvironmentVariables(organizationId, siteName, baseUrl);

    console.log('Setting environment variables for project:', vercelProject.id);

    // Set environment variables
    try {
      await vercelClient.setEnvironmentVariables(vercelProject.id, envVars);
      console.log('Environment variables set successfully');
    } catch (error: any) {
      console.error('Error setting environment variables:', error);
      // Don't fail deployment for env var errors, just log them
      console.warn('Continuing deployment without some environment variables');
    }

    // Trigger deployment for the linked project
    let deployment;
    if (gitRepository) {
      console.log('Triggering deployment for project:', vercelProject.id);
      try {
        deployment = await vercelClient.deployProject(vercelProject.id, projectName);
        console.log('Deployment created:', deployment.uid);
      } catch (error: any) {
        console.error('Error creating deployment:', error);
        // If simple deployment fails, try the GitHub approach as fallback
        console.log('Fallback: Attempting GitHub deployment');
        try {
          deployment = await vercelClient.deployFromGitHub(
            projectName, 
            gitRepository, 
            branch, 
            envVars
          );
          console.log('Fallback deployment created:', deployment.uid);
        } catch (fallbackError: any) {
          console.error('Fallback deployment also failed:', fallbackError);
          return NextResponse.json({ 
            error: `Failed to create deployment: ${fallbackError.message}` 
          }, { status: 500 });
        }
      }
    }

    // Update organization with Vercel project info
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        base_url: baseUrl,
        vercel_project_id: vercelProject.id,
        vercel_deployment_id: deployment?.uid || null,
        deployment_status: deployment ? 'building' : 'created',
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      // Don't fail the deployment, just log the error
      console.warn('Organization update failed, but deployment may still succeed');
    }

    // Create deployment record for tracking
    const { error: deploymentError } = await supabase
      .from('deployments')
      .insert({
        organization_id: organizationId,
        vercel_project_id: vercelProject.id,
        vercel_deployment_id: deployment?.uid || null,
        project_name: projectName,
        base_url: baseUrl,
        git_repository: gitRepository,
        git_branch: branch,
        status: deployment ? 'building' : 'created',
        created_by: userId,
        created_at: new Date().toISOString()
      });

    if (deploymentError) {
      console.error('Error creating deployment record:', deploymentError);
      // Don't fail the deployment for tracking errors
    }

    return NextResponse.json({
      success: true,
      message: 'Site deployment initiated successfully',
      data: {
        organizationId,
        projectName,
        baseUrl,
        vercelProjectId: vercelProject.id,
        vercelDeploymentId: deployment?.uid || null,
        deploymentStatus: deployment ? 'building' : 'created',
        estimatedReadyTime: deployment ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null // ~5 minutes
      }
    });

  } catch (error) {
    console.error('Error in site deployment:', error);
    return NextResponse.json({ 
      error: 'Internal server error during deployment' 
    }, { status: 500 });
  }
}

// GET - Check deployment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const deploymentId = searchParams.get('deploymentId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get deployment status from our database
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (deploymentError || !deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    // If we have a Vercel deployment ID, check its status
    let vercelStatus = null;
    if (deployment.vercel_deployment_id) {
      try {
        const vercelClient = createVercelClient();
        const vercelDeployment = await vercelClient.getDeployment(deployment.vercel_deployment_id);
        vercelStatus = {
          state: vercelDeployment.state,
          url: vercelDeployment.url,
          created: vercelDeployment.created,
          ready: vercelDeployment.ready,
        };

        // Update our database if status changed
        if (vercelDeployment.state !== deployment.status) {
          await supabase
            .from('deployments')
            .update({
              status: vercelDeployment.state.toLowerCase(),
              deployed_url: vercelDeployment.url,
              updated_at: new Date().toISOString()
            })
            .eq('id', deployment.id);
        }
      } catch (error) {
        console.error('Error checking Vercel deployment status:', error);
      }
    }

    return NextResponse.json({
      success: true,
      deployment: {
        ...deployment,
        vercelStatus
      }
    });

  } catch (error) {
    console.error('Error checking deployment status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

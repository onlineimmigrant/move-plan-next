import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activityLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('Organization creation API called');
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    console.log('User verification:', { user: user?.user?.id, error: userError });
    
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const body = await request.json();
    console.log('Request body:', body);
    
    const { name, type } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Validate organization type - exclude 'general' and 'platform' from allowed types
    const validTypes = [
      'immigration', 'solicitor', 'finance', 'education', 'job', 'beauty', 'doctor', 'services', 'realestate',
      'construction', 'software', 'marketing', 'consulting', 'automotive', 'hospitality', 'retail', 'healthcare', 'transportation', 'technology'
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid organization type. General and Platform types are not allowed for creation.' }, { status: 400 });
    }

    // Check user's profile and permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    console.log('Profile query result:', { profile, profileError });

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user has site creation permissions
    console.log('Checking site creation permissions:', profile.is_site_creator);
    if (!profile.is_site_creator) {
      return NextResponse.json({ error: 'User does not have site creation permissions' }, { status: 403 });
    }

    // Check if user's current organization is 'general' type
    if (!profile.organization_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    console.log('Current organization check:', { currentOrg, orgError });
    
    if (orgError || !currentOrg) {
      return NextResponse.json({ error: 'Could not verify current organization' }, { status: 500 });
    }

    if (currentOrg.type !== 'platform') {
      return NextResponse.json({ error: 'Only users in platform organizations can create new sites' }, { status: 403 });
    }

    // Check creation limit for users with is_site_creator = true (they can create only one organization)
    if (profile.is_site_creator && profile.role !== 'admin') {
      const { data: existingOrgs, error: existingError } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by_email', user.user.email);

      console.log('Existing organizations check:', { existingOrgs, existingError, userEmail: user.user.email });

      if (existingError) {
        return NextResponse.json({ error: 'Error checking existing organizations' }, { status: 500 });
      }

      if (existingOrgs && existingOrgs.length > 0) {
        return NextResponse.json({ error: 'Users with site creator permissions can only create one organization' }, { status: 403 });
      }
    }

    // Find the next available port for local URL
    const { data: allOrgs, error: portError } = await supabase
      .from('organizations')
      .select('base_url_local')
      .order('created_at', { ascending: true });

    if (portError) {
      return NextResponse.json({ error: 'Error checking existing organizations' }, { status: 500 });
    }

    let nextPort = 3100;
    if (allOrgs && allOrgs.length > 0) {
      const usedPorts = allOrgs
        .map(org => {
          const match = org.base_url_local?.match(/:(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(port => port !== null)
        .sort((a, b) => a! - b!);

      if (usedPorts.length > 0) {
        nextPort = Math.max(...usedPorts as number[]) + 1;
      }
    }

    const baseUrlLocal = `http://localhost:${nextPort}`;

    // Create the new organization with creator's email
    console.log('Creating organization with data:', {
      name,
      type,
      base_url_local: baseUrlLocal,
      base_url: null,
      created_by_email: user.user.email
    });
    
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name,
        type,
        base_url_local: baseUrlLocal,
        base_url: null, // Will be filled with Vercel project URL below
        created_by_email: user.user.email
      })
      .select()
      .single();

    console.log('Organization creation result:', { newOrg, createError });

    if (createError) {
      console.error('Failed to create organization:', createError);
      return NextResponse.json({ error: 'Failed to create organization', details: createError.message }, { status: 500 });
    }

    // Log the creation activity
    await logActivity({
      organizationId: newOrg.id,
      action: 'created',
      details: `${name} created`,
      userEmail: user.user.email
    });

    // Generate Vercel project name and base URL
    const projectName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newOrg.id.slice(0, 8)}`;
    const baseUrl = `https://${projectName}.vercel.app`;

    console.log('Generated Vercel project details:', { projectName, baseUrl });

    // Update the organization with the generated base_url
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({ base_url: baseUrl })
      .eq('id', newOrg.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update organization with base_url:', updateError);
      // Don't fail the creation, just log the error
      console.warn('Organization created but base_url update failed');
    }

    console.log('Organization updated with base_url:', updatedOrg);

    // Create default settings record for the new organization
    const { data: newSettings, error: settingsError } = await supabase
      .from('settings')
      .insert({
        organization_id: newOrg.id,
        site: newOrg.name, // Default site field to organization name
        font_family: 'Inter', // Default font family
        // Add other default fields as needed
      })
      .select()
      .single();

    console.log('Settings creation result:', { newSettings, settingsError });

    if (settingsError) {
      console.error('Failed to create settings:', settingsError);
      // Note: Organization was created successfully, but settings failed
      console.warn('Organization created but settings creation failed. Manual settings creation may be required.');
    }

    // Create default website_hero record for the new organization
    const { data: newHero, error: heroError } = await supabase
      .from('website_hero')
      .insert({
        organization_id: newOrg.id,
        name: newSettings?.site || newOrg.name, // Use site value or organization name as fallback
        h1_title: `Welcome to ${newOrg.name}`,
        h1_text_color: '#1f2937',
        p_description: `Discover what ${newOrg.name} has to offer.`,
        p_description_color: '#6b7280',
        background_color: '#ffffff',
        h1_text_size: 'text-xl',
        h1_text_size_mobile: 'text-lg',
        p_description_size: 'text-base',
        p_description_size_mobile: 'text-sm',
        title_alighnement: 'center',
        title_block_width: 'full',
        title_block_columns: 1,
        p_description_weight: 'normal',
        is_h1_gradient_text: false,
        is_bg_gradient: false,
        is_image_full_page: false,
        is_seo_title: false,
        image_first: false,
        button_main_get_started: 'Get Started' // Default button text
      })
      .select()
      .single();

    console.log('Hero creation result:', { newHero, heroError });

    if (heroError) {
      console.error('Failed to create hero:', heroError);
      console.warn('Organization created but hero creation failed. Manual hero creation may be required.');
    }

    // Automatically trigger Vercel deployment after organization creation
    let deploymentResult = null;
    let deploymentError = null;
    
    // Only attempt Vercel deployment if token is available
    if (!process.env.VERCEL_TOKEN) {
      console.warn('VERCEL_TOKEN not available - skipping automatic Vercel deployment');
      deploymentError = 'VERCEL_TOKEN environment variable not configured';
    } else {
      try {
        console.log('Attempting automatic Vercel deployment for new organization...');
        console.log('VERCEL_TOKEN available:', !!process.env.VERCEL_TOKEN);
        console.log('VERCEL_TOKEN length:', process.env.VERCEL_TOKEN?.length || 0);
        
        // Import deployment logic dynamically to avoid circular dependencies
        const { createVercelClient, generateSiteEnvironmentVariables } = await import('@/lib/vercel');
        console.log('Successfully imported Vercel client functions');
        
        // Initialize Vercel client with correct team ID
        console.log('Creating Vercel client...');
        console.log('Using team ID: team_O74MS093TrJebFniPVoMmj3F');
        const vercelClient = createVercelClient(
          process.env.VERCEL_TOKEN,
          'team_O74MS093TrJebFniPVoMmj3F' // Correct team ID provided by user
        );
        console.log('Vercel client created successfully with team ID');
        
        // Debug: Check what the token has access to
        try {
          console.log('Testing Vercel API access...');
          const projects = await vercelClient.listProjects();
          console.log('Current accessible projects count:', projects.projects?.length || 0);
          console.log('Sample project names:', projects.projects?.slice(0, 3).map(p => p.name) || []);
        } catch (debugError) {
          console.warn('Failed to list existing projects:', debugError);
        }
        
        const finalProjectName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newOrg.id.slice(0, 8)}`;
        
        console.log('Creating Vercel project automatically:', finalProjectName);
        
        // Create Vercel project
        const vercelProject = await vercelClient.createProject(finalProjectName, 'nextjs');
        console.log('Vercel project created automatically:', vercelProject.id);
        
        // Connect GitHub repository immediately after project creation
        const gitRepository = 'https://github.com/onlineimmigrant/move-plan-next';
        console.log('Connecting GitHub repository to project:', gitRepository);
        
        try {
          await vercelClient.connectGitRepository(vercelProject.id, gitRepository);
          console.log('GitHub repository connected successfully');
          
          // Wait a moment for the connection to propagate
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Attempt to trigger deployment
          console.log('Attempting to trigger initial deployment...');
          try {
            const deployment = await vercelClient.deployProject(vercelProject.id, finalProjectName);
            console.log('Initial deployment triggered successfully:', deployment.uid);
            
            // Update deployment status and ID
            await supabase
              .from('organizations')
              .update({
                vercel_deployment_id: deployment.uid,
                deployment_status: 'building'
              })
              .eq('id', newOrg.id);
              
          } catch (deployError) {
            console.warn('Initial deployment failed (this is common for new repo connections):', deployError);
            // Continue without failing - user can deploy manually
          }
          
        } catch (gitError) {
          console.warn('GitHub repository connection failed:', gitError);
          console.log('Project created but Git connection failed - user will need to connect manually');
        }
        
        // Generate environment variables
        const envVars = generateSiteEnvironmentVariables(newOrg.id, newOrg.name, baseUrl);
        
        // Set environment variables
        try {
          await vercelClient.setEnvironmentVariables(vercelProject.id, envVars);
          console.log('Environment variables set automatically');
        } catch (envError) {
          console.warn('Environment variables setup failed during auto-deployment:', envError);
        }
        
        // Update organization with Vercel project info
        const { error: autoUpdateError } = await supabase
          .from('organizations')
          .update({
            base_url: baseUrl,
            vercel_project_id: vercelProject.id,
            deployment_status: 'created', // Project created, ready for manual deployment
            updated_at: new Date().toISOString()
          })
          .eq('id', newOrg.id);

        if (autoUpdateError) {
          console.warn('Failed to update organization with Vercel project info:', autoUpdateError);
        }
        
        deploymentResult = {
          vercelProjectId: vercelProject.id,
          projectName: finalProjectName,
          baseUrl: baseUrl,
          status: 'created',
          dashboardUrl: `https://vercel.com/dashboard/projects/${vercelProject.id}`,
          githubRepository: gitRepository,
          message: 'Vercel project created successfully with GitHub repository connection.'
        };
        
        console.log('Automatic Vercel project creation completed successfully');
        
      } catch (autoDeployError: any) {
        console.error('❌ Automatic Vercel deployment failed:', autoDeployError);
        console.error('Error details:', {
          message: autoDeployError.message,
          stack: autoDeployError.stack,
          name: autoDeployError.name
        });
        
        // Provide specific guidance for 403 errors
        if (autoDeployError.message.includes('403') || autoDeployError.message.includes('Not authorized')) {
          console.error('🚨 VERCEL TOKEN PERMISSION ISSUE:');
          console.error('1. Check that your VERCEL_TOKEN has "Full Access" scope');
          console.error('2. Verify the token is associated with the correct team');
          console.error('3. Try regenerating the token at https://vercel.com/account/tokens');
          deploymentError = 'VERCEL_TOKEN permission denied - check token scope and team access';
        } else {
          deploymentError = autoDeployError.message;
        }
        
        // Don't fail the organization creation - just log the deployment failure
        console.log('Organization created successfully, but automatic Vercel deployment failed');
      }
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        type: newOrg.type,
        base_url_local: newOrg.base_url_local,
        base_url: updatedOrg?.base_url || baseUrl,
        vercel_project_id: deploymentResult?.vercelProjectId || null,
        deployment_status: deploymentResult?.status || 'not_deployed'
      },
      settings: newSettings || null,
      website_hero: newHero || null,
      deployment: deploymentResult,
      deploymentError: deploymentError
    });

  } catch (error) {
    console.error('Organization creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { profiles, organizationId } = await request.json();

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: 'No profiles provided' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each profile
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      
      try {
        // Validate required fields
        if (!profile.email) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Email is required`);
          continue;
        }

        // Validate team JSONB if provided
        if (profile.team) {
          if (typeof profile.team === 'string') {
            try {
              profile.team = JSON.parse(profile.team);
            } catch (e) {
              results.failed++;
              results.errors.push(`Row ${i + 1}: Invalid team JSON`);
              continue;
            }
          }
          if (typeof profile.team !== 'object') {
            results.failed++;
            results.errors.push(`Row ${i + 1}: team must be a valid JSON object`);
            continue;
          }
        }

        // Validate customer JSONB if provided
        if (profile.customer) {
          if (typeof profile.customer === 'string') {
            try {
              profile.customer = JSON.parse(profile.customer);
            } catch (e) {
              results.failed++;
              results.errors.push(`Row ${i + 1}: Invalid customer JSON`);
              continue;
            }
          }
          if (typeof profile.customer !== 'object') {
            results.failed++;
            results.errors.push(`Row ${i + 1}: customer must be a valid JSON object`);
            continue;
          }
        }

        // Check if account already exists by email
        const { data: existingProfiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id, organization_id')
          .eq('email', profile.email);

        if (fetchError) {
          throw fetchError;
        }

        const existingProfile = existingProfiles?.[0];

        if (existingProfile) {
          // Profile exists - check organization
          if (existingProfile.organization_id && existingProfile.organization_id !== organizationId) {
            // Profile belongs to a different organization
            results.failed++;
            results.errors.push(
              `Row ${i + 1} (${profile.email}): Account exists in a different organization`
            );
            continue;
          }

          // Update existing account - only allowed fields
          const updateData: any = {
            updated_at: new Date().toISOString(),
          };

          // Always ensure organization_id is set
          if (!existingProfile.organization_id) {
            updateData.organization_id = organizationId;
          }

          // Only update full_name if provided
          if (profile.full_name !== undefined) {
            updateData.full_name = profile.full_name || null;
          }

          // Update team data if provided
          if (profile.team) {
            updateData.team = profile.team;
          }

          // Update customer data if provided
          if (profile.customer) {
            updateData.customer = profile.customer;
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', existingProfile.id);

          if (updateError) throw updateError;

          results.imported++;
        } else {
          // No profile exists - check if auth user exists
          const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
          const authUserExists = existingAuthUser?.users?.find(u => u.email === profile.email);

          let userId: string;

          if (authUserExists) {
            // Auth user exists but no profile - use existing auth user ID
            userId = authUserExists.id;
          } else {
            // Create new auth user
            const tempPassword = `Temp${Math.random().toString(36).slice(2)}!${Date.now()}`;
            
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: profile.email,
              password: tempPassword,
              email_confirm: true, // Auto-confirm email
            });

            if (authError) {
              throw new Error(`Failed to create auth user: ${authError.message}`);
            }

            if (!authData.user) {
              throw new Error('No user returned from auth creation');
            }

            userId = authData.user.id;
          }

          // Double-check profile doesn't exist (race condition safety)
          const { data: doubleCheck } = await supabase
            .from('profiles')
            .select('id, organization_id')
            .eq('id', userId)
            .single();

          if (doubleCheck) {
            // Profile already exists with this ID - update it instead
            if (doubleCheck.organization_id && doubleCheck.organization_id !== organizationId) {
              results.failed++;
              results.errors.push(
                `Row ${i + 1} (${profile.email}): Account exists in a different organization`
              );
              continue;
            }

            const updateData: any = {
              updated_at: new Date().toISOString(),
            };

            // Always ensure organization_id is set
            if (!doubleCheck.organization_id) {
              updateData.organization_id = organizationId;
            }

            if (profile.full_name !== undefined) {
              updateData.full_name = profile.full_name || null;
            }

            if (profile.team) {
              updateData.team = profile.team;
            }

            if (profile.customer) {
              updateData.customer = profile.customer;
            }

            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', userId);

            if (updateError) throw updateError;

            results.imported++;
          } else {
            // Create profile with imported data
            // Default new users to leads unless they have customer data
            const hasCustomerData = profile.customer?.is_customer || profile.customer?.testimonial_text;
            const defaultCustomer = hasCustomerData 
              ? profile.customer 
              : {
                  is_customer: false,
                  is_lead: true,
                  lead_status: 'new',
                  lead_source: 'bulk_import',
                  lead_score: 0,
                  lead_notes: '',
                };

            const newProfile: any = {
              id: userId,
              email: profile.email,
              organization_id: organizationId,
              role: 'user', // Default role
              full_name: profile.full_name || null,
              team: profile.team || {},
              customer: profile.customer ? { ...defaultCustomer, ...profile.customer } : defaultCustomer,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: profileError } = await supabase
              .from('profiles')
              .insert(newProfile);

            if (profileError) {
              // Only rollback if we just created the auth user
              if (!authUserExists) {
                await supabase.auth.admin.deleteUser(userId);
              }
              throw new Error(`Failed to create profile: ${profileError.message}`);
            }

            results.imported++;
          }
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1} (${profile.email || 'no email'}): ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import profiles' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    // Verify token
    const { data: resetData, error: fetchError } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .gte('expiry', new Date().toISOString())
      .single();

    if (fetchError || !resetData) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const resetEmail = resetData.email.toLowerCase().trim(); // Normalize email
    console.log('Normalized reset data email:', resetEmail); // Debug normalized email

    // Get all users using admin.listUsers
    const { data: usersResponse, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000, // Fetch up to 1000 users to ensure all are included
    });

    console.log('Raw users response:', usersResponse); // Debug full response
    console.log('Users list:', usersResponse?.users.map(u => ({ email: u.email, id: u.id }))); // Debug user emails

    if (userError) {
      return NextResponse.json({ error: `Error fetching users: ${userError.message}` }, { status: 400 });
    }

    if (!usersResponse || !usersResponse.users) {
      return NextResponse.json({ error: 'No users found in response' }, { status: 400 });
    }

    // Find user with case-insensitive email match
    const user = usersResponse.users.find((u) => u.email && u.email.toLowerCase().trim() === resetEmail);
    if (!user) {
      return NextResponse.json({ error: `User not found for the provided email: ${resetData.email}` }, { status: 400 });
    }

    const userId = user.id;

    // Update user password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    // Clean up the used token
    await supabaseAdmin.from('password_resets').delete().eq('token', token);

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Reset password update failed:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
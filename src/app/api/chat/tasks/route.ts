import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { modelId, modelType, action, task, originalName, taskName } = await request.json();

    if (!modelId || !modelType || !action) {
      return NextResponse.json({ error: 'modelId, modelType, and action are required' }, { status: 400 });
    }

    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    let user;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase.auth.getUser(token);
      user = data.user;
      if (error || !user) {
        console.error('Token auth error:', error?.message || 'No user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabaseService
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Profile error:', profileError?.message);
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const { role, organization_id } = profileData;

    // Enforce permissions
    if (modelType === 'default' && role !== 'admin') {
      console.error('Permission denied: User is not admin', { userId: user.id, role });
      return NextResponse.json(
        { error: 'Only admins can manage tasks for default models' },
        { status: 403 }
      );
    }

    // Determine table and filters
    const table = modelType === 'default' ? 'ai_models_default' : 'ai_models';
    const filters = modelType === 'default'
      ? { id: modelId, organization_id }
      : { id: modelId, user_id: user.id };

    // Fetch current tasks
    const { data: modelData, error: modelError } = await supabaseService
      .from(table)
      .select('task')
      .match(filters)
      .single();

    if (modelError || !modelData) {
      console.error('Model fetch error:', modelError?.message, { modelId, modelType });
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    let tasks: Task[] = modelData.task || [];

    // Handle CRUD actions
    if (action === 'add') {
      if (!task || !task.name || !task.system_message) {
        return NextResponse.json({ error: 'Task name and system_message are required' }, { status: 400 });
      }
      if (tasks.some((t: Task) => t.name === task.name)) {
        return NextResponse.json({ error: 'Task name already exists' }, { status: 400 });
      }
      tasks = [...tasks, task];
    } else if (action === 'update') {
      if (!originalName || !task || !task.name || !task.system_message) {
        return NextResponse.json({ error: 'originalName and task details are required' }, { status: 400 });
      }
      if (tasks.some((t: Task) => t.name === task.name && t.name !== originalName)) {
        return NextResponse.json({ error: 'Task name already exists' }, { status: 400 });
      }
      tasks = tasks.map((t: Task) => (t.name === originalName ? task : t));
    } else if (action === 'delete') {
      if (!taskName) {
        return NextResponse.json({ error: 'taskName is required' }, { status: 400 });
      }
      tasks = tasks.filter((t: Task) => t.name !== taskName);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update tasks in the database
    const { error: updateError } = await supabaseService
      .from(table)
      .update({ task: tasks })
      .match(filters);

    if (updateError) {
      console.error('Update tasks error:', updateError.message, { modelId, modelType });
      return NextResponse.json({ error: 'Failed to update tasks' }, { status: 500 });
    }

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Tasks API error:', error.message, error.stack);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}

interface Task {
  name: string;
  system_message: string;
}
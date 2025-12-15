// app/api/flashcards/create/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseAIServerClient } from '@/lib/supabaseAI';
import axios from 'axios';
import OpenAI from 'openai';

interface Flashcard {
  question: string;
  answer: string;
  topic?: string;
  section?: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  chat_history_id: number;
}

export async function POST(request: Request) {
  try {
    const { chat_history_id } = await request.json();
    if (!chat_history_id) {
      console.error('Request error: chat_history_id is required');
      return NextResponse.json({ error: 'chat_history_id is required' }, { status: 400 });
    }

    const supabase = await createSupabaseAIServerClient();

    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    let user;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      user = data.user;
      if (error || !user) {
        console.error('Token auth error:', error?.message || 'No user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      if (error || !user) {
        console.error('Cookie auth error:', error?.message || 'No user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Authenticated user ID:', user.id);

    // Fetch user profile to check role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Profile error:', profileError?.message || 'No profile found for user:', user.id);
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const { role, organization_id } = profileData;

    // Fetch chat history
    const { data: chatHistoryData, error: chatError } = await supabase
      .from('ai_chat_histories')
      .select('id, name, messages, user_id, is_default_flashcard')
      .eq('id', chat_history_id)
      .eq('user_id', user.id)
      .limit(1);

    if (chatError) {
      console.error('Chat history query error:', chatError.message, {
        chat_history_id,
        user_id: user.id,
      });
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    console.log('Chat history query result:', chatHistoryData);

    if (!chatHistoryData || chatHistoryData.length === 0) {
      console.error('Chat history not found for ID:', chat_history_id, 'User ID:', user.id);
      return NextResponse.json({ error: 'Chat history not found' }, { status: 404 });
    }

    const chatHistory = chatHistoryData[0];

    // Validate messages
    if (!chatHistory.messages || !Array.isArray(chatHistory.messages) || chatHistory.messages.length === 0) {
      console.error('Invalid or empty messages in chat history:', {
        chat_history_id,
        messages: chatHistory.messages,
      });
      return NextResponse.json({ error: 'Chat history has no valid messages' }, { status: 400 });
    }

    // Check if is_default_flashcard is true and user is admin
    const isDefaultFlashcard = chatHistory.is_default_flashcard && (role === 'admin' || role === 'superadmin');
    if (chatHistory.is_default_flashcard && role !== 'admin' && role !== 'superadmin') {
      console.error('Permission error: Only admins can create default flashcards');
      return NextResponse.json({ error: 'Only admins can create default flashcards' }, { status: 403 });
    }

    // Fetch premium model for flashcard creation
    const { data: modelData, error: modelError } = await supabase
      .from('ai_models_default')
      .select('name, api_key, endpoint, max_tokens, system_message')
      .eq('role', 'flashcard')
      .eq('is_active', true)
      .eq('organization_id', organization_id)
      .limit(1);

    if (modelError || !modelData || modelData.length === 0) {
      console.error('Model error:', modelError?.message || 'No flashcard model found for organization:', organization_id);
      return NextResponse.json({ error: 'No flashcard model available' }, { status: 400 });
    }

    const { name, api_key, endpoint, max_tokens, system_message } = modelData[0];
    console.log('Using flashcard model:', name, 'System message:', system_message);

    // Prepare messages for the flashcard model
    const messages: Message[] = [
      { role: 'system', content: system_message },
      {
        role: 'user',
        content: `Create flashcards from the following chat history:\nName: ${chatHistory.name}\nMessages: ${JSON.stringify(chatHistory.messages)}`,
      },
    ];

    // Call the flashcard model
    let response;
    if (name.includes('gpt')) {
      const openai = new OpenAI({ apiKey: api_key });
      const completion = await openai.chat.completions.create({
        model: name,
        messages,
        max_tokens,
      });
      response = { data: { choices: [{ message: { content: completion.choices[0].message.content } }] } };
    } else if (name.includes('grok')) {
      response = await axios.post(
        endpoint,
        { model: name, messages, max_tokens },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
    } else if (name.includes('llama') || name.includes('mixtral')) {
      response = await axios.post(
        endpoint,
        { inputs: messages[messages.length - 1].content, parameters: { max_new_tokens: max_tokens } },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
      response = { data: { choices: [{ message: { content: JSON.stringify(response.data[0].generated_text) } }] } };
    } else if (name.includes('claude')) {
      response = await axios.post(
        endpoint,
        { model: name, messages, max_tokens },
        { headers: { 'x-api-key': api_key } }
      );
      response = { data: { choices: [{ message: { content: response.data.content[0].text } }] } };
    } else if (name.includes('deepseek')) {
      response = await axios.post(
        endpoint,
        { model: name, messages, max_tokens },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
    } else {
      console.error('Unsupported model:', name);
      return NextResponse.json({ error: 'Unsupported model' }, { status: 400 });
    }

    const rawResponse = response.data.choices[0].message.content;
    console.log('Raw model response:', rawResponse);

    let flashcards: Flashcard[];
    try {
      flashcards = JSON.parse(rawResponse);
    } catch (parseError: any) {
      console.error('Invalid flashcards response:', rawResponse, 'Parse error:', parseError.message);
      return NextResponse.json({ error: 'Invalid flashcard format: Expected JSON array' }, { status: 400 });
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      console.error('Invalid flashcards response: Not an array or empty');
      return NextResponse.json({ error: 'No flashcards generated' }, { status: 400 });
    }

    // Validate flashcard structure
    const validFlashcards = flashcards.filter((fc) => fc.question && fc.answer);
    if (validFlashcards.length === 0) {
      console.error('No valid flashcards generated');
      return NextResponse.json({ error: 'No valid flashcards generated' }, { status: 400 });
    }

    // Save flashcards to the appropriate table
    const tableName = isDefaultFlashcard ? 'ai_default_flashcards' : 'ai_user_flashcards';
    const flashcardsToInsert = validFlashcards.map((fc) => ({
      name: fc.question.slice(0, 100),
      messages: [
        { role: 'user', content: fc.question },
        { role: 'assistant', content: fc.answer },
      ],
      topic: fc.topic || null,
      section: fc.section || null,
      ...(isDefaultFlashcard ? { organization_id } : { user_id: user.id }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from(tableName)
      .insert(flashcardsToInsert);

    if (insertError) {
      console.error(`Insert error in ${tableName}:`, insertError.message);
      return NextResponse.json({ error: `Failed to save flashcards: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Flashcards created successfully', flashcards: flashcardsToInsert });
  } catch (error: any) {
    console.error('Flashcard creation error:', error.message, error.stack);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}
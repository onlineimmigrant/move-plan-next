import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define the Transaction interface based on the Supabase transactions table
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_transaction_id: string;
  stripe_customer_id: string;
  updated_at: string;
  description: string | null;
  customer: string;
  email: string;
  payment_method: string;
  refunded_date: string | null;
  metadata: { [key: string]: string };
}

export async function GET(request: Request) {
  try {
    // Extract the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase client with the user's access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify the user with the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const transactionId = searchParams.get('transaction_id');

    if (transactionId) {
      // Fetch a single transaction by stripe_transaction_id
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('stripe_transaction_id', transactionId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      console.log('Fetched single transaction:', data);
      return NextResponse.json({ transactions: [data], totalCount: 1 }, { status: 200 });
    } else {
      // Fetch the total count of transactions for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 });
      }

      // Fetch the user's transactions with pagination
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('Transactions fetched from Supabase:', data);
      return NextResponse.json({ transactions: data, totalCount: totalCount || 0 }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in GET /api/transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
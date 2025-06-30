import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseAIServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore.get(name))?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            await cookieStore.set(name, value, options);
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            await cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
}
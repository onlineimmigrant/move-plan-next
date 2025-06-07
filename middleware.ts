import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Ensure dotenv is loaded in development (handled by server.js in production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

export const runtime = 'nodejs'; // Force Node.js runtime for dotenv and Node APIs

export async function middleware(req: NextRequest) {
  const logPrefix = `[Middleware] [${new Date().toISOString()}] ${req.nextUrl.pathname}`;
  console.log(`${logPrefix} Processing request`);

  try {
    // Validate environment variables
    const {
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_PROJECT_ID,
    } = process.env;

    if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
      console.error(`${logPrefix} Missing environment variables: SUPABASE_URL, SERVICE_ROLE_KEY, or PROJECT_ID`);
      return redirectToLogin(req);
    }

    // Initialize Supabase client
    const supabase = createServerClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get: (name) => req.cookies.get(name)?.value,
          set: () => {}, // No-op for middleware
          remove: () => {}, // No-op for middleware
        },
      }
    );

    // Check for auth cookie
    const cookieName = `sb-${NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`;
    const authCookie = req.cookies.get(cookieName);
    if (!authCookie) {
      console.log(`${logPrefix} No auth cookie found`);
      return redirectToLogin(req);
    }

    // Parse access token
    let accessToken: string;
    try {
      const parsedCookie = JSON.parse(authCookie.value);
      accessToken = parsedCookie.access_token;
      if (!accessToken) {
        throw new Error('No access token in cookie');
      }
    } catch (err) {
      console.log(`${logPrefix} Invalid auth cookie: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return redirectToLogin(req);
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      console.log(`${logPrefix} User authentication failed: ${authError?.message || 'No user'}`);
      return redirectToLogin(req);
    }

    // Get organization ID
    const organizationId = await getOrganizationId(req.nextUrl.origin);
    if (!organizationId) {
      console.log(`${logPrefix} No organization found`);
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Fetch user profile
    const profile = await fetchUserProfile(user.id);
    if (!profile || profile.role !== 'admin' || profile.organization_id !== organizationId) {
      console.log(`${logPrefix} Access denied: Not admin or wrong organization`);
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.log(`${logPrefix} Access granted for user: ${user.id}, org: ${organizationId}`);

    // Set custom headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-organization-id', organizationId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error(`${logPrefix} Error:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return redirectToLogin(req);
  }
}

// Helper function to redirect to login
function redirectToLogin(req: NextRequest): NextResponse {
  const redirectUrl = new URL('/login', req.url);
  redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

// Type definitions for custom functions (assumed)
interface UserProfile {
  id: string;
  role: 'admin' | 'user' | string;
  organization_id: string;
}

async function getOrganizationId(origin: string): Promise<string | null> {
  // Placeholder: Implement based on src/lib/supabase.ts
  return null;
}

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  // Placeholder: Implement based on src/lib/supabase.ts
  return null;
}
# Template Section RLS Fix

## Problem
Creating new template sections was failing with error:
```
Error code: 42501
Message: "new row violates row-level security policy for table website_templatesection"
Status: 500
```

## Root Cause
The `/api/template-sections` POST route was using the regular Supabase client (with anon key) which enforces Row Level Security (RLS) policies. When attempting to insert new template sections, the RLS policy was blocking the operation because the client didn't have the proper authentication context.

## Solution
Updated `/src/app/api/template-sections/route.ts` to use **two separate Supabase clients**:

1. **supabaseAdmin** - Uses `SUPABASE_SERVICE_ROLE_KEY`
   - Bypasses RLS policies
   - Used for write operations (INSERT)
   - Admin-level access for server-side operations

2. **supabase** - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Respects RLS policies
   - Used for read operations (SELECT)
   - Normal client access

## Changes Made

### Before
```typescript
import { supabase, getOrganizationId } from '@/lib/supabase';

// POST handler
const { data, error } = await supabase
  .from('website_templatesection')
  .insert(insertData)
  .select()
  .single();
```

### After
```typescript
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';

// Create admin client for write operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular client for read operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST handler - now uses supabaseAdmin
const { data, error } = await supabaseAdmin
  .from('website_templatesection')
  .insert(insertData)
  .select()
  .single();
```

## Why This Pattern?
This follows the same pattern used in other API routes like:
- `/api/template-sections/[id]/route.ts` (DELETE/PUT operations)
- `/api/template-heading-sections/route.ts`
- `/api/metrics/[id]/route.ts`
- `/api/activities/route.ts`

## Testing
After this fix, creating new template sections should work without RLS policy violations:

1. ✅ Open EditModal
2. ✅ Navigate to Sections tab
3. ✅ Click "New Section"
4. ✅ Fill in section details
5. ✅ Click Save
6. ✅ Section is created successfully
7. ✅ Toast notification shows success

## Environment Variable Required
Ensure `.env.local` has:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

This key can be found in your Supabase project dashboard under Settings > API > service_role key (secret).

## Security Note
The service role key bypasses all RLS policies, so it should:
- ✅ Only be used in server-side API routes
- ✅ Never be exposed to the client
- ✅ Be stored in environment variables
- ✅ Only be used for admin operations that require bypassing RLS

## Related Files
- `/src/app/api/template-sections/route.ts` - Fixed POST handler
- `/src/app/api/template-sections/[id]/route.ts` - Already using supabaseAdmin pattern
- `/src/contexts/TemplateSectionEditContext.tsx` - Frontend context (no changes needed)

## Date
2024-01-XX

## Status
✅ Fixed - Ready to test

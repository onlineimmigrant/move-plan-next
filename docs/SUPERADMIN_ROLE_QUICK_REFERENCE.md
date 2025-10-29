# Superadmin Role - Quick Reference

## Role Hierarchy

```
┌─────────────┐
│ superadmin  │  System-wide access, manage all orgs, all system models
└──────┬──────┘
       │
┌──────▼──────┐
│   admin     │  Organization admin, manage org users, enable/disable models
└──────┬──────┘
       │
┌──────▼──────┐
│    user     │  Regular user, use enabled models only
└─────────────┘
```

## Helper Functions

### `is_superadmin()` → BOOLEAN
Returns `true` if current user has `role='superadmin'`
```sql
-- Example usage in RLS policy
CREATE POLICY "Superadmin access"
  ON some_table FOR ALL
  USING (is_superadmin());
```

### `is_admin()` → BOOLEAN
Returns `true` if current user has `role='admin'`
```sql
-- Example
CREATE POLICY "Admin access"
  ON some_table FOR SELECT
  USING (is_admin());
```

### `is_admin_or_superadmin()` → BOOLEAN
Returns `true` if user is either admin or superadmin
```sql
-- Example
CREATE POLICY "Admin or superadmin access"
  ON some_table FOR ALL
  USING (is_admin_or_superadmin());
```

### `get_user_role()` → TEXT
Returns the role of current user (`'superadmin'`, `'admin'`, or `'user'`)
```sql
-- Example
SELECT get_user_role();
-- Returns: 'superadmin'
```

### `get_user_organization_id()` → UUID
Returns the organization_id of current user
```sql
-- Example
SELECT get_user_organization_id();
-- Returns: '123e4567-e89b-12d3-a456-426614174000'
```

### `promote_to_superadmin(email TEXT)` → TABLE
Promotes a user to superadmin role (security-sensitive, direct SQL only)
```sql
-- Example
SELECT * FROM promote_to_superadmin('admin@example.com');

-- Returns:
-- user_id | user_email | old_role | new_role | promoted_at
```

## Common Queries

### View all superadmins
```sql
SELECT u.email, p.role, p.updated_at
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE p.role = 'superadmin'
ORDER BY p.updated_at DESC;
```

### View role distribution
```sql
SELECT 
  role,
  COUNT(*) as user_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM profiles
GROUP BY role
ORDER BY user_count DESC;
```

### View recent role changes
```sql
SELECT 
  u.email as user_email,
  cu.email as changed_by_email,
  rca.old_role,
  rca.new_role,
  rca.changed_at
FROM role_change_audit rca
INNER JOIN auth.users u ON u.id = rca.user_id
LEFT JOIN auth.users cu ON cu.id = rca.changed_by
ORDER BY rca.changed_at DESC
LIMIT 20;
```

### Check if specific user is superadmin
```sql
SELECT 
  u.email,
  p.role,
  CASE WHEN p.role = 'superadmin' THEN '✓ YES' ELSE '✗ NO' END as is_superadmin
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';
```

### Promote user to superadmin
```sql
-- ⚠️ USE WITH CAUTION - This gives full system access
SELECT * FROM promote_to_superadmin('user@example.com');

-- Verify
SELECT u.email, p.role
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE u.email = 'user@example.com';
```

### Demote superadmin to admin
```sql
-- No special function needed, just update
UPDATE profiles
SET role = 'admin',
    updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- Note: This will be logged in role_change_audit automatically
```

### View superadmin audit trail
```sql
SELECT 
  u.email as user_email,
  cu.email as changed_by_email,
  rca.old_role,
  rca.new_role,
  rca.changed_at
FROM role_change_audit rca
INNER JOIN auth.users u ON u.id = rca.user_id
LEFT JOIN auth.users cu ON cu.id = rca.changed_by
WHERE rca.new_role = 'superadmin' 
   OR rca.old_role = 'superadmin'
ORDER BY rca.changed_at DESC;
```

## Security Best Practices

### 1. Promote First Superadmin via SQL
```sql
-- After running migration 007, immediately create first superadmin
SELECT * FROM promote_to_superadmin('founder@yourcompany.com');
```

### 2. Limit Number of Superadmins
```sql
-- Check current count
SELECT COUNT(*) as superadmin_count
FROM profiles
WHERE role = 'superadmin';

-- Recommendation: Keep it to 2-3 maximum
```

### 3. Monitor Superadmin Promotions
```sql
-- Set up monitoring query (run regularly or via cron)
SELECT 
  COUNT(*) as recent_superadmin_promotions
FROM role_change_audit
WHERE new_role = 'superadmin'
  AND changed_at > NOW() - INTERVAL '7 days';

-- Alert if count > expected
```

### 4. Never Expose promote_to_superadmin() via API
```typescript
// ❌ WRONG - Never do this
app.post('/api/promote-superadmin', async (req, res) => {
  const { email } = req.body;
  await supabase.rpc('promote_to_superadmin', { user_email: email });
});

// ✅ CORRECT - Only via direct SQL in Supabase dashboard
// Or via secure admin portal with multi-factor auth + logging
```

### 5. Require MFA for Superadmins
```sql
-- Check which superadmins have MFA enabled
SELECT 
  u.email,
  u.phone,
  CASE 
    WHEN u.phone IS NOT NULL THEN '✓ MFA Enabled'
    ELSE '✗ MFA Disabled'
  END as mfa_status
FROM auth.users u
INNER JOIN profiles p ON p.id = u.id
WHERE p.role = 'superadmin';
```

## Application Integration

### TypeScript Type Definitions
```typescript
// Add to your types file
export type UserRole = 'superadmin' | 'admin' | 'user';

export interface UserProfile {
  id: string;
  role: UserRole;
  organization_id: string;
  // ... other fields
}
```

### Client-Side Role Check (React/Next.js)
```typescript
import { supabase } from '@/lib/supabase';

export async function getUserRole(): Promise<UserRole> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'user';

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role || 'user';
}

export async function isSuperadmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'superadmin';
}

export async function isAdminOrSuperadmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin' || role === 'superadmin';
}
```

### Middleware Protection (Next.js)
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check if accessing superadmin routes
  if (req.nextUrl.pathname.startsWith('/superadmin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/superadmin/:path*', '/admin/:path*', '/account/:path*'],
};
```

### API Route Protection (Next.js)
```typescript
// app/api/superadmin/[...]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check superadmin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Superadmin logic here...
  return NextResponse.json({ success: true });
}
```

## Testing

### Test RLS Policies
```sql
-- Set session variables to simulate different users
-- (This only works for testing in SQL editor)

-- Test as superadmin
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"role": "superadmin"}';

SELECT COUNT(*) FROM ai_models_system; -- Should see all

-- Test as admin
SET LOCAL request.jwt.claims = '{"role": "admin"}';

SELECT COUNT(*) FROM ai_models_system; -- Should see filtered

-- Test as user
SET LOCAL request.jwt.claims = '{"role": "user"}';

SELECT COUNT(*) FROM ai_models_system; -- Should see only enabled
```

## Troubleshooting

### Can't access system models as superadmin
```sql
-- Check if you're actually superadmin
SELECT get_user_role();

-- Check if RLS is blocking you
SELECT * FROM ai_models_system; -- As superadmin, should work

-- If still blocked, check policy
SELECT * FROM pg_policies 
WHERE tablename = 'ai_models_system' 
AND policyname LIKE '%superadmin%';
```

### Helper functions not working
```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'is_%' OR routine_name LIKE 'get_user_%';

-- If missing, re-run migration 007
```

### Role constraint violations
```sql
-- Check current constraint
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'profiles_role_check';

-- Should show: CHECK ((role = ANY (ARRAY['superadmin', 'admin', 'user'])))
```

## Migration Files Reference

- **007_add_superadmin_role_support.sql**: Creates role system, helper functions, audit table
- **005_setup_rls_policies.sql**: Uses helper functions for RLS (run AFTER 007)

## Related Documentation

- System AI Models Architecture: `/docs/SYSTEM_AI_MODELS_ARCHITECTURE.md`
- Implementation Plan: `/docs/SYSTEM_AI_MODELS_FOUNDATION_PLAN.md`
- Migration Order Guide: `/database/migrations/MIGRATION_ORDER_SUPERADMIN.md`

# Logout Implementation Guide

## Overview
The logout functionality has been centralized in the `LoginRegistration` folder with smart redirect logic.

## Files

### 1. `/src/components/LoginRegistration/hooks/useLogout.ts`
Standalone hook for logout with smart redirect logic. Can be used independently of AuthContext.

**Features:**
- Handles Supabase sign out
- Clears local storage (rememberMe, etc.)
- Smart redirect logic:
  - Stays on current page if it's public
  - Redirects to home (/) if on protected route

**Usage:**
```typescript
import { useLogout } from '@/components/LoginRegistration/hooks';

function MyComponent() {
  const { logout, isLoading, error } = useLogout();
  
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      console.log('Logged out, redirected to:', result.redirectUrl);
    }
  };
}
```

### 2. `/src/context/AuthContext.tsx`
Updated with smart redirect logic integrated into the `logout()` function.

**Changes:**
- Added `usePathname` hook
- Added `protectedRoutes` array defining auth-required pages
- Added `isProtectedRoute()` helper function
- Updated `logout()` to redirect intelligently:
  - If on `/account/*` or `/admin/*` → redirect to `/`
  - If on public page → stay on current page
- Clears `rememberMe` localStorage item

## Protected Routes

Currently defined protected routes:
- `/account` (and all sub-routes)
- `/admin` (and all sub-routes)

To add more protected routes, update the `protectedRoutes` array in:
1. `useLogout.ts` (standalone hook)
2. `AuthContext.tsx` (context logout)

## Redirect Logic

```
User clicks logout
    ↓
Check current page
    ↓
Is it /account/* or /admin/*?
    ↓
Yes → Redirect to /          No → Stay on current page
```

## Examples

### Example 1: Logout from Account Page
```
User is on: /account/profile
User clicks: Logout
Result: Redirected to /
```

### Example 2: Logout from Public Page
```
User is on: /products
User clicks: Logout
Result: Stays on /products (now as guest)
```

### Example 3: Logout from Localized Route
```
User is on: /en/admin/dashboard
User clicks: Logout
Result: Redirected to /en/
```

## Integration Points

### Components Using Logout:
1. **Header.tsx** - User menu dropdown
   - Updated to just call `logout()` without manual redirect
   - Smart redirect is handled automatically

2. **AuthContext** - Global auth state
   - Provides `logout()` through context
   - All consumers get smart redirect automatically

## Testing Checklist

- [ ] Logout from `/account/profile` → redirects to `/`
- [ ] Logout from `/admin/dashboard` → redirects to `/`
- [ ] Logout from `/products` → stays on `/products`
- [ ] Logout from `/about-us` → stays on `/about-us`
- [ ] Logout from `/en/account` → redirects to `/en/`
- [ ] Logout from `/es/admin` → redirects to `/es/`
- [ ] Logout from nested protected route `/account/settings/profile` → redirects to `/`
- [ ] localStorage cleared (rememberMe removed)
- [ ] Session cleared in Supabase
- [ ] Can't access protected routes after logout

## Future Enhancements

1. **Remember Last Page**: Store last visited public page and redirect there after logout
2. **Logout Confirmation**: Add optional confirmation modal before logout
3. **Session Timeout**: Auto-logout after inactivity with redirect to current page if public
4. **Logout Message**: Show toast/notification with success message
5. **Logout Everywhere**: Add option to sign out from all devices

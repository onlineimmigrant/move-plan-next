# Login Redirect Implementation Guide

## Overview
Users are now redirected back to the page they were viewing before logging in, providing a seamless authentication experience.

## How It Works

### Flow Diagram
```
User on page /products
    ↓
Clicks "Login" button
    ↓
Current URL saved to localStorage (returnUrl: "/products")
    ↓
Redirected to /login
    ↓
User enters credentials
    ↓
Login successful
    ↓
Check redirect priority:
1. Explicit redirectTo parameter
2. URL search params (redirectTo=...)
3. localStorage returnUrl
4. Default: /account
    ↓
User redirected back to /products
```

## Implementation

### 1. **useReturnUrl Hook**
Location: `/src/components/LoginRegistration/hooks/useReturnUrl.ts`

Automatically saves the current page URL before navigating to login/register pages.

**Usage in Pages:**
```typescript
import { useReturnUrl } from '@/components/LoginRegistration/hooks';

export default function LoginPage() {
  useReturnUrl(); // Call this hook to save return URL
  // ... rest of component
}
```

**Manual Usage:**
```typescript
import { saveReturnUrl } from '@/components/LoginRegistration/hooks';

// Save current page before redirecting
saveReturnUrl(window.location.pathname);
router.push('/login');
```

### 2. **useLogin Hook**
Location: `/src/components/LoginRegistration/hooks/useLogin.ts`

Enhanced with smart redirect logic that checks multiple sources:

**Redirect Priority:**
1. **Explicit Parameter**: `login(formData, '/custom-redirect')`
2. **URL Search Params**: `/login?redirectTo=/products`
3. **localStorage returnUrl**: Saved by `useReturnUrl` hook
4. **Default**: `/account` (fallback)

**Anti-patterns Handled:**
- Prevents redirecting to auth pages (`/login`, `/register`, `/reset-password`)
- Handles localized routes (e.g., `/en/login` → cleaned to `/login`)
- Clears returnUrl from localStorage after use

### 3. **Integration Points**

#### Header Component
Saves return URL when user clicks login:
```typescript
const handleLoginModal = useCallback(() => {
  // Save current page for redirect after login
  if (pathname && !pathname.includes('/login')) {
    saveReturnUrl(pathname);
  }
  setIsLoginOpen(true);
}, [pathname]);
```

#### Login Page
Automatically saves return URL:
```typescript
export default function LoginPage() {
  useReturnUrl(); // Saves current page if not already on auth page
  // ...
}
```

## Examples

### Example 1: Protected Route
```
User visits: /account/profile (not logged in)
Middleware redirects to: /login?redirectTo=/account/profile
After login → /account/profile
```

### Example 2: Modal Login
```
User on: /products
Clicks: "Login" in header
Modal opens, returnUrl saved: "/products"
After login → /products
```

### Example 3: Direct Navigation
```
User navigates to: /login
No returnUrl saved (already on auth page)
After login → /account (default)
```

### Example 4: With Search Params
```
URL: /login?redirectTo=/checkout
After login → /checkout (URL param takes priority)
```

### Example 5: Localized Routes
```
User on: /es/products
Clicks: "Login"
returnUrl saved: "/es/products"
After login → /es/products
```

## Protected Routes

Auth pages that won't be saved as returnUrl:
- `/login`
- `/register`
- `/reset-password`
- All localized variants (e.g., `/en/login`)

## Storage

**localStorage Key:** `returnUrl`

**Lifecycle:**
1. Saved when navigating to login
2. Retrieved during login process
3. **Automatically cleared** after successful login

## API Reference

### `useReturnUrl()`
React hook that automatically saves current page URL.
- **When**: Called in login/register page components
- **Effect**: Saves pathname to localStorage if not on auth page
- **Returns**: void

### `saveReturnUrl(url?: string)`
Manually save a return URL.
- **Parameters**: `url` - The URL to return to (optional, uses current if omitted)
- **Returns**: void

### `getReturnUrl(clearAfterGet?: boolean)`
Retrieve saved return URL.
- **Parameters**: `clearAfterGet` - Clear after retrieving (default: true)
- **Returns**: `string | null`

### `clearReturnUrl()`
Clear saved return URL from storage.
- **Returns**: void

## Testing Checklist

- [ ] Login from /products → returns to /products
- [ ] Login from /en/products → returns to /en/products
- [ ] Login via modal from any page → returns to that page
- [ ] Login with URL param `?redirectTo=/checkout` → goes to /checkout
- [ ] Login from /login directly → goes to /account (default)
- [ ] Login from protected route with middleware redirect → returns to protected route
- [ ] returnUrl cleared after successful login
- [ ] Auth pages not saved as returnUrl
- [ ] Logout then login → goes to /account (no stale returnUrl)

## Security Considerations

1. **No External Redirects**: Only internal paths are accepted
2. **Auth Page Filtering**: Prevents redirect loops
3. **Validation**: URLs are checked before redirect
4. **Storage Cleanup**: returnUrl cleared after use to prevent stale data

## Future Enhancements

1. **Session Storage**: Consider using sessionStorage for browser-tab isolation
2. **Expiration**: Add timestamp to returnUrl, expire after X minutes
3. **Deep Linking**: Support returning to specific states (tabs, filters, etc.)
4. **History Stack**: Remember last N pages, allow choosing which to return to
5. **Smart Defaults**: Different defaults based on user role (admin vs regular user)

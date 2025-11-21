# OAuth Redirect Debug Guide

## Issue
After OAuth authentication in production, users are being redirected to localhost instead of the production domain.

## Root Cause
Supabase OAuth configuration needs to be updated with production URLs.

## Fix Steps

### 1. Update Supabase Dashboard Settings

#### A. Site URL Configuration
1. Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm
2. Navigate to: **Authentication** → **URL Configuration**
3. Set **Site URL** to: `https://codedharmony.app`

#### B. Redirect URLs Configuration
Add these redirect URLs (in the same URL Configuration section):
```
https://codedharmony.app/*/auth/callback
https://codedharmany-move-plan-next.vercel.app/*/auth/callback
http://localhost:3000/*/auth/callback
```

The `*` wildcard matches any locale (en, es, fr, etc.)

### 2. Update OAuth Provider Configurations

#### Google OAuth Configuration
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   - `https://rgbmdfaoowqbgshjuwwm.supabase.co/auth/v1/callback`

#### LinkedIn OAuth Configuration
1. Go to: https://www.linkedin.com/developers/apps
2. Find your application
3. Under **OAuth 2.0 settings** → **Redirect URLs**, ensure you have:
   - `https://rgbmdfaoowqbgshjuwwm.supabase.co/auth/v1/callback`

### 3. Test in Browser Console

After making these changes, test by opening browser console and running:

```javascript
// Before OAuth login
console.log('Current origin:', window.location.origin);
console.log('Expected callback:', window.location.origin + '/auth/callback');
```

Then check the redirect after OAuth completes.

### 4. Verify Organization Domain Configuration

Check your database to ensure domains are properly configured:

```sql
SELECT id, name, base_url, base_url_local, domains 
FROM organizations 
WHERE name = 'Coded Harmony';
```

Expected result should show:
- `base_url`: `https://codedharmany-move-plan-next.vercel.app`
- `domains`: Array containing `codedharmony.app` and any other production domains

### 5. Check Vercel Environment Variables

Ensure your Vercel project has:
- `NEXT_PUBLIC_BASE_URL` = `https://codedharmany-move-plan-next.vercel.app` (or your primary domain)
- All Supabase keys match your local `.env` file

## Testing Checklist

After applying fixes:

- [ ] Test Google OAuth on production domain
- [ ] Test LinkedIn OAuth on production domain
- [ ] Verify redirect lands on correct domain
- [ ] Check browser console for any OAuth errors
- [ ] Test with different locales (e.g., /en/, /es/, /fr/)

## Common Pitfalls

1. **Wildcard not supported**: If Supabase doesn't support `*` wildcard, add each locale explicitly:
   - `https://codedharmony.app/en/auth/callback`
   - `https://codedharmony.app/es/auth/callback`
   - etc.

2. **Case sensitivity**: URLs are case-sensitive in OAuth configs

3. **Trailing slashes**: Some OAuth providers are strict about trailing slashes

4. **Vercel preview deployments**: If testing on preview URLs, add them to redirect URLs temporarily

## Support Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Google OAuth Setup: https://supabase.com/docs/guides/auth/social-login/auth-google
- LinkedIn OAuth Setup: https://supabase.com/docs/guides/auth/social-login/auth-linkedin

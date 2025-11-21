# Supabase OAuth Configuration Reference

## Complete Setup for Multi-Tenant OAuth

### Supabase Dashboard Configuration

**URL:** https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/auth/url-configuration

#### Site URL
```
https://codedharmony.app
```

#### Redirect URLs (Add all of these)

```
https://*.app/*/auth/callback
https://*.app/auth/callback
https://*.app/*/reset-password
https://*.app/reset-password

https://*.com/*/auth/callback
https://*.com/auth/callback
https://*.com/*/reset-password
https://*.com/reset-password

https://*.co.uk/*/auth/callback
https://*.co.uk/auth/callback
https://*.co.uk/*/reset-password
https://*.co.uk/reset-password

https://*.org/*/auth/callback
https://*.org/auth/callback
https://*.org/*/reset-password
https://*.org/reset-password

https://*.fr/*/auth/callback
https://*.fr/auth/callback
https://*.fr/*/reset-password
https://*.fr/reset-password

https://*.io/*/auth/callback
https://*.io/auth/callback
https://*.io/*/reset-password
https://*.io/reset-password

https://*.vercel.app/*/auth/callback
https://*.vercel.app/auth/callback
https://*.vercel.app/*/reset-password
https://*.vercel.app/reset-password

http://localhost:3000/*/auth/callback
http://localhost:3000/auth/callback
http://localhost:3000/*/reset-password
http://localhost:3000/reset-password
```

### Why Two Patterns?

1. **`https://*.app/*/auth/callback`** 
   - Matches: `https://codedharmony.app/en/auth/callback`
   - Matches: `https://codedharmony.app/es/auth/callback`
   - For: Locale-based URLs

2. **`https://*.app/auth/callback`**
   - Matches: `https://codedharmony.app/auth/callback`
   - For: Root-level URLs (no locale)

3. **`https://*.app/*/reset-password`**
   - Matches: `https://codedharmony.app/en/reset-password`
   - For: Password reset with locale

4. **`https://*.app/reset-password`**
   - Matches: `https://codedharmony.app/reset-password`
   - For: Password reset without locale

### Supported Patterns

✅ Works for:
- All custom domains ending in `.app`, `.com`, `.co.uk`, `.org`, `.fr`, `.io`
- All Vercel preview/production deployments
- Local development
- All supported locales (en, es, fr, de, ru, it, pt, zh, ja, pl)
- Both OAuth callbacks and password reset flows

### OAuth Providers Configuration

#### Google Cloud Console
**Authorized redirect URIs:**
```
https://rgbmdfaoowqbgshjuwwm.supabase.co/auth/v1/callback
```

#### LinkedIn Developer Console
**Redirect URLs:**
```
https://rgbmdfaoowqbgshjuwwm.supabase.co/auth/v1/callback
```

### Testing

Test each pattern:
```bash
# OAuth Callbacks
# Test with locale
https://codedharmony.app/en/auth/callback

# Test without locale  
https://codedharmony.app/auth/callback

# Test subdomain with locale
https://app.example.com/fr/auth/callback

# Test subdomain without locale
https://app.example.com/auth/callback

# Password Reset
# Test with locale
https://codedharmony.app/en/reset-password

# Test without locale
https://codedharmony.app/reset-password

# Test UK domain with locale
https://example.co.uk/en/reset-password

# Test French domain
https://example.fr/auth/callback
```

### Adding New TLDs

To support new top-level domains (e.g., `.net`, `.dev`), add to Supabase:
```
https://*.net/*/auth/callback
https://*.net/auth/callback
https://*.net/*/reset-password
https://*.net/reset-password

https://*.dev/*/auth/callback
https://*.dev/auth/callback
https://*.dev/*/reset-password
https://*.dev/reset-password
```

### Security Notes

- Wildcards are safe because they only match the pattern structure
- Each domain still requires proper organization configuration in database
- OAuth providers validate against Supabase's callback URL
- Users are redirected to their original domain after authentication

### Troubleshooting

**Issue: "Redirect URL not allowed"**
- Check Supabase URL Configuration has both wildcard patterns
- Verify domain matches one of the wildcard patterns
- Check browser console for actual callback URL being used

**Issue: "Redirecting to localhost in production"**
- Ensure `window.location.origin` is correct in OAuth buttons
- Check localStorage for stored redirect URL
- Verify callback page uses `window.location.origin`

**Issue: "Works for some domains but not others"**
- Add specific TLD pattern to Supabase (e.g., `.co.uk` needs its own pattern)
- Check if domain has subdomain (needs `*` wildcard)

### Current Implementation

The OAuth buttons automatically:
1. Detect current locale from URL
2. Generate callback URL with or without locale
3. Store final redirect destination in localStorage
4. Redirect back to original domain after authentication

No manual configuration needed per tenant/domain.

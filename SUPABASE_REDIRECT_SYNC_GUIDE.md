# Automatic Supabase Redirect URL Sync

## Overview

This system automatically manages Supabase Auth redirect URLs based on your organization domains. Whenever a new organization is created or domains are updated, the Supabase configuration is automatically synced.

## How It Works

1. **Database Trigger**: When organizations are created/updated, a PostgreSQL trigger fires
2. **API Endpoint**: The trigger calls `/api/sync-supabase-redirects` 
3. **Auto-Update**: The API collects all domains and updates Supabase configuration
4. **All Locales**: Automatically generates redirect URLs for all supported locales

## Setup Instructions

### Step 1: Configure Supabase Management API Access

The Supabase Management API requires authentication. You need to add your Supabase access token:

1. Go to: https://app.supabase.com/account/tokens
2. Create a new access token (or use existing)
3. Add to your `.env` file:

```bash
SUPABASE_ACCESS_TOKEN=your_token_here
```

### Step 2: Apply Database Migration

Run the migration to create the automatic sync trigger:

```bash
# Apply the migration
psql -h db.rgbmdfaoowqbgshjuwwm.supabase.co \
  -U postgres \
  -d postgres \
  -f migrations/sync-supabase-redirects-trigger.sql

# Or via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy/paste contents of migrations/sync-supabase-redirects-trigger.sql
# 3. Run the query
```

### Step 3: Set Database Configuration Variable

The trigger needs access to your API secret:

```sql
-- Run this in Supabase SQL Editor
ALTER DATABASE postgres SET app.settings.sync_api_secret = 'VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4=';
```

### Step 4: Initial Sync

Manually trigger the first sync to configure all existing domains:

```bash
# Using the script
./scripts/sync-supabase-redirects.sh

# Or using curl directly
curl -X POST https://codedharmony.app/api/sync-supabase-redirects \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4="
```

## Usage

### Automatic Sync (Recommended)

Once set up, redirect URLs are automatically synced when:

- A new organization is created
- An organization's `base_url` is updated
- An organization's `base_url_local` is updated  
- An organization's `domains` array is modified

**Example:**
```sql
-- This will automatically trigger a sync
UPDATE organizations 
SET domains = array_append(domains, 'mynewdomain.com')
WHERE name = 'Coded Harmony';

-- Or by ID
UPDATE organizations 
SET domains = array_append(domains, 'mynewdomain.com')
WHERE id = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3';
```

### Manual Sync

You can also manually trigger a sync anytime:

**Option 1: Using the Shell Script**
```bash
./scripts/sync-supabase-redirects.sh
```

**Option 2: Using Curl**
```bash
curl -X POST https://codedharmony.app/api/sync-supabase-redirects \
  -H "x-webhook-secret: VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4="
```

**Option 3: Via API in Code**
```typescript
const response = await fetch('/api/sync-supabase-redirects', {
  method: 'POST',
  headers: {
    'x-webhook-secret': process.env.SYNC_API_SECRET,
  },
});

const result = await response.json();
console.log(result);
```

### View Current Redirect URLs

Check what redirect URLs are currently configured:

```bash
# Using curl
curl https://codedharmony.app/api/sync-supabase-redirects

# Or in browser
open https://codedharmony.app/api/sync-supabase-redirects
```

## Generated Redirect URLs

The system automatically generates redirect URLs in this format:

For each domain (from `base_url`, `base_url_local`, and `domains` array):
- `{domain}/auth/callback` (root)
- `{domain}/en/auth/callback` (English)
- `{domain}/es/auth/callback` (Spanish)
- `{domain}/fr/auth/callback` (French)
- `{domain}/de/auth/callback` (German)
- `{domain}/ru/auth/callback` (Russian)
- `{domain}/it/auth/callback` (Italian)
- `{domain}/pt/auth/callback` (Portuguese)
- `{domain}/zh/auth/callback` (Chinese)
- `{domain}/ja/auth/callback` (Japanese)
- `{domain}/pl/auth/callback` (Polish)
- `{domain}/*/auth/callback` (wildcard for all locales)

**Example for `codedharmony.app`:**
```
https://codedharmony.app/auth/callback
https://codedharmony.app/en/auth/callback
https://codedharmony.app/es/auth/callback
https://codedharmony.app/fr/auth/callback
https://codedharmony.app/de/auth/callback
https://codedharmony.app/ru/auth/callback
https://codedharmony.app/it/auth/callback
https://codedharmony.app/pt/auth/callback
https://codedharmony.app/zh/auth/callback
https://codedharmony.app/ja/auth/callback
https://codedharmony.app/pl/auth/callback
https://codedharmony.app/*/auth/callback
```

## Adding New Locales

To add support for new locales:

1. Update `src/lib/supabase-redirect-sync.ts`:
```typescript
// Add your new locale to this array
const locales = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl', 'ar', 'hi'];
```

2. Trigger a manual sync:
```bash
./scripts/sync-supabase-redirects.sh
```

## Troubleshooting

### Issue: Sync not triggering automatically

**Check if trigger exists:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_supabase_redirects';
```

**Check trigger function:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'sync_supabase_redirects_on_org_update';
```

**Check database logs:**
```sql
-- In Supabase Dashboard > Logs > Postgres Logs
```

### Issue: "Unauthorized" error

Make sure your `SYNC_API_SECRET` environment variable matches in:
- `.env` file
- Vercel environment variables
- Database configuration (`app.settings.sync_api_secret`)

### Issue: Redirect URLs not updating in Supabase

**Verify Supabase Management API token:**
1. Check token is valid: https://app.supabase.com/account/tokens
2. Ensure token has correct permissions
3. Update `.env` with new token if needed

**Check API response:**
```bash
# Run with verbose output
curl -v -X POST https://codedharmony.app/api/sync-supabase-redirects \
  -H "x-webhook-secret: VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4="
```

### Issue: Some domains not included

**Verify organization data:**
```sql
SELECT id, name, base_url, base_url_local, domains 
FROM organizations 
WHERE domains IS NOT NULL OR base_url IS NOT NULL;
```

**Check for protocol:**
Domains in the `domains` array should not include protocol. The system automatically adds `https://`:
```sql
-- ✅ Good
UPDATE organizations SET domains = ARRAY['myapp.com', 'app.example.com'];

-- ❌ Bad
UPDATE organizations SET domains = ARRAY['https://myapp.com'];
```

## Security

- The API endpoint is protected with `SYNC_API_SECRET`
- Database trigger runs with `SECURITY DEFINER` to ensure proper permissions
- Only authorized services can trigger the sync
- Management API token should be kept secure

## Monitoring

View sync activity in:

1. **Vercel Logs**: Check `/api/sync-supabase-redirects` endpoint logs
2. **Supabase Logs**: Database trigger executions
3. **Manual Check**: GET request to `/api/sync-supabase-redirects`

## API Reference

### GET /api/sync-supabase-redirects

Returns current redirect URLs configuration.

**Response:**
```json
{
  "success": true,
  "count": 36,
  "redirectUrls": [
    "http://localhost:3000/auth/callback",
    "https://codedharmony.app/auth/callback",
    ...
  ]
}
```

### POST /api/sync-supabase-redirects

Triggers sync of redirect URLs to Supabase.

**Headers:**
- `x-webhook-secret`: Your SYNC_API_SECRET

**Response:**
```json
{
  "success": true,
  "message": "Supabase redirect URLs updated successfully",
  "count": 36,
  "redirectUrls": [...]
}
```

## Future Enhancements

Potential improvements:
- Webhook notifications on sync completion
- Sync history/audit log
- Custom locale configuration per organization
- Automatic cleanup of old/unused redirect URLs
- Integration with Vercel domain management

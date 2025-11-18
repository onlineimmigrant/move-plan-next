# Automatic R2 CORS Synchronization System

## Overview

This system automatically keeps Cloudflare R2 bucket CORS configuration in sync with organization domains, eliminating manual CORS configuration and authentication issues.

## Problem Solved

**Before:** Manual CORS configuration required updating Cloudflare settings every time:
- A new organization was added
- Organization domains changed
- Deploying to new environments
- Authentication failures due to missing origins

**After:** Automatic synchronization whenever organizations are created/updated.

## Architecture

### Components

1. **Core Library** (`/src/lib/cloudflareR2.ts`)
   - `getAllOrganizationDomains()` - Fetches all domains from all organizations
   - `updateR2CORS()` - Updates Cloudflare R2 bucket CORS
   - `syncR2CORSWithOrganizations()` - Main sync function
   - `getCurrentCORSConfig()` - Retrieves current CORS settings

2. **API Endpoints**
   - `POST /api/sync-r2-cors` - Manual sync trigger (admin only)
   - `GET /api/sync-r2-cors` - View current CORS configuration
   - `POST /api/webhooks/organization-updated` - Webhook for external triggers

3. **Database Trigger** (`setup-r2-cors-auto-sync.sql`)
   - PostgreSQL function that detects organization changes
   - Triggers on INSERT/UPDATE of organizations table
   - Notifies application via pg_notify

4. **Realtime Listener** (`/src/lib/organizationCORSSync.ts`)
   - Supabase Realtime subscription
   - Auto-syncs CORS when organizations change
   - Debounced to prevent excessive API calls

5. **Admin UI** (`/src/components/admin/R2CORSManagement.tsx`)
   - Manual sync button
   - View current CORS configuration
   - Status messages and documentation

## How It Works

### Automatic Flow

```
1. Organization Created/Updated
   ↓
2. Database Trigger Fires
   ↓
3. Supabase Realtime Notification
   ↓
4. organizationCORSSync Listener Receives Event
   ↓
5. Debounce (2 seconds)
   ↓
6. getAllOrganizationDomains() - Fetches ALL org domains
   ↓
7. updateR2CORS() - Updates Cloudflare R2 CORS
   ↓
8. CORS Applied (1-2 minutes propagation)
```

### Manual Flow

```
1. Admin clicks "Sync Now" in UI
   ↓
2. POST /api/sync-r2-cors
   ↓
3. syncR2CORSWithOrganizations()
   ↓
4. Cloudflare R2 CORS Updated
```

## Setup Instructions

### 1. Run Database Migration

```sql
-- Apply the trigger to organizations table
psql -h <supabase-host> -U postgres -d postgres < setup-r2-cors-auto-sync.sql
```

Or in Supabase SQL Editor:
```sql
-- Copy/paste contents of setup-r2-cors-auto-sync.sql
```

### 2. Initialize Realtime Listener

In your app initialization (e.g., `app/layout.tsx` or `middleware.ts`):

```typescript
import { startOrganizationCORSSync } from '@/lib/organizationCORSSync';

// Start listening for organization changes
if (typeof window === 'undefined') { // Server-side only
  startOrganizationCORSSync();
}
```

### 3. Add Admin UI to Settings

```typescript
// In your admin settings page
import R2CORSManagement from '@/components/admin/R2CORSManagement';

export default function AdminSettingsPage() {
  return (
    <div>
      {/* Other admin settings */}
      <R2CORSManagement />
    </div>
  );
}
```

### 4. Initial Sync

Run once to sync existing organizations:

```bash
# Via API
curl -X POST https://your-domain.com/api/sync-r2-cors \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or via admin UI
# Navigate to admin settings → R2 CORS Management → Click "Sync Now"
```

## Domain Collection Logic

The system collects domains from:

1. **organizations.domains** array (primary)
   - Each domain gets HTTPS variant
   - Wildcard subdomains (`*.domain.com`)
   - WWW variants

2. **organizations.base_url** (fallback)
   - Production domain

3. **organizations.base_url_local** (development)
   - Local development URLs

4. **Hardcoded localhost** (always included)
   - `http://localhost:3000`
   - `http://localhost:3001`

### Example

```sql
-- Organization 1
domains: ['codedharmony.app', 'move-plan-next.vercel.app']
base_url: 'https://codedharmony.app'
base_url_local: 'http://localhost:3000'

-- Organization 2
domains: ['metexam.com']
base_url: 'https://metexam.com'
base_url_local: null

-- Results in CORS AllowedOrigins:
[
  'https://codedharmony.app',
  'https://www.codedharmony.app',
  'https://*.codedharmony.app',
  'https://move-plan-next.vercel.app',
  'https://www.move-plan-next.vercel.app',
  'https://*.move-plan-next.vercel.app',
  'https://metexam.com',
  'https://www.metexam.com',
  'https://*.metexam.com',
  'http://localhost:3000',
  'http://localhost:3001'
]
```

## CORS Configuration Details

Generated CORS rules include:

```json
{
  "AllowedOrigins": ["<all-org-domains>"],
  "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": [
    "ETag",
    "Content-Length",
    "Content-Type",
    "Content-Range",
    "Accept-Ranges"
  ],
  "MaxAgeSeconds": 3600
}
```

## Security

- **API Authorization**: Only admin/owner/superadmin roles can trigger sync
- **Webhook Secret**: Webhook endpoint requires `SYNC_API_SECRET`
- **Cloudflare Token**: Uses `CLOUDFLARE_API_TOKEN` from environment
- **Domain Validation**: Only domains from verified organizations

## Monitoring & Debugging

### Check Current CORS

```bash
curl https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/r2/buckets/product-videos/cors \
  -H "Authorization: Bearer YOUR_CLOUDFLARE_TOKEN"
```

### Test CORS

```bash
curl -I -H "Origin: https://codedharmony.app" \
  https://pub-6891bafd3bd54c36b02da71be2099135.r2.dev/test-file.mp4
```

Should return:
```
Access-Control-Allow-Origin: https://codedharmony.app
```

### Console Logs

```
[CORS Sync] Organization changed: UPDATE 6695b959-45ef-44b4-a68c-9cd0fe0e25a3
[CORS Sync] Domains changed, syncing R2 CORS...
[R2 CORS] Syncing CORS configuration with organization domains...
[R2 CORS] Successfully updated CORS configuration
[R2 CORS] Allowed origins: [...15 domains]
[CORS Sync] ✅ R2 CORS synced successfully
```

## Troubleshooting

### CORS not updating

1. **Check database trigger exists:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_organization_updated';
   ```

2. **Check Realtime listener:**
   - Look for `[CORS Sync] ✅ Listening for organization changes` in logs

3. **Verify Cloudflare credentials:**
   ```bash
   echo $CLOUDFLARE_API_TOKEN
   echo $R2_ACCOUNT_ID
   ```

4. **Manual sync:**
   ```bash
   # Via admin UI or API
   curl -X POST /api/sync-r2-cors
   ```

### Videos still not playing

1. **Wait 1-2 minutes** for CORS propagation
2. **Hard refresh** browser (Cmd+Shift+R)
3. **Check Network tab** for CORS headers
4. **Verify domain is in organizations.domains:**
   ```sql
   SELECT id, domains FROM organizations;
   ```

## Environment Variables Required

```env
CLOUDFLARE_API_TOKEN=your_token
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=product-videos
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxx.r2.dev
SYNC_API_SECRET=your_webhook_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Benefits

✅ **Zero Manual Configuration** - Add organization → CORS auto-updates  
✅ **Multi-Tenant Support** - All organizations share same R2 bucket safely  
✅ **Production Ready** - Works across all environments automatically  
✅ **Self-Healing** - Sync button in admin UI for quick fixes  
✅ **Scalable** - Handles unlimited organizations and domains  
✅ **Secure** - Role-based access control for sync operations  

## Migration from Manual CORS

If you currently have manual CORS setup:

1. **Backup current CORS** (if needed):
   ```bash
   curl -X GET https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/r2/buckets/product-videos/cors \
     -H "Authorization: Bearer YOUR_TOKEN" > cors-backup.json
   ```

2. **Run setup SQL** to create trigger

3. **Sync once** via admin UI or API

4. **Test** video playback on all domains

5. **Remove** old manual CORS scripts/documentation

## Future Enhancements

- [ ] Automatic cleanup of deleted organization domains
- [ ] CORS sync status dashboard
- [ ] Email notifications on sync failures
- [ ] Bulk organization import with auto-sync
- [ ] CORS diff view before sync

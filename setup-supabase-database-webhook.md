# Setup Supabase Database Webhook for R2 CORS Auto-Sync

Since `pg_net` may have limitations with outbound HTTP requests, use Supabase's built-in Database Webhooks instead.

## Steps to Configure in Supabase Dashboard:

### 1. Go to Database Webhooks
- Navigate to: **Database** → **Webhooks** in your Supabase dashboard
- Click **Create a new hook**

### 2. Configure the Webhook

**Name:** `r2-cors-auto-sync`

**Table:** `organizations`

**Events:** Check both:
- ☑ INSERT
- ☑ UPDATE

**Type:** `HTTP Request`

**Method:** `POST`

**URL:** `https://codedharmony.app/api/sync-r2-cors`

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "x-webhook-secret": "VJuKxQbhui0PpwQtFkIdC+T5OPCUHZisDNWVjk3J/z4="
}
```

**HTTP Params:** (leave empty)

**Conditions (optional):** To only trigger when domains or base_url changes:
```sql
(
  (TG_OP = 'INSERT') OR 
  (TG_OP = 'UPDATE' AND (
    NEW.domains IS DISTINCT FROM OLD.domains OR 
    NEW.base_url IS DISTINCT FROM OLD.base_url
  ))
)
```

### 3. Test the Webhook

After creating, click **Send Test Request** to verify connectivity.

### 4. Verify Automatic Sync

1. Update any organization's `domains` field in the table editor
2. Wait 2-3 seconds
3. Check webhook logs in Supabase dashboard
4. Verify CORS updated at: https://codedharmony.app/api/sync-r2-cors (GET request)

## Advantages of Database Webhooks:

✅ No need for pg_net extension
✅ Built-in retry logic
✅ Dashboard UI for monitoring
✅ Better debugging with request/response logs
✅ No SQL code needed

## Fallback: Manual Sync

If automatic sync fails, you can always run manually:
```bash
node sync-r2-cors-now.js
```

Or use the Admin UI at: https://codedharmony.app/admin (R2 CORS Management section)

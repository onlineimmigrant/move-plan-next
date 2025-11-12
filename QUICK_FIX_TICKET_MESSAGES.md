# Quick Fix - Ticket Messages Not Showing

## The Problem
Users don't see admin messages or their own messages in the ticket chat.

## The Solution (2 minutes)

### 1. Fix Database Permissions
Run this in Supabase SQL Editor:
```bash
# File location:
database/migrations/FIX_TICKET_RLS_POLICIES.sql
```

**Steps:**
1. Copy the SQL file contents
2. Go to Supabase → SQL Editor
3. Paste and run
4. Look for "✅ RLS policies created successfully!"

### 2. Enable Realtime (if needed)
1. Supabase → Database → Replication
2. Find `ticket_responses` table
3. Toggle realtime ON
4. Save

### 3. Test It
Open browser console (F12) and look for these emojis:
- `📤` = Sending message
- `✅` = Saved to database
- `🔔` = Realtime update received
- `🔍` = Messages displayed

**Good output:**
```
🔍 Messages Component Debug: {
  totalResponses: 5,
  responses: [
    {isAdmin: false, ...},  ← Customer message
    {isAdmin: true, ...},   ← Admin message (should now appear!)
    ...
  ]
}
```

## If Still Broken

### Missing realtime event (no 🔔)?
→ Check Supabase Dashboard → Database → Replication → `ticket_responses` is enabled

### Messages in 📨 but not in 🔍?
→ React state issue - refresh the page

### No messages at all?
→ RLS still blocking - run the SQL script again

### "Object not found" error?
→ Already fixed - attachmentHelpers.ts now handles missing files silently

## Remove Debug Logs (when fixed)

Search and remove these console.log lines:
1. `Messages.tsx` → Remove useEffect with 🔍
2. `useMessageHandling.ts` → Remove 📤 and ✅ logs
3. `useRealtimeSubscription.ts` → Remove 🔔, 🔄, and 📨 logs

## Done!
- ✅ Admin messages now visible to customers
- ✅ Customer messages appear after sending
- ✅ Realtime updates working
- ✅ No storage errors

---

**Full details:** See `TICKET_MESSAGES_FIX_SUMMARY.md`
**Debug guide:** See `TICKET_MESSAGE_DEBUG_GUIDE.md`

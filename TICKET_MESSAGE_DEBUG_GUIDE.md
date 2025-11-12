# Ticket Message Debugging Guide

## Issue
Users are not receiving admin messages and their own sent messages are not appearing in the chat view.

## Debugging Added

I've added comprehensive console logging to track the message flow from sending to display:

### 1. **Message Sending** (`useMessageHandling.ts`)
When a customer sends a message, you'll see:
```
📤 Sending customer message: {ticketId, userId, messageLength, filesCount}
✅ Message inserted successfully: {responseId, isAdmin, message}
```

**What to check:**
- Verify `isAdmin: false` for customer messages
- Confirm message is being inserted to database

### 2. **Realtime Subscription** (`useRealtimeSubscription.ts`)
When any message arrives via realtime:
```
🔔 Realtime event received: {event, table, ticketId, isAdmin, message}
```

**What to check:**
- Is the realtime event firing when admin sends a message?
- Is the realtime event firing when customer sends a message?
- What is the `eventType` (INSERT, UPDATE, DELETE)?

### 3. **Ticket Refresh** (`useRealtimeSubscription.ts`)
When the ticket is refreshed from database:
```
🔄 Refreshing selected ticket: {ticketId}
📨 Fetched responses: {ticketId, count, responses[]}
```

**What to check:**
- How many responses are being fetched?
- Are both admin and customer messages in the array?
- Does each response have correct `isAdmin` value?

### 4. **Messages Display** (`Messages.tsx`)
When the Messages component renders:
```
🔍 Messages Component Debug: {ticketId, totalResponses, responses[]}
```

**What to check:**
- How many responses are being passed to the component?
- Are all messages present or are some missing?
- Does this match what was fetched in step 3?

## Testing Steps

1. **Open the customer tickets modal** (TicketsAccountModal)
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Select a ticket** - Watch for initial fetch logs
4. **Send a customer message** - Watch for:
   - 📤 Sending message
   - ✅ Message inserted
   - 🔔 Realtime event (if triggering)
   - 🔄 Refreshing ticket
   - 📨 Fetched responses
   - 🔍 Messages rendered

5. **Have admin send a reply** (in admin modal) - Watch for:
   - 🔔 Realtime event (should fire on customer side)
   - 🔄 Refreshing ticket
   - 📨 Fetched responses (should include admin message)
   - 🔍 Messages rendered (should show admin message)

## Common Issues to Look For

### Issue 1: Messages not showing after sending
**Symptom:** 📤 and ✅ appear, but 🔍 doesn't show the new message

**Possible causes:**
- Optimistic update not working
- State not updating after database insert
- Check `setSelectedTicket` in `useMessageHandling.ts`

### Issue 2: Realtime not triggering
**Symptom:** No 🔔 event when admin sends message

**Possible causes:**
- Realtime subscription not set up correctly
- RLS policies blocking realtime events
- `filter: ticket_id=in.(${ticketIds})` not matching
- Check subscription in `useRealtimeSubscription.ts`

### Issue 3: Messages fetched but not displayed
**Symptom:** 📨 shows messages, but 🔍 shows fewer or none

**Possible causes:**
- `processTicketResponses` filtering out messages
- State update race condition
- Check the data flow from fetch to render

### Issue 4: Admin messages not appearing
**Symptom:** Only customer messages (isAdmin: false) appear

**Possible causes:**
- RLS policy preventing customer from seeing admin responses
- Avatar filtering in Messages component
- Check database permissions

### Issue 5: Customer messages not appearing
**Symptom:** Only admin messages (isAdmin: true) appear

**Possible causes:**
- `is_admin` field not set correctly on insert
- Messages being filtered somewhere
- Check insert statement and rendering logic

## Database Permissions Check

If messages are being inserted but not fetched, check RLS policies:

```sql
-- Check if customer can read their own ticket responses
SELECT * FROM ticket_responses 
WHERE ticket_id = 'YOUR_TICKET_ID';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'ticket_responses';
```

## Next Steps Based on Console Output

1. **If no logs appear at all**
   - React component not mounting
   - Hooks not being called
   - Check modal is actually open

2. **If only 📤✅ appear but no 🔔**
   - Realtime subscription issue
   - Check Supabase realtime is enabled for the table

3. **If 🔔 appears but no 🔄📨**
   - `fetchTicketsRef` or `refreshSelectedTicket` not being called
   - Check the setTimeout delay or callback

4. **If 📨 shows messages but 🔍 doesn't**
   - State update not triggering re-render
   - Check React dependencies

5. **If 🔍 shows messages but they're not visible**
   - CSS/rendering issue
   - Check Messages.tsx JSX rendering logic

## Remove Debugging

Once issue is identified and fixed, remove console.log statements from:
- `Messages.tsx` (useEffect)
- `useMessageHandling.ts` (console.log calls)
- `useRealtimeSubscription.ts` (console.log calls)

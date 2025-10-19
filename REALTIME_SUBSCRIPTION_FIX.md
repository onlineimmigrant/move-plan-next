# Realtime Subscription & File Upload Fixes

## Date: October 19, 2025

## Issues Fixed

### 1. Realtime Channel Subscription Memory Leak
**Problem**: The realtime channel subscription was not being properly cleaned up when the TicketsAdminModal closed, causing:
- Multiple duplicate subscriptions
- Memory leaks
- Potential performance degradation
- Subscription conflicts

**Root Cause**: 
- `setupRealtimeSubscription()` returned a channel reference
- Component didn't store this reference
- Cleanup tried to unsubscribe by calling `supabase.channel('tickets-admin-channel').unsubscribe()` which created a NEW channel reference instead of unsubscribing from the actual channel

**Solution**:
1. Added `realtimeChannelRef` useRef to store the channel reference
2. Modified `setupRealtimeSubscription()` to:
   - Clean up any existing channel first
   - Store the new channel reference in the ref
   - Return the channel for proper tracking
3. Updated cleanup logic to unsubscribe from the stored channel reference
4. Enhanced subscription status logging for better debugging

**Files Modified**:
- `/src/components/modals/TicketsAdminModal/TicketsAdminModal.tsx`
  - Added: `const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);`
  - Modified: `setupRealtimeSubscription()` to store channel reference
  - Modified: `onCleanup` to properly unsubscribe from stored reference

- `/src/components/modals/TicketsAdminModal/utils/ticketApi.ts`
  - Enhanced subscription status callback with detailed logging:
    - `SUBSCRIBED` - Success message
    - `CHANNEL_ERROR` - Error logging
    - `TIMED_OUT` - Timeout logging
    - `CLOSED` - Closure logging

### 2. Image Display Issue After Upload
**Problem**: Uploaded images weren't displaying immediately in the chat widget after sending - they only appeared after page reload.

**Root Cause**: 
The `loadAttachmentUrls` function was **replacing** the entire attachment URLs state instead of **merging** new URLs with existing ones:
```tsx
// BEFORE (WRONG)
setAttachmentUrls(urls);

// AFTER (CORRECT)
setAttachmentUrls(prev => ({ ...prev, ...urls }));
```

**Solution**:
Modified `loadAttachmentUrls` in both admin and account modals to merge new URLs with existing ones using the spread operator.

**Files Modified**:
- `/src/components/modals/TicketsAdminModal/TicketsAdminModal.tsx` (line ~391)
- `/src/components/modals/TicketsAccountModal/TicketsAccountModal.tsx` (line ~156)

Both now use: `setAttachmentUrls(prev => ({ ...prev, ...urls }));`

## Technical Details

### Realtime Subscription Flow
```typescript
// 1. Component opens → setupRealtimeSubscription() called
const channel = TicketAPI.setupRealtimeSubscription({...});
realtimeChannelRef.current = channel;

// 2. Component closes → Cleanup triggered
if (realtimeChannelRef.current) {
  realtimeChannelRef.current.unsubscribe();
  realtimeChannelRef.current = null;
}

// 3. Component reopens → Old channel cleaned, new one created
if (realtimeChannelRef.current) {
  realtimeChannelRef.current.unsubscribe(); // Cleanup old
}
const newChannel = TicketAPI.setupRealtimeSubscription({...});
realtimeChannelRef.current = newChannel; // Store new
```

### Image URL Cache Management
```typescript
// WRONG: Replaces entire cache
const urls = { newId1: url1, newId2: url2 };
setAttachmentUrls(urls); // Loses all previous URLs!

// CORRECT: Merges with existing cache
const urls = { newId1: url1, newId2: url2 };
setAttachmentUrls(prev => ({ ...prev, ...urls })); // Keeps all URLs
```

## Testing Checklist

### Realtime Subscription
- [ ] Open TicketsAdminModal
- [ ] Check console for "✅ Successfully subscribed to realtime updates"
- [ ] Create/update a ticket from another tab/window
- [ ] Verify the change appears in the modal immediately
- [ ] Close modal
- [ ] Check console for "🔌 Unsubscribing from realtime (admin modal)"
- [ ] Reopen modal multiple times
- [ ] Verify no duplicate subscriptions in console

### Image Display
- [ ] Open TicketsAdminModal
- [ ] Select a ticket
- [ ] Upload an image file
- [ ] Send the message
- [ ] **Verify image displays immediately** (without page reload)
- [ ] Upload multiple images in one message
- [ ] Verify all images display
- [ ] Switch to another ticket and back
- [ ] Verify previously loaded images still display

## Monitoring

Look for these console logs to verify proper operation:

### Success Indicators:
- `✅ Successfully subscribed to realtime updates`
- `✅ Realtime: Ticket change`
- `✅ Realtime: Response change`
- `✅ Realtime: Note change`
- `🔌 Unsubscribing from realtime (admin modal)`

### Error Indicators (should not appear):
- `❌ Realtime channel error:`
- `⏱️ Realtime subscription timed out`
- `❌ Error setting up realtime subscription:`

## Benefits

1. **Memory Leak Fixed**: Proper channel cleanup prevents memory leaks
2. **No Duplicate Subscriptions**: Old channels are cleaned before creating new ones
3. **Better Debugging**: Enhanced logging for subscription status
4. **Immediate Image Display**: Users see uploaded images instantly
5. **Proper State Management**: URL cache accumulates instead of replacing
6. **Consistent Behavior**: Same fix applied to both admin and account modals

## Related Files

- `/src/components/modals/TicketsAdminModal/TicketsAdminModal.tsx`
- `/src/components/modals/TicketsAccountModal/TicketsAccountModal.tsx`
- `/src/components/modals/TicketsAdminModal/utils/ticketApi.ts`
- `/src/lib/fileUpload.ts`

## Previous Fixes (Context)

These fixes build upon previous work:
- Database schema corrections (table names, JOIN clauses)
- File upload system refactoring (uploadFileOnly function)
- Error logging improvements (Supabase error messages)
- API response structure updates (nested attachments)

# Video Call Connection Fix

## Issue
After admin approves customer from waiting room, the video call doesn't start and shows error:
```
[ManagedVideoCall] Failed to get token: Unknown error
```

## Root Cause
The API endpoint `/api/meetings/launch-video` was returning `twilio_token` but the frontend was expecting `token`.

## Fixes Applied

### 1. Fixed API Response Format
**File:** `/src/app/api/meetings/launch-video/route.ts`

Changed response to include both `token` and `twilio_token` for compatibility:
```typescript
return NextResponse.json({
  success: true,
  booking,
  token: twilioToken,        // ✅ Added - matches frontend expectation
  twilio_token: twilioToken, // Kept for backwards compatibility
  room_name: roomName,
  identity,
  expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
});
```

### 2. Added Better Logging
**Frontend:** `ManagedVideoCall.tsx`
```typescript
console.log('[ManagedVideoCall] API response:', {
  success: data.success,
  hasToken: !!data.token,
  hasRoomName: !!data.room_name,
  error: data.error
});
```

**Backend:** `launch-video/route.ts`
- Logs when generating token
- Logs token generation success
- Enhanced error logging with stack traces
- More descriptive error messages

### 3. Added Twilio Credentials Validation
```typescript
if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
  console.error('[launch-video] Missing Twilio credentials');
  throw new Error('Twilio credentials not configured');
}
```

## Expected Behavior Now

### Complete Flow:

1. **Customer** clicks join link → enters waiting room
   ```
   🔍 Should enter waiting room? { shouldEnterWaitingRoom: true }
   ✅✅✅ RENDERING WAITING ROOM COMPONENT ✅✅✅
   ```

2. **Admin** sees customer in waiting list → clicks "Approve"
   ```
   POST /api/meetings/waiting-room/approve
   Response: { success: true, booking: { status: 'in_progress' } }
   ```

3. **Customer** waiting room detects status change
   ```
   [WaitingRoom] Status changed from waiting to in_progress
   ```

4. **Frontend** requests Twilio token
   ```
   [ManagedVideoCall] Status changed to in_progress, fetching Twilio token...
   ```

5. **API** generates and returns token
   ```
   [launch-video] Generating token for: { identity: "...", roomName: "meeting-..." }
   [launch-video] Token generated successfully
   ```

6. **Frontend** receives token and starts video
   ```
   [ManagedVideoCall] API response: { success: true, hasToken: true, hasRoomName: true }
   ✅ Token received, starting video call
   ```

7. **Video call** launches for both participants

## Testing Instructions

### Test the fix:

1. **Restart dev server** (changes are in API route)
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

2. **Admin:** Send instant meeting invite to customer

3. **Customer:** Click join link in email

4. **Verify waiting room shows:**
   - Animated dots
   - "Waiting for host to admit you..."
   - Meeting details

5. **Admin:** See customer in "Waiting Participants" section

6. **Admin:** Click "Approve"

7. **Watch console logs:**
   - Browser console (customer side)
   - Terminal (API logs)

8. **Expected result:** Video call should launch for customer immediately after approval

## Troubleshooting

### If still getting "Failed to get token":

1. **Check Twilio credentials in `.env`:**
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Check terminal for error:**
   ```
   [launch-video] Missing Twilio credentials: { hasSid: false, ... }
   ```

3. **Verify Twilio credentials are valid:**
   - Log in to Twilio Console
   - Check Account SID matches
   - Check API Key exists and is active
   - Check API Secret is correct

### If Twilio credentials missing:

1. Go to [Twilio Console](https://console.twilio.com/)
2. Get Account SID from dashboard
3. Create API Key:
   - Go to Account → API Keys & Tokens
   - Create new API Key
   - Copy SID and Secret (save secret, can't retrieve later!)
4. Add to `.env` file
5. Restart server

### If video doesn't connect but token is received:

Check browser console for Twilio Video errors:
- Camera/microphone permissions denied
- Network connectivity issues
- Browser compatibility (needs WebRTC support)

## Console Logs Reference

### Successful Flow:
```
[ManagedVideoCall] Status changed to in_progress, fetching Twilio token...
[launch-video] Generating token for: { identity: "John Doe", roomName: "meeting-abc-123" }
[launch-video] Token generated successfully
[ManagedVideoCall] API response: { success: true, hasToken: true, hasRoomName: true }
✅ Token received, starting video call
```

### Failed - Missing Credentials:
```
[launch-video] Missing Twilio credentials: { hasSid: false, hasKey: true, hasSecret: true }
[ManagedVideoCall] ❌ Failed to get token: Twilio credentials not configured
```

### Failed - API Error:
```
[launch-video] Error launching video call: Error: ...
[launch-video] Error message: ...
[ManagedVideoCall] ❌ Failed to get token: Internal server error
```

## Status

✅ **Fixed:** API now returns `token` field
✅ **Added:** Better error logging
✅ **Added:** Twilio credentials validation
✅ **Ready:** Test the complete flow

After restarting the server, the waiting room → approval → video call flow should work end-to-end!

# Waiting Room Debug Guide - Console Log Analysis

## 🔍 What to Look For

When you click "Join" on a meeting scheduled in the future, you should see this **EXACT SEQUENCE** of console logs:

---

## Expected Console Log Sequence

### Step 1: Launch Attempt
```javascript
[useMeetingLauncher] Waiting room check: {
  isAdmin: false,
  isHost: false,
  now: "2025-10-23T14:00:00.000Z",
  startTime: "2025-10-23T14:10:00.000Z",
  shouldEnterWaitingRoom: true,
  currentStatus: "confirmed"
}
```

**What it means:** System determined customer should enter waiting room

---

### Step 2: API Call
```javascript
[useMeetingLauncher] Entering waiting room...
```

**What it means:** Making POST request to `/api/meetings/waiting-room/enter`

---

### Step 3: API Success
```javascript
[useMeetingLauncher] Waiting room entered successfully: {
  success: true,
  booking: { id: "...", status: "waiting", ... }
}
```

**What it means:** Database updated, booking status changed to 'waiting'

---

### Step 4: Context Updated
```javascript
[ManagedVideoCall] useEffect - Checking status: waiting
[ManagedVideoCall] ✅ Status is waiting - SETTING showWaitingRoom = true
```

**What it means:** ManagedVideoCall detected waiting status

---

### Step 5: Main Render
```javascript
[ManagedVideoCall] Main render: {
  status: "waiting",
  showWaitingRoom: true,
  hasToken: false,
  hasRoom: false
}
```

**What it means:** Component rendering with correct state

---

### Step 6: Render Branch
```javascript
[ManagedVideoCall] ✅✅✅ RENDERING WAITING ROOM COMPONENT ✅✅✅
```

**What it means:** Taking the waiting room render path

---

### Step 7: WaitingRoom Component
```javascript
[WaitingRoom] Component mounted/rendered {
  bookingId: "abc-123",
  status: "waiting",
  waiting_since: "2025-10-23T14:00:00.000Z"
}
```

**What it means:** WaitingRoom component successfully mounted

---

## 🚨 Problem Scenarios

### Scenario A: Never Enters Waiting Room

**Console shows:**
```javascript
[useMeetingLauncher] Waiting room check: {
  isAdmin: true,  // ← PROBLEM!
  ...
  shouldEnterWaitingRoom: false
}
```

**Problem:** You're logged in as admin  
**Solution:** Login as non-admin user

---

### Scenario B: isHost = true

**Console shows:**
```javascript
[useMeetingLauncher] Waiting room check: {
  isHost: true,  // ← PROBLEM!
  ...
  shouldEnterWaitingRoom: false
}
```

**Problem:** You're the host of this meeting  
**Solution:** Login as different user (not the host)

---

### Scenario C: Meeting Already Started

**Console shows:**
```javascript
[useMeetingLauncher] Waiting room check: {
  now: "2025-10-23T14:15:00.000Z",
  startTime: "2025-10-23T14:10:00.000Z",  // ← In the past!
  shouldEnterWaitingRoom: false
}
```

**Problem:** Meeting time has passed  
**Solution:** Create new meeting scheduled in the future

---

### Scenario D: API Call Fails

**Console shows:**
```javascript
[useMeetingLauncher] Entering waiting room...
[useMeetingLauncher] Failed to enter waiting room: ERROR TEXT
```

**Problem:** Database migration not applied or API error  
**Solution:** 
1. Check Network tab for API response
2. Run diagnostic SQL: `/scripts/check-waiting-room-migration.sql`
3. Apply migration if needed

---

### Scenario E: Status Not Detected

**Console shows:**
```javascript
[useMeetingLauncher] Waiting room entered successfully: {...}
[ManagedVideoCall] useEffect - Checking status: confirmed  // ← WRONG!
```

**Problem:** Booking status not actually updated in response  
**Solution:** Check API response body - should have `status: "waiting"`

---

### Scenario F: showWaitingRoom Never Set

**Console shows:**
```javascript
[ManagedVideoCall] useEffect - Checking status: waiting
[ManagedVideoCall] ✅ Status is waiting - SETTING showWaitingRoom = true
[ManagedVideoCall] Main render: {
  status: "waiting",
  showWaitingRoom: false,  // ← PROBLEM!
  ...
}
```

**Problem:** State update race condition  
**Solution:** This shouldn't happen - may need to add delay

---

### Scenario G: Component Not Rendering

**Console shows:**
```javascript
[ManagedVideoCall] ✅✅✅ RENDERING WAITING ROOM COMPONENT ✅✅✅
// But NO [WaitingRoom] log after this
```

**Problem:** WaitingRoom component failed to mount  
**Solution:** Check for React errors in console, check import path

---

### Scenario H: Renders But Not Visible

**Console shows ALL expected logs including:**
```javascript
[WaitingRoom] Component mounted/rendered {...}
```

**Problem:** CSS/z-index issue  
**Solution:** 
1. Open React DevTools
2. Find `WaitingRoom` component
3. Check if it's in the DOM
4. Inspect the parent div - should have `z-[99999]`
5. Check for any overlapping elements
6. Try adding `!important` to z-index

---

## 🧪 Quick Test Commands

### Test 1: Check if you see ANY logs
```javascript
// In console, run:
console.log('[TEST] Console is working');
```

### Test 2: Check meeting status in database
```sql
-- In Supabase SQL Editor:
SELECT id, status, waiting_since, scheduled_at
FROM bookings
WHERE id = 'your-booking-id';
```

### Test 3: Manually trigger waiting room
```javascript
// In console while on account page:
document.querySelector('[aria-label="Schedule Meeting"]')?.click();
```

---

## 📊 Decision Tree

```
Is booking in the future? 
├─ NO → Won't enter waiting room (expected)
└─ YES → Continue

Are you admin?
├─ YES → Won't enter waiting room (admins bypass)
└─ NO → Continue

Are you the host?
├─ YES → Won't enter waiting room (hosts bypass)
└─ NO → Continue

Do you see: "[useMeetingLauncher] Entering waiting room..."?
├─ NO → Check previous steps
└─ YES → Continue

Do you see: "Waiting room entered successfully"?
├─ NO → Check API error, check migration applied
└─ YES → Continue

Do you see: "SETTING showWaitingRoom = true"?
├─ NO → Check booking status in response
└─ YES → Continue

Do you see: "RENDERING WAITING ROOM COMPONENT"?
├─ NO → React state issue - hard refresh browser
└─ YES → Continue

Do you see: "[WaitingRoom] Component mounted"?
├─ NO → Component import issue
└─ YES → Continue

Can you SEE the waiting room on screen?
├─ NO → CSS/z-index issue - use React DevTools
└─ YES → ✅ SUCCESS!
```

---

## 🔧 Emergency Fixes

### Fix 1: Hard Refresh
```
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Fix 2: Clear All State
```javascript
// In console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 3: Check React DevTools
1. Open DevTools
2. Go to "Components" tab
3. Search for "ManagedVideoCall"
4. Check props: `videoCallOpen`, `activeMeeting`, `showWaitingRoom`

### Fix 4: Force Render Waiting Room
```javascript
// In console (for testing only):
document.body.innerHTML += `
<div style="position: fixed; inset: 0; z-index: 999999; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-center;">
  <div style="color: white; font-size: 24px;">TEST: If you see this, CSS is working</div>
</div>
`;
```

---

## 📝 Report Template

If waiting room still not working, provide this info:

```
**Browser:** Chrome/Firefox/Safari
**User Role:** admin/customer
**Booking Time:** [scheduled time]
**Current Time:** [now]
**Is Host:** yes/no

**Console Logs:**
[Paste ALL logs starting with [useMeetingLauncher] and [ManagedVideoCall]]

**Network Tab:**
- POST /api/meetings/waiting-room/enter: [status code]
- Response body: [paste response]

**React DevTools:**
- ManagedVideoCall props: [paste]
- videoCallOpen: 
- showWaitingRoom:
- activeMeeting.status:
```

---

## ✅ Success Indicators

You know it's working when you see:

1. ✅ Console log: "RENDERING WAITING ROOM COMPONENT"
2. ✅ Console log: "[WaitingRoom] Component mounted"
3. ✅ Full-screen dark overlay appears
4. ✅ Centered card with "Waiting for Host..." text
5. ✅ Animated pulsing video camera icon
6. ✅ Timer counting up
7. ✅ Meeting details displayed

**If you see ALL 7 items above: WORKING! 🎉**

---

## 🆘 Still Not Working?

1. Apply database migration (if not done)
2. Check console for ALL logs
3. Take screenshot of console
4. Check Network tab for API responses
5. Check React DevTools for component state
6. Report with template above

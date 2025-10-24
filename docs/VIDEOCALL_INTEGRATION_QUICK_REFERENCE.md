# VideoCall Integration - Quick Reference Card

## 🎯 At a Glance

**Status**: ✅ FULLY INTEGRATED  
**Phase**: 0 - Foundation Complete  
**Files Modified**: 2  
**Files Created**: 6 (+ 4 docs)  
**TypeScript Errors**: 0  
**Ready for**: Testing

---

## 🚀 Quick Test (2 Minutes)

1. **Start dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open Meetings Modal** (in your app)

3. **Check tabs appear**:
   - "My Meetings" tab
   - "Book New Meeting" tab

4. **Switch between tabs** - Should work smoothly

✅ If tabs work → Integration successful!

---

## 📋 Environment Variables

**Required in `.env.local`**:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your-secret-here
```

**Get from**: https://console.twilio.com → Video → API Keys

**After adding**: Restart dev server

---

## 🎨 User Journey

```
User Opens Modal
     ↓
"My Meetings" Tab (default)
     ↓
See upcoming bookings
     ↓
15 min before start → "Join Video Call" enabled
     ↓
Click "Join Video Call"
     ↓
Video modal opens (z-2000)
     ↓
Join Twilio room
     ↓
Status: "In Progress"
     ↓
Leave call
     ↓
Status: "Completed"
```

---

## 🔑 Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `MeetingProvider` | Global state | Wraps entire app |
| `ManagedVideoCall` | Video modal | Root level (z-2000) |
| `MyBookingsList` | Bookings list | "My Meetings" tab |
| `useMeetingLauncher` | Launch logic | Hook |

---

## 🌐 API Endpoints

| URL | Method | Purpose |
|-----|--------|---------|
| `/api/meetings/launch-video` | POST | Launch video call |
| `/api/meetings/refresh-token` | POST | Refresh token |

---

## ⏱️ Join Window Logic

| User Type | Can Join When |
|-----------|---------------|
| Customer | 15 min before start |
| Admin | Anytime |
| Past Meeting | Never |

---

## 🎨 Status Colors

| Status | Color | Badge |
|--------|-------|-------|
| Confirmed | Green | 🟢 Confirmed |
| In Progress | Blue | 🔵 In Progress |
| Completed | Gray | ⚪ Completed |

---

## 🐛 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Tabs don't appear | Check ClientProviders import |
| Video doesn't launch | Check Twilio env vars |
| Join button disabled | Check meeting time (15-min window) |
| No bookings shown | Create test booking |

---

## 📊 Test Database Query

```sql
-- Create test booking (starts in 5 min)
INSERT INTO bookings (
  id, organization_id, meeting_type_id,
  customer_email, customer_name,
  start_time, end_time, status
) VALUES (
  gen_random_uuid(),
  'your-org-id',
  'your-meeting-type-id',
  'test@example.com',
  'Test User',
  NOW() + INTERVAL '5 minutes',
  NOW() + INTERVAL '35 minutes',
  'confirmed'
);
```

---

## ✅ Success Criteria

- [x] MeetingProvider in ClientProviders
- [x] ManagedVideoCall at root level
- [x] MyBookingsList in modal
- [x] Tab navigation works
- [x] 0 TypeScript errors
- [ ] Video call launches (needs testing)
- [ ] Status updates work (needs testing)

---

## 📚 Full Docs

1. **Architecture**: `/docs/VIDEOCALL_INTEGRATION_PHASE0.md`
2. **Quick Start**: `/docs/VIDEOCALL_INTEGRATION_QUICKSTART.md`
3. **Test Guide**: `/docs/VIDEOCALL_INTEGRATION_TEST_GUIDE.md`
4. **Summary**: `/docs/VIDEOCALL_INTEGRATION_SUMMARY.md`
5. **This Card**: `/docs/VIDEOCALL_INTEGRATION_QUICK_REFERENCE.md`

---

## 🎉 You're Ready!

Integration is complete. Start testing with the Quick Test above.

**Need help?** Check the full Test Guide for detailed test cases.

**Found a bug?** Check Troubleshooting section or full docs.

**Everything works?** Move to Phase 1 (Email Notifications)!

---

**Last Updated**: October 22, 2025

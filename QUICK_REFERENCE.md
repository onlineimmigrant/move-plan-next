# 🚀 Quick Reference - Waiting Room & Instant Meetings

## ⚠️ FIRST: Apply Database Migration

```bash
# Open Supabase Dashboard → SQL Editor → New Query
# Copy/paste: /migrations/add_waiting_status_to_bookings.sql
# Click "Run"
```

---

## 🎯 What's New

### 1️⃣ Waiting Room
**Customer joins early → Waits for host → Host approves → Video call starts**

### 2️⃣ Instant Meetings
**Admin clicks button → Fills form → Email sent → Customer joins immediately**

### 3️⃣ Admin Controls
**See waiting participants → Approve/Deny with one click → Real-time updates**

---

## 📍 Where to Find New Features

### Admin Panel
```
Meetings → Admin View (MeetingsAdminModal)
  ├── WaitingRoomControls (top panel)
  │   └── Shows all waiting participants
  │   └── Admit/Deny buttons
  └── "+ Send Instant Invite" button (header)
      └── Opens InstantMeetingModal
```

### Customer Side
```
/meetings/join/{booking_id}
  ├── If early: WaitingRoom component
  │   └── "Waiting for host..." with timer
  └── If approved: Video call starts
```

---

## 🔗 API Endpoints

### Waiting Room APIs
```
POST /api/meetings/waiting-room/enter
GET  /api/meetings/waiting-room/enter?hostUserId={id}&organizationId={id}
POST /api/meetings/waiting-room/approve
POST /api/meetings/waiting-room/reject
```

### Instant Meeting API
```
POST /api/meetings/instant-invite
```

---

## 📊 Status Flow

```
Waiting Room Flow:
scheduled → waiting → in_progress → completed
                  ↓
               cancelled (if denied)

Instant Meeting Flow:
confirmed → in_progress → completed
```

---

## 🧪 Quick Test

### Test Waiting Room
1. Apply migration ✅
2. Create booking 5 min from now
3. Visit `/meetings/join/{booking_id}` as customer
4. Should see waiting room
5. Open admin panel
6. Should see customer in controls
7. Click "Admit"
8. Customer should join video call

### Test Instant Meeting
1. Open admin → Bookings
2. Click "+ Send Instant Invite"
3. Fill form with your email
4. Submit
5. Check inbox
6. Click "Join Video Meeting"
7. Should join immediately

---

## 🔧 Key Files

### Created
- `src/app/api/meetings/waiting-room/enter/route.ts`
- `src/app/api/meetings/waiting-room/approve/route.ts`
- `src/app/api/meetings/waiting-room/reject/route.ts`
- `src/app/api/meetings/instant-invite/route.ts`
- `src/components/modals/MeetingsModals/WaitingRoom/WaitingRoom.tsx`
- `src/components/modals/MeetingsModals/WaitingRoom/WaitingRoomControls.tsx`
- `src/components/modals/MeetingsModals/InstantMeetingModal.tsx`
- `migrations/add_waiting_status_to_bookings.sql`

### Modified
- `src/types/meetings.ts` (added 'waiting' status)
- `src/context/MeetingContext.tsx` (added waiting fields)
- `src/hooks/useMeetingLauncher.ts` (auto waiting room entry)
- `src/components/modals/MeetingsModals/ManagedVideoCall.tsx` (integrated WaitingRoom)
- `src/components/modals/MeetingsModals/MeetingsAdminModal/AdminBookingsList.tsx` (added controls & button)
- `src/app/api/send-email/route.ts` (added meeting_invitation template)

---

## 💡 Pro Tips

### For Admins
- Use instant meetings for urgent calls
- Filter by "Waiting" status to see all pending
- Notes field in instant invite is optional but helpful
- Waiting room controls update every 5 seconds

### For Developers
- Check browser console for detailed logs
- `useMeetingLauncher` handles waiting room routing automatically
- Email templates use placeholder replacement
- Status transitions are strictly enforced

---

## 🆘 Troubleshooting

### Waiting room not showing?
✅ Check migration applied (run verification query)
✅ Check booking time (must join early)
✅ Check browser console for errors

### Email not sending?
✅ Verify AWS SES credentials
✅ Check email address is verified in SES
✅ Check API response in network tab

### Controls not visible?
✅ Verify user role is 'admin'
✅ Clear browser cache
✅ Check component mounted in React DevTools

---

## 📚 Full Documentation

- **Complete Guide:** `/docs/WAITING_ROOM_AND_INSTANT_MEETINGS_COMPLETE.md`
- **Migration Guide:** `/APPLY_MIGRATION_FIRST.md`
- **Summary:** `/IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist

- [ ] Database migration applied
- [ ] Tested waiting room (customer side)
- [ ] Tested waiting room (admin side)
- [ ] Tested instant meeting creation
- [ ] Tested email delivery
- [ ] Tested approve/deny actions
- [ ] Verified status transitions
- [ ] Checked error handling

---

**🎉 All features implemented and ready to use!**

*Remember: Migration MUST be applied first!*

# VideoCall Integration - Quick Start Guide

## 🚀 Phase 0 Implementation Complete!

All core components are ready. Follow these steps to integrate into your app.

---

## Step 1: Add MeetingProvider to Root Layout

**File**: `/src/app/layout.tsx`

```tsx
import { MeetingProvider } from '@/context/MeetingContext';
import ManagedVideoCall from '@/components/modals/MeetingsModals/ManagedVideoCall';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MeetingProvider>
          {/* Video call modal - renders at root level (z-2000) */}
          <ManagedVideoCall />
          
          {/* Your existing providers */}
          <SettingsProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SettingsProvider>
        </MeetingProvider>
      </body>
    </html>
  );
}
```

---

## Step 2: Add Bookings List to MeetingsBookingModal

**File**: `/src/components/modals/MeetingsModals/MeetingsBookingModal/MeetingsBookingModal.tsx`

```tsx
import MyBookingsList from './MyBookingsList';

export default function MeetingsBookingModal({ isOpen, onClose }: Props) {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'my-meetings' | 'book-new'>('my-meetings');

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('my-meetings')}
          className={`px-4 py-2 ${activeTab === 'my-meetings' ? 'border-b-2 border-blue-600' : ''}`}
        >
          My Meetings
        </button>
        <button
          onClick={() => setActiveTab('book-new')}
          className={`px-4 py-2 ${activeTab === 'book-new' ? 'border-b-2 border-blue-600' : ''}`}
        >
          Book New Meeting
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-meetings' ? (
        <MyBookingsList organizationId={settings?.organization_id} />
      ) : (
        // Your existing booking flow
        <Calendar />
      )}
    </BaseModal>
  );
}
```

---

## Step 3: Set Environment Variables

**File**: `.env.local`

```bash
# Twilio Credentials (get from https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your-secret-here

# Already exists
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### How to Get Twilio Credentials:

1. Sign up at https://www.twilio.com/console
2. Create a new project
3. Go to "Develop" → "Video" → "Tools" → "API Keys"
4. Create new API Key
5. Copy SID, Key, and Secret to `.env.local`

---

## Step 4: Test the Integration

### Test Flow:
1. ✅ **Create a booking** (via MeetingsBookingModal)
2. ✅ **View in My Meetings tab** (should show in MyBookingsList)
3. ✅ **Wait until 15 minutes before start** (or manually adjust booking time)
4. ✅ **Click "Join Video Call"** button
5. ✅ **Video call should open** (VideoCallModal appears)
6. ✅ **Check booking status** in database (should be 'in_progress')
7. ✅ **Leave the call**
8. ✅ **Check booking status** again (should be 'completed')

### Test API Endpoints:

```bash
# 1. Launch video call
curl -X POST http://localhost:3000/api/meetings/launch-video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"booking_id": "your-booking-uuid"}'

# 2. Refresh token
curl -X POST http://localhost:3000/api/meetings/refresh-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"booking_id": "your-booking-uuid"}'
```

---

## Step 5: Optional Enhancements

### A. Add Deep Link Support

**File**: `/src/app/meetings/page.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMeetingLauncher } from '@/hooks/useMeetingLauncher';

export default function MeetingsPage() {
  const searchParams = useSearchParams();
  const { launchFromBooking } = useMeetingLauncher();

  useEffect(() => {
    const bookingId = searchParams.get('booking_id');
    if (bookingId) {
      // Auto-launch video call from URL
      launchFromBooking({ bookingId });
    }
  }, [searchParams]);

  return <div>Launching meeting...</div>;
}
```

Now users can join via link: `https://yoursite.com/meetings?booking_id=xxx`

---

### B. Add Email Notifications

**File**: `/src/app/api/meetings/bookings/route.ts`

```tsx
// After creating booking:
const bookingLink = `${process.env.NEXT_PUBLIC_SITE_URL}/meetings?booking_id=${booking.id}`;

await sendEmail({
  to: customerEmail,
  subject: 'Meeting Confirmed',
  template: 'booking-confirmation',
  data: {
    meetingTime: format(new Date(startTime), 'PPpp'),
    joinLink: bookingLink
  }
});
```

---

### C. Add Meeting Reminders

**File**: `/src/lib/scheduledTasks.ts` (create new file)

```tsx
// Run via cron job or Vercel Cron
export async function sendMeetingReminders() {
  const fifteenMinsFromNow = new Date(Date.now() + 15 * 60 * 1000);

  const { data: upcomingMeetings } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', fifteenMinsFromNow.toISOString());

  for (const meeting of upcomingMeetings || []) {
    await sendEmail({
      to: meeting.customer_email,
      subject: 'Your meeting starts in 15 minutes',
      template: 'meeting-reminder',
      data: {
        joinLink: `${process.env.NEXT_PUBLIC_SITE_URL}/meetings?booking_id=${meeting.id}`
      }
    });
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Join Video Call" button is disabled

**Causes**:
1. Meeting is more than 15 minutes away
2. Meeting has already ended
3. Booking status is not 'confirmed' or 'in_progress'

**Fix**:
```typescript
// Check meeting status
const { canJoinMeeting, getTimeUntilMeeting } = useMeetingLauncher();
const timeInfo = getTimeUntilMeeting(booking);

console.log('Can join:', canJoinMeeting(booking));
console.log('Time info:', timeInfo);
```

---

### Issue: Video call doesn't open

**Causes**:
1. Missing Twilio credentials
2. Invalid booking ID
3. User lacks permission

**Fix**:
```typescript
// Check API response
try {
  await launchFromBooking({ bookingId });
} catch (error) {
  console.error('Launch error:', error);
  // Check error.message for details
}
```

---

### Issue: Token refresh fails

**Causes**:
1. Booking no longer exists
2. User session expired
3. Network error

**Fix**:
- Auto-refresh runs at 50 minutes
- Manual refresh: `refreshToken(bookingId)`
- Check browser console for errors

---

## 📊 Database Queries

### Check booking status:
```sql
SELECT id, status, start_time, end_time, metadata
FROM bookings
WHERE id = 'your-booking-uuid';
```

### View all upcoming meetings:
```sql
SELECT b.*, mt.name as meeting_type_name
FROM bookings b
JOIN meeting_types mt ON b.meeting_type_id = mt.id
WHERE b.start_time > NOW()
AND b.status IN ('confirmed', 'in_progress')
ORDER BY b.start_time ASC;
```

### Find meetings in progress:
```sql
SELECT * FROM bookings
WHERE status = 'in_progress'
AND end_time > NOW();
```

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] MeetingProvider added to root layout
- [ ] ManagedVideoCall component renders
- [ ] Twilio credentials in `.env.local`
- [ ] MyBookingsList shows upcoming meetings
- [ ] "Join Video Call" button appears 15 min before
- [ ] Video call launches successfully
- [ ] Booking status updates to 'in_progress'
- [ ] Token auto-refreshes at 50 minutes
- [ ] Booking status updates to 'completed' on leave
- [ ] Deep links work (optional)
- [ ] Email notifications sent (optional)

---

## 🎉 You're Ready!

Phase 0 is complete and ready for testing. The foundation is solid for:
- ✅ Customer-initiated video calls
- ✅ Long meetings (> 1 hour)
- ✅ Secure access control
- ✅ Automatic status tracking

**Next**: Phase 1 - Payment Integration (Week 2)

Need help? Check `/docs/VIDEOCALL_INTEGRATION_PHASE0.md` for detailed documentation!

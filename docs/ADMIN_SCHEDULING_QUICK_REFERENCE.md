# Admin Scheduling Quick Reference

## What Changed

### Before
- ❌ Admin had hardcoded 9 AM - 5 PM hours
- ❌ 24-hour toggle in header (localStorage only)
- ❌ No visual indication of customer booking hours

### After
- ✅ Admin has **full 24-hour access** (00:00 - 23:59)
- ✅ 24-hour format controlled via **Settings Modal** (server-side)
- ✅ Customer booking hours are **visually highlighted**
- ✅ Shows **GMT offset** and **business hours context**

## Visual Guide

### Admin Modal Header
```
┌─────────────────────────────────────────────────────┐
│ 🗓️ Admin: Schedule Meeting          [⚙️ Settings]  │
│ Select any time slot (full admin control)           │
└─────────────────────────────────────────────────────┘
```

### Time Slot Selection (Admin View)

**Header Info:**
```
24-hour format • Your time: GMT+02:00
Customer hours: 09:00 - 17:00 (highlighted)
```

**Time Slots:**
```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 00:00    │ 00:30    │ 01:00    │ 01:30    │ 02:00    │ 02:30    │
│ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │
│ [White]  │ [White]  │ [White]  │ [White]  │ [White]  │ [White]  │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 09:00 ✨ │ 09:30 ✨ │ 10:00 ✨ │ 10:30 ✨ │ 11:00 ✨ │ 11:30 ✨ │
│ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │
│ Customer │ Customer │ Customer │ Customer │ Customer │ Customer │
│ Hours    │ Hours    │ Hours    │ Hours    │ Hours    │ Hours    │
│ [Cyan]   │ [Cyan]   │ [Cyan]   │ [Cyan]   │ [Cyan]   │ [Cyan]   │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 18:00    │ 18:30    │ 19:00    │ 19:30    │ 20:00    │ 20:30    │
│ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │
│ [White]  │ [White]  │ [White]  │ [White]  │ [White]  │ [White]  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

Legend:
- **White background**: Admin-only hours (customers can't book)
- **Cyan background + badge**: Customer booking hours (highlighted for reference)
- **Green gradient**: Selected slot

### 12-Hour Format Example
When 24-hour format is **OFF** in settings:
```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 12:00 AM │ 12:30 AM │ 1:00 AM  │ 1:30 AM  │ 9:00 AM✨│ 9:30 AM✨│
│ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │ Oct 20   │
│ [White]  │ [White]  │ [White]  │ [White]  │ Customer │ Customer │
│          │          │          │          │ Hours    │ Hours    │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

## How to Use

### Change Time Format Preference

1. **Open Settings**
   - Click **⚙️ Settings** button in Admin modal header

2. **Toggle Format**
   - Find "Use 24-Hour Time Format" toggle
   - Turn **ON** for 24-hour (13:00)
   - Turn **OFF** for 12-hour (1:00 PM)

3. **Save**
   - Click **Save** button
   - Modal closes and updates immediately

### Schedule Outside Business Hours

1. **Open Admin Modal**
   - Navigate to Admin: Schedule Meeting

2. **Select Date**
   - Click on any date in the calendar

3. **Choose Time Slot**
   - Scroll through **all** time slots (00:00 - 23:30)
   - White slots: Admin-only (customers can't book these)
   - Cyan highlighted slots: Customer booking hours
   - **You can select ANY slot**

4. **Complete Booking**
   - Fill in meeting details
   - Click **Schedule Meeting**

### Understanding the Display

**GMT Offset:**
- Shows your browser's timezone offset from UTC
- Example: GMT+02:00 (2 hours ahead of UTC)
- Automatically calculated
- Updates if you change timezone

**Customer Hours:**
- Shows organization's business hours
- Example: "Customer hours: 09:00 - 17:00"
- These slots are highlighted in cyan
- Customers can **only** book these hours
- Admins can book **any** hour

**Slot Badge:**
- "Customer Hours" badge on highlighted slots
- Hover for tooltip: "This time slot is within customer booking hours"
- Helps identify which slots customers can see

## Examples

### Example 1: Late Night Admin Booking
**Scenario:** Schedule a meeting at 11 PM (23:00)

```
Admin View:
├─ 22:00 [White - Selectable] ←
├─ 22:30 [White - Selectable]
├─ 23:00 [White - Selectable] ← You can select this!
├─ 23:30 [White - Selectable]

Customer View:
└─ (No slots visible - outside business hours)
```

**Result:** ✅ Meeting created. Only visible to admin users.

### Example 2: Business Hours Booking
**Scenario:** Schedule a meeting at 2 PM (14:00)

```
Admin View:
├─ 13:30 [Cyan + Badge - Selectable] ✨
├─ 14:00 [Cyan + Badge - Selectable] ← You select this ✨
├─ 14:30 [Cyan + Badge - Selectable] ✨

Customer View:
├─ 13:30 [Available]
├─ 14:00 [Booked - Shows your meeting] ✓
├─ 14:30 [Available]
```

**Result:** ✅ Meeting visible to both admins and customers.

### Example 3: Early Morning Booking
**Scenario:** Schedule a meeting at 7 AM (07:00)

```
Business Hours: 09:00 - 17:00

Admin View:
├─ 06:30 [White - Selectable]
├─ 07:00 [White - Selectable] ← You can select this!
├─ 07:30 [White - Selectable]
├─ 08:30 [White - Selectable]
├─ 09:00 [Cyan + Badge - Selectable] ✨ ← Customer hours start

Customer View:
├─ (Nothing before 09:00)
├─ 09:00 [Available] ← First slot customers see
```

**Result:** ✅ Admin booking at 7 AM works. Customers won't see it in their booking form.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Settings | Click ⚙️ button |
| Close Modal | `Esc` key |
| Select Slot | Click on slot |
| Scroll Slots | Mouse wheel / Trackpad |

## Tips

### Best Practices
1. **Use business hours highlighting** as a guide for customer-facing slots
2. **Book outside hours** for internal meetings or special cases
3. **Check GMT offset** when scheduling with international clients
4. **Set 24-hour format** in Settings for consistency

### Common Use Cases

**Internal Team Meetings:**
- Schedule outside business hours
- Example: 8 AM standup (before customer hours)
- Only visible to team members

**Emergency Appointments:**
- Use admin override to book outside hours
- Example: Late-night support call at 10 PM
- Customer receives special booking

**VIP Client Slots:**
- Book during highlighted customer hours
- Blocks slot from regular customer booking
- Ensures availability for important clients

### Troubleshooting

**Q: I don't see all 24 hours of slots**
- A: Check that you're in Admin modal (not customer booking)
- A: Verify migration 008 has been applied

**Q: Format won't change**
- A: Make sure you clicked "Save" in Settings modal
- A: Check that API is reachable
- A: Refresh the page

**Q: GMT offset seems wrong**
- A: Check your computer's timezone settings
- A: Try refreshing the page
- A: Verify browser has correct timezone

**Q: Customer Hours badge not showing**
- A: Verify business hours are configured in Settings
- A: Check that slots fall within configured hours
- A: Ensure API returns is_business_hours flag

## Summary

### What Admins Can Do:
- ✅ Schedule **any time** (00:00 - 23:59)
- ✅ See which hours are customer-facing (highlighted)
- ✅ Choose time display format (24h/12h)
- ✅ View timezone context (GMT offset)
- ✅ Override customer booking restrictions

### What's Highlighted:
- 🌟 Cyan background = Customer booking hours
- 📌 "Customer Hours" badge = Visible to customers
- ⚪ White background = Admin-only times
- 🟢 Green gradient = Selected slot

### Where to Configure:
- ⚙️ Settings Modal → "Use 24-Hour Time Format"
- ⚙️ Settings Modal → "Business Hours" (start/end times)
- ⚙️ Settings Modal → "Available Days" (weekday selection)

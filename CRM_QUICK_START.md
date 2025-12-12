# CRM Quick Start Guide

## 🚀 5-Minute Setup

### 1. Import and Use

```tsx
import { ProfileDetailView } from '@/components/crm';

function YourComponent() {
  const [showCRM, setShowCRM] = useState(false);
  const [profile, setProfile] = useState(null);

  return (
    <>
      <button onClick={() => setShowCRM(true)}>Open CRM</button>
      
      {showCRM && (
        <ProfileDetailView 
          profile={profile}
          onClose={() => setShowCRM(false)}
        />
      )}
    </>
  );
}
```

---

## 📊 Component Overview

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ProfileDetailView** | Main container | 4 tabs, customer header, gradient UI |
| **AppointmentsSection** | Manage bookings | Stats, list, book new, case linking |
| **SupportSection** | Manage tickets | Stats, create tickets, priority levels |
| **CasesSection** | Case management | Stats, expandable cards, billing info |
| **ActivityTimeline** | Unified history | Chronological feed, filters, smart timestamps |

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/crm/profiles/[id]/appointments` | GET | Fetch bookings |
| `/api/crm/profiles/[id]/tickets` | GET | Fetch tickets |
| `/api/crm/profiles/[id]/tickets` | POST | Create ticket |
| `/api/crm/profiles/[id]/cases` | GET | Fetch cases with counts |

---

## 📝 Common Tasks

### Book Appointment with Case

```tsx
<MeetingsBookingModal
  isOpen={true}
  onClose={() => {}}
  prefilledData={{
    customerId: 'uuid',
    caseId: 'uuid'  // Links to case
  }}
/>
```

### Create Support Ticket

```tsx
const response = await fetch(`/api/crm/profiles/${profileId}/tickets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Need help',
    description: 'Description here',
    priority: 'high',
    customer_id: profileId,
  })
});
```

### Fetch All Customer Data

```tsx
const [appointments, tickets, cases] = await Promise.all([
  fetch(`/api/crm/profiles/${id}/appointments`).then(r => r.json()),
  fetch(`/api/crm/profiles/${id}/tickets`).then(r => r.json()),
  fetch(`/api/crm/profiles/${id}/cases`).then(r => r.json()),
]);
```

---

## 🎨 Customization

### Change Default Tab

```tsx
// In ProfileDetailView.tsx, line 16
const [activeTab, setActiveTab] = useState<TabType>('activity'); // Changed from 'appointments'
```

### Modify Stats Colors

```tsx
// In any Section component, update statsCardStyle gradient
statsCardStyle('linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR_2 100%)')
```

### Add Custom Activity Type

```tsx
// In ActivityTimeline.tsx
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'your_custom_type': return '🎉';
    // ... existing cases
  }
};
```

---

## ⚡ Performance Tips

1. **Memoization** - All components use `useMemo` and `useCallback`
2. **Parallel Fetching** - API calls use `Promise.all()`
3. **Smart Loading** - Each section loads independently
4. **Virtual Scrolling** - Add if needed for 1000+ items

---

## 🐛 Troubleshooting

### Issue: Data not loading

**Check:**
- Organization ID is set in settings context
- RLS policies allow access
- Profile ID is valid UUID

**Solution:**
```tsx
console.log('Org ID:', settings?.organization_id);
console.log('Profile ID:', profile?.id);
```

### Issue: Case linking not working

**Check:**
- `case_id` column exists in bookings table
- API route includes case_id in body
- MeetingsBookingModal receives prefilledData

**Solution:**
```sql
-- Verify column exists
SELECT case_id FROM bookings LIMIT 1;
```

### Issue: Activity timeline empty

**Check:**
- All 3 API endpoints return data
- Timestamps are valid ISO strings
- Activities array is populated

**Solution:**
```tsx
// Add debug logging in ActivityTimeline
console.log('Activities loaded:', activities.length);
```

---

## 📦 File Locations

```
src/components/crm/
├── ProfileDetailView.tsx          [Main component]
├── ActivityTimeline.tsx           [Timeline]
├── index.ts                       [Exports]
└── sections/
    ├── AppointmentsSection.tsx
    ├── SupportSection.tsx
    └── CasesSection.tsx

src/app/api/crm/profiles/[profileId]/
├── appointments/route.ts
├── tickets/route.ts
└── cases/route.ts
```

---

## 🎯 Integration Checklist

- [ ] Database migrations applied (cases table, case_id columns)
- [ ] RLS policies configured for cases table
- [ ] Import ProfileDetailView in your code
- [ ] Pass valid profile object with id
- [ ] Test all 4 tabs render correctly
- [ ] Test booking modal with case linking
- [ ] Test ticket creation
- [ ] Verify activity timeline shows data

---

## 📚 Full Documentation

See `CRM_INTEGRATION_COMPLETE.md` for comprehensive documentation including:
- Detailed architecture diagrams
- Complete API specifications
- Database schema details
- Testing procedures
- Advanced examples

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Verify database schema matches documentation
3. Test API endpoints directly with curl/Postman
4. Review RLS policies in Supabase dashboard
5. Check organization_id is correctly set

---

**You're all set!** 🎉 Start using your CRM system by importing ProfileDetailView.

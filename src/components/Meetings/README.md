# Meetings Module

A comprehensive Calendly-like scheduling system with Twilio video integration for the Help Center and Ticket system.

## Features

- 📅 Interactive calendar with month/week/day views
- 🎥 Twilio-powered video calling
- 📝 Booking system with form validation
- 🔔 Availability management
- 🔒 Secure room-based video calls
- 📱 Responsive design with Tailwind CSS

## Components

### Core Components
- `MeetingsBookingModal` - Main booking modal with calendar and form
- `MeetingsAccountToggleButton` - Floating action button to access meetings
- `Calendar` - Interactive calendar component
- `BookingForm` - Booking form with validation
- `VideoCall` - Twilio video calling interface

### API Endpoints
- `/api/meetings/bookings` - CRUD operations for bookings
- `/api/meetings/availability` - Check available time slots
- `/api/meetings/meeting-types` - Manage meeting types
- `/api/meetings/rooms` - Twilio room management

## Usage

### Basic Setup

1. **Database Migration**: Run the migration file `migrations/create_meetings_system.sql`
2. **Environment Variables**: Add Twilio credentials to your `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_API_KEY=your_api_key
   TWILIO_API_SECRET=your_api_key_secret
   ```
3. **Import Components**:
   ```typescript
   import { MeetingsBookingModal, MeetingsAccountToggleButton } from '@/components/modals/MeetingsModals';
   ```

### Integration with Existing Systems

#### Add to Ticket Responses
```typescript
import { MeetingsAccountToggleButton } from '@/components/modals/MeetingsModals';

// In your ticket response component
<MeetingsAccountToggleButton />
```

#### Add to Help Center Articles
```typescript
import { MeetingsBookingModal } from '@/components/modals/MeetingsModals';

const [showMeetings, setShowMeetings] = useState(false);

// In your help center article
<button onClick={() => setShowMeetings(true)}>
  Schedule a Meeting
</button>

{showMeetings && (
  <MeetingsBookingModal
    isOpen={showMeetings}
    onClose={() => setShowMeetings(false)}
  />
)}
```

## Database Schema

The module adds 5 new tables:
- `meeting_types` - Available meeting types (30min, 60min, etc.)
- `availability_schedules` - User availability schedules
- `bookings` - Meeting bookings
- `meeting_participants` - Participants in meetings
- `meeting_rooms` - Twilio room information

## Types

All TypeScript types are defined in `/src/types/meetings.ts`:
- `Booking`
- `MeetingType`
- `AvailabilitySchedule`
- `CalendarEvent`
- `TimeSlot`
- `VideoRoom`

## Security

- Row Level Security (RLS) policies ensure users can only access their organization's data
- Twilio rooms are secured with JWT tokens
- All API endpoints validate user permissions

## Development

### Testing the Video Call Feature
1. Create a booking through the UI
2. Join the meeting at the scheduled time
3. Test audio/video controls and screen sharing

### Adding New Meeting Types
1. Insert into `meeting_types` table
2. Update the UI components if needed

### Customizing Availability
1. Modify `availability_schedules` table structure
2. Update the availability API endpoint
3. Adjust the calendar component logic

## Troubleshooting

### Common Issues
- **Twilio connection fails**: Check environment variables and Twilio console
- **Calendar not loading**: Verify database connection and RLS policies
- **Video call not starting**: Ensure booking exists and room was created

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging in API routes.
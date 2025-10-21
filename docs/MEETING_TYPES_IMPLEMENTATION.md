# Meeting Types Management Implementation

## Overview
Added comprehensive meeting types management functionality to the GlobalSettingsModal, allowing administrators to create, edit, and manage different types of meetings that customers can book.

## Implementation Date
January 2025

## Files Created

### API Routes
1. **`/src/app/api/meetings/types/route.ts`**
   - GET endpoint: Retrieves all meeting types for an organization
   - POST endpoint: Creates a new meeting type
   - Requires `organization_id` query parameter
   - Returns meeting types with all fields including customer visibility settings

2. **`/src/app/api/meetings/types/[id]/route.ts`**
   - PUT endpoint: Updates an existing meeting type
   - DELETE endpoint: Soft deletes a meeting type (sets `is_active` to false)
   - Both endpoints verify organization ownership for security
   - Requires `organization_id` in request body (PUT) or query params (DELETE)

### UI Components
3. **`/src/components/SiteManagement/sections/MeetingTypesSection.tsx`**
   - Main section component displaying list of meeting types
   - Features:
     - Displays all meeting types in card format
     - Shows duration, buffer time, color indicator, and status badges
     - "Add Type" button to create new meeting types
     - Edit button for each meeting type
     - Activate/Deactivate toggle for each type
     - Empty state with call-to-action
     - Loading and error states
     - Real-time refresh via custom events

4. **`/src/components/SiteManagement/modals/AddEditMeetingTypeModal.tsx`**
   - Modal for creating and editing meeting types
   - Features:
     - Name and description fields
     - Duration selection with quick presets (15, 30, 45, 60, 90, 120 minutes)
     - Buffer time configuration
     - Color picker with common presets
     - Customer choice toggle (determines if customers can select this type)
     - Active/inactive toggle
     - Full validation with error display
     - Works in both "add" and "edit" modes

## Files Modified

### Settings Integration
5. **`/src/components/modals/GlobalSettingsModal/GlobalSettingsModal.tsx`**
   - Added `meeting-types` section to the sections array
   - Configuration:
     ```typescript
     { 
       id: 'meeting-types', 
       label: 'Meeting Types', 
       title: 'Meeting Types', 
       subtitle: 'Manage meeting types for booking system', 
       parent: 'meetings' 
     }
     ```

6. **`/src/components/SiteManagement/SettingsFormFields.tsx`**
   - Added special handling for `meeting-types` section
   - Uses lazy loading for performance
   - Manages modal state for add/edit operations
   - Triggers refresh events after save operations
   - Added meeting-types to section mapping

## Database Schema

### meeting_types Table
```sql
CREATE TABLE meeting_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_customer_choice BOOLEAN NOT NULL DEFAULT true
);
```

## API Endpoints

### GET /api/meetings/types
**Query Parameters:**
- `organization_id` (required): Organization UUID
- `include_inactive` (optional): Include inactive types

**Response:**
```json
{
  "meeting_types": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "name": "Consultation",
      "description": "30-minute consultation call",
      "duration_minutes": 30,
      "buffer_minutes": 5,
      "is_active": true,
      "color": "#14b8a6",
      "icon": "clock",
      "is_customer_choice": true,
      "created_at": "2025-01-...",
      "updated_at": "2025-01-..."
    }
  ]
}
```

### POST /api/meetings/types
**Query Parameters:**
- `organization_id` (required): Organization UUID

**Request Body:**
```json
{
  "name": "Demo Call",
  "description": "Product demonstration",
  "duration_minutes": 45,
  "buffer_minutes": 10,
  "color": "#3b82f6",
  "icon": "video",
  "is_customer_choice": true
}
```

**Response:** `201 Created`
```json
{
  "meeting_type": { /* created meeting type */ }
}
```

### PUT /api/meetings/types/[id]
**Request Body:**
```json
{
  "organization_id": "uuid",
  "name": "Updated Name",
  "duration_minutes": 60,
  "is_active": false,
  // ... other fields (all optional except organization_id)
}
```

**Response:** `200 OK`
```json
{
  "meeting_type": { /* updated meeting type */ }
}
```

### DELETE /api/meetings/types/[id]
**Query Parameters:**
- `organization_id` (required): Organization UUID

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Note:** This performs a soft delete (sets `is_active` to false)

## Features

### Meeting Type Properties
1. **Name**: Display name for the meeting type
2. **Description**: Optional detailed description
3. **Duration**: Meeting length in minutes
4. **Buffer Time**: Time before/after to prevent back-to-back bookings
5. **Color**: Visual identification color (hex code)
6. **Icon**: Icon identifier for visual representation
7. **Customer Choice**: Whether customers can select this type when booking
8. **Active Status**: Enable/disable without deleting

### User Interface
- **List View**: Card-based layout showing all meeting types
- **Status Badges**: Visual indicators for inactive and admin-only types
- **Quick Actions**: Edit and activate/deactivate buttons
- **Empty State**: Friendly prompt when no meeting types exist
- **Loading States**: Spinner during data fetching
- **Error Handling**: Clear error messages with retry option

### Security
- Organization ID validation on all endpoints
- Row-level security via organization_id checks
- Service role key for server-side operations
- Soft delete to preserve data integrity

## Usage Flow

### Adding a Meeting Type
1. Admin opens Settings → Meeting Types
2. Clicks "+ Add Type" button
3. Fills in meeting type details:
   - Name (required)
   - Description (optional)
   - Duration (required, with quick presets)
   - Buffer time (optional)
   - Color (with presets or custom)
   - Customer choice toggle
   - Active status toggle
4. Clicks "Create Meeting Type"
5. Meeting type appears in the list immediately

### Editing a Meeting Type
1. Admin clicks edit icon on a meeting type card
2. Modal opens pre-filled with current values
3. Admin makes changes
4. Clicks "Save Changes"
5. List updates to reflect changes

### Deactivating a Meeting Type
1. Admin clicks "Deactivate" button
2. Meeting type is soft-deleted (is_active = false)
3. Card shows "Inactive" badge
4. Can be reactivated by clicking "Activate"

## Integration Points

### Current Integration
- GlobalSettingsModal section navigation
- Organization-based data isolation
- Real-time updates via custom events

### Future Integration
- **BookingForm Component**: Use meeting types from database instead of hardcoded values
  - Filter by `is_customer_choice = true` for customer view
  - Show all types for admin view
  - Display duration and description in booking UI
  
- **Calendar Component**: 
  - Color-code meetings by type
  - Show meeting type icons in calendar events
  - Filter calendar by meeting type

- **Availability Management**:
  - Different availability rules per meeting type
  - Type-specific booking limits

## Testing Checklist

- [ ] Create a new meeting type
- [ ] Edit an existing meeting type
- [ ] Toggle customer choice setting
- [ ] Activate/deactivate a meeting type
- [ ] Verify organization isolation (can't see other org's types)
- [ ] Test empty state UI
- [ ] Test loading states
- [ ] Test error handling and retry
- [ ] Verify color picker functionality
- [ ] Test duration quick presets
- [ ] Verify buffer time calculation
- [ ] Test modal validation (required fields)

## Technical Notes

### Performance
- Lazy loading of components for faster initial load
- Suspense boundaries for graceful loading states
- Minimal re-renders with proper state management

### Code Organization
- Follows existing patterns in SiteManagement components
- Reuses BaseModal for consistency
- Clear separation of concerns (API, UI, state management)

### Future Improvements
1. Icon selector UI (currently accepts string, could add visual picker)
2. Meeting type categories/grouping
3. Default meeting type per organization
4. Meeting type analytics (most booked, etc.)
5. Duplicate meeting type functionality
6. Bulk operations (activate/deactivate multiple)
7. Meeting type templates

## Related Documentation
- See `database/migrations/` for meeting_types table schema
- See calendar documentation for integration details
- See booking flow documentation for customer experience

## Dependencies
- Supabase: Database and API
- Heroicons: UI icons
- BaseModal: Shared modal component
- Tailwind CSS: Styling

## Notes
- Meeting types use soft delete to preserve historical data
- Organization ID is verified on all operations for security
- Customer choice flag allows admin-only meeting types
- Buffer time is optional but recommended for scheduling flexibility

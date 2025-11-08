# BookingCard Accordion Design Proposal

## Overview
Extract shared `BookingCard` component with accordion functionality to replace duplicated code in `AdminBookingsList` and `MyBookingsList`.

---

## Current Issues
- **Code Duplication:** ~150+ lines duplicated between Admin and Customer views
- **Vertical Space:** Cards take 250-300px each
- **Mobile UX:** Only 1-2 cards visible at once
- **Information Hierarchy:** Important details buried in card body

---

## Proposed Solution

### 1. Shared Component Location
```
src/components/modals/MeetingsModals/shared/components/
├── BookingCard/
│   ├── BookingCard.tsx           (main accordion component)
│   ├── BookingCardHeader.tsx     (collapsed state - compact)
│   ├── BookingCardDetails.tsx    (expanded state - full details)
│   ├── BookingCardActions.tsx    (action buttons)
│   ├── types.ts                  (shared types)
│   └── index.ts
├── BookingCardSkeleton.tsx       (already exists ✅)
└── index.ts
```

### 2. Auto-Expand Logic

**Priority-Based Expansion:**
```typescript
enum ExpansionPriority {
  LIVE = 3,           // Currently in progress → ALWAYS expanded
  URGENT = 2,         // Starting ≤15 min → AUTO expanded
  TODAY = 1,          // Starting today → CLOSED but highlighted
  FUTURE = 0,         // Future meetings → CLOSED
  PAST = -1           // Completed/Cancelled → CLOSED
}

const getExpansionPriority = (booking: Booking): ExpansionPriority => {
  const timeInfo = getTimeUntilMeeting(booking);
  const diffMs = new Date(booking.scheduled_at).getTime() - Date.now();
  const diffMins = Math.floor(diffMs / 60000);
  
  // Inactive meetings always collapsed
  if (['cancelled', 'completed'].includes(booking.status)) {
    return ExpansionPriority.PAST;
  }
  
  // Live meetings always expanded
  if (timeInfo.isInProgress) {
    return ExpansionPriority.LIVE;
  }
  
  // Starting soon - auto-expand
  if (diffMins > 0 && diffMins <= 15) {
    return ExpansionPriority.URGENT;
  }
  
  // Today but not urgent
  const isToday = new Date(booking.scheduled_at).toDateString() === new Date().toDateString();
  if (isToday) {
    return ExpansionPriority.TODAY;
  }
  
  return ExpansionPriority.FUTURE;
};

const defaultExpanded = getExpansionPriority(booking) >= ExpansionPriority.URGENT;
```

### 3. Compact Header Design (Closed State)

**Goal:** Show critical info in ~60-80px height

```tsx
<BookingCardHeader>
  {/* Row 1: Title + Status + Toggle */}
  <div className="flex items-start justify-between">
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-base truncate">
        {booking.title}
      </h4>
    </div>
    
    <div className="flex items-center gap-2">
      {/* Live Indicator (pulsing dot) */}
      {isLive && <LivePulsingDot />}
      
      {/* Status Badge */}
      <StatusBadge status={booking.status} isLive={isLive} />
      
      {/* Expand/Collapse Icon */}
      <ChevronDownIcon className={`w-5 h-5 transition-transform ${
        isExpanded ? 'rotate-180' : ''
      }`} />
    </div>
  </div>
  
  {/* Row 2: Critical Info (Date, Time, Countdown) */}
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <CalendarIcon className="w-4 h-4" />
    <span className="font-medium">{format(scheduledAt, 'EEE, MMM d')}</span>
    <span>•</span>
    <ClockIcon className="w-4 h-4" />
    <span>{format(scheduledAt, 'h:mm a')}</span>
    <span>•</span>
    <span className="font-semibold text-primary">
      {getRelativeTime(scheduledAt)}
    </span>
    
    {/* Urgent Countdown Badge */}
    {showCountdown && (
      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold animate-pulse">
        ⏰ {diffMins} min
      </span>
    )}
  </div>
  
  {/* Row 3: Customer Name (Admin) or Host (Customer) */}
  <div className="flex items-center gap-2 text-sm text-gray-500">
    <UserIcon className="w-4 h-4" />
    <span className="truncate">
      {isAdminView ? booking.customer_name : booking.host?.full_name}
    </span>
  </div>
</BookingCardHeader>
```

**Collapsed Height:** ~72px (3 rows × 24px)

### 4. Expanded Details (Full State)

```tsx
<BookingCardDetails>
  {/* Email */}
  <DetailRow icon={EnvelopeIcon} label="Email">
    {isAdminView ? booking.customer_email : booking.host?.email}
  </DetailRow>
  
  {/* Duration */}
  <DetailRow icon={ClockIcon} label="Duration">
    {booking.duration_minutes} minutes
  </DetailRow>
  
  {/* Meeting Type */}
  {booking.meeting_type && (
    <DetailRow icon={VideoCameraIcon} label="Type">
      <MeetingTypeBadge type={booking.meeting_type} />
    </DetailRow>
  )}
  
  {/* Notes */}
  {booking.notes && (
    <DetailRow icon={ChatBubbleIcon} label="Notes">
      <p className="text-sm italic text-gray-600 line-clamp-3">
        "{booking.notes}"
      </p>
    </DetailRow>
  )}
  
  {/* Admin-Only: Waiting Room Controls */}
  {isAdminView && (
    <WaitingRoomControls bookingId={booking.id} />
  )}
</BookingCardDetails>
```

### 5. Action Buttons (Footer)

```tsx
<BookingCardActions>
  <div className="flex items-center justify-between pt-3 border-t">
    {/* Left: Cancel/Delete */}
    {!isInactive && (
      <CancelButton onCancel={() => handleCancel(booking.id)} />
    )}
    
    {/* Right: Primary Action */}
    <div className="flex gap-2">
      {canJoin && !isInactive ? (
        <JoinButton 
          onClick={() => handleJoin(booking)}
          isJoining={joiningBookingId === booking.id}
          isLive={isLive}
        />
      ) : isCompleted ? (
        <span className="text-xs text-gray-400">Meeting ended</span>
      ) : isCancelled ? (
        <span className="text-xs text-gray-400">Cancelled</span>
      ) : null}
    </div>
  </div>
</BookingCardActions>
```

---

## 6. Props Interface

```typescript
interface BookingCardProps {
  booking: Booking;
  variant: 'admin' | 'customer';
  
  // Event handlers
  onJoin: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
  
  // State
  isJoining?: boolean;
  currentUserId?: string;
  userRole?: string;
  
  // Optional overrides
  defaultExpanded?: boolean;
  showWaitingRoomControls?: boolean;
}
```

---

## 7. Visual States

### Border & Background Colors (Urgency-Based)

```typescript
const getCardStyles = (booking: Booking, timeInfo: any) => {
  const isInactive = ['cancelled', 'completed'].includes(booking.status);
  
  if (isInactive) {
    return {
      borderColor: '#e5e7eb',      // gray-200
      backgroundColor: '#f9fafb',   // gray-50
      borderWidth: '1px',
      opacity: 0.7
    };
  }
  
  const diffMs = new Date(booking.scheduled_at).getTime() - Date.now();
  const diffMins = Math.floor(diffMs / 60000);
  
  // LIVE (red theme)
  if (timeInfo.isInProgress) {
    return {
      borderColor: '#dc2626',       // red-600
      backgroundColor: '#fee2e2',   // red-50
      borderWidth: '2px'
    };
  }
  
  // URGENT (green theme) - ≤15 min
  if (diffMins > 0 && diffMins <= 15) {
    return {
      borderColor: '#16a34a',       // green-600
      backgroundColor: '#dcfce7',   // green-50
      borderWidth: '2px'
    };
  }
  
  // TODAY (yellow theme)
  const isToday = new Date(booking.scheduled_at).toDateString() === new Date().toDateString();
  if (isToday) {
    return {
      borderColor: '#eab308',       // yellow-500
      backgroundColor: '#fef9c3',   // yellow-50
      borderWidth: '2px'
    };
  }
  
  // FUTURE (neutral)
  return {
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: '1px'
  };
};
```

---

## 8. Benefits Summary

### Code Quality
- ✅ **DRY Principle:** Eliminate ~300+ lines of duplication
- ✅ **Single Source of Truth:** One component to maintain
- ✅ **Consistent UX:** Same behavior across Admin/Customer views
- ✅ **Testability:** Test once, works everywhere

### User Experience
- ✅ **Vertical Space:** 60-80px (collapsed) vs 250-300px (current)
- ✅ **Mobile-Friendly:** See 5-6 cards vs 1-2 cards
- ✅ **Information Hierarchy:** Most important info always visible
- ✅ **Smart Defaults:** Auto-expand only urgent meetings
- ✅ **Visual Priority:** Color-coded urgency (red=live, green=soon, yellow=today)

### Performance
- ✅ **Less DOM:** Collapsed cards render less HTML
- ✅ **Lazy Details:** Expanded content only renders when needed
- ✅ **Faster Scrolling:** Smaller cards = smoother scrolling

---

## 9. Implementation Phases

### Phase 1: Extract Shared Component
1. Create `BookingCard/` directory structure
2. Extract shared logic (status colors, time calculations, etc.)
3. Create `BookingCard.tsx` with both Admin/Customer support
4. Export from shared components

### Phase 2: Add Accordion Functionality
1. Add `isExpanded` state with auto-expansion logic
2. Create `BookingCardHeader` (compact view)
3. Create `BookingCardDetails` (expanded view)
4. Add smooth collapse/expand animation

### Phase 3: Replace in Parent Components
1. Update `AdminBookingsList.tsx` to use new `BookingCard`
2. Update `MyBookingsList.tsx` to use new `BookingCard`
3. Remove duplicated code
4. Test both admin and customer flows

### Phase 4: Polish & Optimize
1. Add keyboard navigation (↑↓ arrows, Enter to expand)
2. Add ARIA attributes for accessibility
3. Test on mobile devices
4. Performance optimization (memo, lazy loading)

---

## 10. Estimated Impact

**Before:**
- AdminBookingsList: 635 lines
- MyBookingsList: 616 lines
- **Total:** 1,251 lines

**After:**
- BookingCard component: ~300 lines (new shared)
- AdminBookingsList: ~350 lines (-285 lines, -45%)
- MyBookingsList: ~320 lines (-296 lines, -48%)
- **Total:** 970 lines (-281 lines, -22% reduction)

**Additional Benefits:**
- Better mobile UX (5-6 visible cards vs 1-2)
- Consistent behavior across views
- Easier to maintain and test
- Foundation for future enhancements (drag-to-reorder, multi-select, etc.)

---

## Conclusion

This is an **excellent refactoring opportunity** that combines:
1. ✅ Code quality improvement (DRY, maintainability)
2. ✅ UX enhancement (accordion, better mobile experience)
3. ✅ Performance gains (less DOM, lazy rendering)
4. ✅ Consistency (one component, one behavior)

**Recommendation: PROCEED** 🚀

# Orders System Implementation

## Overview

The orders system integrates e-commerce functionality with the meetings/booking system, providing:
- ✅ Persistent order records for all purchases
- ✅ Support for products, services, and subscriptions
- ✅ Service booking time slot management
- ✅ Soft reservations during checkout (10-minute hold)
- ✅ Staff assignment for service bookings
- ✅ Stripe payment tracking

## Database Schema

### Tables Created
1. **`orders`** - Main transaction records
2. **`order_items`** - Line items for each order
3. **`service_capacity`** - Time slot availability and capacity management

### Key Features
- UUID primary keys for new tables
- Foreign key integrity with existing tables (products, pricingplan, bookings, profiles)
- Row Level Security (RLS) policies
- Automatic timestamp triggers
- Helper functions for reservation management

## API Endpoints

### Orders API (`/api/orders`)

#### POST - Create Order
```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      {
        item_type: 'service',
        pricingplan_id: 'uuid-here',
        booking_id: 'uuid-here',
        item_name: '1-Hour Consultation',
        quantity: 1,
        unit_price: 50.00,
        selected_staff_id: 'uuid-here'
      }
    ],
    stripe_payment_intent_id: 'pi_xxx',
    stripe_customer_id: 'cus_xxx',
    notes: 'Customer notes here'
  })
});
```

#### GET - Fetch Orders
```typescript
// Get all orders for current user
const response = await fetch('/api/orders');

// Get specific order with items
const response = await fetch('/api/orders?order_id=uuid-here');
```

#### PATCH - Update Order
```typescript
const response = await fetch('/api/orders', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_id: 'uuid-here',
    status: 'completed',
    payment_status: 'paid'
  })
});
```

### Service Capacity API (`/api/service-capacity/slots`)

#### GET - Fetch Available Time Slots
```typescript
const params = new URLSearchParams({
  pricingplan_id: 'uuid-here',
  staff_id: 'uuid-here',  // Optional
  start_date: '2025-10-23T00:00:00Z',
  end_date: '2025-10-30T23:59:59Z'
});

const response = await fetch(`/api/service-capacity/slots?${params}`);
```

#### POST - Reserve Time Slot
```typescript
const response = await fetch('/api/service-capacity/slots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    capacity_id: 'uuid-here',
    duration_minutes: 10  // Optional, defaults to 10
  })
});
```

#### DELETE - Release Reservation
```typescript
const response = await fetch('/api/service-capacity/slots?capacity_id=uuid-here', {
  method: 'DELETE'
});
```

## React Hooks

### useOrders Hook

```typescript
import { useOrders } from '@/hooks/useOrders';

function CheckoutComponent() {
  const { loading, error, createOrder, getOrders, updateOrder } = useOrders();

  const handleCheckout = async () => {
    try {
      const { order, order_items } = await createOrder({
        items: [{
          item_type: 'service',
          pricingplan_id: selectedPlan.id,
          item_name: selectedPlan.package,
          quantity: 1,
          unit_price: selectedPlan.price
        }],
        stripe_payment_intent_id: paymentIntent.id
      });

      console.log('Order created:', order);
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Processing...' : 'Complete Purchase'}
    </button>
  );
}
```

### useServiceCapacity Hook

```typescript
import { useServiceCapacity } from '@/hooks/useServiceCapacity';

function TimeSlotPicker() {
  const { loading, error, getAvailableSlots, reserveSlot, releaseReservation } = useServiceCapacity();
  const [slots, setSlots] = useState([]);
  const [reservedSlot, setReservedSlot] = useState(null);

  useEffect(() => {
    const fetchSlots = async () => {
      const availableSlots = await getAvailableSlots({
        pricingplan_id: selectedPlan.id,
        start_date: new Date().toISOString(),
        end_date: addDays(new Date(), 7).toISOString()
      });
      setSlots(availableSlots);
    };

    fetchSlots();
  }, [selectedPlan]);

  const handleSelectSlot = async (slotId) => {
    try {
      // Release previous reservation if exists
      if (reservedSlot) {
        await releaseReservation(reservedSlot);
      }

      // Reserve new slot for 10 minutes
      const reserved_until = await reserveSlot(slotId);
      setReservedSlot(slotId);

      // Auto-release after 10 minutes
      setTimeout(async () => {
        await releaseReservation(slotId);
        setReservedSlot(null);
      }, 10 * 60 * 1000);

    } catch (err) {
      console.error('Failed to reserve slot:', err);
    }
  };

  return (
    <div>
      {slots.map(slot => (
        <button key={slot.id} onClick={() => handleSelectSlot(slot.id)}>
          {new Date(slot.slot_start).toLocaleString()}
        </button>
      ))}
    </div>
  );
}
```

## Integration with Checkout Flow

### Example: Complete Checkout with Service Booking

```typescript
import { useOrders } from '@/hooks/useOrders';
import { useServiceCapacity } from '@/hooks/useServiceCapacity';
import { useStripe } from '@stripe/react-stripe-js';

function ServiceCheckout() {
  const { createOrder } = useOrders();
  const { reserveSlot, releaseReservation } = useServiceCapacity();
  const stripe = useStripe();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservedCapacityId, setReservedCapacityId] = useState(null);

  const handleCheckout = async () => {
    try {
      // Step 1: Reserve the time slot
      if (selectedSlot) {
        const reserved_until = await reserveSlot(selectedSlot.id);
        setReservedCapacityId(selectedSlot.id);
      }

      // Step 2: Create Stripe Payment Intent
      const { paymentIntent } = await stripe.confirmPayment({
        // ... Stripe configuration
      });

      // Step 3: Create order record
      const { order, order_items } = await createOrder({
        items: [{
          item_type: 'service',
          pricingplan_id: selectedPlan.id,
          booking_id: newBooking.id,  // Created booking record
          item_name: selectedPlan.package,
          quantity: 1,
          unit_price: selectedPlan.price,
          selected_staff_id: selectedSlot?.staff_id
        }],
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customer.id
      });

      // Step 4: Confirm the booking in service_capacity
      // This is done by the database function when payment succeeds

      console.log('Purchase complete!', order);

    } catch (error) {
      // Release reservation on error
      if (reservedCapacityId) {
        await releaseReservation(reservedCapacityId);
      }
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div>
      {/* UI components */}
      <button onClick={handleCheckout}>Complete Purchase</button>
    </div>
  );
}
```

## Database Helper Functions

The migration created these PostgreSQL functions:

### `cleanup_expired_reservations()`
Automatically cleans up expired 10-minute reservations.

### `reserve_time_slot(capacity_id, user_id, duration_minutes)`
Reserves a time slot with soft-lock for checkout process.

### `release_reservation(capacity_id, user_id)`
Releases a user's reservation on a time slot.

### `confirm_booking(capacity_id, user_id)`
Confirms a booking and increments the current_bookings counter.

## Type Definitions

All TypeScript types are available in `/src/types/orders.ts`:

- `Order` - Main order record
- `OrderItem` - Individual line item
- `ServiceCapacity` - Time slot record
- `OrderStatus` - 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
- `PaymentStatus` - 'unpaid' | 'paid' | 'failed' | 'refunded'
- `ItemType` - 'product' | 'service' | 'subscription'

## Next Steps

1. **Integrate with existing checkout flow** - Update your current checkout to create order records
2. **Create service capacity management UI** - Admin interface for creating/managing time slots
3. **Implement webhook handler** - Update orders when Stripe payments complete
4. **Build order history page** - User-facing order history and details
5. **Add email notifications** - Order confirmation and receipt emails

## Migration File

The complete migration is in: `/database/migrations/007_create_orders_system.sql`

Run it in Supabase SQL Editor or via CLI:
```bash
psql YOUR_DATABASE_URL -f database/migrations/007_create_orders_system.sql
```

## Security

- All tables have Row Level Security (RLS) enabled
- Users can only see their own orders
- Admins have full access via admin policies
- Service capacity is publicly readable but write-protected
- Foreign key constraints ensure data integrity

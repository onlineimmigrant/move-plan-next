# Subscription Flow Quick Reference

## Price Selection Logic

### For Recurring Plans (type='recurring')
```typescript
if (billingCycle === 'annual') {
  use stripe_price_id_annual  // Annual prepay with discount
} else {
  use stripe_price_id          // Monthly billing
}
```

### For One-Time Plans (type='one_time')
```typescript
always use stripe_price_id     // Single payment, no recurrence
```

## API Endpoints

### Create Subscription
**POST** `/api/create-subscription`

**Request:**
```json
{
  "basketItems": [
    {
      "plan": {
        "id": "uuid",
        "type": "recurring",
        "name": "Professional Plan",
        "stripe_price_id": "price_monthly_xxx",
        "stripe_price_id_annual": "price_annual_xxx"
      },
      "quantity": 1,
      "billingCycle": "annual",
      "stripePriceId": "price_annual_xxx"
    }
  ],
  "customerEmail": "user@example.com"
}
```

**Note:** No `paymentMethodId` required. Subscription creates its own payment intent.

**Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "customerId": "cus_xxx",
  "clientSecret": "pi_xxx_secret_xxx",
  "status": "incomplete"
}
```

**Usage:** Call this BEFORE confirming payment, then use the returned `clientSecret` with `stripe.confirmPayment()`.

## Webhook Events

### Subscription Lifecycle

| Event | Action | Database Update |
|-------|--------|----------------|
| `customer.subscription.created` | New subscription started | Insert/upsert subscription record |
| `customer.subscription.updated` | Subscription modified | Update status, dates, flags |
| `customer.subscription.deleted` | Subscription cancelled | Mark as `cancelled`, set `cancelled_at` |
| `invoice.payment_succeeded` | Recurring payment successful | Update status to `active` |
| `invoice.payment_failed` | Recurring payment failed | Update status to `past_due` |

## Database Queries

### Check Subscription Status
```sql
SELECT 
  stripe_subscription_id,
  customer_email,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
FROM subscriptions
WHERE customer_email = 'user@example.com'
  AND status IN ('active', 'trialing');
```

### Find Past Due Subscriptions
```sql
SELECT * FROM subscriptions
WHERE status = 'past_due'
  AND organization_id = 'org_uuid'
ORDER BY current_period_end DESC;
```

### Cancel Subscription (via Stripe)
```typescript
const stripe = await createStripeInstance(organizationId);
await stripe.subscriptions.update('sub_xxx', {
  cancel_at_period_end: true
});
// Webhook will update database automatically
```

## Stripe Dashboard Testing

### Test Cards
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`
- **Insufficient Funds:** `4000 0000 0000 9995`

**Use any future expiry date and any 3-digit CVC**

### Trigger Webhook Events Manually
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event type (e.g., `invoice.payment_succeeded`)
5. Click "Send test webhook"

### View Subscription Details
1. Stripe Dashboard → Customers
2. Find customer by email
3. Click on customer
4. View "Subscriptions" tab
5. See billing schedule, upcoming invoices, payment history

## Common Issues & Solutions

### Issue: "Payment method already used" error
**Cause:** Trying to attach payment method after it was consumed by Payment Intent  
**Solution:** ✅ FIXED - Now we create subscription FIRST (which generates its own payment intent), then confirm payment with that client secret. Payment method is never pre-attached.

### Issue: Subscription created but payment fails
**Cause:** Payment method declined after subscription creation  
**Solution:** Stripe automatically retries. Check webhook for `invoice.payment_failed` event. Update UI to show past_due status.

### Issue: Annual price not found
**Cause:** `stripe_price_id_annual` is `null` or missing  
**Solution:** Verify plan type is `recurring`. Check database for correct price ID. Ensure price was created in Stripe.

### Issue: Webhook not received
**Cause:** Webhook endpoint not configured or signature verification failed  
**Solution:** 
1. Check Stripe Dashboard → Developers → Webhooks → Events
2. Verify endpoint URL is correct
3. Check `STRIPE_WEBHOOK_SECRET` environment variable
4. Review webhook logs for errors

### Issue: Duplicate subscriptions created
**Cause:** Multiple payment attempts or concurrent requests  
**Solution:** Add idempotency key to subscription creation:
```typescript
await stripe.subscriptions.create({
  // ... subscription params
}, {
  idempotencyKey: `subscription_${customerEmail}_${Date.now()}`
});
```

## Code Snippets

### Get Customer Subscriptions (Frontend)
```typescript
const response = await fetch('/api/customer/subscriptions');
const { subscriptions } = await response.json();

subscriptions.forEach(sub => {
  console.log(`${sub.customer_email}: ${sub.status}`);
  console.log(`Next billing: ${sub.current_period_end}`);
});
```

### Cancel Subscription (Frontend)
```typescript
const response = await fetch('/api/cancel-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionId: 'sub_xxx',
    cancelAtPeriodEnd: true, // or false for immediate cancellation
  }),
});
```

### Update Subscription (Change Plan)
```typescript
const stripe = await createStripeInstance(organizationId);

await stripe.subscriptions.update('sub_xxx', {
  items: [{
    id: 'si_xxx', // subscription item ID
    price: 'price_new_xxx', // new price ID
  }],
  proration_behavior: 'create_prorations', // or 'none', 'always_invoice'
});
```

## Monitoring

### Key Metrics to Track
- Active subscriptions count
- Monthly recurring revenue (MRR)
- Churn rate
- Failed payment rate
- Subscription upgrades/downgrades

### Database Queries for Analytics
```sql
-- Active subscriptions by status
SELECT status, COUNT(*) as count
FROM subscriptions
WHERE organization_id = 'org_uuid'
GROUP BY status;

-- MRR calculation (requires joining with pricing data)
SELECT 
  SUM(price_amount) as monthly_recurring_revenue
FROM subscriptions s
JOIN subscription_items si ON s.stripe_subscription_id = si.subscription_id
WHERE s.status = 'active'
  AND s.organization_id = 'org_uuid';

-- Churn rate (last 30 days)
SELECT 
  COUNT(*) FILTER (WHERE cancelled_at >= NOW() - INTERVAL '30 days') as churned,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_subscriptions
FROM subscriptions
WHERE organization_id = 'org_uuid';
```

## Environment Setup

### Development
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx_test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Production
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx_live
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Webhook Endpoint URL
- **Development:** `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
- **Production:** `https://yourdomain.com/api/webhooks/stripe`

**Configure in Stripe Dashboard:**
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL
4. Select events to listen for
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

**See also:**
- SUBSCRIPTION_IMPLEMENTATION_COMPLETE.md (detailed implementation)
- STRIPE_COORDINATION_GUIDE.md (Stripe integration guide)
- COMMITMENT_MONTHS_MIGRATION_COMPLETE.md (database schema changes)

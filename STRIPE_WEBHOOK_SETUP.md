# Stripe Webhook Setup Guide

## Implementation Complete ✅

The webhook system now supports multi-tenant organizations using metadata-based identification.

---

## How It Works

### 1. **Metadata Injection**
When creating Stripe objects, we automatically add `organization_id` to metadata:

```typescript
// PaymentIntent
metadata: {
  organization_id: "org-uuid-123",
  subscription_id: "sub_xxx",
  invoice_id: "in_xxx"
}

// Subscription
metadata: {
  organization_id: "org-uuid-123",
  item_count: 1,
  item_ids: "plan-id-1,plan-id-2"
}

// Customer
metadata: {
  organization_id: "org-uuid-123"
}
```

### 2. **Webhook Processing Flow**
```
Stripe → Webhook Event → Extract organization_id from metadata
                      ↓
         Fetch org's webhook_secret & secret_key from database
                      ↓
         Verify signature with org's webhook_secret
                      ↓
         Create org-specific Stripe instance
                      ↓
         Process event in organization context
```

### 3. **Performance**
- **O(1) complexity** - Single database lookup by organization ID
- Scales to unlimited organizations
- No loop through all organizations

---

## Development Testing

### Prerequisites
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login
```

### Local Testing
```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (whsec_...) and add to .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Terminal 3: Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.created
stripe trigger customer.subscription.updated
```

### Verify Logs
You should see:
```
[Webhook] Extracted organization_id: xxx-xxx-xxx
[Webhook] Fetching keys for organization: xxx-xxx-xxx
[Webhook] Signature verified successfully. Event type: payment_intent.succeeded
[Webhook] Processing payment_intent.succeeded event
[Webhook] Payment is for subscription invoice: in_xxx
[Webhook] Settling draft/open invoice with paid_out_of_band
[Webhook] Invoice marked paid (out-of-band) to activate subscription
```

---

## Production Setup (Per Organization)

### Step 1: Configure Webhook in Stripe Dashboard

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```

4. **Select events to listen to:**
   
   **Required Events (Subscription Flow):**
   - `payment_intent.succeeded` - Settles subscription invoices, prevents duplicates
   - `customer.created` - Creates user accounts automatically
   - `customer.subscription.updated` - Tracks subscription status changes
   - `customer.subscription.deleted` - Handles subscription cancellations
   - `invoice.payment_failed` - Handles failed renewal payments
   - `invoice.paid` - Confirms successful renewals
   
   **Optional Events (Product Sync):**
   - `product.created` - Syncs new products to database
   - `product.updated` - Updates product information
   - `product.deleted` - Removes deleted products
   - `price.created` - Syncs new prices to database
   - `price.updated` - Updates price information
   - `price.deleted` - Removes deleted prices

   **Full Event List:**
   ```
   ✓ customer.created
   ✓ customer.subscription.deleted
   ✓ customer.subscription.updated
   ✓ invoice.paid
   ✓ invoice.payment_failed
   ✓ payment_intent.succeeded
   ✓ price.created
   ✓ price.deleted
   ✓ price.updated
   ✓ product.created
   ✓ product.deleted
   ✓ product.updated
   ```

5. Click **"Add endpoint"**

6. **Copy the Signing Secret** (starts with `whsec_`)

### Step 2: Store Webhook Secret in Database

**Option A: SQL Query**
```sql
UPDATE organizations 
SET stripe_webhook_secret = 'whsec_xxxxxxxxxxxxx'
WHERE id = 'your-organization-id';
```

**Option B: Supabase Dashboard**
1. Go to **Table Editor** → **organizations**
2. Find your organization row
3. Edit `stripe_webhook_secret` column
4. Paste the webhook signing secret
5. Click **Save**

**Option C: API/Admin Panel**
Create an admin interface to manage organization Stripe settings.

### Step 3: Test Production Webhook

**Trigger a real payment:**
1. Create a test subscription on your production site
2. Complete payment
3. Check Stripe Dashboard → Webhooks → View events
4. Verify event was delivered successfully (200 status)

**Check logs:**
```
[Webhook] Extracted organization_id: your-org-id
[Webhook] Signature verified successfully
[Webhook] Invoice marked paid
```

---

## Event Handlers Currently Implemented

### ✅ `payment_intent.succeeded`
- Settles subscription invoices with `paid_out_of_band`
- Prevents duplicate charges
- Creates/updates customer records
- Stores transaction data

### ✅ `customer.created`
- Creates user account in auth.users
- Creates profile entry
- Stores customer record
- Generates signup link (optional)

### ✅ Product/Price Sync Events
- `product.created` → Stores in stripe_products table
- `product.updated` → Updates stripe_products table
- `product.deleted` → Removes from stripe_products table
- `price.created` → Stores in stripe_prices table
- `price.updated` → Updates stripe_prices table
- `price.deleted` → Removes from stripe_prices table

### ⚠️ To Be Implemented

**Subscription Management:**
```typescript
// customer.subscription.updated
// - Track subscription status changes (active → past_due → canceled)
// - Update subscriptions table
// - Send notifications

// customer.subscription.deleted
// - Mark subscription as canceled in database
// - Revoke access
// - Send cancellation email
```

**Payment Failures:**
```typescript
// invoice.payment_failed
// - Handle failed subscription renewals
// - Update subscription status to past_due
// - Send payment failure notification
// - Retry payment or cancel subscription
```

**Confirmations:**
```typescript
// invoice.paid
// - Confirm successful subscription renewals
// - Extend subscription period
// - Send receipt email
```

---

## Security Considerations

### ✅ Signature Verification
- Each webhook signature is verified with organization-specific secret
- Invalid signatures are rejected with 400 status
- Prevents webhook spoofing/tampering

### ✅ Organization Isolation
- Each organization has separate Stripe keys
- Metadata ensures correct organization context
- No cross-organization data leakage

### ✅ Validation
- Webhook verifies metadata organization_id matches expected org
- Logs warnings on mismatch
- Helps detect misconfigurations

### 🔒 Recommendations
1. **Use HTTPS only** in production
2. **Rotate webhook secrets** periodically
3. **Monitor webhook logs** for failed verifications
4. **Set up alerts** for webhook failures
5. **Test webhook** after any Stripe key changes

---

## Troubleshooting

### Webhook Signature Verification Failed
```
Error: Webhook signature verification failed
```

**Common Causes:**
1. **Webhook secret mismatch** - Database secret doesn't match Stripe Dashboard
2. **Using `stripe listen` secret in production** - Local dev secret (whsec_...) used instead of production webhook secret
3. **Multiple webhooks configured** - Different webhook endpoints with different secrets
4. **Organization not found** - Organization ID doesn't exist in database
5. **Raw body not preserved** - Middleware or proxy modified the request body

**Solution:**

**For Development (`stripe listen`):**
1. Run `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
2. Copy the webhook signing secret shown (starts with `whsec_`)
3. **Either:**
   - **Option A:** Add to `.env.local`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```
   - **Option B:** Add to organization in database:
     ```sql
     UPDATE organizations 
     SET stripe_webhook_secret = 'whsec_xxxxxxxxxxxxx'
     WHERE id = 'your-org-id';
     ```
4. Restart your dev server
5. Test with `stripe trigger payment_intent.succeeded`

**For Production:**
1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Find your webhook endpoint URL
3. Click to view the webhook details
4. Copy the **Signing secret** (starts with `whsec_`)
5. Update organization in database:
   ```sql
   UPDATE organizations 
   SET stripe_webhook_secret = 'whsec_xxxxxxxxxxxxx'
   WHERE id = 'your-production-org-id';
   ```
6. **IMPORTANT:** Make sure you're using the production webhook secret, NOT the `stripe listen` secret

**Verify Configuration:**
```sql
-- Check if webhook secret is set correctly
SELECT id, name, 
       LEFT(stripe_webhook_secret, 10) || '...' as webhook_secret_preview,
       LEFT(stripe_secret_key, 10) || '...' as secret_key_preview
FROM organizations 
WHERE id = 'your-org-id';
```

**Debug Tips:**
- Check application logs for the exact organization ID being used
- Verify the webhook secret starts with `whsec_`
- Ensure no middleware is modifying the request body
- Test signature verification in isolation

### No Organization ID in Metadata
```
Error: No organization ID in metadata
```

**Causes:**
- Stripe object created outside your application
- Old Stripe objects created before metadata implementation
- Manual object creation in Stripe Dashboard

**Solution:**
1. Ensure all Stripe objects are created via your API endpoints
2. Add organization_id manually in Stripe Dashboard for existing objects
3. Trigger webhook again after adding metadata

### Webhook Not Receiving Events
**Causes:**
- Webhook endpoint not configured in Stripe Dashboard
- Wrong URL in webhook configuration
- Server not accessible from internet (dev environment)

**Solution:**
1. Verify webhook URL in Stripe Dashboard
2. For local dev, use `stripe listen --forward-to`
3. Check server logs for incoming webhook requests
4. Verify webhook events are selected in Stripe Dashboard

---

## Monitoring

### Webhook Delivery Status
**Stripe Dashboard → Webhooks → [Your Endpoint]**
- View recent deliveries
- Check success/failure status
- Retry failed webhooks
- View request/response details

### Application Logs
Monitor these log patterns:
```
✅ [Webhook] Signature verified successfully
✅ [Webhook] Invoice marked paid
✅ [Webhook] Customer already exists in Supabase

⚠️ [Webhook] Organization ID mismatch
⚠️ [Webhook] No webhook secret configured

❌ [Webhook] Signature verification failed
❌ [Webhook] No organization_id found in event metadata
```

---

## Next Steps

### 1. **Test Current Implementation**
- [ ] Test subscription payment in development
- [ ] Verify webhook receives event
- [ ] Check invoice is marked paid
- [ ] Confirm subscription becomes active

### 2. **Add Missing Event Handlers**
- [ ] Implement `customer.subscription.updated`
- [ ] Implement `customer.subscription.deleted`
- [ ] Implement `invoice.payment_failed`
- [ ] Add email notifications

### 3. **Production Deployment**
- [ ] Deploy to production
- [ ] Configure webhook in Stripe Dashboard
- [ ] Store webhook secret in database
- [ ] Test with real payment

### 4. **Monitoring & Alerts**
- [ ] Set up webhook failure alerts
- [ ] Monitor subscription renewal success rate
- [ ] Track payment failure notifications
- [ ] Create admin dashboard for webhook status

---

## Support

If you encounter issues:
1. Check application logs for detailed error messages
2. Verify Stripe Dashboard webhook delivery logs
3. Ensure organization has all required Stripe keys configured
4. Test with `stripe listen` in development first

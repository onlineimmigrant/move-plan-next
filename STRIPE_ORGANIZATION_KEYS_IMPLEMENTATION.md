# Stripe Organization-Specific Keys Implementation

## Overview
This implementation allows each organization to use their own Stripe API keys stored in the database, with fallback to environment variables for backward compatibility.

## Database Schema

### Organizations Table
Added three columns to the `organizations` table:
```sql
stripe_secret_key TEXT
stripe_publishable_key TEXT
stripe_webhook_secret TEXT
```

## Core Files Created/Modified

### 1. Helper Functions (`/src/lib/getStripeKeys.ts`)
Central helper for fetching organization-specific Stripe keys:

```typescript
// Get all keys for an organization
const keys = await getOrganizationStripeKeys(organizationId);

// Get specific keys
const secretKey = await getStripeSecretKey(organizationId);
const publishableKey = await getStripePublishableKey(organizationId);
const webhookSecret = await getStripeWebhookSecret(organizationId);
```

**Features:**
- Fetches keys from `organizations` table
- Falls back to environment variables if not found
- Returns null if neither database nor env vars have keys
- Throws error if required key is missing

### 2. Stripe Instance Factory (`/src/lib/stripeInstance.ts`)
Creates Stripe instances with organization-specific keys:

```typescript
// Create organization-specific Stripe instance
const stripe = await createStripeInstance(organizationId);

// Legacy instance (uses env var)
import { stripe } from '@/lib/stripeInstance'; // Deprecated
```

### 3. API Endpoint for Publishable Key (`/src/app/api/stripe/publishable-key/route.ts`)
Client-side endpoint to fetch publishable key:

```typescript
// GET /api/stripe/publishable-key
// Returns: { publishableKey, organizationId }
```

## Updated API Routes

All API routes now support organization-specific keys:

### Payment Intent Routes
- ✅ `/api/create-payment-intent` - Creates payment intents
- ✅ `/api/cancel-payment-intent` - Cancels payment intents
- ✅ `/api/verify-payment-intent` - Verifies payment status

### Subscription Routes
- ✅ `/api/create-subscription` - Creates subscriptions

### Utility Routes
- ✅ `/api/validate-promo-code` - Validates promo codes
- ✅ `/api/sync-to-stripe` - Syncs data to Stripe
- ✅ `/api/transactions/sync` - Syncs transactions

### Pattern Used
Each route now:
1. Extracts `organizationId` from request or body
2. Creates Stripe instance with `createStripeInstance(organizationId)`
3. Uses that instance for all Stripe operations

```typescript
export async function POST(request: Request) {
  const { organizationId: bodyOrgId, ...otherData } = await request.json();
  
  // Get organization ID
  const organizationId = bodyOrgId || await getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  
  // Create Stripe instance with org keys
  const stripe = await createStripeInstance(organizationId);
  
  // Use stripe instance as normal
  const paymentIntent = await stripe.paymentIntents.create({...});
}
```

## Client-Side Usage

### Option 1: Fetch from API (Recommended)
```typescript
// Fetch publishable key dynamically
const response = await fetch('/api/stripe/publishable-key');
const { publishableKey } = await response.json();
const stripePromise = loadStripe(publishableKey);
```

### Option 2: Update Checkout Components
For existing checkout pages, update to fetch keys:

**Before:**
```typescript
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

**After:**
```typescript
const [publishableKey, setPublishableKey] = useState<string | null>(null);

useEffect(() => {
  fetch('/api/stripe/publishable-key')
    .then(res => res.json())
    .then(data => setPublishableKey(data.publishableKey));
}, []);

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
```

## Webhook Handling

### Challenge
Webhooks receive events from Stripe without organization context. Solutions:

### Solution 1: Metadata (Recommended)
Add `organization_id` to all Stripe objects:

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd',
  metadata: {
    organization_id: organizationId,
  },
});
```

Then in webhook:
```typescript
export async function POST(request: Request) {
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  
  // Extract organization ID from metadata
  const organizationId = event.data.object.metadata?.organization_id;
  if (!organizationId) {
    return NextResponse.json({ error: 'No organization ID in metadata' }, { status: 400 });
  }
  
  // Create stripe instance with org keys
  const stripe = await createStripeInstance(organizationId);
  
  // Process webhook event
}
```

### Solution 2: Separate Webhook Endpoints
Create organization-specific webhook URLs:
```
/api/webhooks/stripe/[organizationId]
```

## Migration Strategy

### Phase 1: Backward Compatibility (Current)
- All keys fall back to environment variables
- Existing code continues to work
- Organizations can optionally add their keys

### Phase 2: Gradual Migration
1. Organizations add their Stripe keys via UI (Shop → Stripe tab)
2. Keys are stored in database
3. API routes use org-specific keys when available
4. Environment variables serve as fallback

### Phase 3: Full Migration
1. Require all organizations to have their keys
2. Remove environment variable fallbacks
3. Pure multi-tenant Stripe implementation

## UI Component

### Stripe Configuration View (`/src/components/modals/ShopModal/components/StripeView.tsx`)

Features:
- Input fields for all three keys
- Auto-masking: Shows `sk_test_••••••••••••1234`
- Toggle visibility with eye icon
- Auto-unmask on focus
- Saves to `organizations` table
- Success/error notifications

Access: **Shop Modal → Stripe Tab**

## RLS Policies

Required policy for updating Stripe keys:

```sql
CREATE POLICY "Admins can update organization stripe keys"
ON organizations
FOR UPDATE
USING (
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

**Apply in Supabase Dashboard → SQL Editor**

## Testing

### 1. Test Key Storage
1. Go to Shop Modal → Stripe tab
2. Enter test keys:
   - Secret: `sk_test_...`
   - Publishable: `pk_test_...`
   - Webhook: `whsec_...`
3. Click Save
4. Verify keys are masked after save
5. Check database: `SELECT stripe_secret_key FROM organizations WHERE id = ?`

### 2. Test API Routes
```bash
# Create payment intent with organization keys
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "usd", "organizationId": "your-org-id"}'
```

### 3. Test Client-Side
```bash
# Fetch publishable key
curl http://localhost:3000/api/stripe/publishable-key
```

## Security Considerations

### ✅ Keys in Database
- Stored as plain text (Postgres encrypts at rest)
- Only admins can update (RLS policy)
- Never exposed to client (secret key)
- Publishable key safe to expose

### ✅ API Routes
- Server-side only (no client exposure of secret keys)
- Organization validation on every request
- Fallback to env vars for backward compatibility

### ⚠️ Future Enhancements
- Encrypt keys in database using `pgcrypto`
- Rotate keys periodically
- Audit log for key changes
- Key expiration warnings

## Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| Org has keys in DB | ✅ Use DB keys |
| Org missing keys in DB | ⚠️ Fall back to env vars |
| Env vars missing | ❌ Error thrown |
| Both DB and env missing | ❌ Error thrown |

## Files Modified

### Core Infrastructure
- ✅ `/src/lib/getStripeKeys.ts` - Key retrieval helper (NEW)
- ✅ `/src/lib/stripeInstance.ts` - Stripe instance factory (NEW)
- ✅ `/src/app/api/stripe/publishable-key/route.ts` - Client-side key endpoint (NEW)

### API Routes (11 files)
- ✅ `/src/app/api/create-payment-intent/route.ts`
- ✅ `/src/app/api/cancel-payment-intent/route.ts`
- ✅ `/src/app/api/verify-payment-intent/route.ts`
- ✅ `/src/app/api/create-subscription/route.ts`
- ✅ `/src/app/api/validate-promo-code/route.ts`
- ✅ `/src/app/api/sync-to-stripe/route.ts`
- ✅ `/src/app/api/transactions/sync/route.ts`
- ⏳ `/src/app/api/webhooks/stripe/route.ts` (TODO)
- ⏳ `/src/app/api/webhooks/stripe/customer/route.ts` (TODO)
- ⏳ `/src/app/api/webhooks/stripe/payment/route.ts` (TODO)
- ⏳ `/src/app/api/webhooks/stripe/product-catalog/route.ts` (TODO)

### Legacy Files (Keep for reference)
- `/src/lib/stripe.js` - Original Stripe instance
- `/src/lib/stripe-supabase.ts` - Supabase + Stripe combo

### Client Components
- ⏳ `/src/app/[locale]/checkout/page.tsx` (TODO)
- ⏳ `/src/components/product/Checkout.js` (TODO)

### Database
- ✅ `/database/migrations/003_add_stripe_keys_to_organizations.sql`
- ✅ `/database/migrations/add-stripe-keys-rls-policy.sql`

## Next Steps

### Immediate (TODO)
1. ⏳ Update webhook routes to extract organization ID from metadata
2. ⏳ Update client-side checkout components to fetch publishable key from API
3. ⏳ Test end-to-end payment flow with organization keys
4. ⏳ Add organization_id to all Stripe object metadata

### Future Enhancements
- [ ] Encrypt keys in database
- [ ] Key rotation system
- [ ] Audit logging for key changes
- [ ] Admin dashboard for key management
- [ ] Multi-environment keys (test/live toggle)
- [ ] Webhook signature verification per organization
- [ ] Key expiration warnings

## Support

For issues or questions:
1. Check browser console for errors
2. Check server logs for Stripe API errors
3. Verify RLS policy is applied
4. Ensure organization ID is being passed correctly
5. Test with Stripe test keys first

## Example: Full Payment Flow

```typescript
// 1. Client fetches publishable key
const response = await fetch('/api/stripe/publishable-key');
const { publishableKey, organizationId } = await response.json();
const stripe = await loadStripe(publishableKey);

// 2. Client creates payment intent
const paymentResponse = await fetch('/api/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    amount: 5000,
    currency: 'usd',
    organizationId, // Include org ID
    metadata: {
      organization_id: organizationId, // Also in metadata for webhooks
      product_id: 'prod_123',
    },
  }),
});

// 3. Server creates payment intent with org-specific keys
// (Handled automatically by updated API route)

// 4. Webhook receives event with organization_id in metadata
// (Extract org ID, create stripe instance, process event)
```

---

**Last Updated:** November 23, 2025
**Status:** Phase 1 Complete (API Routes), Phase 2 In Progress (Webhooks & Client)

# Stripe Organization Keys - Quick Reference

## 🚀 Quick Start

### 1. Configure Keys (Admin UI)
```
Shop Modal → Stripe Tab → Enter Keys → Save
```

### 2. Server-Side Usage
```typescript
import { createStripeInstance } from '@/lib/stripeInstance';
import { getOrganizationId } from '@/lib/getSettings';

const orgId = await getOrganizationId(request);
const stripe = await createStripeInstance(orgId);
```

### 3. Client-Side Usage
```typescript
const res = await fetch('/api/stripe/publishable-key');
const { publishableKey } = await res.json();
const stripe = await loadStripe(publishableKey);
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/src/lib/getStripeKeys.ts` | Fetch organization keys |
| `/src/lib/stripeInstance.ts` | Create Stripe instances |
| `/src/app/api/stripe/publishable-key/route.ts` | Client key endpoint |
| `/src/components/modals/ShopModal/components/StripeView.tsx` | Admin UI |

## ✅ Updated Routes (7/11)

- ✅ `/api/create-payment-intent`
- ✅ `/api/cancel-payment-intent`
- ✅ `/api/verify-payment-intent`
- ✅ `/api/create-subscription`
- ✅ `/api/validate-promo-code`
- ✅ `/api/sync-to-stripe`
- ✅ `/api/transactions/sync`

## ⏳ TODO

- Update 4 webhook routes
- Apply RLS policy in Supabase
- Add `organization_id` to Stripe metadata
- Test end-to-end

## 🔐 Security

- Keys in database (Postgres encrypted at rest)
- RLS policy: Only admins can update
- Secret keys: Server-side only
- Publishable keys: Safe for client
- Masking in UI: `sk_test_••••••••••••1234`

## 📚 Full Documentation

- `STRIPE_ORGANIZATION_KEYS_IMPLEMENTATION.md` - Complete guide
- `STRIPE_IMPLEMENTATION_SUMMARY.md` - Status summary

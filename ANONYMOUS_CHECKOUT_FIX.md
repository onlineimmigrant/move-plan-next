# Anonymous User Checkout Fix

## Problem
Non-authenticated users could not complete checkout for subscription items. They would see "Failed to load payment details" error because:
1. The checkout page waited for `customerEmail` before creating subscription
2. Anonymous users never had `customerEmail` set (only authenticated users)
3. Without subscription creation, no `clientSecret` was obtained
4. Without `clientSecret`, the Stripe PaymentForm couldn't render
5. Users were stuck with no way to enter their email and proceed

## Solution
Implemented a two-step checkout flow for anonymous users with subscription items:

### Step 1: Email Collection
- Show a dedicated email collection form when:
  - Basket contains recurring/subscription items
  - User is not authenticated (no `customerEmail`)
  - No `clientSecret` exists yet
- User enters their email and clicks "Continue to Payment"
- Email is passed to `managePaymentIntent(email)` to create subscription

### Step 2: Payment
- Once subscription is created with the provided email, `clientSecret` is obtained
- Full Stripe PaymentForm is rendered
- User can enter payment details and complete purchase

## Changes Made

### 1. `/src/app/[locale]/checkout/page.tsx`

#### Modified Initial Payment Intent Effect (Lines ~421-450)
**Before:**
```typescript
// For recurring items, wait for email before creating subscription
if (hasRecurringItems && !customerEmail) {
  console.log('[Effect] Waiting for customer email before creating subscription');
  return;
}
```

**After:**
```typescript
// For recurring items WITHOUT authenticated email, skip initial creation
// The subscription will be created when user enters email and clicks pay
if (hasRecurringItems && !customerEmail) {
  console.log('[Effect] Subscription requires email - will be created when user submits payment');
  hasFetchedIntentRef.current = true;
  return;
}
```

**Why:** Sets the `hasFetchedIntentRef` flag to prevent infinite effect loops, and logs that subscription will be created later.

#### Modified `managePaymentIntent` Function (Lines ~275-295)
**Before:**
```typescript
// Email is required for subscriptions
if (!effectiveEmail) {
  console.log('Waiting for customer email before creating subscription');
  setError('Please wait while we load your account details...');
  isProcessingRef.current = false;
  return;
}
```

**After:**
```typescript
// Email is required for subscriptions
// If no email provided yet, skip creation silently (will be created on form submission)
if (!effectiveEmail) {
  console.log('No email yet - subscription will be created when user submits payment');
  isProcessingRef.current = false;
  return;
}
```

**Why:** Removed the error message that confused anonymous users. Now silently skips subscription creation, waiting for email to be provided.

#### Added Email Collection Form (Lines ~793-832)
**Before:**
```typescript
) : (
  <div className="text-center text-red-500 py-8 bg-red-50 rounded-xl">
    <p className="font-semibold mb-3">⚠️ {t.failedToLoadPaymentDetails}</p>
    <Button variant="outline" ...>Retry</Button>
  </div>
)}
```

**After:**
```typescript
) : hasRecurringItems && !customerEmail ? (
  <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 shadow-md">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enter your email to continue</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      A subscription requires an email address. Please enter your email to proceed with payment.
    </p>
    <form onSubmit={async (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      if (email) {
        setPaymentIntentLoading(true);
        await managePaymentIntent(email, false);
        setPaymentIntentLoading(false);
      }
    }}>
      <div className="mb-4">
        <label htmlFor="subscription-email" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="subscription-email"
          name="email"
          type="email"
          required
          className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
          placeholder="your@email.com"
        />
      </div>
      <Button type="submit" variant="start" className="w-full" disabled={paymentIntentLoading}>
        {paymentIntentLoading ? 'Processing...' : 'Continue to Payment'}
      </Button>
    </form>
  </div>
) : (
  <div className="text-center text-red-500 py-8 bg-red-50 rounded-xl">
    <p className="font-semibold mb-3">⚠️ {t.failedToLoadPaymentDetails}</p>
    <Button variant="outline" ...>Retry</Button>
  </div>
)}
```

**Why:** Provides a dedicated email collection UI for anonymous users with subscriptions, making it clear what they need to do to proceed.

## Flow Diagram

### Authenticated User with Subscription
```
Load Checkout Page
  → customerEmail from profile
  → useEffect calls managePaymentIntent(customerEmail)
  → Subscription created with email
  → clientSecret obtained
  → PaymentForm rendered
  → User pays
  → Success
```

### Anonymous User with Subscription (NEW)
```
Load Checkout Page
  → No customerEmail
  → useEffect skips subscription creation
  → Email Collection Form rendered
  → User enters email + clicks "Continue to Payment"
  → managePaymentIntent(email) called
  → Subscription created with email
  → clientSecret obtained
  → PaymentForm rendered
  → User pays
  → Success
```

### Regular (Non-Subscription) User
```
Load Checkout Page
  → useEffect calls managePaymentIntent()
  → PaymentIntent created (no email required)
  → clientSecret obtained
  → PaymentForm rendered (with email field)
  → User enters email + pays
  → Success
```

## Testing Checklist

- [x] Build compiles without TypeScript errors
- [ ] Anonymous user can see email collection form for subscription
- [ ] Email collection form validates email format
- [ ] Clicking "Continue to Payment" creates subscription
- [ ] After email submission, PaymentForm appears with Stripe Elements
- [ ] Anonymous user can complete full payment flow
- [ ] Authenticated user flow unchanged (direct to PaymentForm)
- [ ] Regular non-subscription items unchanged (no email pre-collection)

## Next Steps

1. Test in development with anonymous user + subscription item
2. Verify email validation works
3. Confirm subscription creation after email submission
4. Ensure PaymentForm renders correctly after email collected
5. Complete end-to-end anonymous subscription purchase
6. Deploy to production

## Notes

- This fix maintains backward compatibility with authenticated users
- Non-subscription items are unaffected (email collected in PaymentForm as before)
- The email collection form matches the app's design system
- Error handling remains in place for failed subscription creation
- Loading states properly shown during subscription creation

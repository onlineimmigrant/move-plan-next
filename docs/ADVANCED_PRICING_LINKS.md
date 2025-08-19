# Advanced Product Pricing Links

The PricingModal component now supports advanced URL-based product linking, allowing you to create direct links to specific products in the pricing modal.

## How It Works

The system consists of two main components:

1. **URL Detection Logic** - Detects when a URL contains pricing-related hash fragments
2. **Product Selection Logic** - Automatically selects the appropriate product based on the URL

### URL Hash Detection

The modal opening logic in `HomePage.tsx` has been enhanced to detect any hash that starts with `#pricing`:

```typescript
// Old logic (only exact match)
setIsPricingModalOpen(hash === '#pricing');

// New logic (supports extended format)
const hashParts = hash.split('#').filter(Boolean);
const isPricingHash = hashParts.length > 0 && hashParts[0] === 'pricing';
setIsPricingModalOpen(isPricingHash);
```

This means both `#pricing` and `#pricing#product_name` will open the modal.

## URL Formats

### Basic Pricing Modal
```
/#pricing
```
Opens the pricing modal with the first available product selected.

### Product-Specific Links
```
/#pricing#product_identifier
```
Opens the pricing modal with a specific product selected.

## Product Identifier Types

The system supports three types of product identifiers:

### 1. Product Name (Recommended)
Product names are automatically converted to URL-safe identifiers:
- Convert to lowercase
- Replace non-alphanumeric characters with underscores
- Remove duplicate underscores
- Trim underscores from start/end

**Examples:**
- "Basic Plan" → `basic_plan`
- "Premium Package!" → `premium_package`
- "Pro-2024 (Special)" → `pro_2024_special`

### 2. Product ID
Direct product ID as a number:
```
/#pricing#123
```

### 3. Product Slug
If your products have slugs:
```
/#pricing#premium-plan
```

## Examples

### Creating Links in Your Application

```tsx
import { generateProductPricingUrl, generateBasicPricingUrl } from '@/components/PricingModal';

// Basic pricing link
const basicLink = generateBasicPricingUrl(); // "/#pricing"

// Product-specific link
const productLink = generateProductPricingUrl(product); // "/#pricing#basic_plan"

// Custom base URL
const customLink = generateProductPricingUrl(product, 'https://mysite.com/page'); 
// "https://mysite.com/page#pricing#basic_plan"
```

### HTML Links
```html
<!-- Basic pricing -->
<a href="/#pricing">View Pricing</a>

<!-- Specific products -->
<a href="/#pricing#basic_plan">Basic Plan Details</a>
<a href="/#pricing#premium_package">Premium Package Details</a>
<a href="/#pricing#123">Product ID 123</a>
```

### Dynamic Links in React
```tsx
function ProductCard({ product }) {
  const pricingUrl = `/#pricing#${product.product_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  return (
    <div>
      <h3>{product.product_name}</h3>
      <a href={pricingUrl}>See Pricing Details</a>
    </div>
  );
}
```

## Fallback Behavior

If a product identifier is not found, the system will:
1. Try to match by converted product name
2. Try to match by product ID
3. Try to match by product slug
4. Fall back to the first available product

## Development & Debugging

The system includes comprehensive logging to help with debugging:
- Product identifier detection
- Available products list
- Match attempts and results
- Fallback behavior

Check the browser console for detailed logs when developing.

## Integration Examples

### Marketing Campaigns
```html
<!-- Email campaigns -->
<a href="https://yoursite.com/#pricing#premium_plan">
  Upgrade to Premium - Special Offer!
</a>

<!-- Social media -->
<a href="https://yoursite.com/#pricing#basic_plan">
  Start with our Basic Plan
</a>
```

### In-App Navigation
```tsx
// Navigate to specific product pricing
const handleViewPricing = (product) => {
  window.location.href = generateProductPricingUrl(product);
};

// Or update URL without page reload
const handleShowPricing = (product) => {
  const url = generateProductPricingUrl(product);
  window.history.pushState(null, '', url);
  // Then trigger your modal opening logic
};
```

## Notes

- URLs are automatically updated when users switch between products in the modal
- The pricing hash is properly removed when the modal is closed
- The system works with both direct navigation and programmatic URL updates
- All product identifiers are case-insensitive and URL-safe

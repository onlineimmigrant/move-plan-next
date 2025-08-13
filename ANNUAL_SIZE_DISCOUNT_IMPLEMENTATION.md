# Annual Size Discount Implementation

## Overview

The `annual_size_discount` field has been implemented across the pricing system to provide flexible annual discounting capabilities. This field stores the discount percentage that should be applied when calculating annual pricing from monthly plans.

## Database Schema

### New Field
```sql
annual_size_discount DECIMAL(5,2) -- Stores discount percentage (e.g., 20.00 for 20% off)
```

### Migration Files
- `005_create_pricingplan_table.sql` - Updated to include the field in new table creation
- `006_add_annual_size_discount_to_pricingplan.sql` - Adds the field to existing tables

## API Changes

### Route Updates
- **File**: `/src/app/api/pricing-comparison/route.ts`
- **Change**: Added `annual_size_discount` to the select query for pricing plans
- **Impact**: The field is now included in all pricing plan API responses

## Type System Updates

### PricingPlan Interface
- **File**: `/src/types/pricingplan.ts`
- **Addition**: `annual_size_discount?: number;`

### SamplePricingPlan Interface
- **File**: `/src/components/PricingModal.tsx`
- **Addition**: `annualSizeDiscount?: number;`

## Business Logic Implementation

### Annual Price Calculation Priority
1. **Direct Annual Plan**: Uses `annual?.monthly_price_calculated` if an annual plan exists
2. **Calculated from Monthly + Discount**: Uses `monthlyPrice * (1 - discount/100)` when `annual_size_discount` is available
3. **Fallback**: Uses monthly price as-is

### Example Calculations
```javascript
// Monthly plan: $29, annual_size_discount: 20%
// Annual monthly equivalent: $29 * (1 - 20/100) = $29 * 0.8 = $23.20
// Total annual cost: $23.20 * 12 = $278.40
```

### Discount Badge Display
- **With `annual_size_discount`**: Shows the exact discount percentage from the database
- **Without `annual_size_discount`**: Calculates discount from price difference
- **Example**: "Save 20%" (from database) vs "Save 21%" (calculated)

## Usage Scenarios

### Scenario 1: Monthly Plan with Annual Discount
```sql
-- Monthly plan with 20% annual discount
INSERT INTO pricingplan (
    price, 
    recurring_interval, 
    annual_size_discount
) VALUES (
    2900, -- $29.00 in cents
    'month', 
    20.00 -- 20% discount for annual payment
);
```

### Scenario 2: Separate Monthly and Annual Plans
```sql
-- Monthly plan
INSERT INTO pricingplan (price, recurring_interval) VALUES (2900, 'month');

-- Annual plan (separate pricing)
INSERT INTO pricingplan (
    price, 
    monthly_price_calculated, 
    recurring_interval
) VALUES (
    27600, -- $276 total annual in cents
    23.00, -- $23/month equivalent (after discount conversion)
    'year'
);
```

## Frontend Display Logic

### Price Display
- **Monthly view**: Shows `monthlyPrice`
- **Annual view**: Shows calculated `annualPrice` (monthly equivalent)

### Total Recurring Amount
- **Monthly**: `monthlyPrice × recurring_interval_count`
- **Annual**: `actualAnnualPrice` (calculated total) or `annualPrice × 12`

### Discount Badge
- Shows percentage savings with proper rounding
- Prioritizes database `annual_size_discount` over calculated values

## Benefits

1. **Flexibility**: Supports both direct annual pricing and discount-based calculation
2. **Accuracy**: Uses database values for exact discount percentages
3. **Consistency**: Unified calculation logic across the application
4. **Maintainability**: Clear separation between data and presentation logic

## Testing

To test the implementation:

1. **Run migrations**: Execute both SQL migration files in Supabase
2. **Add test data**: Insert pricingplan records with `annual_size_discount` values
3. **API testing**: Call `/api/pricing-comparison?type=plans&organizationId=X`
4. **UI testing**: View pricing modal with monthly/annual toggle

## Migration Commands

```bash
# Display migration SQL
node run-migration.js

# Then copy and run the SQL in Supabase SQL Editor
```

The implementation ensures backward compatibility while adding powerful new discounting capabilities to your pricing system.

# Inventory Organization ID Migration

## What This Does
Adds `organization_id` column directly to the `inventory` table for better performance and simpler queries.

## Why This Change
Previously, inventory items only had `pricing_plan_id`, requiring a JOIN with the `pricingplan` table to filter by organization. This caused:
- More complex queries
- "Unknown Plan" errors when pricing plans weren't loaded
- Slower performance

## How to Apply

### Step 1: Run the SQL Migration
Execute the SQL file in your Supabase SQL Editor:

```bash
# Copy the contents of add-organization-id-to-inventory.sql
# Paste into Supabase SQL Editor and run
```

Or use the Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify the Migration
The migration will:
1. Add `organization_id` column to inventory table
2. Populate it from linked pricing plans
3. Set it as NOT NULL
4. Add foreign key constraint to organization table
5. Create index for performance

### Step 3: Test
1. Open the Products modal
2. Go to Inventory tab
3. Create a new inventory item
4. Verify it shows the correct pricing plan (no "Unknown Plan")

## What Changed in Code

### API (`/api/inventory/route.ts`)
- **GET**: Now filters directly by `organization_id` (no JOIN needed)
- **POST**: Auto-populates `organization_id` from the selected pricing plan
- **PUT**: Updates `organization_id` if `pricing_plan_id` changes
- **DELETE**: Unchanged

### Benefits
✅ Faster queries (no JOIN required)
✅ Simpler code
✅ Prevents "Unknown Plan" errors
✅ Organization isolation enforced at database level
✅ Automatic cascade on organization deletion

## Rollback (if needed)
```sql
-- Remove the column
ALTER TABLE public.inventory DROP COLUMN organization_id;

-- Remove the index
DROP INDEX idx_inventory_organization_id;
```

## Notes
- The `organization_id` is automatically set from the pricing plan
- Cannot be manually edited (derived from pricing plan)
- Cascade deletes when organization is deleted
- Indexed for performance

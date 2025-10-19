# Multi-Currency Database Fields Format

## 📋 **JSONB Field Formats for Multi-Currency Support**

### 🏷️ **1. `stripe_price_ids` Field Format**

```json
{
  "USD": "price_1ABC123DEF456GHI",
  "EUR": "price_2DEF456GHI789JKL",
  "GBP": "price_3GHI789JKL012MNO",
  "PLN": "price_4JKL012MNO345PQR",
  "RUB": "price_5MNO345PQR678STU"
}
```

#### **Structure:**
- **Key**: Currency code (3-letter ISO code)
- **Value**: Stripe Price ID (string starting with `price_`)

#### **Example SQL Insert:**
```sql
UPDATE pricingplan 
SET stripe_price_ids = '{
  "USD": "price_1O1234567890abcdef",
  "EUR": "price_2O1234567890abcdef",
  "GBP": "price_3O1234567890abcdef"
}'::jsonb
WHERE id = 'your-plan-id';
```

---

### 💰 **2. `prices_multi_currency` Field Format**

```json
{
  "USD": {
    "price": 2999,
    "symbol": "$"
  },
  "EUR": {
    "price": 2799,
    "symbol": "€"
  },
  "GBP": {
    "price": 2399,
    "symbol": "£"
  },
  "PLN": {
    "price": 11999,
    "symbol": "zł"
  },
  "RUB": {
    "price": 279999,
    "symbol": "₽"
  }
}
```

#### **Structure:**
- **Key**: Currency code (3-letter ISO code)
- **Value**: Object containing:
  - `price`: **Number in cents** (e.g., 2999 = $29.99)
  - `symbol`: **Currency symbol** (string)

#### **Example SQL Insert:**
```sql
UPDATE pricingplan 
SET prices_multi_currency = '{
  "USD": {"price": 5999, "symbol": "$"},
  "EUR": {"price": 5499, "symbol": "€"},
  "GBP": {"price": 4699, "symbol": "£"},
  "PLN": {"price": 24999, "symbol": "zł"},
  "RUB": {"price": 599999, "symbol": "₽"}
}'::jsonb
WHERE id = 'your-plan-id';
```

---

### 🌍 **3. `base_currency` Field Format**

```sql
-- Simple string field (not JSONB)
UPDATE pricingplan 
SET base_currency = 'USD'
WHERE id = 'your-plan-id';
```

#### **Supported Values:**
- `'USD'` - US Dollar
- `'EUR'` - Euro  
- `'GBP'` - British Pound
- `'PLN'` - Polish Zloty
- `'RUB'` - Russian Ruble

---

## 📊 **Complete Example Record**

### **Full Multi-Currency Pricing Plan:**
```sql
INSERT INTO pricingplan (
  id,
  product_id,
  package,
  type,
  price,
  currency,
  currency_symbol,
  prices_multi_currency,
  stripe_price_ids,
  base_currency,
  organization_id
) VALUES (
  'uuid-here',
  123,
  'Premium Plan',
  'one_time',
  2999, -- Legacy price in cents
  'USD', -- Legacy currency
  '$',   -- Legacy symbol
  '{
    "USD": {"price": 2999, "symbol": "$"},
    "EUR": {"price": 2799, "symbol": "€"},
    "GBP": {"price": 2399, "symbol": "£"},
    "PLN": {"price": 11999, "symbol": "zł"},
    "RUB": {"price": 279999, "symbol": "₽"}
  }'::jsonb,
  '{
    "USD": "price_1O1234567890USD",
    "EUR": "price_2O1234567890EUR", 
    "GBP": "price_3O1234567890GBP",
    "PLN": "price_4O1234567890PLN",
    "RUB": "price_5O1234567890RUB"
  }'::jsonb,
  'USD',
  'your-org-id'
);
```

---

## 🔄 **Migration Script Example**

### **Add Multi-Currency Support to Existing Plans:**
```sql
-- Add the new JSONB columns
ALTER TABLE pricingplan 
ADD COLUMN IF NOT EXISTS prices_multi_currency JSONB,
ADD COLUMN IF NOT EXISTS stripe_price_ids JSONB,
ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) DEFAULT 'USD';

-- Update existing records with multi-currency data
UPDATE pricingplan 
SET 
  prices_multi_currency = jsonb_build_object(
    currency, jsonb_build_object(
      'price', price,
      'symbol', currency_symbol
    )
  ),
  base_currency = currency
WHERE prices_multi_currency IS NULL;
```

---

## 🎯 **Price Conversion Examples**

### **From Database to Display:**

| Database Value | Currency | Displayed As |
|----------------|----------|--------------|
| `2999` cents   | USD      | `$29.99`     |
| `2799` cents   | EUR      | `€27.99`     |
| `2399` cents   | GBP      | `£23.99`     |
| `11999` cents  | PLN      | `119.99 zł`  |
| `279999` cents | RUB      | `2799.99 ₽` |

### **Important Notes:**
1. **Prices in `prices_multi_currency` are stored in CENTS**
2. **Legacy `price` field compatibility maintained**
3. **Currency symbols included for each currency**
4. **Stripe Price IDs map 1:1 with currencies**
5. **Base currency serves as fallback**

---

## 🛠️ **Quick Test Query**

```sql
-- View multi-currency data for a plan
SELECT 
  id,
  package,
  price as legacy_price,
  currency as legacy_currency,
  prices_multi_currency,
  stripe_price_ids,
  base_currency
FROM pricingplan 
WHERE id = 'your-plan-id';
```

This format ensures full backward compatibility while enabling dynamic multi-currency pricing with proper Stripe integration.
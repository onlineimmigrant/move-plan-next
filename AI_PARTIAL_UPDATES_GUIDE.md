# AI Agent Quick Guide: Partial Competitor Updates

## 🎯 Problem Solved

**Before:** Had to send entire competitor data (all plans + all features) = ~3000 tokens
**Now:** Send only features for one plan = ~500 tokens (83% reduction!)

## 📊 New Data Structure

```json
{
  "plans": [
    {
      "our_plan_id": "uuid-basic",
      "our_plan_name": "Basic",
      "monthly": "9.99",
      "yearly": "99.99"
    },
    {
      "our_plan_id": "uuid-pro",
      "our_plan_name": "Pro",
      "monthly": "29.99",
      "yearly": "299.99"
    }
  ],
  "features": [
    {
      "our_feature_id": "uuid-storage",
      "our_feature_name": "Storage",
      "our_plan_id": "uuid-basic",
      "our_plan_name": "Basic",
      "status": "amount",
      "amount": "10",
      "unit": "GB"
    },
    {
      "our_feature_id": "uuid-storage",
      "our_feature_name": "Storage",
      "our_plan_id": "uuid-pro",
      "our_plan_name": "Pro",
      "status": "amount",
      "amount": "50",
      "unit": "GB"
    }
  ]
}
```

## ✅ How to Update One Plan

### Example: Update only Basic plan features

```typescript
// 1. Get competitor data
const response = await fetch(`/api/comparison/competitor/${competitorId}`);
const competitor = await response.json();

// 2. Filter to just Basic plan features
const basicPlanId = "uuid-basic";
const basicFeatures = competitor.data.features.filter(
  f => f.our_plan_id === basicPlanId
);

// 3. Send to AI (only ~20 features instead of 60!)
const prompt = `
Update competitor features for Basic plan:
${JSON.stringify(basicFeatures, null, 2)}

Research and update status/amount/unit for each feature.
`;

const updatedBasicFeatures = await aiAgent.complete(prompt);

// 4. Merge back into full dataset
const otherFeatures = competitor.data.features.filter(
  f => f.our_plan_id !== basicPlanId
);

competitor.data.features = [...otherFeatures, ...updatedBasicFeatures];

// 5. Save
await fetch(`/api/comparison/competitor/${competitorId}`, {
  method: 'PATCH',
  body: JSON.stringify({ data: competitor.data })
});
```

## 🚀 Common Patterns

### Update Multiple Plans (but not all)

```typescript
const plansToUpdate = ["uuid-basic", "uuid-pro"];
const featuresToUpdate = competitor.data.features.filter(
  f => plansToUpdate.includes(f.our_plan_id)
);
// Process and merge back
```

### Add New Feature to All Plans

```typescript
const newFeatureId = "uuid-new-feature";
const newFeatures = competitor.data.plans.map(plan => ({
  our_feature_id: newFeatureId,
  our_feature_name: "New Feature",
  our_plan_id: plan.our_plan_id,
  our_plan_name: plan.our_plan_name,
  status: "unknown",
  amount: "",
  unit: "",
  note: ""
}));

competitor.data.features.push(...newFeatures);
```

### Update Single Feature Across All Plans

```typescript
const featureToUpdate = "uuid-storage";
competitor.data.features = competitor.data.features.map(f =>
  f.our_feature_id === featureToUpdate
    ? { ...f, status: "available" }
    : f
);
```

### Get Features for Specific Plan

```typescript
const basicFeatures = competitor.data.features.filter(
  f => f.our_plan_id === "uuid-basic"
);
```

## 📝 Field Reference

### Feature Status Values
- `"available"` - Included in plan
- `"unavailable"` - Not offered in plan
- `"partial"` - Partially available/limited
- `"amount"` - Has specific quantity (requires amount + unit)
- `"unknown"` - Cannot determine

### Unit Values (when status = "amount")
- `"GB"` / `"TB"` - Storage
- `"users"` - User limits
- `"projects"` - Project limits
- `"currency"` - Costs money (amount in dollars)
- `"custom"` - Custom metric

## ⚡ Token Optimization Examples

### Scenario 1: Update Basic Plan Only

**Old nested structure:**
```json
{
  "plans": [
    { "name": "Basic", "features": [20 features] },
    { "name": "Pro", "features": [20 features] },
    { "name": "Enterprise", "features": [20 features] }
  ]
}
```
**Tokens: ~3000**

**New flat structure (Basic only):**
```json
{
  "features": [
    { "our_feature_name": "Storage", "our_plan_name": "Basic", ... }
    // Only 20 features
  ]
}
```
**Tokens: ~500** ✅ 83% savings

### Scenario 2: Update Multiple Features

**Old:** Send all 3 plans × 20 features = 60 feature objects
**New:** Send only the 3 features × 3 plans = 9 feature objects
**Savings: 85%**

## 🎨 Best Practices for AI Agents

1. **Always filter by plan_id first** to reduce context size
2. **Include plan_name** in context for readability
3. **Validate plan_id exists** before adding features
4. **Preserve other features** when merging updates
5. **Use specific plan names** in prompts (not "Plan 1", "Plan 2")

## 🔍 API Endpoints

### Get Competitor
```
GET /api/comparison/competitor/:id
```

### Update Competitor Data
```
PATCH /api/comparison/competitor/:id
Body: { "data": { "plans": [...], "features": [...] } }
```

### Get All Plans
```
GET /api/pricingplans?organization_id=:id
```

### Get All Features
```
GET /api/comparison/features?organization_id=:id
```

## 🛡️ Validation

```typescript
// Ensure all features reference valid plans
function validateCompetitorData(data: CompetitorData): boolean {
  const planIds = new Set(data.plans.map(p => p.our_plan_id));
  
  for (const feature of data.features) {
    if (!planIds.has(feature.our_plan_id)) {
      console.error(`Invalid plan_id: ${feature.our_plan_id}`);
      return false;
    }
    if (!feature.our_feature_id) {
      console.error('Missing feature_id');
      return false;
    }
  }
  
  return true;
}
```

## 📚 Related Documentation

- Full implementation: `/COMPARISON_FLAT_STRUCTURE_COMPLETE.md`
- Migration SQL: `/migrate-comparison-data-flat.sql`
- Type definitions: `/src/types/comparison.ts`
- Data hook: `/src/hooks/useCompetitorData.ts`

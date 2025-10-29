# 🚀 Quick Start: Fix System Models

## The Problem
Your Supabase database shows that the `ai_models_system` **table exists** but likely has **no data**, which is why the superadmin portal shows an empty list.

## The Solution (3 Easy Steps)

### Step 1: Run the Diagnostic Script
This will tell you exactly what's wrong.

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of: `database/migrations/DIAGNOSE_AND_FIX.sql`
3. Paste and click **Run**
4. Read the output - it will tell you what to do next

**Expected output:**
```
✅ Total models in table: 0 (means empty)
✅ Your role: superadmin (or needs promotion)
✅ Helper functions: 4 (all exist)
✅ RLS Policies: 3 (all exist)
```

---

### Step 2: Based on Diagnostic Results

#### Scenario A: Table is Empty (Most Likely)
**Symptoms:**
- Diagnostic shows: "Total models = 0"
- Frontend shows empty list

**Solution:**
1. Open `database/migrations/006_seed_system_models.sql`
2. Copy the **entire file**
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Should see: "✅ Successfully seeded 6 system models"

#### Scenario B: You're Not a Superadmin
**Symptoms:**
- Diagnostic shows: "my_role = admin" (or user)

**Solution:**
```sql
SELECT * FROM promote_to_superadmin('your-email@example.com');
```

#### Scenario C: Helper Functions Missing
**Symptoms:**
- Diagnostic shows: "helper_functions = 0"

**Solution:**
1. Run `007_add_superadmin_role_support.sql` first
2. Then run `005_setup_rls_policies.sql`
3. Then promote yourself to superadmin

---

### Step 3: Verify the Fix

**In Supabase SQL Editor:**
```sql
SELECT COUNT(*) FROM ai_models_system;
-- Should return: 6

SELECT name, is_active, is_featured 
FROM ai_models_system 
ORDER BY sort_order;
-- Should show 6 models
```

**In Your App:**
1. Navigate to `/superadmin/system-models`
2. Should see 6 models listed:
   - ⭐ Blog Content Writer Pro (Featured)
   - ⭐ Legal Document Analyst (Featured)
   - Healthcare Information Assistant
   - Property Listing Writer
   - 🤖 Basic Assistant (Free)
   - ⭐ Education Tutor (Trial, Featured)

---

## What Each Model Is For

| Model | Organization Types | Plan Required | Features |
|-------|-------------------|---------------|----------|
| **Blog Content Writer Pro** | Marketing, Software, Retail | Pro | ⭐ Featured, 5 writing tasks |
| **Legal Document Analyst** | Legal, Finance, Immigration | Enterprise | ⭐ Featured, 3 analysis tasks |
| **Healthcare Information Assistant** | Doctor, Healthcare, Beauty | Pro | 2 education tasks |
| **Property Listing Writer** | Real Estate | Starter | 2 listing tasks |
| **Basic Assistant** | All types | Free | 🆓 Free for everyone |
| **Education Tutor** | Education | Free (30-day trial) | ⭐ Featured, 2 teaching tasks |

---

## Common Issues & Solutions

### Issue: "relation ai_models_system does not exist"
**Cause:** Migration 001 wasn't run
**Fix:** Run `001_create_ai_models_system.sql`

### Issue: "function is_superadmin() does not exist"
**Cause:** Migration 007 wasn't run
**Fix:** Run `007_add_superadmin_role_support.sql`

### Issue: "insufficient privilege"
**Cause:** RLS is blocking you (not a superadmin)
**Fix:** Run `promote_to_superadmin('your-email@example.com')`

### Issue: Models inserted but still showing empty
**Cause:** Frontend is using wrong query or RLS is blocking
**Fix:** 
1. Check browser console for errors
2. Run diagnostic script to verify RLS
3. Ensure you're logged in as superadmin

---

## After Fix: API Keys

The seeded models have `PLACEHOLDER_API_KEY`. You need to replace these with real API keys:

1. Go to `/superadmin/system-models`
2. Click **Edit** on each model
3. Replace `PLACEHOLDER_API_KEY` with your actual OpenAI/Anthropic key
4. Click **Save**

**Or update directly in SQL:**
```sql
UPDATE ai_models_system
SET api_key = 'sk-your-actual-openai-key'
WHERE name IN (
  'Blog Content Writer Pro',
  'Healthcare Information Assistant',
  'Property Listing Writer',
  'Basic Assistant',
  'Education Tutor (Trial)'
);

UPDATE ai_models_system
SET api_key = 'sk-ant-your-actual-anthropic-key'
WHERE name = 'Legal Document Analyst';
```

---

## Summary

**Your situation:**
- ✅ Table exists (structure is correct)
- ❌ No data (table is empty)
- ✅ Translation error fixed (removed useTranslations)

**What to do now:**
1. Run `DIAGNOSE_AND_FIX.sql` 
2. Run `006_seed_system_models.sql` (if table is empty)
3. Refresh `/superadmin/system-models`
4. Replace placeholder API keys

**Time estimate:** 5 minutes ⏱️

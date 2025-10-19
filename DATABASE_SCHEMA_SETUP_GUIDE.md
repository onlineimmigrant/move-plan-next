# Quick Start: Apply Database Schemas

## ✅ Schema Files Ready to Apply

Both Phase 6 and Phase 7 database schemas have been **fixed** and are ready to apply in Supabase.

### Fixed Issue
- Changed all `organization_id` from `INTEGER` to `UUID` to match the `organizations` table
- This resolves the foreign key constraint error

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

---

### 2. Apply Phase 6 Schema (Automation & Workflows)

**File**: `PHASE_6_AUTOMATION_SCHEMA.sql`

**What it creates**:
- 12 tables for automation features
- Auto-assignment rules (round-robin, tag-based, workload-balanced)
- Admin teams and team members
- SLA policies and tracking
- Auto-responses and workflows
- Escalation rules
- Webhooks for integrations
- Auto-close rules

**Steps**:
1. Open `PHASE_6_AUTOMATION_SCHEMA.sql` in your editor
2. Copy the **entire file contents** (640 lines)
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Wait for "Success" message (should take 2-3 seconds)
6. Verify tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'ticket_%' 
   OR table_name LIKE 'admin_%';
   ```

**Expected Output**: 12 new tables

---

### 3. Apply Phase 7 Schema (Customer Portal)

**File**: `PHASE_7_CUSTOMER_PORTAL_SCHEMA.sql`

**What it creates**:
- 6 tables for customer portal features
- KB article interaction tracking
- Customer satisfaction ratings
- Notification preferences and queue
- Article suggestion history
- Customer portal session tracking
- 3 helper functions for analytics

**Steps**:
1. Open `PHASE_7_CUSTOMER_PORTAL_SCHEMA.sql` in your editor
2. Copy the **entire file contents** (457 lines)
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for "Success" message
6. Verify tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND (
     table_name LIKE 'ticket_kb_%' 
     OR table_name LIKE 'customer_%'
     OR table_name LIKE 'notification_%'
     OR table_name LIKE 'article_%'
   );
   ```

**Expected Output**: 6 new tables

---

## ✅ Verification Checklist

After applying both schemas, run these checks:

### Check Tables Exist
```sql
-- Phase 6 tables (should return 12 rows)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name IN (
    'ticket_assignment_rules',
    'ticket_assignment_state',
    'admin_teams',
    'admin_team_members',
    'ticket_auto_responses',
    'ticket_sla_policies',
    'ticket_sla_tracking',
    'ticket_workflow_triggers',
    'ticket_workflow_executions',
    'ticket_escalation_rules',
    'ticket_webhooks',
    'ticket_auto_close_rules'
  )
);

-- Phase 7 tables (should return 6 rows)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ticket_kb_interactions',
  'ticket_ratings',
  'customer_notification_preferences',
  'notification_queue',
  'article_suggestion_history',
  'customer_portal_sessions'
);
```

### Check Functions Exist
```sql
-- Should return 5 rows
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_next_round_robin_admin',
  'check_ticket_sla_status',
  'get_article_performance',
  'get_satisfaction_metrics',
  'get_next_send_time'
);
```

### Check RLS Policies
```sql
-- Should show policies on all new tables
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'ticket_%' 
OR tablename LIKE 'admin_%'
OR tablename LIKE 'customer_%'
OR tablename LIKE 'notification_%';
```

---

## 🎯 Test the Features

### Test Phase 6 (Automation)

1. Open your app at `/account` (or wherever TicketsAdminModal is)
2. Click the **⚡ Zap icon** in the tickets modal header
3. AssignmentRulesModal should open **without console errors**
4. You should see:
   - Empty rules list (no errors)
   - Empty teams list (no errors)
   - "Create New Rule" button

**Previous Error (Fixed)**:
```
❌ Error fetching teams: {}
❌ Error fetching rules: {}
```

**Expected Now**:
```
✅ No console errors
✅ Modal loads successfully
✅ Ready to create automation rules
```

---

### Test Phase 7 (Customer Portal)

1. Go to the contact form (`/contact`)
2. Start typing in the **Subject** field (type 10+ characters)
3. KB Widget should slide in with article suggestions
4. Type in the **Message** field to refine suggestions
5. Click an article to view full content
6. Click thumbs up/down to vote
7. Click "Issue Resolved" to prevent ticket creation

**Expected Behavior**:
- Widget appears smoothly after 10 characters
- Articles ranked by relevance
- Vote tracking works (check `ticket_kb_interactions` table)
- "Issue Resolved" prevents ticket submission

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution**: Some tables may already exist. Safe to ignore if applying a second time.

### Error: "permission denied"
**Solution**: Make sure you're using the Supabase SQL Editor (has admin privileges).

### Error: "function already exists"
**Solution**: Functions will be replaced with `CREATE OR REPLACE`. Safe to ignore.

### Console Errors Still Appear
**Solution**: 
1. Hard refresh browser (Ctrl/Cmd + Shift + R)
2. Clear browser cache
3. Restart Next.js dev server (`npm run dev`)

---

## 📊 What You'll Have After

### Phase 6 Features
- ✅ Auto-assignment rules engine
- ✅ Round-robin assignment logic
- ✅ Tag-based routing to teams
- ✅ SLA policies and tracking
- ✅ Auto-responses on ticket events
- ✅ Custom workflow automation
- ✅ Escalation rules
- ✅ Webhook integrations
- ✅ Auto-close for inactive tickets

### Phase 7 Features
- ✅ KB article suggestion engine
- ✅ Customer satisfaction ratings
- ✅ Email notification system (templates ready)
- ✅ Notification preferences per customer
- ✅ Article effectiveness tracking
- ✅ Portal session analytics

---

## 🚀 Next Steps

After applying both schemas:

1. **Phase 6**: Create your first automation rule
   - Open TicketsAdminModal
   - Click Zap icon
   - Create a round-robin rule

2. **Phase 7**: Test KB Widget
   - Go to contact form
   - Type a support question
   - See article suggestions appear
   - Vote on helpfulness

3. **Phase 7**: Complete email notifications
   - Choose email provider (Resend recommended)
   - Create `/api/notifications/send` endpoint
   - Test all 5 email templates

4. **Phase 7**: Build remaining features
   - Customer satisfaction rating modal
   - Ticket history/archive view
   - Complete testing

---

## 📝 Summary

| Schema | Tables | Functions | Lines | Status |
|--------|--------|-----------|-------|--------|
| Phase 6 | 12 | 2 | 640 | ✅ Ready |
| Phase 7 | 6 | 3 | 457 | ✅ Ready |
| **Total** | **18** | **5** | **1,097** | **✅ Ready** |

Both schemas are **type-safe** and **ready to apply** in Supabase! 🎉

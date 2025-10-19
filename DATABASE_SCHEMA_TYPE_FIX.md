# Database Schema Type Fix - October 18, 2025

## Issue

When attempting to apply Phase 6 and Phase 7 database schemas, encountered this error:

```
ERROR: 42804: foreign key constraint "ticket_assignment_rules_organization_id_fkey" cannot be implemented
DETAIL: Key columns "organization_id" and "id" are of incompatible types: integer and uuid.
```

## Root Cause

The `organizations` table uses `UUID` for its `id` column, but the Phase 6 and Phase 7 schemas incorrectly declared `organization_id` as `INTEGER` in all new tables.

## Fix Applied

Changed all `organization_id` column types from `INTEGER` to `UUID` in both schemas:

### Phase 6 Schema (`PHASE_6_AUTOMATION_SCHEMA.sql`)

**Tables Fixed** (12 total):
1. `ticket_assignment_rules`
2. `ticket_assignment_state`
3. `admin_teams`
4. `ticket_auto_responses`
5. `ticket_sla_policies`
6. `ticket_workflow_triggers`
7. `ticket_escalation_rules`
8. `ticket_webhooks`
9. `ticket_auto_close_rules`

**Functions Fixed**:
- `get_next_round_robin_admin()` - Changed parameter from `INTEGER` to `UUID`

### Phase 7 Schema (`PHASE_7_CUSTOMER_PORTAL_SCHEMA.sql`)

**Tables Fixed** (6 total):
1. `ticket_kb_interactions`
2. `ticket_ratings`
3. `customer_notification_preferences`
4. `notification_queue`
5. `article_suggestion_history`
6. `customer_portal_sessions`

**Functions Fixed**:
- `get_satisfaction_metrics()` - Changed parameter from `INTEGER` to `UUID`

## Changes Made

### Before:
```sql
CREATE TABLE ticket_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- ...
);
```

### After:
```sql
CREATE TABLE ticket_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- ...
);
```

## Verification

Both schemas should now apply successfully in the Supabase SQL Editor without foreign key constraint errors.

## Next Steps

1. ✅ Apply `PHASE_6_AUTOMATION_SCHEMA.sql` in Supabase SQL Editor
2. ✅ Apply `PHASE_7_CUSTOMER_PORTAL_SCHEMA.sql` in Supabase SQL Editor
3. ✅ Verify tables created successfully
4. ✅ Test AssignmentRulesModal - should no longer show console errors
5. ✅ Test KnowledgeBaseWidget integration

## Related Files

- `/Users/ois/move-plan-next/PHASE_6_AUTOMATION_SCHEMA.sql` (640 lines)
- `/Users/ois/move-plan-next/PHASE_7_CUSTOMER_PORTAL_SCHEMA.sql` (457 lines)
- `/src/components/modals/AssignmentRulesModal/AssignmentRulesModal.tsx`
- `/src/components/KnowledgeBaseWidget/KnowledgeBaseWidget.tsx`

## Impact

This fix ensures proper foreign key relationships between:
- Automation rules → Organizations
- KB interactions → Organizations
- Notification preferences → Organizations
- All Phase 6/7 tables → Organizations

All tables are now correctly typed to match the existing database schema.

# Email Template Fallback Fix

## Problem
The `/api/send-email` endpoint was failing with a 500 error when no email template existed in the database for a specific organization and email type combination. This was causing ticket creation to fail because the customer confirmation email couldn't be sent.

### Error Message
```
Error fetching email template: {
  error: undefined,
  organization_id: '6695b959-45ef-44b4-a68c-9cd0fe0e25a3',
  type: 'ticket_confirmation'
}
Error sending customer email: { error: 'Failed to fetch email template' }
```

### Root Cause
The code was treating an empty result set (no templates found) the same as a database error. When `template.length === 0`, it would return a 500 error instead of using a fallback template.

## Solution
Added a fallback mechanism that generates default HTML email templates when no custom template is found in the database.

### Changes Made

1. **Added `getDefaultSubject()` function** (line 147-159)
   - Returns appropriate email subject based on email type
   - Supports: welcome, reset_email, email_confirmation, order_confirmation, free_trial_registration, ticket_confirmation, newsletter

2. **Added `generateDefaultHtmlTemplate()` function** (line 161-266)
   - Generates a professional HTML email template with:
     - Responsive design
     - Styled header with logo
     - Content area with type-specific messaging
     - Footer with privacy policy and unsubscribe links
   - Special template for `ticket_confirmation` that includes:
     - Ticket ID, subject, and message
     - Preferred contact method, date, and time range
     - Link to view ticket status

3. **Updated template fetching logic** (line 360-378)
   - Changed error handling to distinguish between query errors and empty results
   - Only returns 500 error if there's an actual database error (`templateError`)
   - Falls back to default template when no custom template is found
   - Logs warning when using default template for debugging

### Benefits
- **Prevents service disruption**: Emails can be sent even without custom templates
- **Better user experience**: Customers still receive ticket confirmations
- **Backwards compatible**: Existing custom templates continue to work
- **Flexible**: Easy to add more default templates for new email types
- **Maintainable**: Clear separation between template generation and placeholder replacement

## Testing
To test the fix:

1. Create a ticket without having an email template in the database
2. Verify the customer receives a ticket confirmation email with all the details
3. Check that admins also receive notification emails
4. Confirm that custom templates (when present) are still used preferentially

## Future Enhancements
Consider:
- Adding default templates to the database during organization setup
- Creating an admin UI for managing email templates
- Supporting template inheritance (organization-level defaults)
- Adding template preview functionality

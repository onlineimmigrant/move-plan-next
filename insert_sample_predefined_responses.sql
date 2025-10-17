-- Sample predefined responses for ticket system
-- Replace 'YOUR_ORGANIZATION_ID' with your actual organization UUID

-- First, let's get the organization ID (you can run this to find yours)
-- SELECT id, name FROM organizations LIMIT 5;

-- Then insert predefined responses for your organization
INSERT INTO ticket_predefined_responses (organization_id, title, message) 
VALUES 
  -- Welcome/Acknowledgment
  (
    'YOUR_ORGANIZATION_ID', 
    'Received - Thank you', 
    'Thank you for contacting our support team. We have received your ticket and will respond as soon as possible. Our typical response time is within 24 hours.'
  ),
  
  -- Under Investigation
  (
    'YOUR_ORGANIZATION_ID', 
    'Under Review', 
    'We are currently reviewing your request. Our team is investigating the issue and will get back to you shortly with an update.'
  ),
  
  -- Request More Information
  (
    'YOUR_ORGANIZATION_ID', 
    'Need More Details', 
    'Thank you for reaching out. To better assist you with this matter, could you please provide the following additional information:

- [Specify what information is needed]
- [Any relevant details]

This will help us resolve your issue more quickly.'
  ),
  
  -- Issue Resolved
  (
    'YOUR_ORGANIZATION_ID', 
    'Issue Resolved', 
    'Great news! Your issue has been resolved. 

If you experience any further problems or have additional questions, please don''t hesitate to open a new ticket or reply to this one.

Thank you for your patience!'
  ),
  
  -- Working on Fix
  (
    'YOUR_ORGANIZATION_ID', 
    'Working on Solution', 
    'Thank you for reporting this issue. Our technical team is actively working on a solution. We will keep you updated on our progress and notify you as soon as it''s resolved.'
  ),
  
  -- Escalated to Technical Team
  (
    'YOUR_ORGANIZATION_ID', 
    'Escalated to Tech Team', 
    'Your ticket has been escalated to our technical team for further investigation. You can expect a more detailed response within the next 48 hours.

We appreciate your patience as we work to resolve this matter.'
  ),
  
  -- Feature Request Acknowledged
  (
    'YOUR_ORGANIZATION_ID', 
    'Feature Request - Thanks', 
    'Thank you for your feature suggestion! We appreciate user feedback and will pass your request to our product team for consideration.

While we can''t guarantee implementation, we do carefully review all suggestions. We''ll update you if this feature is added in a future release.'
  ),
  
  -- Closing Ticket
  (
    'YOUR_ORGANIZATION_ID', 
    'Closing Ticket', 
    'We haven''t heard back from you regarding this issue, so we''re closing this ticket. 

If you still need assistance, please feel free to reopen this ticket or create a new one. We''re always here to help!'
  ),
  
  -- Account/Billing Issue
  (
    'YOUR_ORGANIZATION_ID', 
    'Account/Billing Support', 
    'Thank you for contacting us about your account/billing question. Our billing team has been notified and will review your account shortly.

You should receive a response within 24 hours. If urgent, please let us know.'
  ),
  
  -- Password Reset Help
  (
    'YOUR_ORGANIZATION_ID', 
    'Password Reset Instructions', 
    'To reset your password:

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for the reset link
5. Follow the instructions to create a new password

If you don''t receive the email within 10 minutes, please check your spam folder. Let us know if you continue to have issues.'
  )

ON CONFLICT (organization_id, title) DO NOTHING;

-- Verify the insertion
SELECT id, title, LEFT(message, 50) as message_preview 
FROM ticket_predefined_responses 
WHERE organization_id = 'YOUR_ORGANIZATION_ID'
ORDER BY title;

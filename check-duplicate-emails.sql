-- Check for duplicate email_sent_log records by ID
SELECT id, COUNT(*) as count
FROM email_sent_log
GROUP BY id
HAVING COUNT(*) > 1;

-- Check for the specific UUID causing issues
SELECT *
FROM email_sent_log
WHERE id = '488b440f-0aa6-40a1-9119-7a06480d460a';

-- Check recent email_sent_log entries
SELECT 
  id,
  to_email,
  subject,
  status,
  sent_at,
  created_at
FROM email_sent_log
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are multiple subscriptions creating duplicates
-- (This would show if the same email was inserted multiple times)
SELECT 
  to_email,
  subject,
  sent_at,
  COUNT(*) as duplicate_count
FROM email_sent_log
GROUP BY to_email, subject, sent_at
HAVING COUNT(*) > 1
ORDER BY sent_at DESC;

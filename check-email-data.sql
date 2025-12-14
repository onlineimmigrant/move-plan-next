-- Check if email_messages exist
SELECT COUNT(*) as total_messages FROM email_messages;

-- Check if email_threads exist
SELECT COUNT(*) as total_threads FROM email_threads;

-- Check threads with their message counts
SELECT 
  t.id,
  t.subject,
  t.message_count,
  (SELECT COUNT(*) FROM email_messages m WHERE m.thread_id = t.id) as actual_count
FROM email_threads t
LIMIT 10;

-- Check messages and their thread_id
SELECT 
  m.id,
  m.thread_id,
  m.subject,
  m.from_email,
  m.sent_at
FROM email_messages m
LIMIT 10;

-- Check if thread_ids match
SELECT 
  m.thread_id,
  COUNT(*) as message_count,
  EXISTS(SELECT 1 FROM email_threads t WHERE t.id = m.thread_id) as thread_exists
FROM email_messages m
GROUP BY m.thread_id;

-- Update message_count for all existing threads
UPDATE email_threads t
SET message_count = (
  SELECT COUNT(*)
  FROM email_messages m
  WHERE m.thread_id = t.id
)
WHERE message_count = 0 OR message_count IS NULL;

-- Also update first_message_at and last_message_at if they're missing
UPDATE email_threads t
SET 
  first_message_at = (
    SELECT MIN(sent_at)
    FROM email_messages m
    WHERE m.thread_id = t.id
  ),
  last_message_at = (
    SELECT MAX(sent_at)
    FROM email_messages m
    WHERE m.thread_id = t.id
  )
WHERE first_message_at IS NULL OR last_message_at IS NULL;

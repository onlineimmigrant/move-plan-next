-- Update priority levels to only include low, medium, high
-- Set default priority to 'low' for tickets without a priority
-- Remove the CHECK constraint and add a new one with updated values

-- First, update all NULL priorities to 'low'
UPDATE tickets 
SET priority = 'low' 
WHERE priority IS NULL;

-- Drop the old constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_priority_check;

-- Add the new constraint with only 3 levels
ALTER TABLE tickets 
  ADD CONSTRAINT tickets_priority_check 
  CHECK (priority IN ('low', 'medium', 'high'));

-- Set default value for new tickets
ALTER TABLE tickets 
  ALTER COLUMN priority SET DEFAULT 'low';

-- Ensure the column is NOT NULL
ALTER TABLE tickets 
  ALTER COLUMN priority SET NOT NULL;

COMMENT ON COLUMN tickets.priority IS 'Priority level: low (default), medium, or high';

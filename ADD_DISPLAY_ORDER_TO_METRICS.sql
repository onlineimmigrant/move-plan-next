-- Migration: Add display_order column to website_templatesection_metrics table
-- This enables persistent ordering of metrics within template sections

-- Add the display_order column
ALTER TABLE website_templatesection_metrics 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set default values for existing records (order by id)
WITH numbered_metrics AS (
  SELECT 
    templatesection_id,
    metric_id,
    ROW_NUMBER() OVER (PARTITION BY templatesection_id ORDER BY metric_id) as row_num
  FROM website_templatesection_metrics
  WHERE display_order IS NULL
)
UPDATE website_templatesection_metrics wm
SET display_order = nm.row_num
FROM numbered_metrics nm
WHERE wm.templatesection_id = nm.templatesection_id 
  AND wm.metric_id = nm.metric_id
  AND wm.display_order IS NULL;

-- Add a default constraint for new records
ALTER TABLE website_templatesection_metrics 
ALTER COLUMN display_order SET DEFAULT 1;

-- Create an index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_templatesection_metrics_display_order 
ON website_templatesection_metrics(templatesection_id, display_order);

-- Verification query
SELECT 
  templatesection_id,
  metric_id,
  display_order,
  COUNT(*) OVER (PARTITION BY templatesection_id) as metrics_in_section
FROM website_templatesection_metrics
ORDER BY templatesection_id, display_order;

COMMENT ON COLUMN website_templatesection_metrics.display_order IS 
'Order in which metrics should be displayed within a template section. Lower numbers appear first.';

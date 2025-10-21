-- Insert sample meeting types for different organizations
-- This migration should be run after the meetings system tables are created

-- Insert meeting types for the default organization (you'll need to replace with actual organization_id)
-- First, let's get the organization_id dynamically or use a placeholder

-- Note: Replace 'your-organization-id-here' with the actual organization UUID from your database

-- Insert sample meeting types for different organizations
-- This migration should be run after the meetings system tables are created

-- Insert meeting types for the default organization (you'll need to replace with actual organization_id)
-- First, let's get the organization_id dynamically or use a placeholder

-- Note: Replace 'your-organization-id-here' with the actual organization UUID from your database

INSERT INTO meeting_types (organization_id, name, description, duration_minutes, buffer_minutes, color, icon, is_active) VALUES
-- Quick consultations
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Quick Chat', 'A brief 15-minute consultation for quick questions', 15, 5, '#10B981', 'ChatBubbleLeftIcon', true),

-- Standard meetings
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Discovery Call', 'Initial discovery call to understand your needs', 30, 10, '#3B82F6', 'PhoneIcon', true),
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Strategy Session', 'In-depth strategy discussion and planning', 45, 15, '#8B5CF6', 'LightBulbIcon', true),
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Standard Meeting', 'Regular meeting for updates and discussions', 60, 15, '#F59E0B', 'CalendarDaysIcon', true),

-- Extended sessions
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Deep Dive Workshop', 'Extended workshop for detailed analysis', 90, 30, '#EF4444', 'WrenchScrewdriverIcon', true),
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Full Day Session', 'Comprehensive full-day working session', 480, 60, '#7C3AED', 'ClockIcon', true),

-- Specialized meetings
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Technical Review', 'Code review or technical architecture discussion', 75, 15, '#06B6D4', 'ComputerDesktopIcon', true),
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Client Presentation', 'Formal presentation to clients or stakeholders', 50, 10, '#EC4899', 'PresentationChartBarIcon', true),
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Brainstorming Session', 'Creative brainstorming and ideation', 40, 10, '#84CC16', 'SparklesIcon', true),

-- Follow-ups
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Follow-up Call', 'Quick follow-up on previous discussions', 20, 5, '#6B7280', 'ArrowPathIcon', true),
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Status Update', 'Regular status update meeting', 25, 5, '#374151', 'DocumentTextIcon', true),

-- Emergency/urgent
('6695b959-45ef-44b4-a68c-9cd0fe0e25a3', 'Urgent Consultation', 'Emergency or urgent matter discussion', 35, 5, '#DC2626', 'ExclamationTriangleIcon', true);

-- Alternative approach: Insert for all organizations (if you want the same types for all orgs)
-- Uncomment and modify as needed:

-- INSERT INTO meeting_types (organization_id, name, description, duration_minutes, buffer_minutes, color, icon, is_active)
-- SELECT
--   o.id as organization_id,
--   mt.name,
--   mt.description,
--   mt.duration_minutes,
--   mt.buffer_minutes,
--   mt.color,
--   mt.icon,
--   mt.is_active
-- FROM organizations o
-- CROSS JOIN (
--   VALUES
--     ('Quick Chat', 'A brief 15-minute consultation for quick questions', 15, 5, '#10B981', 'ChatBubbleLeftIcon', true),
--     ('Discovery Call', 'Initial discovery call to understand your needs', 30, 10, '#3B82F6', 'PhoneIcon', true),
--     ('Strategy Session', 'In-depth strategy discussion and planning', 45, 15, '#8B5CF6', 'LightBulbIcon', true),
--     ('Standard Meeting', 'Regular meeting for updates and discussions', 60, 15, '#F59E0B', 'CalendarDaysIcon', true),
--     ('Deep Dive Workshop', 'Extended workshop for detailed analysis', 90, 30, '#EF4444', 'WrenchScrewdriverIcon', true),
--     ('Technical Review', 'Code review or technical architecture discussion', 75, 15, '#06B6D4', 'ComputerDesktopIcon', true),
--     ('Client Presentation', 'Formal presentation to clients or stakeholders', 50, 10, '#EC4899', 'PresentationChartBarIcon', true),
--     ('Brainstorming Session', 'Creative brainstorming and ideation', 40, 10, '#84CC16', 'SparklesIcon', true),
--     ('Follow-up Call', 'Quick follow-up on previous discussions', 20, 5, '#6B7280', 'ArrowPathIcon', true),
--     ('Status Update', 'Regular status update meeting', 25, 5, '#374151', 'DocumentTextIcon', true),
--     ('Urgent Consultation', 'Emergency or urgent matter discussion', 35, 5, '#DC2626', 'ExclamationTriangleIcon', true)
-- ) AS mt(name, description, duration_minutes, buffer_minutes, color, icon, is_active);

-- To find your organization_id, run this query:
-- SELECT id, site, base_url FROM organizations;

-- Example output:
-- id: 6695b959-45ef-44b4-a68c-9cd0fe25a3
-- site: Coded Harmony
-- base_url: https://codedharmony.co.uk
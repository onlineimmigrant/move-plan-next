-- Quick Test: Check if predefined responses table exists and add sample data

-- Step 1: Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ticket_predefined_responses'
) as table_exists;

-- Step 2: If table doesn't exist, create it (run the create_tickets_tables_required.sql first)
-- Then run the add_ticket_predefined_responses_table.sql migration

-- Step 3: Get your organization ID (replace with your actual query if needed)
-- SELECT id, name FROM organizations LIMIT 5;

-- Step 4: Insert sample predefined responses
-- REPLACE 'YOUR_ORG_ID_HERE' with your actual organization UUID

DO $$
DECLARE
    v_org_id UUID := 'YOUR_ORG_ID_HERE'; -- CHANGE THIS!
BEGIN
    -- Check if we have any responses already
    IF NOT EXISTS (
        SELECT 1 FROM ticket_predefined_responses 
        WHERE organization_id = v_org_id
    ) THEN
        -- Insert sample responses
        INSERT INTO ticket_predefined_responses (organization_id, title, message) 
        VALUES 
            (v_org_id, 'Thank You', 'Thank you for contacting us. We have received your ticket and will respond shortly.'),
            (v_org_id, 'Under Review', 'We are currently reviewing your request and will get back to you soon.'),
            (v_org_id, 'More Info Needed', 'Could you please provide more details about your issue? This will help us assist you better.'),
            (v_org_id, 'Resolved', 'Your issue has been resolved. If you need further assistance, feel free to reach out!'),
            (v_org_id, 'In Progress', 'We are working on your request. We''ll update you as soon as we have more information.')
        ON CONFLICT (organization_id, title) DO NOTHING;
        
        RAISE NOTICE 'Sample responses inserted successfully';
    ELSE
        RAISE NOTICE 'Responses already exist for this organization';
    END IF;
END $$;

-- Step 5: Verify the data
SELECT id, title, LEFT(message, 50) as message_preview 
FROM ticket_predefined_responses 
WHERE organization_id = 'YOUR_ORG_ID_HERE' -- CHANGE THIS!
ORDER BY title;

-- Step 6: Count responses
SELECT COUNT(*) as total_responses 
FROM ticket_predefined_responses 
WHERE organization_id = 'YOUR_ORG_ID_HERE'; -- CHANGE THIS!

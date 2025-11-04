-- Add 'team' and 'testimonials' to section_type enum if it exists
-- Run this in Supabase SQL Editor

-- First, check if section_type is an enum type
DO $$ 
BEGIN
    -- If section_type is an enum, add new values
    IF EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'section_type_enum'
    ) THEN
        -- Add 'team' if it doesn't exist
        BEGIN
            ALTER TYPE section_type_enum ADD VALUE IF NOT EXISTS 'team';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        -- Add 'testimonials' if it doesn't exist
        BEGIN
            ALTER TYPE section_type_enum ADD VALUE IF NOT EXISTS 'testimonials';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        RAISE NOTICE 'Added team and testimonials to section_type_enum';
    ELSE
        RAISE NOTICE 'section_type_enum does not exist - no action needed';
    END IF;
END $$;

-- Alternatively, if section_type is a text column with CHECK constraint,
-- we need to update the constraint
DO $$
BEGIN
    -- Check if there's a CHECK constraint on section_type
    IF EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'website_templatesection'
        AND column_name = 'section_type'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE website_templatesection 
        DROP CONSTRAINT IF EXISTS website_templatesection_section_type_check;
        
        -- Add new constraint with all values including team and testimonials
        ALTER TABLE website_templatesection
        ADD CONSTRAINT website_templatesection_section_type_check
        CHECK (section_type IN (
            'general',
            'brand',
            'article_slider',
            'contact',
            'faq',
            'reviews',
            'help_center',
            'real_estate',
            'pricing_plans',
            'team',
            'testimonials'
        ));
        
        RAISE NOTICE 'Updated CHECK constraint for section_type';
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'website_templatesection'
AND column_name = 'section_type';

-- Show current section types in use
SELECT DISTINCT section_type 
FROM website_templatesection 
WHERE section_type IS NOT NULL
ORDER BY section_type;
